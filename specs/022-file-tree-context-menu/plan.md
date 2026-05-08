# Implementation Plan: File Tree Right-Click Menu

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Add a positioned popover menu with New file / New folder / Rename
/ Delete. Plus two reusable modals (Confirm + Prompt) under
`components/ui/`. All destructive actions confirm via modal.

## Constitution Check

1–6. All gates pass. Destruction (Principle III) is satisfied by
the Confirm modal on Delete and overwrite-Rename. No new external
deps — modals built from Tailwind primitives.

## Files touched

- `app/src/components/ui/confirm-modal.tsx` — new.
- `app/src/components/ui/prompt-modal.tsx` — new.
- `app/src/file-tree/file-tree-menu.tsx` — new.
- `app/src/file-tree/file-tree.tsx` — wire `onContextMenu`,
  background `onContextMenu` for empty-area actions.

## Phase 0 — Research

`react-arborist` lets us pass an `onContextMenu` handler at the
tree level which receives the raw event; we render our own
positioned menu.
