#!/usr/bin/env bun

import { join, relative } from 'path';
import { runPreprocessor, forEachChapter, declareSupports, PATH_BOOK, isFile } from '../common.js';
import { $ } from 'execa';

declareSupports(['html']);

const dateFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour12: false,
    year: 'numeric',
    month: 'long',
    weekday: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone,
  });

type GitDate = [number, string | undefined];
function parseGitDate(gitDateStr: string): GitDate {
  // git will return successfully but with no output if it didn't know about
  // the file, so explicitly check if we got something
  if (!gitDateStr.includes('-')) {
    return [0, undefined];
  }

  const [secondsStr, timezone] = gitDateStr.split('-');
  return [secondsStr ? parseInt(secondsStr) : 0, timezone];
}

function gitDateToDateString([unixSeconds, timezone]: GitDate): string {
  if (unixSeconds === 0) {
    return '???';
  }

  const fallbackTimezone = 'Australia/Melbourne';
  return dateFormatter(
    {
      undefined: fallbackTimezone,
      '+1000': 'Australia/Melbourne',
      '+1100': 'Australia/Melbourne',
      '+1030': 'Australia/Adelaide',
      '+0930': 'Australia/Adelaide',
    }[String(timezone)] ?? fallbackTimezone
  ).format(unixSeconds * 1000);
}

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    if (chapter.path === null) return;

    const argFile = relative(process.cwd(), join(PATH_BOOK, chapter.path));
    const argDate = `--date=format:%s-%z`;

    const [{ stdout: creationStr }, { stdout: modifiedStr }, exists] = await Promise.all([
      $`git log -1 --diff-filter=A --follow ${argDate} --format=%cd -- ${argFile}`,
      $`git log -1 ${argDate} --pretty=format:%cd -- ${argFile}`,
      isFile(argFile),
    ]);

    // git won't error if the path isn't recognised, so sanity check it ourselves
    if (!exists) {
      throw new Error(`Failed to find file: ${argFile}`);
    }

    const creationDate = parseGitDate(creationStr);
    let modifiedDate = parseGitDate(modifiedStr);
    if (modifiedDate[0] <= creationDate[0]) modifiedDate = creationDate;

    chapter.content += `\n<div class="modified">
      Created: ${gitDateToDateString(creationDate)}
      ${modifiedDate != creationDate ? `<br/>Last updated: ${gitDateToDateString(modifiedDate)}` : ''}
</div>`;
  });
});
