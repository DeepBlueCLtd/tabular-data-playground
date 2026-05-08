# Implementation Plan: App Shell Layout

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Compose the IDE shell from a header, an activity bar, a side panel,
an editor area, a terminal panel, and a status bar. Use
`react-resizable-panels` for the two resizable splits. Wire
placeholders into every slot so downstream items (#13, #15, #18, #21)
drop in without restructuring. Theme-aware via the tokens from #7/#10.

## Constitution Check

1. Research-first — pass (the IDE shell is the evaluation harness).
2. Notes-section — N/A.
3. Destruction — pass.
4. Backend — pass.
5. Pinning — pass; new dep pinned in Notes below.
6. Limitations — pass; no new sharp edge.

All gates pass. No Complexity Tracking entries.

## Technical Context

- Layout: outer flex column → header, body grid, status bar.
- Body grid: activity bar (fixed) + `PanelGroup` horizontal:
  `[SidePanel]` ↔ `PanelGroup` vertical: `[EditorArea]` ↔ `[Terminal]`.
- `react-resizable-panels` provides `Panel`, `PanelGroup`,
  `PanelResizeHandle`. Persistence via `autoSaveId` prop. We pass
  prefixed IDs (`fde-shell-horizontal`, `fde-shell-vertical`).
- Side-panel collapse: a small `useState` in the shell tracks the
  active activity entry plus a `collapsed` flag. When collapsed, we
  render no `Panel` for the side; when expanded, we use the persisted
  size.
- Sub-components live in `app/src/components/shell/` to keep the
  shell-related files together.

## Notes — Pinned Tooling

| Package | Version | Kind |
|---------|---------|------|
| react-resizable-panels | 2.1.7 | runtime |

Exact pin; lockfile records resolved tree.

## Files touched

- `app/package.json` — add `react-resizable-panels`.
- `app/src/components/shell/app-shell.tsx` — new; root composition.
- `app/src/components/shell/activity-bar.tsx` — new.
- `app/src/components/shell/side-panel.tsx` — new (placeholders).
- `app/src/components/shell/editor-area-placeholder.tsx` — new.
- `app/src/components/shell/terminal-panel-placeholder.tsx` — new.
- `app/src/components/shell/status-bar-placeholder.tsx` — new.
- `app/src/components/shell/icons.tsx` — new; small inline SVG icons.
- `app/src/App.tsx` — render `<AppShell />` (with header + toggle).

## Phase 0 — Research

- **react-resizable-panels vs dockview / react-mosaic** — `react-
  resizable-panels` is small, framework-agnostic in spirit, persists
  via localStorage, no opinions on tabs. For v1 shell splits this is
  enough; #9 may layer dockview/mosaic on top of the editor area only.
- **Why placeholders rather than wiring straight to #13/#15/#21** —
  keeps each item small and testable. The shell exposes named slots;
  feature items replace placeholders one at a time without touching
  `app-shell.tsx`.
- **Activity bar collapse behaviour** — VS Code collapses the side
  panel when the active item is re-clicked; we mirror that to feel
  familiar. Persisting collapse state is deferred (low value, easy to
  add later if missed).
