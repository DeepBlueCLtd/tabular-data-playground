# Implementation Plan: Drag-and-drop Importer

**Branch**: `claude/epic-e1-1gMf9`
**Date**: 2026-05-08

## Summary

Drop zone over the file tree pane that walks dropped folders via
`webkitGetAsEntry`, enforces 10 MB cap, and modal-confirms
overwrites with an "Overwrite all" toggle.

## Constitution Check

1–6. All gates pass. New sharp edges (10 MB cap, no symlinks
support) added to `docs/limitations.md`. Destruction handled by
modal-confirm.

## Files touched

- `app/src/components/ui/import-overwrite-modal.tsx` — tri-state
  confirm.
- `app/src/file-tree/drag-drop-importer.tsx` — wrapper component.
- `app/src/components/shell/side-panel.tsx` — wrap FileTree.
- `docs/limitations.md` — note the cap and symlink behaviour.
