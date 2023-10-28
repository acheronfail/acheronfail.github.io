/// <reference path="../node_modules/bun-types/types.d.ts" />

import { join } from 'path';
import { NodeWalkingStep, Parser } from 'commonmark';

let allFiles: Promise<string[]> | null = null;
export async function getAllFiles() {
  if (allFiles) return allFiles;
  return (allFiles = (async () => {
    const text = await Bun.file('src/SUMMARY.md').text();
    const ast = new Parser().parse(text);
    const walker = ast.walker();

    const files: string[] = [];
    let event: NodeWalkingStep | null;
    while ((event = walker.next())) {
      if (event.entering && event.node.type === 'link') {
        if (event.node.destination) {
          files.push(join('src', event.node.destination));
        }
      }
    }

    return files;
  })());
}

export interface Link {
  from: string;
  to: string;
}

export async function getAllLinks(): Promise<Link[]> {
  return await Promise.all(
    await getAllFiles().then((paths) =>
      paths.map(async (path) => {
        const text = await Bun.file(path).text();
        const ast = new Parser().parse(text);
        const walker = ast.walker();

        const links: Link[] = [];
        let event: NodeWalkingStep | null;
        while ((event = walker.next())) {
          if (event.entering && event.node.type === 'link') {
            if (event.node.destination) {
              links.push({
                from: path,
                to: event.node.destination,
              });
            }
          }
        }

        return links;
      })
    )
  ).then((list) => list.flat());
}
