# Public TS surface — `app/src/lessons/files.ts`

```ts
export interface LessonStarterFile {
  relativePath: string;   // POSIX, no ../ segments
  assetUrl: string;       // URL emitted by Vite ?url glob
}

export interface LessonFiles {
  slug: string;
  files: readonly LessonStarterFile[];
}

export function getLessonFiles(slug: string): LessonFiles;
// Always returns a LessonFiles object; `files` is empty for lessons
// without a `files/` folder.

export function lessonHasFiles(slug: string): boolean;
// Convenience: `getLessonFiles(slug).files.length > 0`.
```

`LessonMeta` (re-exported from `@/lessons`) gains:

```ts
hasFiles: boolean;   // Derived; do not set in meta.json.
```

The `<LessonView>` component (#38) renders a **Load lesson files**
button in its header when `lesson.meta.hasFiles === true`. Clicking
runs the destructive-confirm flow described in `spec.md` — there is
no public hook into this flow other than via `<LessonView>`.

## Stability

- `getLessonFiles`, `lessonHasFiles`, and the `hasFiles` field are
  the public contract. Anything else under `app/src/lessons/files.ts`
  or `app/src/lessons/load-files-action.tsx` is internal.
