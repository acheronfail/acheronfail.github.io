export interface Book {
  items: Section[];
}

export type SectionTitle = { PartTitle: string };
export type SectionChapter = { Chapter: Chapter };
export type Section = SectionTitle | SectionChapter | 'Separator';

export interface Chapter {
  name: string;
  content: string;
  number: number[] | null;
  sub_items: Section[];
  /** `null` when it's a "draft" chapter, i.e.: `[foo]()` */
  path: string | null;
  source_path: string | null;
  parent_names: string[];
}

export interface Context {}
