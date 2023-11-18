import { join } from 'path';
import { NodeWalkingStep, Parser } from 'commonmark';

const BOOK_DIR = 'book';

let allFiles: Promise<string[]> | null = null;
export async function getAllFiles() {
  if (allFiles) return allFiles;
  return (allFiles = (async () => {
    const text = await Bun.file(join(BOOK_DIR, 'SUMMARY.md')).text();
    const ast = new Parser().parse(text);
    const walker = ast.walker();

    const files: string[] = [];
    let event: NodeWalkingStep | null;
    while ((event = walker.next())) {
      if (event.entering && event.node.type === 'link') {
        if (event.node.destination) {
          files.push(join(BOOK_DIR, event.node.destination));
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

export interface AllLinks {
  internal: Link[];
  external: Link[];
}

export async function getAllLinks(): Promise<AllLinks> {
  const allLinks: AllLinks = {
    internal: [],
    external: [],
  };

  await Promise.all(
    await getAllFiles().then((paths) =>
      paths.map(async (path) => {
        const text = await Bun.file(path).text();
        const ast = new Parser().parse(text);
        const walker = ast.walker();

        let event: NodeWalkingStep | null;
        while ((event = walker.next())) {
          const { entering, node } = event;
          if (entering && node.type === 'link') {
            if (node.destination) {
              const isInternal = ['/', '.', '#'].includes(node.destination[0]!) || !/[a-z]+:/i.test(node.destination);
              if (isInternal) {
                allLinks.internal.push({ from: path, to: node.destination });
              } else {
                allLinks.external.push({ from: path, to: node.destination });
              }
            }
          }
        }
      })
    )
  );

  return allLinks;
}
