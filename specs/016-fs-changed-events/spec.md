# Feature Specification: fs-changed Event System

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #12 — "fs-changed event system — mini-shell
and Pyodide bridge are the only writers; file tree and editor
subscribe; no polling (decision #53, `spec.md` §6.5)."

## User Scenarios & Testing

### User Story 1 — A subscriber is notified after a write (P1)

A consumer registers `bus.on('fs-changed', cb)`. After
`vfs.writeFile('/workspace/foo.csv', '...')`, the callback fires
once with `{ paths: ['/workspace/foo.csv'] }`.

### User Story 2 — Multiple subscribers receive the same event (P1)

File tree and editor both subscribe; both callbacks fire after a
mutating call. Order of invocation is registration order.

### User Story 3 — `useFsChanged(cb)` hook auto-cleans up (P2)

A React component using `useFsChanged(cb)` stops receiving events
after it unmounts.

### Edge Cases

- The same event is emitted whether the mutation came from the
  vfs facade, the CLI bridge, or `runPython` — the worker is the
  only emitter, and consumers don't need to know which path caused
  it.
- Emission is **fire-and-forget**; if a subscriber throws, other
  subscribers still run.
- In v1 the `paths` field is coarse: typically the workspace root
  for CLI/runPython invocations, the specific path for facade
  calls. Consumers should treat it as a coalesced hint, not an
  authoritative diff.
- The bus has no replay; subscribers see only events emitted while
  subscribed.

## Requirements

- **FR-001**: New module `app/src/fs/events.ts` MUST export an
  `FsEventBus` class with:
  - `on(listener: (e: { paths: string[] }) => void): () => void`
  - `emit(paths: string[]): void`
  - The `on` return value is an unsubscribe function.
- **FR-002**: `app/src/fs/use-fs-changed.ts` MUST export a hook
  `useFsChanged(listener)` that subscribes on mount and
  unsubscribes on unmount; the listener is referenced via a ref
  so consumers don't need to memoise it.
- **FR-003**: A singleton bus MUST be exposed via the same
  `PyodideContext` (alongside `vfs`) so React components can
  consume it without prop-drilling.
- **FR-004**: `pyodide-provider.tsx` MUST forward each `fs-changed`
  worker message to `bus.emit(msg.paths)`.
- **FR-005**: A throwing subscriber MUST NOT prevent other
  subscribers from running. The thrown error is logged via
  `console.error` and otherwise swallowed.
- **FR-006**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.

## Success Criteria

- **SC-001**: Subscribing then calling `vfs.writeFile(...)` fires
  the listener exactly once.
- **SC-002**: Subscribing then calling `run(['describe', 'x.csv'])`
  also fires the listener (CLI mutation path).
- **SC-003**: Unmounting a `useFsChanged` consumer stops further
  callbacks.

## Assumptions

- The worker already emits `fs-changed` after mutating FS calls
  and after CLI / runPython completion (#11 / #28).
- `paths` is a `string[]` even when only one path is affected.
- No throttling / coalescing in v1 — emissions are 1:1 with worker
  events. If the file tree gets noisy, we can debounce later.
