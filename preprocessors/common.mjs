import { inspect } from 'util';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export const PATH_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');

export function runPreprocessor(callback) {
  async function inner() {
    const [context, book] = JSON.parse(await readAllStdin());
    await callback(context, book);
    process.stdout.write(JSON.stringify(book));
  }

  inner().then(
    () => process.exit(0),
    (err) => {
      log(err);
      process.exit(1);
    }
  );
}

export function declareSupports(outputs) {
  // https://rust-lang.github.io/mdBook/for_developers/preprocessors.html
  if (process.argv[2] === 'supports') {
    process.exit(outputs.includes(process.argv[3]) ? 0 : 1);
  }
}

function readAllStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('error', (err) => reject(err));
    process.stdin.on('close', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('data', (chunk) => chunks.push(chunk));
  });
}

// recursively iterate over each chapter in the book
export async function forEachChapter(book, callback) {
  const recurse = (sections) =>
    sections
      .filter((s) => typeof s !== 'string')
      .filter((s) => 'Chapter' in s)
      .map(async (s) => {
        await callback(s.Chapter);
        await Promise.all(recurse(s.Chapter.sub_items));
      });

  await Promise.all(recurse(book.sections));
}

// log to stderr
export function log(...args) {
  const things = [];
  for (const arg of args) {
    things.push(inspect(arg));
  }

  process.stderr.write(`${things.join(' ')}\n`);
}
