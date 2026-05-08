import { checkUniqueness, validateLessonMeta } from './validate';
import type { Lesson, LessonIndex, LessonMeta } from './types';

// Lesson content lives at repo-root /content/lessons/, one level up
// from the Vite project root (app/). Use a relative glob so Vite
// resolves correctly.
const metaModules = import.meta.glob<Record<string, unknown>>(
  '../../../content/lessons/*/meta.json',
  { eager: true, import: 'default' },
);

const bodyModules = import.meta.glob<string>('../../../content/lessons/*/lesson.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function folderFromMetaPath(path: string): string {
  const m = /content\/lessons\/([^/]+)\/meta\.json$/.exec(path);
  if (!m || m[1] === undefined) {
    throw new Error(`lesson loader: unexpected meta.json path ${path}`);
  }
  return m[1];
}

function folderFromBodyPath(path: string): string {
  const m = /content\/lessons\/([^/]+)\/lesson\.md$/.exec(path);
  if (!m || m[1] === undefined) {
    throw new Error(`lesson loader: unexpected lesson.md path ${path}`);
  }
  return m[1];
}

let cached: LessonIndex | null = null;

function buildIndex(): LessonIndex {
  const bodiesByFolder = new Map<string, string>();
  for (const [path, body] of Object.entries(bodyModules)) {
    bodiesByFolder.set(folderFromBodyPath(path), body);
  }

  const metasByFolder = new Map<string, LessonMeta>();
  for (const [path, raw] of Object.entries(metaModules)) {
    const folder = folderFromMetaPath(path);
    metasByFolder.set(folder, validateLessonMeta(folder, raw));
  }

  for (const folder of metasByFolder.keys()) {
    if (!bodiesByFolder.has(folder)) {
      throw new Error(
        `lesson loader: content/lessons/${folder}/lesson.md is missing (meta.json present)`,
      );
    }
  }
  for (const folder of bodiesByFolder.keys()) {
    if (!metasByFolder.has(folder)) {
      throw new Error(
        `lesson loader: content/lessons/${folder}/meta.json is missing (lesson.md present)`,
      );
    }
  }

  const isProd = import.meta.env.PROD;
  const includeDev = import.meta.env.VITE_INCLUDE_DEV_LESSONS === '1';
  const all = Array.from(metasByFolder.entries()).map(([folder, meta]) => ({ folder, meta }));
  const visible = isProd && !includeDev ? all.filter((e) => !e.folder.startsWith('_')) : all;

  checkUniqueness(visible);

  const sorted = [...visible].sort((a, b) => a.meta.order - b.meta.order);
  const entries: LessonMeta[] = sorted.map((e) => e.meta);
  const bySlug = new Map<string, Lesson>();
  for (const { folder, meta } of sorted) {
    const body = bodiesByFolder.get(folder);
    if (body === undefined) {
      throw new Error(`lesson loader: missing body for ${folder} (internal invariant)`);
    }
    bySlug.set(meta.slug, { slug: meta.slug, meta, body });
  }

  return { entries: Object.freeze(entries), bySlug };
}

export function getLessonIndex(): LessonIndex {
  if (cached === null) {
    cached = buildIndex();
  }
  return cached;
}

export function getLesson(slug: string): Lesson | undefined {
  return getLessonIndex().bySlug.get(slug);
}

export const __testing = {
  resetCache(): void {
    cached = null;
  },
};
