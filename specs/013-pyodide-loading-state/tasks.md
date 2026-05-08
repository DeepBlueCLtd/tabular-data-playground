# Tasks: Pyodide Loading-State UI (Backlog #29)

## Phase 1: Indicator component

- [X] T001 Create `app/src/pyodide/pyodide-loading-indicator.tsx`
  consuming `usePyodide()` and rendering the three states with a
  small dot + label.

## Phase 2: Terminal panel

- [X] T002 Create `app/src/components/shell/terminal-panel.tsx`
  with header (title + indicator) and body (greyed prompt while
  not ready, placeholder copy when ready).
- [X] T003 Delete `terminal-panel-placeholder.tsx`.
- [X] T004 Update `app-shell.tsx` to import `TerminalPanel`.

## Phase 3: Status bar

- [X] T005 Extend `status-bar-placeholder.tsx` to render compact
  Python status on the right.

## Phase 4: Verify

- [X] T006 `pnpm run lint && pnpm run format:check && pnpm run build`
  exits 0.

## Phase 5: Backlog + commit

- [X] T007 Strikethrough `#29` in `backlog.md`; bump Updated.
- [X] T008 Three commits: `feat(#29)`, `docs(#29)`, `docs: backlog status`.
