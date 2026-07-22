import { inspect } from 'util';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFile, stat } from 'fs/promises';
import { parse } from 'smol-toml';
import { z } from 'zod';
import type { Book, Chapter, Context, Section, SectionChapter } from './types.d.ts';

export const PATH_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = parse(await readFile(join(PATH_ROOT, 'book.toml'), 'utf8'));
const sourceDirectory = z.object({ book: z.object({ src: z.string() }) }).parse(config).book.src;
export const PATH_BOOK = join(PATH_ROOT, sourceDirectory);
export const PATH_SUMMARY = join(PATH_BOOK, 'SUMMARY.md');
export const TAGS_CHAPTER_PATH = 'tags.md';

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
    process.exitCode = 0;
  } catch (err) {
    log(err);
    process.exitCode = 1;
  }
}

export function declareSupports(outputs: [string, ...string[]]) {
  // https://rust-lang.github.io/mdBook/for_developers/preprocessors.html
  if (process.argv[2] === 'supports') {
    process.exit(outputs.includes(process.argv[3]!) ? 0 : 1);
  }
}

// read all stdin into a string
async function readProcessStdin(): Promise<string> {
  process.stdin.setEncoding('utf8');
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input;
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

  await Promise.all(recurse(book.items));
}

// log to stderr
export function log(...args: unknown[]) {
  const things: string[] = [];
  for (const arg of args) {
    things.push(inspect(arg));
  }

  process.stderr.write(`${things.join(' ')}\n`);
}

const FrontMatter = z.object({
  tags: z.string().array(),
});
export type FrontMatter = z.infer<typeof FrontMatter>;

// parse front matter
export function parseFrontMatter(input: string, path: string): FrontMatter | null {
  try {
    const toml = parse(input);
    return FrontMatter.parse(toml);
  } catch (err) {
    if (err instanceof Error) {
      const msg = [`Error parsing frontmatter: "${err.message}"`];
      if (path) {
        msg.push(`in ${path}`);
      }
      process.stderr.write(`${msg.join(' ')}\n`);
      return null;
    }

    throw err;
  }
}

/**
 * @returns returns `[FrontMatterLines[], RestLines[]]`
 */
export function splitFrontMatter(lines: string[]): [string[], string[]] {
  if (!lines[0]?.includes('+++')) {
    return [[], lines];
  }

  let i = 1;
  while (!lines[i]?.includes('+++')) ++i;
  return [lines.slice(1, i), lines.slice(i + 1)];
}
