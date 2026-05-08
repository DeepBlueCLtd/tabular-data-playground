# Phase 0 Research — Load lesson files (#41)

## Decisions

### D1. Binary-safe glob via `?url` + `fetch`

**Decision**: Use
`import.meta.glob('../../../content/lessons/*/files/**/*', { eager: true, query: '?url', import: 'default' })`
to inline starter file URLs. At click time, `fetch(url)` returns a
`Response` whose `arrayBuffer()` we pass to `vfs.writeFile`. This is
binary-safe and lets Vite manage hash-based cache busting.

**Rationale**:
- `?raw` only works for text; binary files (e.g. small `.xlsx` or
  encoded CSV) corrupt under raw string handling.
- `?url` produces a stable URL that Vite emits as an asset; we can
  read it via `fetch` at the moment the user actually clicks.
- The fetch is over the same origin (the deployed Pages site or the
  preview server), so no CORS concerns.

**Alternatives considered**:
- Inline as base64 strings via a custom Vite transform: more code,
  larger bundles. Rejected.
- A `?raw` glob plus a separate binary glob: dual paths, more code.
  Rejected.

### D2. `hasFiles` derived in the loader, not stored in `meta.json`

**Decision**: The loader sets `LessonMeta.hasFiles = files.length > 0`
at index-build time. Lesson authors don't write a `hasFiles` field
themselves — the presence of a non-empty `files/` folder is the
ground truth.

**Rationale**:
- Authoring is "drop a folder and rebuild"; introducing a flag the
  author must keep in sync is a footgun.
- The loader already enumerates lessons; adding the file count is a
  one-liner.

### D3. Modal scope: one confirm per *batch*, not per file

**Decision**: When the colliding set is non-empty, show a single
modal that names the lesson slug and the file count. Confirming
overwrites all colliding files. Cancelling aborts the entire copy.

**Rationale**:
- The drag-drop importer (#17) is per-file because the user is
  dragging a heterogeneous set; here every file comes from the same
  lesson. Per-file prompting would feel pedantic.
- The spec text in §5 is phrased as a single batch ("Folder
  `<slug>` already has files…").

**Alternatives considered**:
- Per-file `Cancel/Overwrite/Overwrite all`: matches #17 but is
  noisier than the curriculum context warrants. Rejected.

### D4. Non-colliding user files are preserved (FR-011)

**Decision**: A user's `notes.txt` in `/workspace/<slug>/` survives
**Load lesson files** even when **Overwrite** is chosen. We only
overwrite files whose paths match a starter file path.

**Rationale**:
- Strictly-honour Principle III: nothing the user created is
  destroyed unless it would have been silently overwritten.
- Decision #49 reversed the shared-workspace silent-overwrite model
  precisely to bound destruction; we honour that here.

### D5. Partial-failure semantics: stop and surface, no rollback

**Decision**: If a write fails mid-batch (e.g., transient worker
error), the action stops at that file, surfaces an error, and leaves
both already-written and untouched files in place. v1 does not
implement transactional rollback.

**Rationale**:
- IDBFS doesn't expose a transaction primitive over the Pyodide
  worker bridge.
- Lesson `files/` are small and the failure mode is rare; documenting
  the behaviour is cheaper than building rollback.

This goes into `docs/limitations.md` per Principle VII (Constitution
Check, gate 6).

### D6. `fs-changed` reuse — no new event needed

**Decision**: The action calls `vfs.writeFile` like any other writer;
the existing `fs-changed` mechanism (#12) propagates the change to
the file tree without code in this item.

**Rationale**: The bridge already emits `fs-changed` on writes (see
#28 / decision #53). No reason to invent a parallel event.

## Open question resolved at planning time

- **Where does the button live?** In the lesson view header, next to
  title + estimated minutes. The lesson view is the only place
  where the user sees the slug; routing the action through the side
  panel host (per `contracts/lesson-api.md`'s side-effect surface)
  was considered but rejected: the side panel doesn't know which
  lesson is selected without coupling.
