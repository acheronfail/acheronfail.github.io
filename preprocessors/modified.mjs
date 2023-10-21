#!/usr/bin/env node

import { join, relative } from 'path';
import { runPreprocessor, forEachChapter, declareSupports, PATH_SRC } from './common.mjs';
import { $ } from 'execa';

declareSupports(['html']);

// https://cplusplus.com/reference/ctime/strftime/
const DATE_FORMAT = '%A %B %d %Y, %H:%M';

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    const filePath = relative(process.cwd(), join(PATH_SRC, chapter.path));
    const modified = await $`git log -1 ${`--date=format:${DATE_FORMAT}`} --pretty=format:%cd -- ${filePath}`;
    const markdown = `<div class="modified">Last updated: ${modified.stdout}</div>`;

    chapter.content += `\n${markdown}`;
  });
});
