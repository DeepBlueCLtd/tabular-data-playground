import type { AuthoredLessonMeta } from './types';

export type { AuthoredLessonMeta };

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  'title',
  'slug',
  'order',
  'summary',
  'estimatedMinutes',
  // hasFiles is derived (#41), not authored — but tolerated if present so
  // round-tripped meta objects don't trigger the warning.
  'hasFiles',
]);

function fail(metaPath: string, reason: string): never {
  throw new Error(`lesson loader: ${metaPath}: ${reason}`);
}

export function validateLessonMeta(folderName: string, raw: unknown): AuthoredLessonMeta {
  const metaPath = `content/lessons/${folderName}/meta.json`;

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    fail(metaPath, 'expected a JSON object');
  }
  const m = raw as Record<string, unknown>;

  if (typeof m.title !== 'string' || m.title.length === 0 || m.title.length > 80) {
    fail(metaPath, 'title MUST be a non-empty string <= 80 chars');
  }
  if (typeof m.slug !== 'string' || m.slug !== folderName) {
    fail(
      metaPath,
      `slug MUST equal the folder name (got ${JSON.stringify(m.slug)}, expected ${JSON.stringify(folderName)})`,
    );
  }
  if (!/^[a-z0-9_][a-z0-9-]*$/.test(m.slug)) {
    fail(metaPath, `slug MUST match /^[a-z0-9_][a-z0-9-]*$/`);
  }
  if (typeof m.order !== 'number' || !Number.isInteger(m.order) || m.order < 0) {
    fail(metaPath, 'order MUST be a non-negative integer');
  }
  if (typeof m.summary !== 'string' || m.summary.length === 0 || m.summary.length > 200) {
    fail(metaPath, 'summary MUST be a non-empty string <= 200 chars');
  }
  if (
    typeof m.estimatedMinutes !== 'number' ||
    !Number.isInteger(m.estimatedMinutes) ||
    m.estimatedMinutes < 1
  ) {
    fail(metaPath, 'estimatedMinutes MUST be an integer >= 1');
  }

  for (const key of Object.keys(m)) {
    if (!KNOWN_FIELDS.has(key)) {
      // FR-020: warn, don't throw.
      console.warn(`lesson loader: ${metaPath}: unknown field ${JSON.stringify(key)} ignored`);
    }
  }

  return m as unknown as AuthoredLessonMeta;
}

export function checkUniqueness(
  metas: ReadonlyArray<{ folder: string; meta: AuthoredLessonMeta }>,
): void {
  const seenSlugs = new Map<string, string>();
  const seenOrders = new Map<number, string>();
  for (const { folder, meta } of metas) {
    const prevSlug = seenSlugs.get(meta.slug);
    if (prevSlug !== undefined) {
      throw new Error(
        `lesson loader: duplicate slug ${JSON.stringify(meta.slug)} in folders ${prevSlug} and ${folder}`,
      );
    }
    seenSlugs.set(meta.slug, folder);

    const prevOrder = seenOrders.get(meta.order);
    if (prevOrder !== undefined) {
      throw new Error(
        `lesson loader: duplicate order ${meta.order} in folders ${prevOrder} and ${folder}`,
      );
    }
    seenOrders.set(meta.order, folder);
  }
}
