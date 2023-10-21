#!/usr/bin/env node

import { join, relative } from 'path';
import { readdirSync } from 'fs';
import { runPreprocessor, forEachChapter, declareSupports, PATH_SRC } from './common.mjs';

declareSupports(['html']);

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

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, (chapter) => {
    for (const [re, replacer] of EMBEDS) {
      chapter.content = chapter.content.replace(re, replacer(chapter));
    }
  });
});
