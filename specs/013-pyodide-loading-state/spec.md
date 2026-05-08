# Feature Specification: Pyodide Loading-State UI

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #29 — "Pyodide loading-state UI — terminal
input disabled (greyed prompt), status line 'Loading Python…' until
ready; editor and file tree fully functional throughout (decision
#54, `spec.md` §6.5)."

## User Scenarios & Testing

### User Story 1 — Terminal is visibly inert while Pyodide loads (P1)

A user opens the app. The shell paints. The terminal panel shows a
greyed placeholder prompt and a status line "Loading Python…". The
editor and file tree are fully usable.

**Independent Test**: Open the dev server. Without waiting, click
into the editor area / file tree placeholders — they remain
interactive. The terminal panel shows the greyed prompt + status
line.

### User Story 2 — Terminal becomes ready when Pyodide reports ready (P1)

When `usePyodide()` reports `status === 'ready'`, the terminal
panel's status line flips to "Python ready" and the greyed prompt
disappears (replaced by the placeholder text the terminal scaffold
currently shows; the live xterm UI lands with #21).

**Independent Test**: Watch the terminal panel after page load.
Within ~5 s the status line transitions from "Loading Python…" to
"Python ready".

### User Story 3 — Error surfaces to the loading line (P2)

If Pyodide load fails, the terminal status line shows
"Python failed to load: <message>" and stays inert.

**Independent Test**: Block the Pyodide CDN URL; reload. Terminal
shows the failure line; rest of the UI keeps working.

### Edge Cases

- The status bar at the bottom of the shell ALSO surfaces a compact
  "Python: loading | ready | error" indicator, so the loading state
  is visible even when the terminal panel is collapsed (a future
  feature, but the indicator should not break if the panel is
  resized to zero height).
- The greyed prompt is an aria-disabled affordance — screen readers
  announce it as disabled.
- The terminal placeholder copy that mentions "#21–#26" is replaced
  by this real loading UI; the implementation note moves into the
  status line.
- No animation beyond a simple pulsing dot; no spinners (avoid
  visual noise).

## Requirements

- **FR-001**: A new `app/src/pyodide/pyodide-loading-indicator.tsx`
  component MUST consume `usePyodide()` and render one of:
  - `loading` / `idle` → "Loading Python…"
  - `ready` → "Python ready"
  - `error` → "Python failed to load: {error.message}"
- **FR-002**: A new `app/src/components/shell/terminal-panel.tsx`
  MUST replace `terminal-panel-placeholder.tsx`. It renders:
  - Header: "Terminal" + the loading indicator on the right.
  - Body: a greyed, aria-disabled prompt line (`$ `) when
    `status !== 'ready'`; the existing placeholder copy ("xterm.js
    + mini-shell land here (#21)") when `status === 'ready'`.
- **FR-003**: `app/src/components/shell/app-shell.tsx` MUST import
  the new `TerminalPanel` and remove the old placeholder import.
- **FR-004**: `app/src/components/shell/status-bar-placeholder.tsx`
  MUST also render a compact `Python: <state>` text on the right
  side, sourced from the same `usePyodide()` hook. The "Status bar
  lands via #18" copy stays in the centre/right slot it currently
  occupies; the Python indicator goes to the far right.
- **FR-005**: Editor and file tree placeholders are NOT gated on
  Pyodide status — they remain interactive throughout.
- **FR-006**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.

## Success Criteria

- **SC-001**: From a clean load, the terminal status line displays
  "Loading Python…" within first paint.
- **SC-002**: When Pyodide transitions to `ready`, the line flips
  to "Python ready" without manual interaction.
- **SC-003**: The editor / file tree areas do not change visibly
  before/after Pyodide ready (i.e. they were never gated).

## Assumptions

- The xterm.js terminal (#21) is not yet built; the panel here is
  still a placeholder body, but with real loading-state chrome.
- The status bar (#18) is not yet built; we are extending the
  current placeholder, not replacing it.
- `PyodideProvider` from #27 is in place and `usePyodide()` works.
