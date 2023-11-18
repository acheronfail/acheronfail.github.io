#!/usr/bin/env bun

import { declareSupports, runPreprocessor, forEachChapter } from '../common.js';

const RE_CODEBLOCK = /^```(?<info>.*)\n([\s\S]+?)```$/gim;
const RE_TITLE = /title="(?<title>.+)"/i;

declareSupports(['html']);

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    chapter.content = chapter.content.replace(RE_CODEBLOCK, (original, info) => {
      const match = RE_TITLE.exec(info);
      // TODO: consider using the `lang` in info as a default? and use `notitle` to disable?
      if (!match) return original;

      const { title } = match.groups!;
      // NOTE: double newline here to ensure inner content is parsed as markdown
      return `\n<div class="cb-wrapper"><div class="cb-title">${title}</div>\n\n${original}\n</div>\n`;
    });
  });
});
