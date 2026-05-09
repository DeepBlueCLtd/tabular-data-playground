import { type AuthoredLessonMeta, checkUniqueness, validateLessonMeta } from './validate';
import type { Lesson, LessonFiles, LessonIndex, LessonMeta, LessonStarterFile } from './types';

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

// Starter files for each lesson — bundled as URLs (Vite asset
// pipeline). Read at click-time via fetch() so binary content
// round-trips intact (#41 research D1).
const fileUrlModules = import.meta.glob<string>('../../../content/lessons/*/files/**/*', {
  eager: true,
  query: '?url',
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

function parseFilePath(path: string): { folder: string; relativePath: string } | null {
  const m = /content\/lessons\/([^/]+)\/files\/(.+)$/.exec(path);
  if (!m || m[1] === undefined || m[2] === undefined) return null;
  return { folder: m[1], relativePath: m[2] };
}

let cached: LessonIndex | null = null;
let filesByFolder: Map<string, LessonStarterFile[]> | null = null;

function buildFilesByFolder(): Map<string, LessonStarterFile[]> {
  const out = new Map<string, LessonStarterFile[]>();
  for (const [path, url] of Object.entries(fileUrlModules)) {
    const parsed = parseFilePath(path);
    if (!parsed) continue;
    if (parsed.relativePath.includes('..')) {
      throw new Error(`lesson loader: starter file path contains '..': ${path}`);
    }
    const list = out.get(parsed.folder) ?? [];
    list.push({ relativePath: parsed.relativePath, assetUrl: url });
    out.set(parsed.folder, list);
  }
  for (const list of out.values()) {
    list.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }
  return out;
}

function buildIndex(): LessonIndex {
  const bodiesByFolder = new Map<string, string>();
  for (const [path, body] of Object.entries(bodyModules)) {
    bodiesByFolder.set(folderFromBodyPath(path), body);
  }

  const authoredByFolder = new Map<string, AuthoredLessonMeta>();
  for (const [path, raw] of Object.entries(metaModules)) {
    const folder = folderFromMetaPath(path);
    authoredByFolder.set(folder, validateLessonMeta(folder, raw));
  }

  for (const folder of authoredByFolder.keys()) {
    if (!bodiesByFolder.has(folder)) {
      throw new Error(
        `lesson loader: content/lessons/${folder}/lesson.md is missing (meta.json present)`,
      );
    }
  }
  for (const folder of bodiesByFolder.keys()) {
    if (!authoredByFolder.has(folder)) {
      throw new Error(
        `lesson loader: content/lessons/${folder}/meta.json is missing (lesson.md present)`,
      );
    }
  }

  const isProd = import.meta.env.PROD;
  const includeDev = import.meta.env.VITE_INCLUDE_DEV_LESSONS === '1';
  const all = Array.from(authoredByFolder.entries()).map(([folder, meta]) => ({ folder, meta }));
  const visible = isProd && !includeDev ? all.filter((e) => !e.folder.startsWith('_')) : all;

  checkUniqueness(visible);

  filesByFolder = buildFilesByFolder();

  const sorted = [...visible].sort((a, b) => a.meta.order - b.meta.order);
  const entries: LessonMeta[] = [];
  const bySlug = new Map<string, Lesson>();
  for (const { folder, meta: authored } of sorted) {
    const body = bodiesByFolder.get(folder);
    if (body === undefined) {
      throw new Error(`lesson loader: missing body for ${folder} (internal invariant)`);
    }
    const filesForFolder = filesByFolder.get(folder) ?? [];
    const meta: LessonMeta = { ...authored, hasFiles: filesForFolder.length > 0 };
    entries.push(meta);
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

export function getLessonStarterFiles(slug: string): readonly LessonStarterFile[] {
  // Ensure the index is built so `filesByFolder` is populated.
  getLessonIndex();
  // Look up by folder name (slug === folder name per spec FR-006).
  return filesByFolder?.get(slug) ?? [];
}

export function getLessonFiles(slug: string): LessonFiles {
  return { slug, files: getLessonStarterFiles(slug) };
}

export const __testing = {
  resetCache(): void {
    cached = null;
    filesByFolder = null;
  },
};
