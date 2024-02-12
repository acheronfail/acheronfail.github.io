#!/usr/bin/env bun

import {
  FrontMatter,
  declareSupports,
  forEachChapter,
  splitFrontMatter,
  parseFrontMatter,
  runPreprocessor,
  TAGS_CHAPTER_PATH,
} from '../common.js';
import { Chapter } from '../types.js';

declareSupports(['html']);

const keyFromTag = (tag: string): string => tag.trim().toLowerCase();
const allFrontMatter: { chapter: Chapter; frontMatter: FrontMatter }[] = [];
let tagsChapter: Chapter | null = null;

await runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    if (!chapter.path) {
      return;
    }

    if (chapter.path === TAGS_CHAPTER_PATH) {
      tagsChapter = chapter;
    }

    const [frontMatterLines, lines] = splitFrontMatter(chapter.content.split('\n'));
    if (!frontMatterLines.length) {
      return;
    }

    // remove frontmatter from page
    chapter.content = lines.join('\n');

    // parse frontmatter
    const frontMatter = parseFrontMatter(frontMatterLines.join('\n'), chapter.path);
    if (!frontMatter) {
      return;
    }

    allFrontMatter.push({ chapter, frontMatter });

    // add tags to the end of the page if there were any
    if (frontMatter.tags.length) {
      chapter.content += `\n<div class="tags">\n\nTags: ${frontMatter.tags
        .map((tag) => `[\`${tag}\`](/${TAGS_CHAPTER_PATH}#${keyFromTag(tag)})`)
        .join(', ')}</div>`;
    }
  });

  if (!tagsChapter) {
    throw new Error('Failed to find tags page!');
  }

  type TagMap = Map<string, { name: string; path: string }[]>;

  const map = allFrontMatter.reduce<TagMap>((tags, { chapter, frontMatter }) => {
    if (!chapter.path) return tags;

    const file = { name: chapter.name, path: chapter.path };
    frontMatter.tags.forEach((tag) => {
      const key = keyFromTag(tag);
      const existing = tags.get(key);
      if (existing) {
        existing.push(file);
      } else {
        tags.set(key, [file]);
      }
    });

    return tags;
  }, new Map());

  const tags: string[] = [
    '',
    ...[...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([tag, files]) => [
        '',
        `#### \`${tag}\``,
        ...files.sort((a, b) => a.name.localeCompare(b.name)).map(({ name, path }) => `* [${name}](${path})`),
      ]),
  ];

  tagsChapter.content += tags.join('\n');
});
