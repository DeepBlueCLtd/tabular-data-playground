# Implementation Plan: Pyodide Crash Recovery

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Make `reload()` robust to the no-worker case; add a
"Reload runtime" button to the terminal panel when status is
`error`.

## Constitution Check

1. Research-first — pass.
2. Notes-section — N/A.
3. Destruction — `reload()` resets the runtime and rejects pending
   calls. There's no user data on the line — IDBFS already
   persisted it. No modal needed.
4. Backend — pass.
5. Pinning — N/A.
6. Limitations — pass.

All gates pass.

## Files touched

- `app/src/pyodide/pyodide-provider.tsx` — make `reload` safe when
  no worker; clear error state when respawning.
- `app/src/components/shell/terminal-panel.tsx` — Reload runtime
  button on error.
