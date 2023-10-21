#!/usr/bin/env node

import { join, relative } from 'path';
import { runPreprocessor, forEachChapter, declareSupports, PATH_SRC } from './common.mjs';
import { $ } from 'execa';

declareSupports(['html']);

// https://cplusplus.com/reference/ctime/strftime/
const DATE_FORMAT = '%A %B %d %Y, %H:%M';

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    const argFile = relative(process.cwd(), join(PATH_SRC, chapter.path));
    const argDate = `--date=format:${DATE_FORMAT}`;

    const { stdout: creation } = await $`git log -1 --diff-filter=A --follow ${argDate} --format=%cd -- ${argFile}`;
    const { stdout: modified } = await $`git log -1 ${argDate} --pretty=format:%cd -- ${argFile}`;

    chapter.content += `\n<div class="modified">
      Created: ${creation}
      ${creation != modified ? `<br/>Last updated: ${modified}` : ''}
</div>`;
  });
});
