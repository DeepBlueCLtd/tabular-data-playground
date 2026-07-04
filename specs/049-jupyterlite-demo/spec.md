# Feature Specification: JupyterLite Demo Page

**Feature Branch**: `claude/speckit-issue-21-hjjn3n`
**Created**: 2026-07-04
**Status**: Draft
**Input**: GitHub issue #21 — "Add a JupyterLite demo page to the
Pages site (in-browser matplotlib from tabular data)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See in-browser matplotlib plotting on tabular data (Priority: P1)

A visitor to the public Pages site follows a link to a JupyterLite
demo, opens a bundled example notebook, and runs it. Python executes
entirely in their browser (Pyodide), reads a small sample tabular
dataset, and renders a matplotlib figure inline in the notebook —
with no local install, no accounts, and no server.

**Why this priority**: This is the whole point of the issue. Without
an in-browser matplotlib figure rendering from sample tabular data,
the demo delivers no value. It is the minimum shippable artefact.

**Independent Test**: Open the demo URL in a mainstream browser on a
cold load, open the example notebook, run all cells, and confirm a
matplotlib figure appears inline. This is fully testable on its own
and delivers the complete headline value.

**Acceptance Scenarios**:

1. **Given** the deployed Pages site, **When** a visitor opens the
   JupyterLite demo URL on a cold load in Chrome or Firefox, **Then**
   JupyterLite loads and the example notebook is available to open.
2. **Given** the example notebook is open, **When** the visitor runs
   all cells, **Then** the sample tabular dataset loads and at least
   one matplotlib figure renders inline within the notebook.
3. **Given** the notebook has produced a figure, **When** the visitor
   inspects the running environment, **Then** no server or account was
   required — all execution happened in the browser.

---

### User Story 2 - Discover the demo from the landing page (Priority: P2)

A visitor on the existing site's landing page sees a clearly labelled
link to the JupyterLite demo and can navigate to it, understanding
that it is a separate, notebook/plotting surface complementing the
existing Frictionless playground.

**Why this priority**: A demo that ships but is unreachable from the
site delivers little value; discoverability is what turns the build
into something visitors actually see. It depends on Story 1 existing
but is a distinct, independently testable slice.

**Independent Test**: Load the landing page, confirm a visible link to
the demo is present, click it, and confirm it navigates to the demo
page.

**Acceptance Scenarios**:

1. **Given** the landing page, **When** a visitor reads it, **Then** a
   labelled link to the JupyterLite demo is visible.
2. **Given** the link, **When** the visitor clicks it, **Then** they
   arrive at the JupyterLite demo page.

---

### User Story 3 - Reproduce the demo build from one documented command (Priority: P3)

A maintainer can rebuild the JupyterLite demo locally and produce the
same published output by following a single documented command, so the
demo is reproducible and the frozen playground build stays untouched.

**Why this priority**: Reproducibility and additive-build hygiene
protect the pinned/frozen playground (Constitution VI) and keep the
demo maintainable, but the visitor-facing value (Stories 1–2) can be
demonstrated before this is polished.

**Independent Test**: On a clean checkout, run the single documented
build command and confirm it produces the demo output directory
without modifying or rebuilding the existing playground.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** a maintainer runs the single
   documented build command, **Then** the demo output is produced in
   its own dedicated subdirectory.
2. **Given** the demo build, **When** it runs, **Then** it neither
   modifies nor depends on the existing frozen playground's runtime or
   pins.
3. **Given** the site deploy, **When** the Pages workflow runs, **Then**
   the demo build is an additive step that publishes the demo alongside
   the existing site.

---

### Edge Cases

- **Cold load latency**: The demo fetches Pyodide and package wheels
  (including matplotlib and its dependencies) from a CDN at runtime.
  On a first (uncached) visit this download can be large and slow; the
  demo should set expectations for load time rather than appear broken.
- **Network unavailable / CDN blocked**: Because the demo is online-only
  by design, it cannot run in an offline or air-gapped context. When the
  CDN is unreachable, the notebook cannot execute; this limitation must
  be documented so expectations are set.
- **Unsupported / older browser**: A browser without the capabilities
  Pyodide requires will not run the demo. Mainstream current Chrome and
  Firefox are the supported baseline.
- **Payload weight from data libraries**: If the sample notebook pulls
  in heavier libraries (e.g. numpy/pandas), the wheel download grows.
  Keep the sample light or note the expected load cost.
