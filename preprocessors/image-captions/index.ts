#!/usr/bin/env ./node_modules/.bin/tsx

import { runPreprocessor, forEachChapter, declareSupports } from '../common.js';

declareSupports(['html']);

const RE_MD_IMAGE = /!!?\[(?<alt>.*?)\]\((?<src>.*?)\)/g;

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    chapter.content = chapter.content.replace(RE_MD_IMAGE, (match, alt, src) => {
      const noBorder = match.startsWith('!!');
      const className = noBorder ? 'image' : 'image border';
      return `\
<div class="${className}">
    <img alt="${alt}" src="${src}" />
    <span class="caption">${alt}</span>
</div>
    `.trim();
    });
  });
});
