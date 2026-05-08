# Tasks: fs-changed Event System (Backlog #12)

## Phase 1: Bus

- [X] T001 Create `app/src/fs/events.ts` exporting `FsEventBus`
  with `on(listener) -> unsubscribe` and `emit(paths)`. Snapshot
  listeners before iterating; swallow listener errors via
  `console.error`.

## Phase 2: Hook

- [X] T002 Create `app/src/fs/use-fs-changed.ts` — subscribes on
  mount, unsubscribes on unmount; ref-based callback.

## Phase 3: Wire

- [X] T003 Extend `pyodide-context.ts` with `fsEvents: FsEventBus`.
- [X] T004 In `pyodide-provider.tsx`, instantiate the bus once,
  forward `fs-changed` worker messages to `bus.emit(msg.paths)`,
  expose via context.

## Phase 4: Verify

- [X] T005 `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Phase 5: Backlog + commit

- [X] T006 Strikethrough `#12` in `backlog.md`; bump Updated.
- [X] T007 Three commits: `feat(#12)`, `docs(#12)`, `docs: backlog status`.
