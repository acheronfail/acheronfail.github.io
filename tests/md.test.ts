import { expect, test, describe } from 'bun:test';
import { getAllFiles, getAllLinks } from './util.js';
import { dirname, resolve } from 'path';
import { stat } from 'fs/promises';
import { NodeWalkingStep, Parser } from 'commonmark';
import c from 'chalk';

describe('markdown tests', () => {
  /**
   * Search for any keywords that indicate unfinished content.
   */

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

  /**
   * Get all links from all pages, and then check they point to valid paths.
   */

  test('internal links are valid', async () => {
    const { internal } = await getAllLinks();
    const brokenLinks = await Promise.all(
      internal.map(async ({ from, to, ...rest }) => {
        const resolved = resolve(from.endsWith('index.md') ? dirname(from) : from, to);
        if (to.startsWith('#')) {
          console.warn(`Hash checking not yet implemented, link was: ${to}`);
          return { from, to, ...rest, resolved: to, exists: true };
        }

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

  /**
   * Ensure content inside `<div class="warning">` tags is properly parsed as markdown.
   * See: https://talk.commonmark.org/t/bug-or-expected-markdown-sometimes-doesnt-work-inside-div-tags/4378/4
   */

  const RE_DIV_WARNING = /[\s\S]*?<div\s+class=".*?warning.*?">([\s\S]*)/im;
  interface DivWarningError {
    match: string;
    path: string;
    row: number;
    col: number;
  }
  test('div.warning blocks contain markdown', async () => {
    const files = await getAllFiles();
    const results = await Promise.all(
      files.map(async (path) => {
        const text = await Bun.file(path).text();
        const ast = new Parser().parse(text);
        const walker = ast.walker();

        const errors: DivWarningError[] = [];
        let event: NodeWalkingStep | null;
        while ((event = walker.next())) {
          const { entering, node } = event;
          if (entering && node.type === 'html_block') {
            if (!node.literal) continue;
            if (node.literal.startsWith('<!--')) continue;

            // NOTE: we don't content within these warning blocks to be parsed as a single `html_block`, we want
            // them to be parsed as individual blocks so their content is also parsed as markdown.
            const match = RE_DIV_WARNING.exec(node.literal);
            if (!match) continue;
            if (match[1] && match[1].length > 0) {
              const [[row, col]] = node.sourcepos;
              errors.push({
                match: match[0],
                row,
                col,
                path,
              });
            }
          }
        }

        return errors;
      })
    ).then((results) => results.flat());

    if (results.length > 0) {
      expect().fail(
        c.bold.yellow(`Found <div class="warning"> block whose content is not parsed as markdown:\n`) +
          results
            .map(
              ({ path, row, col, match }) =>
                `  Insert a newline after this opening tag: ${c.red(match)}\n\tat ${c.grey(`${path}:${row}:${col}`)}`
            )
            .join('\n')
      );
    }
  });
});
