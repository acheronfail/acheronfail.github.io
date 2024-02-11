import { expect, test, describe } from 'bun:test';
import { File, getAllFiles, getAllHtmlHeaders, getAllMarkdownLinks } from './util.js';
import { dirname, resolve } from 'path';
import { stat } from 'fs/promises';
import { NodeWalkingStep, Parser } from 'commonmark';
import c from 'chalk';
import { splitFrontMatter } from '../preprocessors/common.js';

describe('markdown tests', () => {
  /**
   * Search for any keywords that indicate unfinished content.
   */

  const RE_TODOS = /TODO|FIXME/gi;
  interface TodoSearchResult {
    path: string;
    what: string;
    line: string;
    row: number;
    col: number;
  }

  test('no TODO or FIXME in files referenced from summary', async () => {
    const checkForTodos = async ({ markdownPath }: File) => {
      const text = await Bun.file(markdownPath).text();
      const matches: TodoSearchResult[] = [];

      text.split('\n').forEach((line, index) => {
        let match: RegExpExecArray | null;
        while ((match = RE_TODOS.exec(line))) {
          matches.push({
            path: markdownPath,
            line,
            what: match[0],
            row: index + 1,
            col: match.index + 1,
          });
        }
      });

      return matches;
    };

    const checks = (await getAllFiles()).map(checkForTodos);
    const allMatches = (await Promise.all(checks)).flat();
    if (allMatches.length > 0) {
      expect().fail(
        c.bold.yellow(`Found unfinished indicators:\n`) +
          allMatches
            .map(
              ({ path, row, col, line, what }) =>
                `  ${line.substring(0, col - 1)}${c.red(what)}${line.substring(col + what.length)}\n\t${c.gray(
                  `at ${path}:${row}:${col}`
                )}`
            )
            .join('\n')
      );
    }
  });

  /**
   * Get all links from all pages, and then check they point to valid paths.
   */

  test('internal links are valid', async () => {
    const { internal } = await getAllMarkdownLinks();
    const htmlHeaders = await getAllHtmlHeaders();
    const brokenLinks = await Promise.all(
      internal.map(async ({ from, to, ...rest }) => {
        const resolved = resolve(from.endsWith('index.md') ? dirname(from) : from, to);
        if (to.startsWith('#')) {
          const headers = htmlHeaders.find((h) => h.markdownPath === from);
          if (!headers) {
            throw new Error(`Failed to find html headers for md file: ${from}`);
          }

          const toId = to.substring(1);
          return {
            from,
            to,
            ...rest,
            resolved: toId,
            exists: headers.headerIds.some((id) => id === toId),
          };
        }

        return {
          from,
          to,
          ...rest,
          resolved,
          exists: await stat(resolved).then(
            () => true,
            () => false
          ),
        };
      })
    ).then((results) => results.filter((x) => !x.exists));

    if (brokenLinks.length > 0) {
      expect().fail(
        c.bold.yellow(`Found broken internal links:\n`) +
          brokenLinks.map(({ to, from }) => `  Invalid link: ${c.red(to)}\n\t${c.gray(`from ${from}`)}`).join('\n')
      );
    }
  });

  /**
   * Ensure content inside `<div class="warning">` tags is properly parsed as markdown.
   * See: https://talk.commonmark.org/t/bug-or-expected-markdown-sometimes-doesnt-work-inside-div-tags/4378/4
   */

  const RE_DIV_WARNING = /[\s\S]*?<div\s+class=".*?warning.*?">([\s\S]*)/im;
  interface DivWarningError {
    match: string;
    path: string;
    row: number;
    col: number;
  }
  test('div.warning blocks contain markdown', async () => {
    const files = await getAllFiles();
    const results = await Promise.all(
      files.map(async ({ markdownPath }) => {
        const text = await Bun.file(markdownPath).text();
        const ast = new Parser().parse(text);
        const walker = ast.walker();

        const errors: DivWarningError[] = [];
        let event: NodeWalkingStep | null;
        while ((event = walker.next())) {
          const { entering, node } = event;
          if (entering && node.type === 'html_block') {
            if (!node.literal) continue;
            if (node.literal.startsWith('<!--')) continue;

            // NOTE: we don't content within these warning blocks to be parsed as a single `html_block`, we want
            // them to be parsed as individual blocks so their content is also parsed as markdown.
            const match = RE_DIV_WARNING.exec(node.literal);
            if (!match) continue;
            if (match[1] && match[1].length > 0) {
              const [[row, col]] = node.sourcepos;
              errors.push({
                match: match[0],
                row,
                col,
                path: markdownPath,
              });
            }
          }
        }

        return errors;
      })
    ).then((results) => results.flat());

    if (results.length > 0) {
      expect().fail(
        c.bold.yellow(`Found <div class="warning"> block whose content is not parsed as markdown:\n`) +
          results
            .map(
              ({ path, row, col, match }) =>
                `  Insert a newline after this opening tag: ${c.red(match)}\n\tat ${c.grey(`${path}:${row}:${col}`)}`
            )
            .join('\n')
      );
    }
  });

  /**
   * Check that all [shorthand] [links] have an associated definition
   * for them somewhere in the file. For example:
   *
   * [shorthand]: ...
   * [links]: ...
   */

  test('no shorthand markdown links without links', async () => {
    const reLink = /\[(?<name>.+?)\](?!\()/g;
    const reLinkDef = /\[(?<name>.+?)\]:\s*.+?/g;

    const files = await getAllFiles();
    const results = await Promise.all(
      files.map(async ({ markdownPath }) => {
        const text = await Bun.file(markdownPath).text();
        const [_, lines] = splitFrontMatter(text.split('\n'));

        const allLinks = new Set();
        const allLinkDefs = new Set();
        let isInCodeblock = false;

        for (let line of lines) {
          // skip codeblocks
          if (line.startsWith('```') || line.startsWith('~~~')) isInCodeblock = !isInCodeblock;
          if (isInCodeblock) continue;

          // strip inline codeblocks
          line = line.replace(/`.+?`/g, '');

          for (const match of line.matchAll(reLink)) {
            allLinks.add(match.groups!['name']);
          }
          for (const match of line.matchAll(reLinkDef)) {
            allLinkDefs.add(match.groups!['name']);
          }
        }

        return {
          markdownPath,
          missing: Array.from(allLinks.keys()).filter((name) => !allLinkDefs.has(name)),
        };
      })
    ).then((results) => results.filter(({ missing }) => missing.length > 0));

    if (results.length > 0) {
      expect().fail(
        c.bold.yellow(`Found some shorthand markdown links without definitions:\n`) +
          results
            .map(
              ({ markdownPath, missing }) =>
                `${missing
                  .map((name) => `  No definition found for ${c.red(`[${name}]`)}`)
                  .join('\n')}\n    at: ${c.grey(markdownPath)}`
            )
            .join('\n')
      );
    }
  });
});
