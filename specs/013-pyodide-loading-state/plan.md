# Implementation Plan: Pyodide Loading-State UI

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Replace the terminal placeholder with a real `TerminalPanel` whose
header includes a Pyodide loading indicator. Add a compact "Python:
…" line to the existing status-bar placeholder. Editor and file
tree are not gated. Tiny pure UI change driven by `usePyodide()`.

## Constitution Check

1. Research-first — pass; supports the IDE shell that hosts the
   evaluation.
2. Notes-section — N/A (infra/UI).
3. Destruction — N/A (no destructive flows).
4. Backend — pass.
5. Pinning — N/A (no new deps).
6. Limitations — pass; no new sharp edges.

All gates pass.

## Technical Context

- Tailwind classes match the current placeholders (border, muted
  text, font-mono for the prompt line).
- The greyed prompt is `<div role="textbox" aria-disabled="true"
  tabIndex={-1} className="font-mono text-xs text-muted-foreground
  opacity-60">$ </div>`. No real input element — there is nothing
  to type into yet.
- The indicator uses a single small CSS pulse for `loading`; for
  `ready`, a static dot in green; for `error`, red. No SVG icons.

## Files touched

- `app/src/pyodide/pyodide-loading-indicator.tsx` — new.
- `app/src/components/shell/terminal-panel.tsx` — new.
- `app/src/components/shell/terminal-panel-placeholder.tsx` —
  deleted.
- `app/src/components/shell/app-shell.tsx` — swap import.
- `app/src/components/shell/status-bar-placeholder.tsx` — extend
  with right-side Python status.

## Phase 0 — Research

- The `usePyodide()` hook exists from #27 and exposes
  `{ status, error, ... }`. No additional state is needed.
- The terminal panel will host xterm in #21; we keep this scaffold
  small enough that #21 only swaps the body, not the header
  chrome.
