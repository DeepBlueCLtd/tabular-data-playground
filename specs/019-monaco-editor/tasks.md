# Tasks: Monaco Editor (Backlog #13)

## Phase 1: Deps + config

- [X] T001 Add `@monaco-editor/react@4.6.0` and
  `monaco-editor@0.52.2` to `app/package.json` (exact, no `^`).
  Run `pnpm install`; commit lockfile.
- [X] T002 Create `app/src/editor/config.ts` with the pinned CDN
  URL and version constants.

## Phase 2: Tab state

- [X] T003 Create `app/src/editor/types.ts` with `EditorTab`.
- [X] T004 Create `app/src/editor/auto-save.ts` — debounce
  helper.
- [X] T005 Create `app/src/editor/editor-tabs-context.ts` and
  `editor-tabs-provider.tsx` — reducer, autosave, vfs reads /
  writes.
- [X] T006 Create `app/src/editor/use-editor-tabs.ts`.

## Phase 3: UI

- [X] T007 Create `app/src/editor/language.ts` — ext map.
- [X] T008 Create `app/src/editor/editor-area.tsx` — tab strip,
  lazy Monaco, empty state with sample-file affordance, theme
  wiring.
- [X] T009 Delete `editor-area-placeholder.tsx`; update
  `app-shell.tsx`.
- [X] T010 Wrap `<App>` with `<EditorTabsProvider>` inside
  `<PyodideProvider>`.

## Phase 4: Limitations + verify

- [X] T011 Add a one-liner to `docs/limitations.md` about
  jsdelivr Monaco CDN dependency.
- [X] T012 `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0. Verify Monaco lands in a separate chunk.

## Phase 5: Backlog + commit

- [X] T013 Strikethrough `#13` in `backlog.md`; bump Updated.
- [X] T014 Three commits: `feat(#13)`, `docs(#13)`, `docs: backlog status`.
