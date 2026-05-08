# Implementation Plan: Monaco Editor

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Lazy-load Monaco via `@monaco-editor/react`. Tabs in a small
React context. Debounced autosave ~500 ms per tab. CDN-pinned
Monaco. Theme follows the app theme provider.

## Constitution Check

1. Research-first — pass (the editor is core to the IDE shell).
2. Notes-section — N/A (infra/UI).
3. Destruction — pass; closing a tab flushes saves; no data
   destruction.
4. Backend — pass; CDN serves static Monaco assets.
5. Pinning — pass; `monaco-editor` and `@monaco-editor/react`
   pinned to exact versions (no `^`); the lockfile + CDN URL
   constitute the pin (mirroring Pyodide).
6. Limitations — pass; sharp edges (CSV no syntax highlighting in
   Monaco out of the box, jsdelivr dependency) are minor and
   already implied by the editor selection. Note the CDN
   dependency in `docs/limitations.md`.

All gates pass.

## Technical Context

- **Lazy load**:
  ```tsx
  const Editor = lazy(() =>
    import('@monaco-editor/react').then(m => ({ default: m.Editor }))
  );
  ```
  Wrap in `<Suspense fallback="Loading editor…">`.
- **Pinned CDN**: `loader.config({ paths: { vs:
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' }})`.
  The `loader` import is also lazy (inside a `useEffect` after
  the first tab opens).
- **Tab state**: React context with reducer. Tabs deduped by
  path; `open(path)` either focuses the existing tab or creates
  a new one and reads from vfs.
- **Autosave**: a `Map<id, NodeJS.Timeout>` of pending timers in
  the provider; `setBuffer(id, content)` clears + reschedules.
  `flush(id)` clears the timer and immediately calls vfs.writeFile.
- **Theme**: `theme={isDark ? 'vs-dark' : 'vs'}` plumbed through
  Monaco's `<Editor theme={...} />` prop. Theme provider is
  already in place from #10.
- **Empty state**: shown when `tabs.length === 0`. Includes the
  "+ Open sample file" affordance (writes a small CSV to vfs and
  opens it).
- **Language inference**: small map keyed by file extension; can
  expand later in #14 (JSON Schema) without reshaping.

## Files touched

- `app/package.json` — add deps, pinned.
- `app/src/editor/config.ts` — Monaco version + CDN URL.
- `app/src/editor/types.ts` — `EditorTab`.
- `app/src/editor/editor-tabs-context.ts` — context type.
- `app/src/editor/editor-tabs-provider.tsx` — provider with
  reducer + autosave.
- `app/src/editor/use-editor-tabs.ts` — hook.
- `app/src/editor/auto-save.ts` — debounce helper.
- `app/src/editor/editor-area.tsx` — tabs + lazy Monaco.
- `app/src/editor/language.ts` — extension → language id map.
- `app/src/components/shell/app-shell.tsx` — swap import.
- `app/src/components/shell/editor-area-placeholder.tsx` —
  delete.
- `app/src/App.tsx` — wrap in `<EditorTabsProvider>` (inside
  `<PyodideProvider>`).
- `docs/limitations.md` — note CDN dependency for Monaco.

## Phase 0 — Research

- `@monaco-editor/react` exposes `Editor`, `loader`, and a
  `useMonaco` hook. The `loader` is the entry point that decides
  where to fetch Monaco from. It is a singleton; calling
  `loader.config(...)` before the first `Editor` mount picks the
  CDN URL.
- For SSR safety we never need to worry — this app is a SPA.
- `monaco-editor` package is needed as a peer dep so types
  resolve; we never import from it on the hot path.

## Notes — Pinned versions

| Package | Version |
|---------|---------|
| `@monaco-editor/react` | 4.6.0 |
| `monaco-editor` | 0.52.2 |
