# Feature Specification: Pyodide Crash Recovery

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #30 — "Pyodide crash recovery — manual
'Reload runtime' button on fatal error; no automatic re-init in v1
(decision #46, `spec.md` §6.5)."

## User Scenarios & Testing

### User Story 1 — Reload after a fatal error (P1)

Pyodide's loader fails (e.g. CDN blocked, fatal init error). The
terminal panel surfaces a "Reload runtime" button. Clicking it
respawns the worker and re-runs the loader. The user is back to
`status === 'ready'` once the new worker reports ready.

**Independent Test**: Force the worker to error (block the
Pyodide CDN URL); reload page; observe the button; click it; the
button disappears once status flips to `loading` then `ready`.

### User Story 2 — No automatic recovery (P1)

If the worker errors, the app does NOT automatically retry.
Reload is gated on the user clicking the button.

### Edge Cases

- The button is the **only** affordance for recovery in v1; there
  is no automatic timer or watchdog.
- If reload itself fails, the same button reappears.
- The `reload` mechanism reuses the cancel infrastructure from
  #31 (terminate + spawn). No new code path.

## Requirements

- **FR-001**: `reload()` on `PyodideContext` MUST work whether or
  not a worker is currently alive — when in error state with no
  worker, it spawns a new one; when a worker exists, it
  terminates and respawns.
- **FR-002**: `terminal-panel.tsx` MUST render a "Reload runtime"
  button when `status === 'error'`. The button is hidden in
  other states.
- **FR-003**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.

## Success Criteria

- **SC-001**: From an error state, clicking the button transitions
  status to `loading` and (on a healthy network) to `ready`.
- **SC-002**: From a ready state, the Reload button is not visible
  (cancel handles in-flight termination instead).

## Assumptions

- The cancel-and-respawn mechanism from #31 is correct; this item
  only makes it survive the no-worker case and adds a button.
