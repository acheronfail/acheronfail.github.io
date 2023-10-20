#!/usr/bin/env node
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/bun-types/types.d.ts" />
/// <reference path="./types.d.ts" />

// TODO: use Bun (currently has issues with stdin: https://github.com/oven-sh/bun/issues/5240)

// https://rust-lang.github.io/mdBook/for_developers/preprocessors.html
if (process.argv[2] === 'supports') {
  process.exit(0);
}

forEachChapter((chapter) => {
  // NOTE: can add `?autoplay=1` for auto play
  chapter.content = chapter.content.replace(/{{\s*youtube\(id="([a-zA-Z0-9]+)"\)\s*}}/g, (_match, id) =>
    `<div class="embed">
      <iframe
          src="https://www.youtube.com/embed/${id}"
          webkitallowfullscreen
          mozallowfullscreen
          allowfullscreen>
      </iframe>
    </div>`.trim()
  );
}).then((book) => {
  process.stdout.write(JSON.stringify(book));
});

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (input += chunk));
    process.stdin.on('close', () => {
      try {
        resolve(JSON.parse(input));
      } catch (err) {
        reject(err);
      }
    });
    process.stdin.on('error', (err) => reject(err));
  });
}

export async function forEachChapter(fn) {
  const [_, book] = await readStdin();
  for (const { Chapter } of book.sections) {
    if (!Chapter) continue;
    fn(Chapter);
    Chapter.sub_items.forEach(({ Chapter }) => {
      if (!Chapter) return;
      fn(Chapter);
    });
  }

  return book;
}
