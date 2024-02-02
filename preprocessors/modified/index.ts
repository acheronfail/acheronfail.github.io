#!/usr/bin/env bun

import { join, relative } from 'path';
import { runPreprocessor, forEachChapter, declareSupports, PATH_BOOK, isFile } from '../common.js';
import { $ } from 'execa';

declareSupports(['html']);

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  hour12: false,
  year: 'numeric',
  month: 'long',
  weekday: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

function unixSecondsToDateString(unixSeconds: number): string {
  // This is NaN when git returned no output (it didn't know about the file).
  if (Number.isNaN(unixSeconds)) {
    return '???';
  }

  return dateFormatter.format(unixSeconds * 1000);
}

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    if (chapter.path === null) return;

    const argFile = relative(process.cwd(), join(PATH_BOOK, chapter.path));
    const argDate = `--date=format:%s`;

    let [{ stdout: creationStr }, { stdout: modifiedStr }, exists] = await Promise.all([
      $`git log -1 --diff-filter=A --follow ${argDate} --format=%cd -- ${argFile}`,
      $`git log -1 ${argDate} --pretty=format:%cd -- ${argFile}`,
      isFile(argFile),
    ]);

    // git won't error if the path isn't recognised, so sanity check it ourselves
    if (!exists) {
      throw new Error(`Failed to find file: ${argFile}`);
    }

    let creationSecs = parseInt(creationStr);
    let modifiedSecs = parseInt(modifiedStr);
    if (modifiedSecs <= creationSecs) modifiedSecs = creationSecs;

    chapter.content += `\n<div class="modified">
      Created: ${unixSecondsToDateString(creationSecs)}
      ${modifiedSecs != creationSecs ? `<br/>Last updated: ${unixSecondsToDateString(modifiedSecs)}` : ''}
</div>`;
  });
});
