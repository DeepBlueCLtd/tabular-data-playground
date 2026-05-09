# Feature Specification: Lesson Loader

**Feature Branch**: `claude/epic-e2-qp0Tr` (epic E2)
**Created**: 2026-05-08
**Status**: Draft
**Backlog ID**: #38
**Input**: User description: "Lesson loader — read markdown lessons from `/content/lessons/`, render via `react-markdown` + `remark-gfm` + `rehype-highlight`. Lesson index built at compile time from `meta.json` files in each lesson folder. (spec.md §7, decision #9)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A learner opens a lesson and reads it (Priority: P1)

A first-time visitor lands in the IDE, opens the lesson panel, picks a lesson
from the curriculum index, and sees the lesson rendered as readable
formatted prose with headings, fenced code blocks (highlighted), tables,
checklists, and inline images. The lesson loads quickly and is fully
self-contained — no live network call to a third party is needed to render
the body of the lesson.

**Why this priority**: Without the ability to render a lesson, none of the
other E2 items (Copy/Run buttons, Load-files action, the eight lessons) can
be demonstrated. This is the foundation for everything Phase 2 ships.

**Independent Test**: Drop a single `lesson.md` plus `meta.json` under
`/content/lessons/<slug>/`, build the app, open the lesson panel, click the
lesson, and confirm the markdown renders correctly with GFM features (tables,
task lists, strikethrough) and code-block syntax highlighting.

**Acceptance Scenarios**:

1. **Given** a lesson folder containing `lesson.md` and a valid `meta.json`,
   **When** the user opens the lesson panel and clicks the lesson entry,
   **Then** the lesson body is rendered with headings, paragraphs, lists,
   tables (GFM), task lists (GFM), strikethrough (GFM), inline code, and
   fenced code blocks with syntax highlighting for the languages used in
   the v1 curriculum (`bash`, `json`, `python`, `csv`/text, `yaml`).
2. **Given** the lesson body uses a `data:` URI image or an absolute
   Pages-base path, **When** the body is rendered, **Then** the image
   displays. (Relative-path image resolution is out of scope for v1 —
   see FR-012.)
3. **Given** the lesson is rendered, **When** an external link in the body
   is clicked, **Then** it opens in a new tab with `rel="noopener noreferrer"`.

---

### User Story 2 — Curated curriculum order (Priority: P1)

The lesson panel shows the curriculum in a deterministic, author-controlled
order — not alphabetical or filesystem-order. Each entry shows its title,
estimated minutes, and a one-line summary so a learner can pick the right
lesson at a glance.

**Why this priority**: The pedagogical sequence in `spec.md` §8 is
deliberate; an unordered or alphabetical list would mis-teach. The index is
the entry point users see before any lesson body, so it must be correct on
first paint.

**Independent Test**: Place three lesson folders with `order` values
`1`, `2`, `3` in `meta.json` and slugs whose alphabetical order differs
from the `order` values. Build and confirm the index renders in numeric
`order`, not slug order.

**Acceptance Scenarios**:

1. **Given** N lesson folders with `meta.json` files setting distinct
   `order` integers, **When** the lesson panel index is shown,
   **Then** entries appear in ascending `order`.
2. **Given** an index entry, **When** the user looks at it, **Then** the
   title, summary, and estimated minutes from `meta.json` are visible.
3. **Given** a build with an invalid `meta.json` (missing required field,
   duplicate `order`, duplicate `slug`), **When** the build runs,
   **Then** the build fails with a message naming the offending file and
   the missing/duplicate field.

---

### User Story 3 — Adding a lesson is "drop a folder and rebuild" (Priority: P2)

A lesson author adds a new lesson by creating a folder under
`/content/lessons/`, dropping in `lesson.md` and `meta.json`, and rebuilding.
No code changes, no central registry edit, no manual route addition.

**Why this priority**: The build-it-to-learn-it process (Principle II) means
the author will be authoring lessons repeatedly throughout E2. Friction here
multiplies across eight lessons and any rework. P2 because it benefits the
author rather than the end-learner directly, but it pays for itself over E2.

**Independent Test**: With the app running in dev mode, create a new lesson
folder and rebuild; confirm the new lesson appears in the index without any
other source change. With the app built for production, do the same and
confirm the new lesson is included.

**Acceptance Scenarios**:

1. **Given** an existing build, **When** the author adds a new lesson folder
   with valid `lesson.md` + `meta.json` and rebuilds, **Then** the new
   lesson appears in the index in its declared `order` position.
2. **Given** a lesson folder is removed before rebuild, **When** the build
   runs, **Then** the lesson disappears from the index without errors.

