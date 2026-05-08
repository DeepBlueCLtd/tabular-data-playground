# Feature Specification: Virtual FS Facade (IDBFS-backed)

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #11 — "Virtual FS facade — single source of
truth for files, bridged to Pyodide IDBFS and Monaco; thin layer so
the backing store can be swapped later (`spec.md` §3, §5)."

## Decisions confirmed (per user)

- **Backing**: Pyodide IDBFS via the worker is the **single source
  of truth**. No main-thread mirror.
- **Shape**: Promise-based, POSIX-ish:
  `readFile / writeFile / readdir / mkdir / remove / stat / exists`.
- **Persistence scope**: only `/workspace` is mounted as IDBFS; the
  rest of Pyodide's FS stays MEMFS. Reset (#20) clears `/workspace`
  only.
- **Binary**: text by default; opt-in to `Uint8Array` via an encoding
  argument.

## User Scenarios & Testing

### User Story 1 — Round-trip a CSV through the facade (P1)

A test harness calls `vfs.writeFile('/workspace/sample.csv',
'a,b\n1,2\n')`, then `vfs.readFile('/workspace/sample.csv')`. The
read returns the exact string. After a page reload, the file is
still there.

**Independent Test**: From the dev console after Pyodide ready,
write then read; reload; read again — content survives.

### User Story 2 — Listing a folder shows what's in it (P1)

After writing two files into `/workspace/lesson1/`, calling
`vfs.readdir('/workspace/lesson1')` returns the two filenames with
correct `kind: 'file'`, no `.` / `..` entries.

### User Story 3 — Binary files round-trip (P2)

`vfs.writeFile('/workspace/bin.dat', new Uint8Array([1,2,3]))` then
`vfs.readFile('/workspace/bin.dat', 'binary')` returns a Uint8Array
of [1,2,3].

### User Story 4 — Errors are typed (P2)

`vfs.readFile('/workspace/missing.txt')` rejects with an
`FsError` whose `code === 'ENOENT'`. The facade does not throw raw
emscripten errors at consumers.

### Edge Cases

- The `/workspace` root is auto-created and mounted on first ready.
- `mkdir(path, { recursive: true })` is allowed — equivalent to
  `pyodide.FS.mkdirTree`. Default is non-recursive.
- `remove(path, { recursive: true })` walks the tree and removes
  files + dirs. Default is non-recursive (errors on a non-empty
  dir).
- After every mutating call (`writeFile`, `mkdir`, `remove`), the
  worker calls `pyodide.FS.syncfs(false, …)` so changes are
  durable. Auto-save debounce of ~500ms (#13) easily absorbs this.
- `stat` returns `{ kind: 'file' | 'dir', size, mtimeMs }`. No
  permissions exposed in v1.
- `readdir` returns `{ name, kind }[]` sorted by name; `.` and `..`
  filtered out.
- All paths must be absolute and start with `/`. Paths outside
  `/workspace` are rejected with `code === 'EPERM'` for v1, to keep
  consumers within the persisted tree.
- Writes to existing paths overwrite without prompt — modal-confirm
  overwrite is the consumer's job (e.g. drag-and-drop importer #17).
- `fs-changed` is emitted by the worker after each mutating call;
  emission shape was locked in #28 and is consumed by #12.

## Requirements

- **FR-001**: New module `app/src/fs/vfs.ts` MUST export a `Vfs`
  class (or factory) with:
  - `readFile(path): Promise<string>`
  - `readFile(path, 'utf8'): Promise<string>`
  - `readFile(path, 'binary'): Promise<Uint8Array>`
  - `writeFile(path, content: string | Uint8Array): Promise<void>`
  - `readdir(path): Promise<DirEntry[]>`
  - `mkdir(path, opts?: { recursive?: boolean }): Promise<void>`
  - `remove(path, opts?: { recursive?: boolean }): Promise<void>`
  - `stat(path): Promise<FsStat>`
  - `exists(path): Promise<boolean>`
- **FR-002**: New types in `app/src/fs/types.ts`:
  `DirEntry { name; kind: 'file' | 'dir' }`,
  `FsStat { kind; size; mtimeMs }`,
  `FsError extends Error { code }` with codes
  `'ENOENT' | 'EEXIST' | 'EISDIR' | 'ENOTDIR' | 'EPERM' | 'EUNK'`.
- **FR-003**: Worker (`worker.ts`) MUST mount IDBFS at `/workspace`
  on Pyodide ready and `syncfs(true)` to load. The post `'ready'`
  message is delayed until this is done.
- **FR-004**: Worker MUST handle FS request messages:
  `fs-readFile`, `fs-writeFile`, `fs-readdir`, `fs-mkdir`,
  `fs-remove`, `fs-stat`, `fs-exists`. Each request carries a
  unique `id`; the worker posts a matching `fs-result` response
  with `{ id, ok, value? | error?: { code, message } }`.
- **FR-005**: After each mutating FS call (`writeFile`, `mkdir`,
  `remove`), the worker MUST call `pyodide.FS.syncfs(false, …)`
  before posting the response. The response resolves only after
  syncfs completes.
- **FR-006**: After each mutating FS call, the worker MUST post a
  `fs-changed` event with the affected `paths` (the
  shape locked in #28). The event system in #12 handles fan-out.
- **FR-007**: All FS calls MUST go through the same in-flight queue
  as `run` / `runPython` (one Pyodide call at a time per worker).
- **FR-008**: Paths outside `/workspace` MUST reject with
  `code: 'EPERM'`. The check is on the main-thread facade for
  fail-fast, and re-checked in the worker for safety.
- **FR-009**: The `Vfs` MUST be constructed inside
  `PyodideProvider` once Pyodide is ready, and exposed via a new
  `useVfs()` hook backed by `PyodideContext` (the worker and the
  inflight scheduler are already there — adding a separate
  provider would only re-expose them). Before ready, `useVfs()`
  returns `{ vfs: null }`.
- **FR-010**: `pnpm run lint && pnpm run format:check && pnpm run build`
  MUST exit 0.
- **FR-011**: In dev only (`import.meta.env.DEV`), expose the vfs
  on `globalThis.__vfs` for manual smoke testing.

## Success Criteria

- **SC-001**: Round-trip write/read of a 1 KB CSV at
  `/workspace/sample.csv` succeeds; content is identical.
- **SC-002**: After page reload, the same file is still readable
  (IDBFS persisted to IndexedDB).
- **SC-003**: `vfs.readdir('/workspace')` returns the expected
  entries, no `.`/`..`.
- **SC-004**: `readFile` on a missing path rejects with
  `code === 'ENOENT'`.
- **SC-005**: A path outside `/workspace` rejects fast with
  `code === 'EPERM'`.

## Assumptions

- Pyodide 0.27 ships IDBFS via `pyodide.FS.filesystems.IDBFS`. This
  is documented and used widely.
- Frictionless writes/reads files through Python's standard
  `open(...)`, which goes through Pyodide's emscripten FS — same
  filesystem the facade uses.
- Auto-save debounce (#13, ~500 ms) is the dominant write rate, so
  per-write `syncfs` is cheap enough.
- `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` from
  `tsconfig.json` are honoured — opts use `?:` and code never
  indexes into arrays without a check.
