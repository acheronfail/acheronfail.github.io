#!/usr/bin/env node
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="./types.d.ts" />

// TODO: use Bun - currently it has issues with stdin:
//  https://github.com/oven-sh/bun/issues/5240
//  https://github.com/oven-sh/bun/issues/1607

import { inspect } from 'util';
import { dirname, join, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';

// https://rust-lang.github.io/mdBook/for_developers/preprocessors.html
if (process.argv[2] === 'supports') {
  process.exit(process.argv[2] === 'html' ? 0 : 1);
}

const PATH_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const EMBEDS = new Map([
  // {{youtube(id="foo")}}
  [
    /{{\s*youtube\(id="(?<id>[0-9a-zA-Z]+)"\)\s*}}/gi,
    (_chapter) => (_match, id) =>
      `\
<div class="embed">
  <iframe
      src="https://www.youtube-nocookie.com/embed/${id}"
      webkitallowfullscreen
      mozallowfullscreen
      allowfullscreen>
  </iframe>
</div>`.trim(),
  ],
  // {{filelist(../path/to/dir)}}
  [
    /{{\s*filelist\((?<path>.+)\)\s*}}/gi,
    (chapter) => (_match, fileListPath) => {
      const realPath = join(PATH_SRC, chapter.path, fileListPath);

      const list = [];
      for (const entry of readdirSync(realPath, { withFileTypes: true })) {
        if (entry.isFile()) {
          list.push({
            mdName: entry.name,
            mdPath: `/${relative(PATH_SRC, join(realPath, entry.name))}`,
          });
        }
      }

      return `**Downloads:**\n${list
        .map(({ mdName, mdPath }) => `- <a href="${mdPath}" download>${mdName}</a>`)
        .join('\n')}`;
    },
  ],
]);

async function main() {
  const [_context, book] = JSON.parse(await readAllStdin());
  forEachChapter(book, (chapter) => {
    for (const [re, replacer] of EMBEDS) {
      chapter.content = chapter.content.replace(re, replacer(chapter));
    }
  });

  process.stdout.write(JSON.stringify(book));
}

function readAllStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('error', (err) => reject(err));
    process.stdin.on('close', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('data', (chunk) => chunks.push(chunk));
  });
}

// recursively iterate over each chapter in the book
export function forEachChapter(book, callback) {
  const recurse = (sections) =>
    sections
      .filter((s) => typeof s !== 'string')
      .filter((s) => 'Chapter' in s)
      .map((s) => {
        callback(s.Chapter);
        recurse(s.Chapter.sub_items);
      });

  recurse(book.sections);
}

// log to stderr
export function log(...args) {
  const things = [];
  for (const arg of args) {
    things.push(inspect(arg));
  }

  process.stderr.write(`${things.join(' ')}\n`);
}

main().then(
  () => process.exit(0),
  (err) => {
    log(err);
    process.exit(1);
  }
);