---

### User Story 4 — Lesson loads instantly after click (Priority: P2)

When the user clicks a lesson from the index, the lesson body appears
without a perceptible delay; the app does not block on a network round-trip
to fetch the body, and the user can scroll/read while Pyodide continues
loading in the background.

**Why this priority**: Lessons are static content shipped with the app; any
fetch delay or loading spinner here would feel wrong. Reading the lesson is
a P1 path, but the *speed* of that path is P2 — a slow first paint would
not block the curriculum from being usable.

**Independent Test**: With Pyodide artificially delayed, click a lesson
from the index and confirm the body renders within 200 ms on a warm load
(after first lesson has been viewed once).

**Acceptance Scenarios**:

1. **Given** the user has the lesson panel open, **When** they click any
   lesson in the index, **Then** the lesson body is on screen in under
   500 ms on a warm load.
2. **Given** Pyodide has not finished loading, **When** the user opens a
   lesson, **Then** the lesson body renders fully and is scrollable; only
   Run buttons are disabled (per #29 / #40), not the lesson content.

---

### Edge Cases

- **Empty `/content/lessons/`**: index renders an empty-state message
  ("No lessons available") rather than crashing or showing chrome only.
- **`lesson.md` missing**: build fails with a message naming the folder.
- **`meta.json` malformed JSON**: build fails with a parser error pointing
  at the file.
- **Duplicate `slug` or `order` across folders**: build fails listing both
  offending folders.
- **`order` not an integer**: build fails with a typed message.
- **Lesson body contains an unknown code-fence language**: the block renders
  as plain monospace text without highlighting, with no console error.
- **Lesson body contains raw HTML**: raw HTML in markdown is **not**
  rendered (sanitised / passed through as text), to keep author authority
  bounded to markdown.
- **Lesson body references an image with a relative path that does not
  resolve**: the missing image's `alt` text is shown; the rest of the lesson
  still renders.
- **External link in lesson body**: opens in a new tab with
  `rel="noopener noreferrer"`.
- **`meta.json` `summary` exceeds a sensible length** (e.g. >200 chars):
  the index truncates the displayed summary; full text remains in the JSON.
- **The user navigates between lessons rapidly**: the previously-rendered
  body is replaced; no stale fragments remain on screen.

## Requirements *(mandatory)*

### Functional Requirements

#### Discovery and indexing

- **FR-001**: The system MUST treat `/content/lessons/<slug>/` as the
  source of lessons, where `<slug>` is the folder name.
- **FR-002**: The system MUST, at build time, enumerate every lesson folder,
  read its `meta.json`, and produce a single in-memory **lesson index**
  consumed by the lesson panel.
- **FR-003**: The lesson index MUST be sorted by the integer `order` field
  in `meta.json`, ascending.
- **FR-004**: Each lesson index entry MUST contain at minimum: `slug`,
  `title`, `summary`, `order`, and `estimatedMinutes`.
- **FR-005**: The build MUST fail (non-zero exit) if any lesson folder is
  missing `lesson.md` or `meta.json`, if `meta.json` is not valid JSON, if
  required fields are missing, if `order` is not an integer, or if `slug`
  or `order` collide across folders. The error message MUST name the
  offending file(s).
- **FR-006**: Lesson `slug` MUST be unique and MUST equal the folder name
  (the folder name is the canonical slug; `meta.json.slug`, if present,
  must match the folder name).

#### Rendering

- **FR-007**: When the user selects a lesson from the index, the system
  MUST render the contents of that lesson's `lesson.md` in the lesson
  panel.
- **FR-008**: Markdown rendering MUST support GitHub-Flavored Markdown
  features: tables, task lists, strikethrough, autolinked URLs, and
  fenced code blocks.
- **FR-009**: Fenced code blocks MUST receive syntax highlighting for the
  registered language allow-list: `bash`, `json`, `python`, `yaml`. Any
  other language tag — including `csv`, `text`, and unrecognised tags —
  MUST render as plain monospace text without throwing and without
  registering a highlighter.
- **FR-010**: Raw HTML inside markdown MUST NOT be evaluated; it is either
  escaped or passed through as text. (Authoring authority is bounded to
  markdown features.)
- **FR-011**: External links in the rendered body MUST open in a new tab
  with `rel="noopener noreferrer"`. Internal/relative links resolve within
  the lesson folder.
- **FR-012**: Images in lesson bodies MAY be embedded as `data:` URIs or
  referenced via absolute Pages-base paths. Relative-path image
  resolution to assets in the lesson folder is **out of scope for v1**
  (no v1 lesson currently requires binary image assets); a missing
  image's `alt` text is shown gracefully (see Edge Cases). If a future
  lesson needs relative-path images, add a follow-up backlog item.
- **FR-013**: The renderer's `<code>` block element MUST be implemented in
  a way that allows downstream items (#39, #40) to inject Copy/Run action
  bars on `bash` blocks **without** requiring further changes to this
  loader. (This is a structural requirement, not a UI delivery — the
  buttons themselves ship in #39/#40.)

#### Lifecycle and integration

- **FR-014**: The lesson panel MUST render its index when no lesson is
  selected (the curriculum index, item #37, will populate this view; this
  loader MUST NOT block #37 by hard-coding a default lesson).
- **FR-015**: Switching between lessons MUST replace the previous body in
  place; no scroll position from the previous lesson is retained.
- **FR-016**: Lesson rendering MUST be independent of Pyodide readiness —
  the lesson body renders even while Pyodide is still loading.

#### Authoring & build hygiene

- **FR-017**: Adding a new lesson MUST require only: (a) creating the
  folder, (b) populating `lesson.md` and `meta.json`, (c) rebuilding. No
  other source file edits are required.
- **FR-018**: Removing a lesson folder before build MUST cause the lesson
  to disappear cleanly from the index with no residual references.
- **FR-019**: The lesson index build step MUST run as part of the standard
  app build pipeline (`pnpm build`); it MUST NOT be a separate manual step.
- **FR-020**: The build MUST treat unknown fields in `meta.json` as
  warnings, not errors, so author-side experimentation does not break
  builds.

### Key Entities

- **Lesson**: A single curriculum unit. Identified by `slug` (folder name).
  Has rendered body (`lesson.md`), display metadata (`meta.json`), and
  optionally a `files/` subfolder of starter files (used by #41, not by
  this loader).
- **`meta.json`** (per lesson): Display metadata. Required fields:
  `title` (string), `slug` (string, must equal folder name), `order`
  (integer, unique across the curriculum), `summary` (string),
  `estimatedMinutes` (integer). Reserved for later items: any field used
  by #41 (e.g. `hasFiles`) and #42–#49 (e.g. lesson-specific assertions).
- **Lesson Index**: The compile-time-built ordered list of lesson entries
  consumed by the curriculum index (#37) and the lesson panel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a clean clone with three sample lesson folders in
  `/content/lessons/`, a single `pnpm build` produces an artefact in which
  all three lessons appear in the curriculum index in the declared `order`,
  and clicking any of them renders the body — with **zero** code changes
  to the app since adding the folders.
- **SC-002**: Rendering a lesson body after the user clicks its index
  entry takes under **500 ms** on a warm load on a desktop laptop.
- **SC-003**: Introducing a malformed lesson folder (missing field,
  duplicate slug, malformed JSON, non-integer order) causes the build to
  fail with an error message that names the offending file(s) — verifiable
  by trying each failure mode and observing a non-zero exit.
- **SC-004**: A lesson body containing the GFM features used by the v1
  curriculum (table, task list, strikethrough, autolinked URL, fenced
  bash/json/python/yaml + a `csv`/unknown block as plain text) renders
  correctly without console errors.
- **SC-005**: With Pyodide artificially delayed by 5 s, lesson bodies
  remain selectable and readable; the lesson panel does not block on
  Pyodide.
- **SC-006**: The author can add an eighth lesson during E2 in under
  **2 minutes** of mechanical work (folder + two files + rebuild),
  excluding the time taken to write the lesson content itself.

## Assumptions

- The curriculum size for v1 is fixed at eight lessons (`spec.md` §8);
  the loader is not designed for hundreds of lessons. A linear,
  build-time index is sufficient.
- All lesson content is shipped as part of the application bundle (or
  served as static assets from the same origin); there is no remote
  CMS or runtime fetch of `meta.json` from a third party.
- Code-block language tagging in lessons is the author's responsibility;
  the renderer does not detect language.
- Adding image assets, downloadable files, or other binary content in a
  lesson folder is allowed; this loader concerns only `lesson.md` and
  `meta.json`. Starter files under `files/` are out of scope here and
  belong to backlog item #41.
- The Run/Copy action bars on bash code blocks are out of scope for this
  loader; this spec only requires that the code-block rendering surface
  be **structurally compatible** with later injection (FR-013).
- The lesson panel UI shell already exists from E1 (item #8 / #11); this
  spec adds content to it, not the panel itself.
- The constitution's Technology Constraints already permit
  `react-markdown`, `remark-gfm`, and `rehype-highlight`; if any of these
  must be added to the pinned dependency list, that goes through the
  pinning process (#55) rather than this spec.
