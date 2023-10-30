#!/usr/bin/env ./node_modules/.bin/tsx

import { dirname, join, relative } from 'path';
import { readdir, readFile } from 'fs/promises';
import { $ } from 'execa';
import { runPreprocessor, forEachChapter, declareSupports, PATH_BOOK, log, PATH_LIB } from '../common';
import { Chapter } from '../types';

declareSupports(['html']);

const EMBEDS = new Map<RegExp, (chapter: Chapter) => (match: RegExpMatchArray) => string | Promise<string>>([
  // {{app(name="foo")}}
  [
    /{{\s*app\(name="(?<name>[0-9a-zA-Z]+)"\)\s*}}/gi,
    (chapter) => async (match) => {
      const { name } = match.groups!;
      const inputPath = join(PATH_LIB, name, 'index.ts');
      const outputName = `${name}.bundle.js`;
      const outputPath = join(dirname(join(PATH_BOOK, chapter.path)), outputName);
      await $`bun build --target=browser ${inputPath} --outfile ${outputPath}`;
      return `<div id="app-${name}"></div><script type="module" type="text/javascript" src="./${outputName}"></script>`;
    },
  ],
  // {{youtube(id="foo")}}
  [
    /{{\s*youtube\(id="(?<id>[0-9a-zA-Z]+)"\)\s*}}/gi,
    (_chapter) => (match) =>
      `\
  <div class="embed">
    <iframe
        src="https://www.youtube-nocookie.com/embed/${match.groups!.id}"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
  </div>`.trim(),
  ],
  // {{filelist(../path/to/dir)}}
  [
    /{{\s*filelist\((?<path>.+)\)\s*}}/gi,
    (chapter) => async (match) => {
      const realPath = join(PATH_BOOK, chapter.path, match.groups!.path);

      const list: { mdName: string; mdPath: string }[] = [];
      for (const entry of await readdir(realPath, { withFileTypes: true })) {
        if (entry.isFile()) {
          list.push({
            mdName: entry.name,
            mdPath: `/${relative(PATH_BOOK, join(realPath, entry.name))}`,
          });
        }
      }

      return `**Downloads:**\n${list
        .map(({ mdName, mdPath }) => `- <a href="${mdPath}" download>${mdName}</a>`)
        .join('\n')}`;
    },
  ],
]);

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    for (const [re, replacer] of EMBEDS) {
      try {
        const replacements = await Promise.all(Array.from(chapter.content.matchAll(re)).map(replacer(chapter)));
        let i = 0;
        chapter.content = chapter.content.replace(re, () => replacements[i++]);
      } catch (err) {
        log(err);
      }
    }
  });
});
