---
description: "Task list — Load lesson files (#41)"
---

# Tasks: Load lesson files (#41)

**Input**: Design documents in `specs/037-load-lesson-files/`
**Prerequisites**: #38 lesson loader landed (commit `5c74d14`).
**Tests**: e2e only (Vitest deferral from #38 still applies).

## Phase 1: Setup
- [ ] T001 Add `app/src/lessons/glob-modules.d.ts` declaration for `*?url` if needed (Vite already types it via `vite/client`); verify by passing typecheck after T002 lands. No new deps.

## Phase 2: Foundational
- [ ] T002 Extend `app/src/lessons/load.ts`: add a `?url` glob over `../../../content/lessons/*/files/**/*`, derive `LessonStarterFile[]` per slug, populate a `Map<slug, LessonStarterFile[]>`. Keep the existing prod `_*` filter consistent so dev-only lessons' files are filtered the same way as their `lesson.md`/`meta.json`.
- [ ] T003 Extend `LessonMeta` in `app/src/lessons/types.ts` with `hasFiles: boolean` (derived). Update `validate.ts` to accept `hasFiles` as a known field (still warning on unknown fields). Update the loader to set `hasFiles` after assembly.
- [ ] T004 [P] Create `app/src/lessons/files.ts` exporting `getLessonFiles(slug)` and `lessonHasFiles(slug)` per `contracts/lesson-files-api.md`. Re-export from `app/src/lessons/index.ts`.

## Phase 3: User Story 1 — Empty workspace, clean copy (P1)
**Independent test**: With empty `/workspace/<slug>/` and a lesson that has `files/`, click button, every file appears at `/workspace/<slug>/<relativePath>`.

- [ ] T005 [US1] Create `app/src/lessons/load-files-action.tsx` exporting `<LoadLessonFilesButton lesson={...} />`. Internal state machine: `idle | confirming | copying | error`. Renders a `<button>` plus the `ConfirmModal`. Disabled when `lesson.meta.hasFiles === false`, when `vfs` is unavailable (use `useVfs()` from `@/fs/use-vfs`), or while `copying`.
- [ ] T006 [US1] Implement the copy primitive: for each `LessonStarterFile`, `fetch(assetUrl).then(r => r.arrayBuffer())`, `mkdir` parent recursively, `writeFile(dest, new Uint8Array(buf))`. Surface any error with the offending path; halt on first error.
- [ ] T007 [US1] Wire `<LoadLessonFilesButton>` into `LessonView` header (`app/src/lessons/lesson-view.tsx`). Pass the resolved `Lesson` so the button doesn't re-fetch.
- [ ] T008 [US1] Update `content/lessons/_sample/` to include a `files/` folder with `data.csv` (≥3 rows) and `README.md`. Confirms the e2e flow has something to copy.

## Phase 4: User Story 2 — Confirm before overwrite (P1)
**Independent test**: Edit a workspace file, click button, see modal, Cancel → no writes; Overwrite → starter wins.

- [ ] T009 [US2] In `load-files-action.tsx`: before any write, scan starter destinations and call `vfs.exists(dest)` for each in parallel. If any exist, transition to `confirming` and render `<ConfirmModal destructive title="Overwrite lesson files?" body="Folder <slug> already has files. Loading the lesson's starter files will overwrite any with the same name. Your edits to those files will be lost." />`. **Cancel** → state `idle`, zero writes; **Overwrite** → state `copying`, proceed.
- [ ] T010 [P] [US2] Confirm Escape and backdrop dismissal route through ConfirmModal's existing handlers (no extra wiring; verified by reading confirm-modal.tsx).
- [ ] T011 [US2] Implement non-colliding-preserve (FR-011) — by construction: the action only writes paths from the starter set, so untouched files survive. Add a comment in the action source citing FR-011.

## Phase 5: User Story 3 — File tree updates automatically (P2)
- [ ] T012 [P] [US3] Verify `vfs.writeFile` calls fan out via the existing `fs-changed` event (#12) — no new code; if the file tree doesn't refresh, that's a regression in #12, not in #41.

## Phase 6: Polish & cross-cutting
- [ ] T013 [P] Extend `app/e2e/lessons.spec.ts` with two new tests: (a) "Load lesson files: empty workspace" — clicks button, asserts `/workspace/_sample/data.csv` content via the existing terminal `cat` builtin or by re-reading via the file tree DOM. (b) "Load lesson files: overwrite confirm" — pre-write a tiny `data.csv`, click button, expect modal with the spec text, Cancel, verify content unchanged; click again, Overwrite, verify content matches starter.
- [ ] T014 [P] Update `docs/limitations.md` with two bullets: (a) **No rollback on partial copy failure** — if a write fails mid-batch, the workspace is left in a mixed state; user can delete and retry. (b) **"Any existing file" treated as user-edited** — Load lesson files asks before overwriting any path collision, even if the file content matches the starter. Both feed into #51.
- [ ] T015 Run `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build && CI=1 pnpm test:e2e`; expect green.
- [ ] T016 Update `backlog.md` row #41 → strikethrough + `complete`. Commit `docs: backlog status — #41 complete`.

## Dependencies
```
T001 → T002 → T003 → T004
T002 + T004 → T005 → T006 → T007
T007 + T008 → e2e in T013
T005 → T009 → T010 → T011
T013, T014 parallel after the core work; T015 sequential (final build); T016 last.
```

## MVP scope
US1 (T005–T008) is the smallest renderable change. US2's confirm gate
is required by Principle III, so it lands in the same commit; we do
NOT ship the button without the modal.
