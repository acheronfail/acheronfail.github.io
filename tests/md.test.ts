import { expect, test, describe } from 'bun:test';
import { stat } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { NodeWalkingStep, Parser } from 'commonmark';
import c from 'chalk';

let allFiles: Promise<string[]> | null = null;
async function getAllFiles() {
  if (allFiles) return allFiles;
  return (allFiles = (async () => {
    const text = await Bun.file('src/SUMMARY.md').text();
    const ast = new Parser().parse(text);
    const walker = ast.walker();

    const files: string[] = [];
    let event: NodeWalkingStep | null;
    while ((event = walker.next())) {
      if (event.entering && event.node.type === 'link') {
        if (event.node.destination) {
          files.push(join('src', event.node.destination));
        }
      }
    }

    return files;
  })());
}

interface Link {
  from: string;
  to: string;
}
async function getAllLinks(): Promise<Link[]> {
  return await Promise.all(
    await getAllFiles().then((paths) =>
      paths.map(async (path) => {
        const text = await Bun.file(path).text();
        const ast = new Parser().parse(text);
        const walker = ast.walker();

        const links: Link[] = [];
        let event: NodeWalkingStep | null;
        while ((event = walker.next())) {
          if (event.entering && event.node.type === 'link') {
            if (event.node.destination) {
              links.push({
                from: path,
                to: event.node.destination,
              });
            }
          }
        }

        return links;
      })
    )
  ).then((list) => list.flat());
}

describe('markdown tests', () => {
  const RE_TODOS = /TODO|FIXME/gi;
  interface TodoSearchResult {
    path: string;
    what: string;
    line: string;
    row: number;
    col: number;
  }

  test('no TODO or FIXME in files referenced from summary', async () => {
    const checkForTodos = async (path: string) => {
      const text = await Bun.file(path).text();
      const matches: TodoSearchResult[] = [];

      text.split('\n').forEach((line, index) => {
        let match: RegExpExecArray | null;
        while ((match = RE_TODOS.exec(line))) {
          matches.push({
            path,
            line,
            what: match[0],
            row: index + 1,
            col: match.index + 1,
          });
        }
      });

      return matches;
    };

    const checks = (await getAllFiles()).map(checkForTodos);
    const allMatches = (await Promise.all(checks)).flat();
    if (allMatches.length > 0) {
      expect().fail(
        c.bold.yellow(`Found unfinished indicators:\n`) +
          allMatches
            .map(
              ({ path, row, col, line, what }) =>
                `  ${line.substring(0, col - 1)}${c.red(what)}${line.substring(col + what.length)}\n\t${c.gray(
                  `at ${path}:${row}:${col}`
                )}`
            )
            .join('\n')
      );
    }
  });

  test('internal links are valid', async () => {
    const internalLinks = await getAllLinks().then((links) => links.filter(({ to }) => ['/', '.'].includes(to[0])));

    const brokenLinks = await Promise.all(
      internalLinks.map(async ({ from, to, ...rest }) => {
        const resolved = resolve(from.endsWith('index.md') ? dirname(from) : from, to);
        return {
          from,
          to,
          ...rest,
          resolved,
          exists: await stat(resolved).then(
            () => true,
            () => false
          ),
        };
      })
    ).then((results) => results.filter((x) => !x.exists));

    if (brokenLinks.length > 0) {
      expect().fail(
        c.bold.yellow(`Found broken internal links:\n`) +
          brokenLinks.map(({ to, from }) => `  Invalid link: ${c.red(to)}\n\t${c.gray(`from ${from}`)}`).join('\n')
      );
    }
  });
});
