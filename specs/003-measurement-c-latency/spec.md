# Feature Specification: Measurement C — Pyodide Latency Budget

**Feature Branch**: `claude/epic-e0-Vrtop` (epic E0; per-item branches not used)
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "Measurement C — Pyodide latency budget. Time cold-start (first frictionless after page load) and warm calls. Output: recommendation in docs/architecture.md on main-thread vs Web Worker placement. Threshold: warm-call median <250 ms and cold start <3 s → main-thread acceptable for v1. Decides #32 (cancellation) and architecture of #27."

**Source**: `spec.md` §10 R3, §11 Phase 0; `backlog.md` item #3.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Capture latency numbers and produce a recommendation (Priority: P1)

The author opens the measurement page. The page loads Pyodide
(pinned), installs `frictionless`, then runs a small fixed sequence
of `frictionless` calls — first one (the "cold call") is timed from
"before invocation" to "after first byte of stdout AND clean exit";
subsequent calls (the "warm calls") are timed in the same way. The
page renders the cold-call duration, every warm-call duration, the
warm-call median and p95, the count of warm calls, and a verdict
against the spec's threshold. The recorded numbers from Chrome and
Firefox flow into `docs/architecture.md` and a written recommendation
states whether v1 may run Pyodide on the main thread.

**Why this priority**: This is the only user story. The
recommendation it produces decides the architecture of the
production Pyodide loader (E1 item #27) and the cancellation
strategy (E1 item #31).

**Independent Test**: Open the page in a fresh browser; click Run;
read the cold-call and warm-call medians; check them against the
threshold (cold < 3 s; warm-call median < 250 ms).

**Acceptance Scenarios**:

1. **Given** a fresh browser tab on a developer-class machine,
   **When** the user clicks Run, **Then** the page completes the
   measurement sequence and renders cold-call duration plus a list
   of warm-call durations.
2. **Given** the measurement completed, **When** the page renders
   the verdict, **Then** the verdict is one of `MAIN-THREAD-OK`,
   `WORKER-RECOMMENDED`, or `INCONCLUSIVE` based on the threshold:
   - cold < 3000 ms AND warm-call median < 250 ms → `MAIN-THREAD-OK`
   - cold ≥ 3000 ms OR warm-call median ≥ 250 ms → `WORKER-RECOMMENDED`
   - any timing missing or any call errored → `INCONCLUSIVE`
3. **Given** the user clicks "Copy results", **When** the clipboard
   reads back, **Then** the contents are the markdown block defined
   in `contracts/measurement-record.md` with all numbers populated.

### Edge Cases

- A run errors mid-way (network blip on micropip, frictionless
  raises) — the page surfaces the error, marks the verdict
  `INCONCLUSIVE`, and reports which call failed at which iteration.
- Warm-call sample is too small (fewer than 5 calls completed)
  — render the available numbers but mark the verdict
  `INCONCLUSIVE` and explain why.
- The same browser is far slower on its first run after a clean
  cache than on subsequent runs — that's the entire point of the
  cold-call measurement; we do not retry.
- Browser-specific anomalies (long Pyodide cold-start on Firefox,
  observed in Spike A) are surfaced in the recommendation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST be a single static page (no backend, no
  build step) loadable from `python3 -m http.server` at
  `app/spikes/measurement-c/`.
- **FR-002**: The page MUST load Pyodide from the SAME pinned URL
  used in Spike A (single source of truth) and install
  `frictionless` via `micropip`. Both versions are recorded on the
  page and in `docs/architecture.md` (Constitution Principle VI).
- **FR-003**: The "cold call" is the first invocation of
  `frictionless` after page load. It MUST be `frictionless validate
  sample.csv` so the cold call exercises real work, not a trivial
  `--version` shortcut. Timing is wall-clock from the moment before
  the Python invocation to the moment after capture finishes (clean
  exit + non-empty stdout).
- **FR-004**: After the cold call, the page MUST run a warm-call
  sequence of N invocations (default N = 10, configurable on the
  page) of the SAME `frictionless validate sample.csv` against the
  same already-loaded runtime. Each warm call's duration is
  measured the same way as the cold call.
- **FR-005**: The page MUST render: the cold-call duration in ms;
  the list of warm-call durations; the warm-call **median** and
  **p95**; the count of completed warm calls; the verdict computed
  per the threshold rule above.
- **FR-006**: The page MUST surface a Copy-results button that
  emits a markdown block per
  `contracts/measurement-record.md` for paste into
  `docs/architecture.md`.
- **FR-007**: The page MUST NOT make network calls beyond the
  pinned Pyodide CDN and the wheels micropip resolves (no
  telemetry, Constitution IV).
- **FR-008**: Sharp edges encountered during measurement (e.g.
  garbage-collector pauses skewing one warm sample, micropip warm
  cache effects, Firefox JIT warmup) MUST be added to
  `docs/limitations.md` in the same change (Constitution VII).
- **FR-009**: The recorded numbers from Chrome and Firefox AND the
  written go/no-go recommendation MUST land in
  `docs/architecture.md` Phase 0 / Measurement C section. The
  recommendation MUST explicitly resolve E1 item #27's
  main-thread-vs-Worker decision and item #31's cancellation
  posture (the spec threshold from `spec.md` §10 R3 governs the
  verdict).

### Key Entities

- **Measurement Record**: the captured outcome — pinned versions,
  cold-call duration, warm-call durations, derived statistics,
  verdict, browser identification.
- **Verdict**: `MAIN-THREAD-OK | WORKER-RECOMMENDED | INCONCLUSIVE`,
  computed from the numbers per the threshold in spec.md §10 R3.
- **Sample CSV**: the same shape used in Spike A
  (`/home/pyodide/sample.csv`, ~7 rows, 3 mixed-type columns).
  Reused so the measurement is comparable to the spike.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader opens the page in latest Chrome and reaches
  a populated verdict in under 90 s on a developer-class machine.
- **SC-002**: The same reader reproduces the measurement in latest
  Firefox.
- **SC-003**: `docs/architecture.md` Phase 0 / Measurement C
  contains: pinned versions, cold-call ms, warm-call durations
  (or at least median/p95/count), verdict, and a one-paragraph
  recommendation explicitly addressing E1 items #27 and #31.
- **SC-004**: An INCONCLUSIVE verdict is as legible as a definitive
  one — the page names which call failed or which sample was
  missing.
- **SC-005**: All sharp edges encountered are present in
  `docs/limitations.md` after the spike merges.

## Assumptions

- The author runs the measurement on a developer-class machine.
  Slow-network and slow-CPU behaviour is out of scope; the verdict
  speaks to the typical end-user environment.
- The threshold values (`cold < 3 s`, `warm median < 250 ms`) come
  from `spec.md` §10 R3 and are not amendable in this measurement.
- "Warm" is defined relative to the same in-process Pyodide runtime
  on the same page — not relative to browser cache. The first
  invocation after a hot reload is still a "cold call".
- Headless Playwright timings are informative but headed Chrome /
  Firefox on the author's actual machine remain authoritative for
  the v1 decision. The recommendation should call this out.
- N = 10 warm calls is the default; the page exposes a control to
  set N higher if the author wants tighter intervals. Smaller N
  is allowed in the verdict logic with an `INCONCLUSIVE` floor at
  fewer than 5 completed warm calls.
