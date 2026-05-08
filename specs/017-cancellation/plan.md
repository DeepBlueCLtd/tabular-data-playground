# Implementation Plan: Cancellation

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Refactor the worker-spawn + load flow into a `spawnWorker()`
helper inside the provider so `cancel()` can call it after a
`worker.terminate()`. Track `running` via a counter that
increments on schedule entry and decrements on resolve/reject.
Wire a Cancel button into the terminal panel.

## Constitution Check

1. Research-first — pass.
2. Notes-section — N/A.
3. Destruction — `cancel()` is destructive (kills in-flight work
   and respawns the runtime). The Cancel button is ONLY visible
   while running, and the action is explicit; no modal needed
   because cancelling is the reversible path (the user can re-run
   the command). Modal-confirm is for *destroying user data*,
   which a cancel does not do.
4. Backend — pass.
5. Pinning — N/A.
6. Limitations — pass.

All gates pass.

## Technical Context

- The worker spawn flow becomes `spawnWorker()`: creates a new
  Worker, attaches listeners, posts `'load'`. Used both at first
  paint and at cancel.
- Pending bridge calls are rejected with `new Error('Cancelled')`
  from `cancel()` before terminate, so consumers see the rejection.
- A new vfs is constructed bound to the new worker; setVfs(new)
  is called on `ready`. Components that resolve the vfs each call
  via `useVfs()` will see the new instance after the next render.
- `running` is `runningCountRef.current > 0`. We mirror it into
  React state for UI consumption.

## Files touched

- `app/src/pyodide/pyodide-context.ts` — add `running`, `cancel`.
- `app/src/pyodide/pyodide-provider.tsx` — refactor spawn,
  implement cancel + counter.
- `app/src/components/shell/terminal-panel.tsx` — Cancel button.

## Phase 0 — Research

- `Worker.prototype.terminate()` is synchronous and immediate per
  spec; no further messages will arrive.
- IDBFS data already synced is durable (IndexedDB transactions
  are atomic at the operation level).
