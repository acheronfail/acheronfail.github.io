import { inspect } from 'util';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { stat } from 'fs/promises';
import { Book, Chapter, Context, Section, SectionChapter } from './types.js';

export const PATH_BOOK = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'book');
export const PATH_LIB = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

export function isFile(path: string): Promise<boolean> {
  return stat(path).then(
    (stat) => stat.isFile(),
    () => false
  );
}

export async function runPreprocessor(callback: (context: Context, book: Book) => void | Promise<void>) {
  try {
    const [context, book] = JSON.parse(await readProcessStdin());
    await callback(context, book);
    process.stdout.write(JSON.stringify(book));
    process.exit(0);
  } catch (err) {
    log(err);
    process.exit(1);
  }
}

export function declareSupports(outputs: [string, ...string[]]) {
  // https://rust-lang.github.io/mdBook/for_developers/preprocessors.html
  if (process.argv[2] === 'supports') {
    process.exit(outputs.includes(process.argv[3]!) ? 0 : 1);
  }
}

// read all stdin into a string
function readProcessStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('error', (err) => reject(err));
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

// recursively iterate over each chapter in the book
export async function forEachChapter(book: Book, callback: (chapter: Chapter) => void | Promise<void>) {
  const recurse = (sections: Section[]) =>
    sections
      .filter((s): s is Exclude<Section, 'Separator'> => typeof s !== 'string')
      .filter((s): s is SectionChapter => 'Chapter' in s)
      .map(async (s) => {
        await callback(s.Chapter);
        await Promise.all(recurse(s.Chapter.sub_items));
      });

  await Promise.all(recurse(book.sections));
}

// log to stderr
export function log(...args: unknown[]) {
  const things: string[] = [];
  for (const arg of args) {
    things.push(inspect(arg));
  }

  process.stderr.write(`${things.join(' ')}\n`);
}
