import { expect, test, describe } from 'vitest';
import { readFile } from 'fs/promises';
import { getAllFiles } from './util.ts';
import chalk from 'chalk';

describe('html tests', () => {
  test('homepage hides the mdBook sidebar', async () => {
    const homepage = (await getAllFiles()).find(({ htmlPath }) => htmlPath.endsWith('/dist/home.html'));
    expect(homepage, 'homepage was not included in the generated book').toBeDefined();

    const text = await readFile(homepage!.htmlPath, 'utf8');
    expect(text).toContain("document.documentElement.classList.remove('sidebar-visible')");
    expect(text).toContain("document.getElementById('mdbook-sidebar-toggle-anchor')");
    expect(text).not.toContain("document.getElementById('sidebar-toggle-anchor')");
  });

  test('no unprocessed {{blocks}}', async () => {
    const files = await getAllFiles();

    const errors: string[] = [];
    await Promise.all(
      files.map(async ({ htmlPath }) => {
        const text = await readFile(htmlPath, 'utf8');
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
      expect.fail(errors.join('\n'));
    }
  });
});
