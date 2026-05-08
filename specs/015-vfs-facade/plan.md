# Implementation Plan: Virtual FS Facade

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Add a thin promise-based facade over Pyodide IDBFS mounted at
`/workspace`. All operations go through worker postMessage with id
correlation, share the inflight queue with `run` / `runPython`, and
syncfs after writes so reloads restore state. Single source of truth
— no main-thread mirror.

## Constitution Check

1. Research-first — pass; needed to host lesson files.
2. Notes-section — N/A (infra).
3. Destruction — `remove(path, { recursive: true })` is destructive
   but has NO modal here; modal-confirm sits in the consumers
   (Reset workspace #20, Drag-and-drop importer #17). The facade is
   a primitive.
4. Backend — pass; IndexedDB is local browser storage only.
5. Pinning — N/A.
6. Limitations — pass; IDBFS quirks (private-mode browsers, quota)
   already enumerated in `docs/limitations.md` (#51 hasn't shipped
   but the items are listed as planned). No new sharp edge here.

All gates pass.

## Technical Context

- **Mount**:
  ```js
  pyodide.FS.mkdir('/workspace');
  pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, {}, '/workspace');
  await new Promise((res, rej) =>
    pyodide.FS.syncfs(true, e => e ? rej(e) : res()));
  ```
- **syncfs after writes**: every mutating handler awaits
  `syncfs(false)` before resolving.
- **Pyodide FS calls used**:
  `readFile(path, { encoding: 'utf8' })`, `writeFile`,
  `readdir`, `mkdir`, `mkdirTree`, `unlink`, `rmdir`,
  `analyzePath`, `stat`.
- **Error mapping**: catch `e.code` from emscripten and map:
  `ENOENT`, `EEXIST`, `EISDIR`, `ENOTDIR`. Anything else → `EUNK`.
  The path-outside-workspace rejection raises `EPERM` directly
  from the facade.
- **In-flight queue**: extracted from the provider into a tiny
  helper so both `run` / `runPython` and FS ops chain on the same
  promise. (Refactor lands here.)
- **Binary**: `writeFile` accepts `string | Uint8Array`; for
  `Uint8Array` we serialise the bytes as a transferable buffer
  copy (worker.postMessage). For `readFile(path, 'binary')` the
  worker posts back an ArrayBuffer.
- **Path normalisation**: a small `normalisePath` helper resolves
  `..` segments and rejects anything that escapes `/workspace`.

## Files touched

- `app/src/pyodide/protocol.ts` — add FS request / response types,
  `fs-changed` event remains.
- `app/src/pyodide/worker.ts` — IDBFS mount + handlers + post
  `fs-changed`.
- `app/src/pyodide/pyodide-provider.tsx` — expose the worker
  reference via context for the vfs provider; refactor inflight
  chain into a helper used by `run`/`runPython`/FS.
- `app/src/fs/types.ts` — `DirEntry`, `FsStat`, `FsError`.
- `app/src/fs/vfs.ts` — `createVfs(worker, inflight)` that issues
  postMessage with id correlation.
- `app/src/fs/use-vfs.ts` — hook reading the vfs from
  `PyodideContext`.
- `app/src/pyodide/pyodide-context.ts` — add `vfs: Vfs | null`.
- `app/src/pyodide/pyodide-provider.tsx` — build the vfs once
  ready, expose via context.

## Phase 0 — Research

- IDBFS docs:
  https://emscripten.org/docs/api_reference/Filesystem-API.html#idbfs
  Pyodide passes through to emscripten's FS API.
- `syncfs(populate, cb)` with `populate = true` reads from
  IndexedDB into the in-memory FS; `false` writes the in-memory FS
  back. We populate once on mount and write after every mutation.
- For `readFile` errors, emscripten throws an `ErrnoError` with
  `.errno`; recent Pyodide includes a `.code` string. We map
  whichever is present.

## Notes — Worker / main split

The worker still owns Pyodide. The facade is a thin RPC. We do NOT
duplicate state on the main thread. Monaco gets fresh content every
time it asks.
