export interface Book {
  sections: Section[];
  __non_exhaustive: null;
}

export type SectionTitle = { PartTitle: string };
export type SectionChapter = { Chapter: Chapter };
export type Section = SectionTitle | SectionChapter | 'Separator';

export interface Chapter {
  name: string;
  content: string;
  number: number[];
  sub_items: Section[];
  /** `null` when it's a "draft" chapter, i.e.: `[foo]()` */
  path: string | null;
  source_path: string;
  parent_names: unknown[];
}

export interface Context {}
