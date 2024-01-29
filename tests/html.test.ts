import { expect, test, describe } from 'bun:test';
import { getAllFiles } from './util.js';
import chalk from 'chalk';

describe('html tests', () => {
  test('no unprocessed {{blocks}}', async () => {
    const files = await getAllFiles();

    const errors: string[] = [];
    await Promise.all(
      files.map(async ({ htmlPath }) => {
        const text = await Bun.file(htmlPath).text();
        const lines = text.split('\n');
        for (const [i, line] of lines.entries()) {
          const match = /{{.+}}/g.exec(line);
          if (match) {
            errors.push(
              `Found unprocessed block "${chalk.red(match[0])}"\n\tat ${chalk.grey(
                `${htmlPath}:${i + 1}:${match.index + 1}`
              )}`
            );
          }
        }
      })
    );

    if (errors.length) {
      expect().fail(errors.join('\n'));
    }
  });
});
