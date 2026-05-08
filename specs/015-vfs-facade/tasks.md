# Tasks: Virtual FS Facade (Backlog #11)

## Phase 1: Types

- [X] T001 Create `app/src/fs/types.ts` with `DirEntry`, `FsStat`,
  `FsError` (with `code`).

## Phase 2: Protocol

- [X] T002 Extend `protocol.ts` with FS request/response types:
  `FsReadFileRequest`, `FsWriteFileRequest`, `FsReaddirRequest`,
  `FsMkdirRequest`, `FsRemoveRequest`, `FsStatRequest`,
  `FsExistsRequest`, and `FsResponse` (success/error union with
  id correlation). Update inbound/outbound unions.

## Phase 3: Worker

- [X] T003 Expand `MinimalPyodide` with `FS` (mkdir, mkdirTree,
  mount, syncfs, readFile, writeFile, readdir, stat, unlink,
  rmdir, analyzePath, filesystems).
- [X] T004 In `load()`, after Pyodide ready: ensure `/workspace`,
  mount IDBFS there, `syncfs(true)`. Then post `'ready'`.
- [X] T005 Implement FS handlers — read/write/readdir/mkdir
  (recursive flag)/remove (recursive flag)/stat/exists. Mutating
  handlers await `syncfs(false)` and post `fs-changed`.
- [X] T006 Wire dispatcher to route the seven FS request types.

## Phase 4: Inflight refactor + facade

- [X] T007 Extract a small `inflight` helper in
  `pyodide-provider.tsx` and reuse for `run` / `runPython`.
- [X] T008 Create `app/src/fs/vfs.ts` — promise-correlated
  postMessage + path-outside-workspace EPERM check + error
  mapping.
- [X] T009 Create `app/src/fs/vfs-context.ts` and
  `vfs-provider.tsx`; expose via `use-vfs.ts`. The provider
  returns null vfs while Pyodide isn't ready and a real one once
  it is.

## Phase 5: Wire + verify

- [X] T010 Wrap App in `<VfsProvider>` inside `<PyodideProvider>`.
- [X] T011 In dev only, expose `globalThis.__vfs` for manual smoke.
- [X] T012 `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Phase 6: Limitations

- [X] T013 If `docs/limitations.md` doesn't yet capture IDBFS sharp
  edges (private-browsing fallback, quota), add a one-liner.

## Phase 7: Backlog + commit

- [X] T014 Strikethrough `#11` in `backlog.md`; bump Updated.
- [X] T015 Three commits: `feat(#11)`, `docs(#11)`, `docs: backlog status`.
