#!/usr/bin/env bun

import { dirname, join, relative } from 'path';
import { readFile, readdir } from 'fs/promises';
import {
  runPreprocessor,
  forEachChapter,
  declareSupports,
  PATH_BOOK,
  log,
  PATH_SUMMARY,
  PATH_ROOT,
} from '../common.js';
import { Chapter } from '../types.js';

declareSupports(['html']);

const GITHUB_PATH_PREFIX = 'https://github.com/acheronfail/acheronfail.github.io/blob/master';

const EMBEDS = new Map<RegExp, (chapter: Chapter) => (match: RegExpMatchArray) => string | Promise<string>>([
  // put a `github:` prefix in a markdown link to link directly to that file in the repository
  // e.g.: `[text](github:path)`
  [
    /(?!\]\()github:(?<path>.+)(?!\))/gi,
    (chapter) => (match) => {
      if (!chapter.path) {
        throw new Error('Chapter path required for this replacer!');
      }

      return [
        GITHUB_PATH_PREFIX,
        join(relative(PATH_ROOT, PATH_BOOK), dirname(chapter.path), match.groups!['path']!),
      ].join('/');
    },
  ],
  // shortcut for `~~~admonish`
  // mainly here so we can have accurate IDE syntax highlighting in the admonish blocks
  [/~~~md\s/gi, (_chapter) => async (_match) => '~~~admonish '],
  // {{latest_post_url}},
  [
    /{{latest_post_url}}/gi,
    (_chapter) => async (_match) => {
      const summary = await readFile(PATH_SUMMARY, 'utf-8');
      for (const line of summary.split('\n')) {
        const match = /\[.+?\]\((\.\/)?(?<mdPath>posts\/.+?)\)/.exec(line);
        if (match) {
          const href = match.groups!['mdPath']!.replace(/\.md$/i, '.html');
          return encodeURIComponent(href).replace(/%2F/gi, '/');
        }
      }

      throw new Error('Failed to find latest post!');
    },
  ],
  // {{youtube(id="foo")}}
  [
    /{{\s*youtube\(id="(?<id>[0-9a-zA-Z]+)"\)\s*}}/gi,
    (_chapter) => (match) =>
      `\
  <div class="embed">
    <iframe
        src="https://www.youtube-nocookie.com/embed/${match.groups!['id']}"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
  </div>`.trim(),
  ],
  // {{filelist(../path/to/dir)}}
  [
    /{{\s*filelist\((?<path>.+)\)\s*}}/gi,
    (chapter) => async (match) => {
      if (!chapter.path) return '';

      const realPath = join(PATH_BOOK, chapter.path, match.groups!['path']!);

      const list: { mdName: string; mdPath: string }[] = [];
      for (const entry of await readdir(realPath, { withFileTypes: true })) {
        if (entry.isFile()) {
          list.push({
            mdName: entry.name,
            mdPath: `/${relative(PATH_BOOK, join(realPath, entry.name))}`,
          });
        }
      }

      return `**Downloads:**\n${list
        .map(({ mdName, mdPath }) => `- <a href="${mdPath}" download>${mdName}</a>`)
        .join('\n')}`;
    },
  ],
]);

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    for (const [re, replacer] of EMBEDS) {
      try {
        const replacements = await Promise.all(Array.from(chapter.content.matchAll(re)).map(replacer(chapter)));
        let i = 0;
        chapter.content = chapter.content.replace(re, () => replacements[i++]!);
      } catch (err) {
        log(err);
      }
    }
  });
});
