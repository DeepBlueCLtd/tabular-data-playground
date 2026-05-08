export interface LessonMeta {
  title: string;
  slug: string;
  order: number;
  summary: string;
  estimatedMinutes: number;
  [unknown: string]: unknown;
}

export interface Lesson {
  slug: string;
  meta: LessonMeta;
  body: string;
}

export interface LessonIndex {
  entries: readonly LessonMeta[];
  bySlug: ReadonlyMap<string, Lesson>;
}
