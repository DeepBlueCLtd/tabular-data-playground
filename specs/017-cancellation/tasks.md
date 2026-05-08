# Tasks: Cancellation (Backlog #31)

## Phase 1: Provider refactor

- [X] T001 Extract `spawnWorker()` in `pyodide-provider.tsx` —
  create worker, attach listeners (ready/error/run-result/
  run-python-result/fs-changed), post `'load'`. Returns the
  worker.
- [X] T002 Track in-flight runs via `runningCountRef`. Increment
  in `run`/`runPython` schedule callbacks before postMessage;
  decrement when the corresponding response resolves/rejects.
  Mirror to a `running` state for React consumers.
- [X] T003 Implement `cancel()` — if any pending: reject all with
  `new Error('Cancelled')`, terminate the worker, reset counters,
  call `spawnWorker()`. Status flips ready → loading → ready.
- [X] T004 Extend `pyodide-context.ts` with `running: boolean`
  and `cancel: () => void`.

## Phase 2: UI

- [X] T005 In `terminal-panel.tsx`, render a small Cancel button
  in the header that calls `cancel()` and is visible only when
  `running === true`.

## Phase 3: Verify

- [X] T006 `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Phase 4: Backlog + commit

- [X] T007 Strikethrough `#31` in `backlog.md`; bump Updated.
- [X] T008 Three commits: `feat(#31)`, `docs(#31)`, `docs: backlog status`.
