---

description: "Tasks for Measurement C — Pyodide latency budget"
---

# Tasks: Measurement C — Pyodide Latency Budget

## Phase 1: Setup

- [X] T001 Create `app/spikes/measurement-c/`
- [X] T002 Author `app/spikes/measurement-c/sample.csv` (same shape as Spike A)

## Phase 2: User Story 1 (P1)

- [X] T003 [US1] Author `app/spikes/measurement-c/index.html` — Run controls, N input, table of warm calls, verdict banner, Versions block, Copy-results button
- [X] T004 [US1] Author `app/spikes/measurement-c/main.js` — imports `../spike-a/pyodide.config.js`, loads Pyodide, installs frictionless, runs cold call + N warm calls of `frictionless validate sample.csv` using the same Typer-app entry-point and chdir workaround Spike A discovered, records per-call durations, computes median/p95/verdict per data-model.md, exposes `window.__MEAS_C__` for harness scraping, implements Copy-results emitting the contract markdown
- [X] T005 [US1] Author `specs/003-measurement-c-latency/verify/run-measurement.mjs` — Playwright harness mirroring Spikes A/B; serves `app/spikes/measurement-c/`, drives Chromium and Firefox, captures the measurement record, writes `verify/results/<browser>.{md,json}` and `summary.json`

## Phase 3: Recording the recommendation

- [X] T006 [US1] Run the harness; capture both browsers
- [X] T007 [US1] Append Measurement C section to `docs/architecture.md` with both records and a written recommendation explicitly addressing E1 items #27 and #31 (spec FR-009, SC-003)
- [X] T008 [US1] Update `docs/limitations.md` with sharp edges observed (Constitution VII; spec FR-008, SC-005). If the verdict is `WORKER-RECOMMENDED`, also note the implication for cancellation (#31)

## Phase 4: Polish

- [X] T009 [P] Walk `quickstart.md` against actual files
- [X] T010 [P] Cross-check spec FR-001..FR-009 / SC-001..SC-005

## Dependencies

- T001 → T002, T003, T004, T005.
- T004 imports the same pyodide.config.js as Spike A (single source of truth for the pin).
- T006 after T005. T007/T008 after T006.