- **Sample data scope**: Only generic, shareable sample data is used;
  no project-specific or sensitive datasets appear in the public repo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST publish a self-contained JupyterLite demo
  reachable at a dedicated path on the existing Pages site (its own
  subdirectory), separate from the existing playground.
- **FR-002**: The demo MUST render matplotlib output entirely in the
  browser (via Pyodide), with figures appearing inline in notebook
  cells — no server and no account required.
- **FR-003**: The demo MUST ship at least one example notebook that
  loads a generic sample tabular dataset (e.g. CSV or Frictionless
  datapackage) and produces at least one matplotlib figure.
- **FR-004**: The landing page MUST include a visible, labelled link to
  the JupyterLite demo.
- **FR-005**: The demo MUST work from a cold (uncached) load in current
  mainstream browsers (Chrome and Firefox).
- **FR-006**: The demo build MUST be reproducible via a single
  documented command.
- **FR-007**: The demo build MUST be an additive step in the existing
  Pages deploy workflow that publishes the demo alongside the existing
  site.
- **FR-008**: The demo MUST live in its own subdirectory with its own
  pinned versions, and MUST NOT modify, rebuild, or share the runtime
  or pins of the existing frozen playground (Constitution VI).
- **FR-009**: The demo MUST use only generic, shareable sample data; no
  project-specific or sensitive datasets in the public repo.
- **FR-010**: The demo's online-only nature (runtime CDN fetch of
  Pyodide and wheels, no offline/air-gapped path) and expected cold-load
  cost MUST be documented so visitor and maintainer expectations are set
  (Constitution Principle VI — Limitations).

### Key Entities *(include if feature involves data)*

- **JupyterLite demo site**: The self-contained, statically-served
  notebook environment published in its own subdirectory of the Pages
  site, with its own pinned versions independent of the playground.
- **Example notebook**: A shipped notebook that loads a sample tabular
  dataset and renders one or more matplotlib figures inline.
- **Sample tabular dataset**: A generic, shareable dataset (CSV or
  Frictionless datapackage) used as the plotting input; kept light to
  bound download weight.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the landing page, a visitor can reach the JupyterLite
  demo in a single click via a clearly labelled link.
- **SC-002**: On a cold load in current Chrome and Firefox, a visitor
  can open the example notebook, run all cells, and see at least one
  matplotlib figure rendered inline.
- **SC-003**: 100% of the demo's execution (data load and plotting)
  happens in the browser — zero server calls beyond fetching pinned
  static assets and CDN-hosted Pyodide/wheels; no account is required.
- **SC-004**: A maintainer can reproduce the published demo output from
  a single documented command on a clean checkout, with the existing
  frozen playground's build output unchanged.
- **SC-005**: The demo's online-only limitation and expected cold-load
  behaviour are stated in the project's limitations documentation.

## Assumptions

- **Numbering**: GitHub issue #21 is a newly filed feature and is
  unrelated to the pre-existing `specs/021-file-tree` directory; the two
  numbering systems are independent. This spec is filed under the next
  sequential spec directory, `049-jupyterlite-demo`.
- **Hosting**: The demo is published on the same public GitHub Pages
  site as the existing playground (`https://deepbluecltd.github.io/
  tabular-data-playground/`), under its own subdirectory (e.g.
  `/jupyterlite/`). Exact path is an implementation detail.
- **Online-only is acceptable here**: Runtime CDN fetching is fine for a
  public Pages demo (Pages is online anyway) and does not violate the
  browser-only/no-backend posture (Constitution Principle IV), which
  permits fetching pinned static assets.
- **Additive to the freeze**: The existing playground is deliberately
  pinned (Constitution VI). The demo has its own pins and runtime and
  must not alter the existing contract.
- **New tooling is a constitution matter**: Introducing the JupyterLite
  build toolchain and its pins is expected to be recorded as a
  constitution Technology-Constraints amendment (with pins in the
  README), handled during planning — not a silent dependency addition.
- **Sample data**: A generic, light sample tabular dataset is used;
  keeping numpy/pandas usage minimal bounds the wheel download.

## Out of Scope

- Offline / vendored-wheel bundling for an air-gapped path (separate
  concern).
- Any change to the existing frozen playground's runtime, pins, or
  build output.
