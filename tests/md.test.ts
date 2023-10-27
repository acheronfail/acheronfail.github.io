import { expect, test, describe } from 'bun:test';
import { NodeWalkingStep, Parser } from 'commonmark';
import { join } from 'path';

describe('markdown tests', () => {
  const RE_TODOS = /TODO|FIXME/gi;
  interface Thing {
    path: string;
    what: string;
    line: string;
    row: number;
    column: number;
  }

  test('no TODO or FIXME in files referenced from summary', async () => {
    const text = await Bun.file('src/SUMMARY.md').text();
    const ast = new Parser().parse(text);
    const walker = ast.walker();

    const checks: Promise<Thing[]>[] = [];
    const checkForTodos = async (link: string) => {
      const path = join('src', link);
      const text = await Bun.file(path).text();
      const matches: Thing[] = [];

      text.split('\n').forEach((line, index) => {
        let match: RegExpExecArray | null;
        while ((match = RE_TODOS.exec(line))) {
          matches.push({
            path,
            line,
            what: match[0],
            row: index + 1,
            column: match.index + 1,
          });
        }
      });

      return matches;
    };

    let event: NodeWalkingStep | null;
    while ((event = walker.next())) {
      if (event.entering && event.node.type === 'link') {
        if (event.node.destination) {
          checks.push(checkForTodos(event.node.destination));
        }
      }
    }

    const allMatches = (await Promise.all(checks)).flat();
    if (allMatches.length > 0) {
      expect().fail(allMatches.map(({ path, row, column, line }) => `[${path}:${row}:${column}] ${line}`).join('\n'));
    }
  });
});
