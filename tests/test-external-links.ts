import linkCheck, { LinkCheckResult } from 'link-check';
import { getAllMarkdownLinks } from './util.js';
import pLimit from 'p-limit';
import c from 'chalk';

/**
 * Check all external links
 */

const links = await getAllMarkdownLinks();
const limit = pLimit(5);
const check = (url: string): Promise<LinkCheckResult> =>
  new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Timed out')), 10_000);
    linkCheck(url, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

let count = 0;
const failed: { link: string; from: string; err: string }[] = [];
await Promise.all(
  links.external.map(({ to: link, from }) =>
    limit(async () => {
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `Checked: ${count++} / ${links.external.length}, failed: ${failed.length} ${c.grey(link.slice(0, 40) + '...')}`
      );

      try {
        const result = await check(link);
        if (result.err) {
          failed.push({ link, from, err: result.err.message });
        } else if (result.statusCode !== 200) {
          failed.push({ link, from, err: `Unexpected status code ${result.statusCode} for ${link}` });
        } else if (result.status !== 'alive') {
          failed.push({ link, from, err: `Unexpected status ${result.status} for ${link}` });
        }
      } catch (err) {
        failed.push({ link, from, err: err instanceof Error ? err.message : `Unexpected error: ${err}` });
      }
    })
  )
);

process.stderr.clearLine(0);
process.stderr.cursorTo(0);

for (const { link, from, err } of failed) {
  console.error(`FAIL(${link}): ${err}\n\tfrom: ${c.grey(from)}`);
}

process.exit(failed.length > 0 ? 1 : 0);
