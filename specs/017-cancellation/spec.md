# Feature Specification: Cancellation via worker.terminate

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #31 — "Cancellation — Ctrl+C and Cancel
button via `worker.terminate()` (Pyodide is on a Web Worker per
Measurement C #3 verdict, recorded in `docs/architecture.md`).
(decision #47, `spec.md` §6.5)."

## User Scenarios & Testing

### User Story 1 — Cancel a long-running CLI call (P1)

A user runs `frictionless validate big.csv`. While it's running,
they click Cancel. The in-flight promise rejects with a
`CancelError`; the worker is terminated and a fresh worker is
spawned; status returns to `loading` then `ready`.

**Independent Test**: From the dev console, fire a `run([...])`
that takes a few seconds, call `cancel()`, observe rejection +
re-init.

### User Story 2 — Cancel button only shows when something is running (P2)

The terminal panel header surfaces a Cancel control while
`running === true`. It hides when the runtime is idle.

### User Story 3 — Pre-existing files survive a cancel (P1)

Files written before the cancel (and synced to IDBFS) are still
present after the worker respawns and remounts IDBFS.

### Edge Cases

- Ctrl+C wiring lives in #21 (terminal UI). For v1 we expose
  `cancel()` on the context AND surface a button — Ctrl+C will be
  wired when xterm lands.
- Calling `cancel()` when nothing is running is a no-op.
- The bridge's "fs-changed" forwarding from the now-dead worker
  is moot; the new worker re-emits as needed.
- After a cancel, status sequence is `ready → loading → ready`.
  The vfs reference flips to a new instance bound to the new
  worker. Components keeping a stale reference would still work
  via context (we re-set state) but should re-read from
  `useVfs()`.

## Requirements

- **FR-001**: `PyodideContextValue` MUST add `running: boolean`
  and `cancel: () => void`.
- **FR-002**: `running` is `true` while at least one `run` /
  `runPython` is in-flight; `false` otherwise.
- **FR-003**: `cancel()` MUST `worker.terminate()`, reject all
  pending bridge calls with `new Error('Cancelled')`, then spawn
  a new worker and re-init (same path as initial load), so
  `status` goes `ready → loading → ready` (or `error`).
- **FR-004**: A Cancel button in `terminal-panel.tsx` MUST be
  visible only when `running === true` and call `cancel()`.
- **FR-005**: While `cancel()` is in progress the `running` flag
  flips back to `false` immediately (the in-flight call is
  rejected synchronously).
- **FR-006**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.

## Success Criteria

- **SC-001**: A `run([...])` that's mid-flight rejects with
  `'Cancelled'` after `cancel()`.
- **SC-002**: After cancel, a follow-up `run(['--version'])`
  succeeds.
- **SC-003**: The Cancel button is present only while running.

## Assumptions

- The worker can be terminated at any point without Pyodide
  cleanup; IDBFS data already-synced is durable.
- Re-init takes ~1–3 s on Chromium and longer on Firefox per
  Measurement C; users wait through the loading state.
- A second cancel during re-init is ignored (the new worker is
  already starting fresh).
