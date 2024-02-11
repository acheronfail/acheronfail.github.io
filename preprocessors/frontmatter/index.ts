#!/usr/bin/env bun

import { FrontMatter, declareSupports, forEachChapter, parseFrontMatter, runPreprocessor } from '../common.js';
import { Chapter } from '../types.js';

declareSupports(['html']);

const FRONT_MATTER_PATTERNS = ['+++'];

const allFrontMatter: { chapter: Chapter; frontMatter: FrontMatter }[] = [];
let tagsChapter: Chapter | null = null;

await runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    if (chapter.path === 'tags.md') {
      tagsChapter = chapter;
    }

    const lines = chapter.content.split('\n');
    const hasFrontmatter = FRONT_MATTER_PATTERNS.includes(lines[0]?.trim() ?? '');
    if (!hasFrontmatter) {
      return;
    }

    let i = 1;
    while (!FRONT_MATTER_PATTERNS.includes(lines[i]?.trim() ?? '')) {
      i++;
    }

    chapter.content = lines.slice(i + 1).join('\n');

    if (!chapter.path) {
      return;
    }

    const frontMatter = parseFrontMatter(lines.slice(1, i).join('\n'), chapter.path);
    if (!frontMatter) {
      return;
    }

    allFrontMatter.push({ chapter, frontMatter });
  });

  if (!tagsChapter) {
    throw new Error('Failed to find tags page!');
  }

  type TagMap = Map<string, { name: string; path: string }[]>;

  const map = allFrontMatter.reduce<TagMap>((tags, { chapter, frontMatter }) => {
    if (!chapter.path) return tags;

    const file = { name: chapter.name, path: chapter.path };
    frontMatter.tags.forEach((tag) => {
      const key = tag.trim().toLowerCase();
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
        `\`${tag}\``,
        ...files.sort((a, b) => a.name.localeCompare(b.name)).map(({ name, path }) => `* [${name}](${path})`),
      ]),
  ];

  tagsChapter.content += tags.join('\n');
});
