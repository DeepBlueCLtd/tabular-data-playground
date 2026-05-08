# Feature Specification: Spike A — Pyodide + Frictionless Install Proof

**Feature Branch**: `claude/epic-e0-Vrtop` (epic E0 branch; per-item branches not used)
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "Spike A — Pyodide + frictionless install proof. A static page that loads Pyodide from a pinned CDN URL, runs micropip.install('frictionless'), then executes `frictionless --version` followed by `frictionless validate <small CSV>` end-to-end inside the browser. The page captures stdout, stderr, and exit-code for each invocation and renders them so the author can read them without opening devtools. Pass criteria: works in latest Chrome AND latest Firefox."

**Source**: `spec.md` §10 R1, §11 Phase 0; `backlog.md` item #1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Reproduce the install proof in a fresh browser (Priority: P1)

The author (or any reader of this repository) opens the spike page in a fresh
browser session, clicks "Run", and watches Pyodide load, install
`frictionless` via `micropip`, and execute two `frictionless` invocations.
All three artefacts of each invocation — stdout, stderr, exit-code — are
visible on the page. Without opening devtools, the reader can tell whether
the spike passed or failed and roughly how long each step took.

**Why this priority**: This is the only user story. The spike's value is
the recorded outcome — "yes, Frictionless installs and runs in the browser
via Pyodide on Chrome and Firefox" or "no, here is where it broke". If
this story doesn't work, the spike has failed and Phase 1 must be
re-planned (frictionless-js fallback or different runtime).

**Independent Test**: Open the spike page in latest Chrome with cleared
cache; click Run; observe the page reach a "PASS" state with
`frictionless --version` printing a version number and
`frictionless validate <small CSV>` printing a validation report with
exit-code 0. Repeat in latest Firefox. The page is the test artefact.

**Acceptance Scenarios**:

1. **Given** a fresh browser tab in latest Chrome with the spike page
   loaded, **When** the user clicks Run, **Then** the page shows
   Pyodide finishing load, `micropip.install('frictionless')` succeeding,
   `frictionless --version` printing a non-empty version string with
   exit-code 0, and `frictionless validate <small CSV>` printing a
   report with exit-code 0 — all on-page, no devtools required.
2. **Given** the same conditions in latest Firefox, **When** the user
   clicks Run, **Then** the same outcomes occur. Any divergence between
   browsers is recorded on the page or in the captured results.
3. **Given** any step fails (Pyodide load, `micropip.install`, or either
   `frictionless` call), **When** the failure occurs, **Then** the page
   stops the sequence, displays which step failed and the captured
   stderr / exit-code, and marks the run "FAIL" rather than hanging.
4. **Given** a successful run in either browser, **When** the user copies
   the captured results, **Then** they obtain a self-contained text block
   suitable for pasting into `docs/architecture.md` or the epic PR
   description.

### Edge Cases

- Pyodide CDN is unreachable (offline, blocked) — page surfaces a clear
  network error rather than spinning indefinitely.
- `micropip.install('frictionless')` raises (e.g. wheel missing,
  incompatible Python version) — the raised exception is captured and
  shown; the spike records this as a FAIL outcome with the underlying
  reason.
- The CSV file used for `frictionless validate` is missing or fails to
  parse — distinguishable on-page from a Pyodide / install failure.
- A second click on Run while a run is in progress is ignored or queued
  (no double-execution); after a run finishes, Run is enabled again so
  the reader can re-time a "warm" execution if curious.
- The browser is below the latest-2-versions support window — the page
  may run; results are still informational. No fallback engineering.
- SharedArrayBuffer is unavailable (cross-origin isolation not
  configured on GitHub Pages) — must not block the spike. If absence
  measurably affects behaviour, capture the observation in
  `docs/limitations.md`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The spike MUST be a single static page (no backend, no
  build-time secrets) loadable from `file://` or a static host. It is
  the de-risk for Constitution Principle IV (browser-only, no backend).
- **FR-002**: The page MUST load Pyodide from a pinned CDN URL. The
  pinned version MUST be visible on the page and recorded in
  `docs/architecture.md`.
- **FR-003**: The page MUST install Frictionless via
  `micropip.install('frictionless')`. The Frictionless version actually
  resolved MUST be captured (from `frictionless --version`) and
  recorded.
- **FR-004**: The page MUST run `frictionless --version` and
  `frictionless validate <small CSV>` against a CSV bundled with the
  spike. The CSV MUST be small (fits in the page; ≤ a few KB) and MUST
  exercise validation enough to produce a non-trivial report (at least
  one row, at least one typed column).
- **FR-005**: For each invocation the page MUST capture and display
  stdout, stderr, and exit-code separately so the reader can tell which
  channel a message arrived on without opening devtools.
