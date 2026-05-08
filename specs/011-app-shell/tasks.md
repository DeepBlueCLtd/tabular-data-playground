# Tasks: App Shell Layout (Backlog #8)

## Phase 1: Dep + folder

- [X] T001 Add `react-resizable-panels@2.1.7` to `app/package.json` runtime deps; `pnpm install`.
- [X] T002 Create `app/src/components/shell/` directory.

## Phase 2: Shell pieces

- [X] T003 Create `icons.tsx` — `BookIcon` and `FilesIcon` (inline SVG).
- [X] T004 Create `activity-bar.tsx` — vertical bar with two icon buttons; `aria-label`s; visible active state via Tailwind classes.
- [X] T005 Create `side-panel.tsx` — switches between Lessons and Files placeholders.
- [X] T006 Create `editor-area-placeholder.tsx`, `terminal-panel-placeholder.tsx`, `status-bar-placeholder.tsx` — each renders a clearly-labelled stub citing the feature ID that will replace it.

## Phase 3: Compose + wire

- [X] T007 Create `app-shell.tsx` — owns activity-bar state (`active`, `collapsed`); composes activity bar + horizontal `PanelGroup` (side panel + vertical `PanelGroup` of editor + terminal); status bar at the bottom. `autoSaveId="fde-shell-h"` and `"fde-shell-v"`.
- [X] T008 Update `App.tsx` to render `<AppShell />` (header lives inside `AppShell`).

## Phase 4: Verify

- [X] T009 `pnpm run lint && pnpm run format:check && pnpm run build` — all exit 0.

## Phase 5: Backlog + commit

- [X] T010 Strikethrough `#8` in `backlog.md`; bump Updated.
- [X] T011 Three commits: `feat(#8)`, `docs(#8)`, `docs: backlog status`.
