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

  test('sidebar does not include section numbers', async () => {
    const dist = new URL('../dist/', import.meta.url);
    const tocScript = (await readdir(dist)).find((file) => /^toc-.+\.js$/.test(file));
    expect(tocScript, 'generated table-of-contents script was not found').toBeDefined();

    const [html, script] = await Promise.all([
      readFile(new URL('toc.html', dist), 'utf8'),
      readFile(new URL(tocScript!, dist), 'utf8'),
    ]);

    for (const text of [html, script]) {
      expect(text).not.toMatch(/<strong aria-hidden="true">\d+(?:\.\d+)*\.<\/strong>/);
    }
  });

  test('homepage hides the mdBook sidebar', async () => {
    const dist = new URL('../dist/', import.meta.url);
    const [homepage, index, about] = await Promise.all([
      readFile(new URL('home.html', dist), 'utf8'),
      readFile(new URL('index.html', dist), 'utf8'),
      readFile(new URL('about.html', dist), 'utf8'),
    ]);

    for (const [text, path] of [
      [homepage, 'home.md'],
      [index, 'index.md'],
    ] as const) {
      expect(text).toContain(`const is_home_page = ["home.md", "index.md"].includes("${path}");`);
      expect(text).toMatch(/if \(is_home_page\) \{\s+sidebar = 'hidden';\s+sidebar_toggle\.checked = false;/);
      expect(text.indexOf('if (is_home_page)')).toBeLessThan(text.indexOf('<nav id="mdbook-sidebar"'));
    }

    expect(about).toContain('const is_home_page = ["home.md", "index.md"].includes("about.md");');
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
