import { expect, test, describe } from 'vitest';
import { readFile, readdir } from 'fs/promises';
import { getAllFiles } from './util.ts';
import chalk from 'chalk';

describe('html tests', () => {
  test('git history is centered', async () => {
    const css = await readFile(new URL('../preprocessors/modified/index.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.modified\s*{[^}]*display:\s*block;/);
    expect(css).toMatch(/\.modified\s*{[^}]*text-align:\s*center;/);
  });

  test('sidebar does not include page headings', async () => {
    const dist = new URL('../dist/', import.meta.url);
    const tocScript = (await readdir(dist)).find((file) => /^toc-.+\.js$/.test(file));
    expect(tocScript, 'generated table-of-contents script was not found').toBeDefined();

    const text = await readFile(new URL(tocScript!, dist), 'utf8');
    expect(text).not.toContain('Support for dynamically adding headers to the sidebar');
  });

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