- **FR-006**: The page MUST display a PASS / FAIL summary at the top
  once a run completes. PASS requires both `frictionless` invocations
  to exit 0 with non-empty stdout. FAIL otherwise.
- **FR-007**: The page MUST surface elapsed time for at least the
  first end-to-end run (load → install → first frictionless call →
  second frictionless call). Precise per-step timing is a nice-to-have
  here; full latency characterisation belongs to Measurement C
  (item #3).
- **FR-008**: The page MUST NOT make any network call other than
  fetching the pinned Pyodide assets and the wheels `micropip` resolves
  for `frictionless`. No telemetry, no analytics (Constitution
  Principle IV).
- **FR-009**: The captured results — versions, exit-codes, and a copy of
  stdout/stderr from a successful Chrome run AND a successful Firefox
  run — MUST be recorded in `docs/architecture.md` as part of the
  Phase 0 record. The spike is not "done" on the basis of code alone;
  the recorded outcome is the deliverable (Constitution Principle V).
- **FR-010**: Any sharp edge encountered during the spike (e.g.
  SharedArrayBuffer absence, micropip wheel issues, slow cold start,
  network requirement of `micropip.install`) MUST be added to
  `docs/limitations.md` in the same change (Constitution Principle VII).
- **FR-011**: The pinned Pyodide and Frictionless versions MUST be
  recorded such that a future reader can reproduce the run
  (Constitution Principle VI). Recording in `docs/architecture.md`
  satisfies this for the spike; full v1.0 pinning in `package.json` /
  README is out of scope here.
- **FR-012**: The spike MUST be runnable WITHOUT any project build
  step. A reader should be able to open the HTML file directly (or
  `python -m http.server` for the workspace) and click Run; no
  Vite/pnpm required. This keeps the spike usable even if the rest of
  the IDE shell never gets built.

### Key Entities

- **Spike Page**: a single static HTML file that hosts the spike UI
  (Run button, status, captured stdout/stderr/exit-code panes,
  PASS/FAIL summary, version and timing readouts).
- **Pinned Pyodide Distribution**: the CDN-served Pyodide bundle at a
  specific version. Pinning is part of the deliverable.
- **Frictionless Wheel**: the package installed at runtime by
  `micropip`. Its resolved version is recorded but not vendored.
- **Sample CSV**: a small CSV bundled with the spike, used as input to
  `frictionless validate`. Chosen to exercise validation without
  pulling in a fixture pipeline.
- **Run Record**: the captured PASS/FAIL outcome plus stdout, stderr,
  exit-codes, versions, and timings — the artefact that flows into
  `docs/architecture.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader opens the spike page in latest Chrome from a
  cleared cache and reaches a PASS summary in under 60 seconds without
  opening devtools.
- **SC-002**: The same reader reproduces the PASS summary in latest
  Firefox without code changes.
- **SC-003**: The recorded `docs/architecture.md` Phase 0 entry
  contains, at minimum: pinned Pyodide version, resolved Frictionless
  version, exit-code and a representative line of stdout for each of
  the two `frictionless` invocations on each browser, and a one-line
  go/no-go statement for proceeding to E1.
- **SC-004**: If the spike fails, the failing step and its captured
  stderr / exit-code are visible on the page and recorded — i.e. a
  failure is as legible as a success. (A silent timeout counts as a
  failure of the spike's design, not a graceful FAIL.)
- **SC-005**: All sharp edges encountered are present in
  `docs/limitations.md` after the spike merges, with enough detail for
  a future reader to know what to expect.

## Assumptions

- The author runs the spike on a developer-class machine with a
  reasonable broadband connection. Performance on slow networks is not
  in scope; latency budget belongs to Measurement C (item #3).
- "Latest Chrome" and "latest Firefox" are read against the
  Constitution's "latest 2 versions" browser support window at the
  time the spike is run.
- The spike is intentionally throwaway in code-quality terms: it is a
  research artefact (Constitution Principle I), not feature code, and
  is not expected to be reused verbatim in the IDE shell. Anything
  worth carrying forward gets re-implemented in E1 against the proper
  app structure.
- The spike does NOT need to integrate with the future virtual FS,
  command bridge, or terminal. Those exist in E1 (items #11, #28,
  #21–#25) and are deliberately out of scope here.
- A "small CSV" is something the author can author by hand, on the
  order of ≤ 20 rows. The exact columns are an authoring detail.
- `micropip.install('frictionless')` is expected to succeed on Pyodide
  at the pinned version; if it does not, that IS the spike's primary
  finding and the project re-plans (frictionless-js or alternative
  runtime) — re-planning is out of scope for this item.
