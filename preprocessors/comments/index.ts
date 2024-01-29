#!/usr/bin/env bun

import { runPreprocessor, forEachChapter, declareSupports } from '../common.js';

declareSupports(['html']);

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    if (chapter.path === null) return;
    if (!chapter.path.startsWith('posts/')) return;

    chapter.content += `\n
<script src="https://utteranc.es/client.js"
    repo="acheronfail/acheronfail.github.io"
    issue-term="pathname"
    label="💬"
    theme="preferred-color-scheme"
    crossorigin="anonymous"
    async>
</script>`;
  });
});
