#!/usr/bin/env ./node_modules/.bin/tsx

import { join, relative } from 'path';
import { runPreprocessor, forEachChapter, declareSupports, PATH_BOOK } from '../common';
import { $ } from 'execa';

declareSupports(['html']);

// https://cplusplus.com/reference/ctime/strftime/
const DATE_FORMAT = '%A %B %d %Y, %H:%M';

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    const argFile = relative(process.cwd(), join(PATH_BOOK, chapter.path));
    const argDate = `--date=format:${DATE_FORMAT}`;

    let { stdout: creation } = await $`git log -1 --diff-filter=A --follow ${argDate} --format=%cd -- ${argFile}`;
    let { stdout: modified } = await $`git log -1 ${argDate} --pretty=format:%cd -- ${argFile}`;

    if (!creation) creation = '???';
    if (!modified) modified = creation;

    chapter.content += `\n<div class="modified">
      Created: ${creation}
      ${creation != modified ? `<br/>Last updated: ${modified}` : ''}
</div>`;
  });
});
