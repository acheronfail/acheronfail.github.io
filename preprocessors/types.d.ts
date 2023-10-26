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
  path: string;
  source_path: string;
  parent_names: unknown[];
}

export interface Context {}
