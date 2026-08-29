#!/usr/bin/env -S node --experimental-strip-types

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const SITE_ORIGIN = 'https://www.acheron.fail';
const OUTPUT_DIRECTORY = new URL('../dist/', import.meta.url);

const getHtmlFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? getHtmlFiles(path) : Promise.resolve(path.endsWith('.html') ? [path] : []);
    })
  );
  return nested.flat();
};

const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const canonicalPathFor = (outputPath: string): string => {
  const path = relative(OUTPUT_DIRECTORY.pathname, outputPath).split(sep).join('/');

  if (path === 'index.html' || path === 'home.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  return `/${path}`;
};

const htmlFiles = await getHtmlFiles(OUTPUT_DIRECTORY.pathname);
const canonicalUrls = new Set<string>();

await Promise.all(
  htmlFiles.map(async (outputPath) => {
    let html = await readFile(outputPath, 'utf8');

    // Error, print, and redirect documents should never appear as independent search results.
    if (/<meta\s+name="robots"\s+content="noindex"/i.test(html) || /http-equiv="refresh"/i.test(html)) return;

    const canonicalUrl = new URL(canonicalPathFor(outputPath), SITE_ORIGIN).href;
    canonicalUrls.add(canonicalUrl);
    html = html.replace('</head>', `        <link rel="canonical" href="${canonicalUrl}">\n    </head>`);
    await writeFile(outputPath, html);
  })
);

const sitemapEntries = [...canonicalUrls]
  .sort((a, b) => a.localeCompare(b))
  .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;

await writeFile(new URL('sitemap.xml', OUTPUT_DIRECTORY), sitemap);
