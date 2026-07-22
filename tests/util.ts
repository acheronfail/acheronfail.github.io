import { dirname, join, resolve } from 'path';
import { Parser } from 'commonmark';
import type { NodeWalkingStep } from 'commonmark';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import html from 'node-html-parser';
import { parse } from 'smol-toml';
import { z } from 'zod';

const DIRNAME = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(DIRNAME, '..');
const config = parse(await readFile(join(ROOT_DIR, 'book.toml'), 'utf8'));
const sourceDirectory = z.object({ book: z.object({ src: z.string() }) }).parse(config).book.src;
const BOOK_DIR = resolve(ROOT_DIR, sourceDirectory);
const HTML_DIR = resolve(DIRNAME, '..', 'dist');

export interface File {
  markdownPath: string;
  htmlPath: string;
}

let allFiles: Promise<File[]> | null = null;
export async function getAllFiles(): Promise<File[]> {
  if (allFiles) return allFiles;
  return (allFiles = (async () => {
    const text = await readFile(join(BOOK_DIR, 'SUMMARY.md'), 'utf8');
    const ast = new Parser().parse(text);
    const walker = ast.walker();

    const files: File[] = [];
    let event: NodeWalkingStep | null;
    while ((event = walker.next())) {
      if (event.entering && event.node.type === 'link') {
        if (event.node.destination) {
          files.push({
            markdownPath: join(BOOK_DIR, event.node.destination),
            htmlPath: join(HTML_DIR, event.node.destination.replace(/\.md$/, '.html')),
          });
        }
      }
    }

    files.push({
      markdownPath: join(BOOK_DIR, '404.md'),
      htmlPath: join(HTML_DIR, '404.html'),
    });

    return files;
  })());
}

export interface Link {
  from: string;
  to: string;
}

export interface AllLinks {
  internal: Link[];
  external: Link[];
}

export interface Header extends File {
  headerIds: string[];
}

export async function getAllHtmlHeaders(): Promise<Header[]> {
  const allHeaders: Header[] = [];

  await Promise.all(
    await getAllFiles().then(async (paths) =>
      paths.map(async (file) => {
        const text = await readFile(file.htmlPath, 'utf8');
        const root = html.parse(text);
        allHeaders.push({
          ...file,
          headerIds: root
            .querySelectorAll('h1, h2, h3, h4, h5, h6')
            .filter((node) => !node.classList.contains('menu-title'))
            .map((node) => node.id),
        });
      })
    )
  );

  return allHeaders;
}

export async function getAllMarkdownLinks(): Promise<AllLinks> {
  const allLinks: AllLinks = {
    internal: [],
    external: [],
  };

  await Promise.all(
    await getAllFiles().then((paths) =>
      paths.map(async ({ markdownPath }) => {
        const text = await readFile(markdownPath, 'utf8');
        const ast = new Parser().parse(text);
        const walker = ast.walker();

        let event: NodeWalkingStep | null;
        while ((event = walker.next())) {
          const { entering, node } = event;
          if (entering && node.type === 'link') {
            if (node.destination) {
              const isInternal = ['/', '.', '#'].includes(node.destination[0]!) || !/[a-z]+:/i.test(node.destination);
              if (isInternal) {
                allLinks.internal.push({ from: markdownPath, to: node.destination });
              } else {
                allLinks.external.push({ from: markdownPath, to: node.destination });
              }
            }
          }
        }
      })
    )
  );

  return allLinks;
}
