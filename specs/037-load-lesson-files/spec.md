# Feature Specification: Load lesson files

**Feature Branch**: `claude/epic-e2-qp0Tr` (epic E2)
**Created**: 2026-05-08
**Status**: Draft
**Backlog ID**: #41
**Input**: "Load lesson files" action — copies `/content/lessons/<slug>/files/` into `/workspace/<slug>/`; modal-confirm overwrite when destination has user-edited files (decisions #19→#49, #51, `spec.md` §5). Implements Principle III.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Author starts a lesson with a clean workspace (Priority: P1)

A learner opens a lesson, clicks **Load lesson files**, and the lesson's
starter files appear under `/workspace/<slug>/` for them to read and
edit. They follow the lesson's instructions in the terminal and editor,
each operating against the freshly-loaded files.

**Why this priority**: Without this action, every lesson that ships
starter files (`data.csv`, `README.md`, partial `datapackage.json`,
etc.) requires the learner to manually re-create them, which defeats
the curriculum's "follow along" pedagogy and the build-it-to-learn-it
discipline.

**Independent test**: With a lesson that ships a `files/` folder, an
empty workspace, click **Load lesson files**. Confirm every file under
`content/lessons/<slug>/files/` is now present at the same path under
`/workspace/<slug>/` with byte-identical contents. The Files panel
reflects the new tree without a manual refresh.

**Acceptance Scenarios**:

1. **Given** the lesson `01-describe` ships `files/data.csv` and
   `files/README.md`, **And** `/workspace/01-describe/` does not exist,
   **When** the user clicks **Load lesson files**, **Then** both files
   appear at `/workspace/01-describe/data.csv` and
   `/workspace/01-describe/README.md`.
2. **Given** files have been copied, **When** the user opens the file
   tree, **Then** the new files are visible without needing to reload
   the page.
3. **Given** a lesson with no `files/` folder, **When** the user views
   the lesson, **Then** the **Load lesson files** button is hidden or
   disabled (and labelled to explain why); the absence is not an error.

### User Story 2 — Author re-runs the lesson and is asked before any overwrite (Priority: P1)

The learner has been editing files inside `/workspace/<slug>/`. They
re-click **Load lesson files** (intentionally or accidentally). The app
detects that the destination folder is non-empty and shows a modal:
*"Folder `<slug>` already has files. Loading the lesson's starter files
will overwrite any with the same name. Your edits to those files will
be lost."* with **Cancel** and **Overwrite** actions.

**Why this priority**: Principle III is non-negotiable. A silent
overwrite would corrupt the learner's work — exactly the footgun that
decision #49 reversed.

**Independent test**: Edit a file under `/workspace/<slug>/`, click
**Load lesson files** again, confirm the modal appears, **Cancel**,
verify edits are intact. Repeat, choose **Overwrite**, verify file
contents now match the bundled starter.

**Acceptance Scenarios**:

1. **Given** `/workspace/<slug>/data.csv` exists with user edits,
   **When** the user clicks **Load lesson files** and chooses **Cancel**,
   **Then** no files in `/workspace/<slug>/` are written or removed.
2. **Given** the same precondition, **When** the user chooses
   **Overwrite**, **Then** every starter file replaces the corresponding
   `/workspace/<slug>/` file; files in `/workspace/<slug>/` that have no
   matching starter are left alone (not deleted).
3. **Given** `/workspace/<slug>/` has only files that *do not* collide
   with the starter set (e.g., user added `notes.txt` and the starter
   is `data.csv` only), **When** the user clicks **Load lesson files**,
   **Then** no modal appears; the starter files are written and
   `notes.txt` is preserved.
4. **Given** the modal is open, **When** the user presses Escape or
   clicks the backdrop, **Then** the action cancels — same as **Cancel**.

### User Story 3 — File tree updates automatically (Priority: P2)

Right after loading, the file tree shows the new folder/files without a
manual refresh. The editor, if a tab was open on a file that just got
overwritten, re-reads the new content (or shows a clear unsaved-conflict
state — implementation choice subject to E1 patterns).

**Why this priority**: P2 because the worst-case outcome is a manual
F5 refresh; correctness is preserved either way.

**Acceptance Scenarios**:

1. **Given** the user clicks **Load lesson files**, **When** the
   operation completes, **Then** the Files panel renders the new files
   within 250 ms (the existing `fs-changed` event mechanism — see #12
   — handles this).

### Edge Cases

- **Lesson has zero `files/`**: button hidden or disabled with a
  one-line explanation; no error.
- **Destination folder doesn't exist yet**: created (recursively) before
  the first write.
- **`files/` contains nested subfolders** (e.g.
  `files/raw/2025/sample.csv`): full path mirrored under
  `/workspace/<slug>/raw/2025/sample.csv`.
- **Binary file in `files/`** (e.g. small `.xlsx`): copied byte-for-byte.
- **Total `files/` size is large** (e.g. several 10 MB files): no
  artificial cap — these are bundled-with-the-app starter files vetted
  by the lesson author. (This is different from drag-drop import #17,
  where 10 MB/file is a per-file cap on user-supplied files.)
- **Pyodide is still loading when the user clicks the button**: button
  is disabled until the VFS is ready (the VFS lives behind the Pyodide
  worker boundary in v1; see Plan).
- **The user clicks the button rapidly**: the second click is ignored
  while a copy is in flight (single-flight); button shows a busy state.
- **A file inside `files/` cannot be written** (quota, transient
  worker error): action stops at the first failure, surfaces the error
  in a non-blocking toast/inline message; previously-copied files
  remain (no rollback in v1; see Limitations gate).
- **The user picks "Overwrite", and one of the writes fails halfway
  through**: same partial-state outcome as above; the user's choice
  was informed.

## Requirements *(mandatory)*

### Functional Requirements

#### Discovery and bundling

- **FR-001**: The lesson loader (#38 module) MUST additionally
  enumerate `/content/lessons/<slug>/files/**/*` at build time, with
  binary-safe content (raw `Uint8Array` or base64), and expose a
  `getLessonFiles(slug)` API.
- **FR-002**: The lesson index entry MUST carry a derived flag
  `hasFiles: boolean` so the lesson view can hide/disable the button
  without a separate fetch.
- **FR-003**: Underscored slugs (`_*`) follow the same dev-only rule as
  in #38 — their `files/` folder is bundled in dev / when
  `VITE_INCLUDE_DEV_LESSONS=1` is set, and excluded from prod
  otherwise.

#### Action UI

- **FR-004**: A **Load lesson files** button MUST appear in the lesson
  view header for every lesson where `hasFiles === true`.
- **FR-005**: The button MUST be disabled while the VFS is unavailable
  (Pyodide worker not ready), while a previous copy is in flight, and
  for lessons where `hasFiles === false`. A short hint text MUST
  explain why when disabled.
- **FR-006**: While the copy is in flight, the button MUST display a
  busy state (e.g. "Loading…") and not accept further clicks.

#### Confirm-on-destruction (Principle III)

- **FR-007**: Before any write, the action MUST inspect
  `/workspace/<slug>/` and identify the subset of starter files whose
  destination paths already exist (call this set the *colliding* set).
- **FR-008**: If the colliding set is non-empty, the action MUST
  present a modal naming the lesson slug and the count of files about
  to be overwritten (or the list, if ≤ 5). Buttons: **Cancel** and
  **Overwrite**. Modal copy MUST follow the spec text in §5: "Folder
  `<slug>` already has files. Loading the lesson's starter files will
  overwrite any with the same name. Your edits to those files will be
  lost."
- **FR-009**: **Cancel** (button, Escape key, backdrop click) MUST
  abort the action with **zero** writes performed.
- **FR-010**: **Overwrite** MUST proceed to copy every starter file —
  both the colliding subset and the rest — to `/workspace/<slug>/`.
- **FR-011**: Files under `/workspace/<slug>/` that do **not** appear
  in the starter set MUST NOT be deleted or modified. (E.g., a user's
  `notes.txt` survives.)

#### Copy execution

- **FR-012**: For each starter file, the action MUST: (a) ensure the
  parent directory exists (recursive `mkdir`), (b) write the file via
  the VFS API. Binary content MUST round-trip without corruption.
- **FR-013**: After a successful write, the loader MUST emit / rely on
  the existing `fs-changed` mechanism (#12) so the file tree
  re-renders without explicit invalidation.
- **FR-014**: On a write failure, the action MUST stop, surface a
  human-readable error, and leave the partial state in place; v1 does
  not implement rollback. The error MUST name the offending path.

#### Boundaries

- **FR-015**: This action MUST NOT touch any path outside
  `/workspace/<slug>/`. The VFS' built-in `EPERM` guard suffices.
- **FR-016**: This action MUST NOT delete the lesson folder before
  copying. Existing files unaffected by the copy (FR-011) are kept.
- **FR-017**: This action MUST NOT trigger Pyodide command execution.
  It writes through the VFS bridge but does not run Python code.

### Key Entities

- **Starter file**: A bundled file under `content/lessons/<slug>/files/`
  with a relative path inside that folder, a content payload, and a
  derived destination path under `/workspace/<slug>/`.
- **Colliding set**: The intersection of starter file destinations with
  files that already exist in the workspace. Populating this set
  drives the destruction-confirm gate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With an empty workspace, clicking **Load lesson files**
  on a lesson with N≤20 small (<100 KB) starter files completes in
  under 1 second on a desktop laptop.
- **SC-002**: With existing user edits in `/workspace/<slug>/`, the
  modal appears before any byte is written (verifiable: instrument the
  VFS bridge to count writes between click and modal, expect 0).
- **SC-003**: Choosing **Cancel** results in zero writes and zero
  removes — verifiable by capturing the VFS message queue during the
  flow.
- **SC-004**: Choosing **Overwrite** results in `vfs.readFile(path)`
  for every starter file matching the bundled content byte-for-byte.
- **SC-005**: A user file that does not collide with the starter set
  is preserved across the operation — verifiable by writing
  `notes.txt` first, running the action, and re-reading `notes.txt`.
- **SC-006**: Clicking the button while a copy is already in flight
  is a no-op (UI button disabled; underlying handler short-circuits).

## Assumptions

- The lesson loader (#38) public surface is in place; this item
  extends it (`hasFiles`, `getLessonFiles`).
- The VFS (#11) and `fs-changed` event system (#12) work as
  documented; this item is a consumer.
- Lesson `files/` folders contain only files relevant to the lesson —
  no tests, no node_modules, no build artefacts. Lesson authoring
  conventions (#50) will codify this.
- "User-edited files" is approximated as "any file that exists in the
  destination at click-time", regardless of whether the user actually
  edited it. This is the same approximation the drag-drop importer
  (#17) uses; we trade a tiny over-prompt for simplicity.
- Atomicity: v1 does not implement rollback. A partial copy on
  failure leaves both old and new files mixed. Documenting this in
  `docs/limitations.md` is the constitution-required move (Principle
  VII) — gated below.
