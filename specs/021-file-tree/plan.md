# Implementation Plan: File Tree

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

`react-arborist` Tree fed by a recursive vfs walk; rebuilt on
`fs-changed`. File click → `editorTabs.open(path)`. Render in the
side panel when "files" is active.

## Constitution Check

1–6. All gates pass. New dep `react-arborist` is the
constitution-named pick.

## Files touched

- `app/package.json` — add dep, pinned.
- `app/src/file-tree/file-tree.tsx` — new.
- `app/src/file-tree/walk.ts` — recursive vfs walk to node tree.
- `app/src/components/shell/side-panel.tsx` — wire it in.

## Phase 0 — Research

`react-arborist` 3.x ships `Tree` + a `data` prop of nested
`{ id, name, children }`. We wire `onActivate` to open the tab.
