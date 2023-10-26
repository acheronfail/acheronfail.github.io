#!/usr/bin/env ./node_modules/.bin/tsx

import { runPreprocessor, forEachChapter, declareSupports } from '../common';

declareSupports(['html']);

const RE_MD_IMAGE = /!\[(?<alt>.*?)\]\((?<src>.*?)\)/g;

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    chapter.content = chapter.content.replace(RE_MD_IMAGE, (_match, alt, src) =>
      `\
<div class="image">
    <img alt="${alt}" src="${src}" />
    <span class="caption">${alt}</span>
</div>
    `.trim()
    );
  });
});
