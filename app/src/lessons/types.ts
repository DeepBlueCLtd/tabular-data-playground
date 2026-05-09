// Fields the lesson author writes in meta.json. Used by the validator.
export interface AuthoredLessonMeta {
  title: string;
  slug: string;
  order: number;
  summary: string;
  estimatedMinutes: number;
}

// LessonMeta = authored fields + derived fields. Other unknown fields
// authored in meta.json survive on the same object (warned about, not
// thrown — FR-020), but they are not part of the public type.
export interface LessonMeta extends AuthoredLessonMeta {
  hasFiles: boolean; // Derived by the loader (#41); not authored.
}

export interface LessonStarterFile {
  relativePath: string; // POSIX, no '..' segments
  assetUrl: string;
}

export interface LessonFiles {
  slug: string;
  files: readonly LessonStarterFile[];
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
