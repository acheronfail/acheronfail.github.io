/// <reference path="../types/link-check.d.ts" />

import linkCheck from 'link-check';
import { getAllLinks } from './util';
import { promisify } from 'util';
import pLimit from 'p-limit';
import c from 'chalk';

/**
 * Check all external links
 */

const links = await getAllLinks();
const check = promisify(linkCheck);
const limit = pLimit(5);

let count = 0;
const failed: { link: string; err: string }[] = [];
await Promise.all(
  links.external.map(({ to: link }) =>
    limit(async () => {
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `Checked: ${count++} / ${links.external.length}, failed: ${failed.length} ${c.grey(link.slice(0, 40) + '...')}`
      );

      try {
        const result = await check(link);
        if (result.err) {
          failed.push({ link, err: result.err.message });
        } else if (result.statusCode !== 200) {
          failed.push({ link, err: `Unexpected status code ${result.statusCode} for ${link}` });
        } else if (result.status !== 'alive') {
          failed.push({ link, err: `Unexpected status ${result.status} for ${link}` });
        }
      } catch (err) {
        failed.push({ link, err: err instanceof Error ? err.message : `Unexpected error: ${err}` });
      }
    })
  )
);

for (const { link, err } of failed) {
  console.error(`FAIL(${link}): ${err}`);
}

process.stderr.clearLine(0);
process.stderr.cursorTo(0);
process.exit(failed.length > 0 ? 1 : 0);
