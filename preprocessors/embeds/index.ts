#!/usr/bin/env bun

import { join, relative } from 'path';
import { readdir } from 'fs/promises';
import { runPreprocessor, forEachChapter, declareSupports, PATH_BOOK, log } from '../common.js';
import { Chapter } from '../types.js';

declareSupports(['html']);

const EMBEDS = new Map<RegExp, (chapter: Chapter) => (match: RegExpMatchArray) => string | Promise<string>>([
  // {{youtube(id="foo")}}
  [
    /{{\s*youtube\(id="(?<id>[0-9a-zA-Z]+)"\)\s*}}/gi,
    (_chapter) => (match) =>
      `\
  <div class="embed">
    <iframe
        src="https://www.youtube-nocookie.com/embed/${match.groups!['id']}"
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
      const realPath = join(PATH_BOOK, chapter.path, match.groups!['path']!);

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
        chapter.content = chapter.content.replace(re, () => replacements[i++]!);
      } catch (err) {
        log(err);
      }
    }
  });
});
