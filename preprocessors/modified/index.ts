#!/usr/bin/env bun

import { join, relative } from 'path';
import { runPreprocessor, forEachChapter, declareSupports, PATH_BOOK, isFile } from '../common.js';
import { $ } from 'execa';

declareSupports(['html']);

// https://cplusplus.com/reference/ctime/strftime/
const DATE_FORMAT = '%A %B %d %Y, %H:%M';

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    if (chapter.path === null) return;

    const argFile = relative(process.cwd(), join(PATH_BOOK, chapter.path));
    const argDate = `--date=format:${DATE_FORMAT}`;

    let [{ stdout: creation }, { stdout: modified }, exists] = await Promise.all([
      $`git log -1 --diff-filter=A --follow ${argDate} --format=%cd -- ${argFile}`,
      $`git log -1 ${argDate} --pretty=format:%cd -- ${argFile}`,
      isFile(argFile),
    ]);

    // git won't error if the path isn't recognised, so sanity check it ourselves
    if (!exists) {
      throw new Error(`Failed to find file: ${argFile}`);
    }

    if (!creation) creation = '???';
    if (!modified) modified = creation;

    chapter.content += `\n<div class="modified">
      Created: ${creation}
      ${creation != modified ? `<br/>Last updated: ${modified}` : ''}
</div>`;
  });
});
