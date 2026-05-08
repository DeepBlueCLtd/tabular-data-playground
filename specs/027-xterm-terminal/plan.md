# Implementation Plan: xterm.js Terminal UI

**Branch**: `claude/epic-e1-1gMf9`

## Constitution Check

5. Pinning — pass; new deps pinned exactly.
All gates pass.

## Files touched

- `app/package.json` — deps.
- `app/src/terminal/terminal.tsx` — wrapper.
- `app/src/terminal/line-editor.ts` — input buffer + history.
- `app/src/components/shell/terminal-panel.tsx` — mount when ready.
- `app/src/index.css` — import xterm css.
