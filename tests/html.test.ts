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

    for (const text of [homepage, index]) {
      expect(text).toContain('<pre class="home-json">');
      expect(text).toMatch(/pre\.home-json > \.buttons \.clip-button \{\s+display: none;/);
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

  test('indexable pages declare one canonical URL and appear in the sitemap', async () => {
    const dist = new URL('../dist/', import.meta.url);
    const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8');
    const files = await getAllFiles();

    for (const { htmlPath } of files) {
      const html = await readFile(htmlPath, 'utf8');
      if (html.includes('<meta name="robots" content="noindex">') || html.includes('http-equiv="refresh"')) {
        expect(html).not.toContain('rel="canonical"');
        continue;
      }

      const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];
      expect(canonicals, `${htmlPath} should have one canonical URL`).toHaveLength(1);
      expect(sitemap).toContain(`<loc>${canonicals[0]![1]}</loc>`);
    }

    expect(await readFile(new URL('index.html', dist), 'utf8')).toContain(
      '<link rel="canonical" href="https://www.acheron.fail/">'
    );
    expect(await readFile(new URL('home.html', dist), 'utf8')).toContain(
      '<link rel="canonical" href="https://www.acheron.fail/">'
    );
    expect(await readFile(new URL('posts/pixel-picker/index.html', dist), 'utf8')).toContain(
      '<link rel="canonical" href="https://www.acheron.fail/posts/pixel-picker/">'
    );
  });

  test('moved posts retain redirects from their old public URLs', async () => {
    const dist = new URL('../dist/', import.meta.url);
    const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8');
    const redirects = [
      ['guides/games/d2r.html', '/posts/d2r.html'],
      ['guides/arch-vm-apple-arm64/index.html', '/posts/arch-vm-apple-arm64/'],
      ['stories/pixel-picker/index.html', '/posts/pixel-picker/'],
      ['stories/tx-over-serial/index.html', '/posts/tx-over-serial/'],
      ['stories/xcolor/index.html', '/posts/xcolor/'],
    ] as const;

    for (const [oldPath, newPath] of redirects) {
      const html = await readFile(new URL(oldPath, dist), 'utf8');
      expect(html).toContain(`http-equiv="refresh" content="0; URL=${newPath}"`);
      expect(html).toContain(`rel="canonical" href="${newPath}"`);
      expect(sitemap).not.toContain(`https://www.acheron.fail/${oldPath}`);
    }
  });
});
