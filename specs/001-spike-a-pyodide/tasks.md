---

description: "Task list for Spike A — Pyodide + Frictionless install proof"
---

# Tasks: Spike A — Pyodide + Frictionless Install Proof

**Input**: Design documents from `/specs/001-spike-a-pyodide/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/run-record.md, quickstart.md

**Tests**: No automated test tasks. The spike's verification is manual
reproduction in latest Chrome and latest Firefox per spec FR-001 and
SC-001/SC-002. Vitest/Playwright arrive in E1 (items #33, #35) and are
out of scope here.

**Organization**: There is one user story (P1). Tasks are grouped to
match the per-step structure of the spike (Pyodide load → install →
version → validate → record), with the doc updates that close out E0.

## Path Conventions

- Spike source: `app/spikes/spike-a/`
- Phase 0 record: `docs/architecture.md`
- Limitations doc: `docs/limitations.md`
- All paths relative to repo root.

---

## Phase 1: Setup

**Purpose**: Lay down the directory and a single source of truth for
the pinned Pyodide version. No package manager, no build step.

- [X] T001 Create directory tree `app/spikes/spike-a/` and `docs/` (if absent) at repo root
- [X] T002 Author `app/spikes/spike-a/pyodide.config.js` exporting `PYODIDE_VERSION` and `PYODIDE_INDEX_URL` as ES-module constants (single source of truth for pinning, per research.md R1)

---

## Phase 2: Foundational

**Purpose**: Provide the static fixture and HTML shell that the
implementation phase fills in. Independent of Pyodide so they can be
authored without waiting on the runtime work.

- [X] T003 [P] Author `app/spikes/spike-a/sample.csv` per research.md R6 (5–10 rows, 3 mixed-type columns, no deliberate errors)
- [X] T004 [P] Author `app/spikes/spike-a/index.html` shell — title, Run button, status line, four-row step table, output panes (stdout + stderr per step), PASS/FAIL banner placeholder, Copy-results button, version readout area; load `main.js` as `<script type="module">` and Pyodide via classic `<script src>` per research.md R2

**Checkpoint**: Static shell renders in a browser; Run does nothing yet.

---

## Phase 3: User Story 1 — Reproduce the install proof in a fresh browser (Priority: P1) 🎯 MVP

**Goal**: A reader opens the page in latest Chrome or Firefox, clicks
Run, and reaches a PASS banner with all four steps green.

**Independent Test**: Per `quickstart.md`, open the spike via
`python3 -m http.server` in latest Chrome with cleared cache; click
Run; observe PASS banner, populated step table, non-empty stdout for
both `frictionless` calls. Repeat in latest Firefox.

### Implementation for User Story 1

- [X] T005 [US1] Implement `pyodide_load` step in `app/spikes/spike-a/main.js` — `await loadPyodide({ indexURL: PYODIDE_INDEX_URL })`, time it, render `pyodide.version` into the version readout, advance state machine per data-model.md
- [X] T006 [US1] Implement `micropip_install_frictionless` step in `app/spikes/spike-a/main.js` — `await pyodide.loadPackage('micropip')` then `await micropip.install('frictionless')`, time it, capture any warnings into the step's stderr pane
- [X] T007 [US1] Implement stdio capture helper in `app/spikes/spike-a/main.js` — wrap `sys.stdout`/`sys.stderr` with `io.StringIO()` and catch `SystemExit` per research.md R3; returns `{ stdout, stderr, exit_code, exception_summary }`
- [X] T008 [US1] Implement `frictionless_version` step in `app/spikes/spike-a/main.js` — drive the CLI entry-point with argv `["--version"]` per research.md R4, capture via T007 helper, render row 3 of step table; populate Frictionless version readout from first non-empty stdout line
- [X] T009 [US1] Implement `frictionless_validate` step in `app/spikes/spike-a/main.js` — write `sample.csv` into Pyodide FS at `/sample.csv`, drive CLI with argv `["validate", "/sample.csv"]`, capture, render row 4
- [X] T010 [US1] Implement PASS/FAIL evaluator in `app/spikes/spike-a/main.js` — applies the rules in data-model.md (all `exit_code === 0` AND non-empty stdout for both frictionless steps), renders the banner; on FAIL halt the sequence and stop subsequent steps
- [X] T011 [US1] Implement Run-button state machine in `app/spikes/spike-a/main.js` — disabled while running (ignores extra clicks per spec edge cases), re-enabled after `done` so the reader can re-time a warm run; track `total_elapsed_ms`
- [X] T012 [US1] Implement step-failure rendering in `app/spikes/spike-a/main.js` — when a step fails, surface its `stderr`/`exit_code`/`exception_summary` in the row, populate FAIL banner, leave subsequent rows blank (matches contracts/run-record.md FAIL shape)
- [X] T013 [US1] Implement Copy-results action in `app/spikes/spike-a/main.js` — emits the markdown block defined in `contracts/run-record.md`, copies via `navigator.clipboard.writeText`, includes browser detection from `navigator.userAgent`, current date, all four step rows, version readouts, total elapsed, and a Notes line (editable on-page, if practical, otherwise placeholder for hand-edit before paste)

**Checkpoint**: Spike page is functionally complete. Manual runs follow.

---

## Phase 4: Manual Verification & E0 Record

**Purpose**: Run the spike on both browsers and produce the durable
Phase 0 artefact. This is the deliverable per Constitution Principle V.

- [X] T014 [US1] Headless Chromium 141 run via Playwright harness (`specs/001-spike-a-pyodide/verify/run-spikes.mjs`) — PASS in ~8.4 s; record at `verify/results/chromium.{md,json}` (spec SC-001 met against Chromium; user to also reproduce in latest Chrome stable when convenient)
- [X] T015 [US1] Headless Firefox 142 run via Playwright harness — PASS in ~30.5 s (under 60 s); record at `verify/results/firefox.{md,json}` (spec SC-002)
- [X] T016 [US1] `docs/architecture.md` Phase 0 section finalised with both run records, pinned Pyodide URL, resolved Frictionless version (5.19.0), and per-step elapsed/exit values (spec FR-009, FR-011, SC-003)
- [X] T017 [US1] **Go/no-go: Go.** Recorded in `docs/architecture.md` (spec SC-003)
- [X] T018 [US1] `docs/limitations.md` updated with four real findings: Frictionless CLI entry-point correction, "path is not safe" workaround, Pyodide cold-start ~3.6× slower on Firefox, `crossOriginIsolated === false` confirmed (Constitution Principle VII; spec FR-010, SC-005)

**Checkpoint**: E0 evidence for Spike A is committed and readable in `docs/`.

---

## Phase 5: Polish

- [X] T019 [P] Walked `quickstart.md` end-to-end against actual files (`app/spikes/spike-a/{index.html,main.js,pyodide.config.js,sample.csv}`); paths and steps match
- [X] T020 [P] Cross-checked spec FR-001..FR-012 and SC-001..SC-005 against delivered artefact; SC-001 and SC-002 (Chrome/Firefox PASS in <60 s) cannot be confirmed in this sandbox and remain PENDING via T014/T015. All FRs structurally addressed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on T001 (directory exists) but T003 and T004 can run in parallel with T002.
- **User Story 1 (Phase 3)**: depends on Phases 1 and 2.
- **Manual Verification (Phase 4)**: depends on Phase 3 (spike must work first).
- **Polish (Phase 5)**: depends on Phase 4.

### Within User Story 1

- T005 → T006 (micropip install requires Pyodide loaded).
- T007 (stdio helper) is required by T008 and T009.
- T008 → T009 (clean version call before validate; also separates failure modes).
- T010 (PASS/FAIL) depends on all step results.
- T011 (Run state machine) wraps T005..T010.
- T012 (failure rendering) interleaves with T005..T009 and T010 — author together to keep error paths consistent.
- T013 (Copy results) depends on the populated Run Record from T005..T012.
- T014, T015 cannot start until T005..T013 are complete.
- T016, T017 depend on T014 and T015.
- T018 can be drafted alongside T014/T015 and finalised when results are in.

### Parallel Opportunities

- T003 (sample.csv) and T004 (HTML shell) — different files, both independent of Pyodide. [P]
- T019 and T020 — different files. [P]
- T014 and T015 — different browsers, same author serially in practice (one machine), but logically independent.

---

## Parallel Example: Phase 2

```text
# Authored together; same author, different files:
Task: "T003 [P] Author app/spikes/spike-a/sample.csv per research.md R6"
Task: "T004 [P] Author app/spikes/spike-a/index.html shell"
```

---

## Implementation Strategy

This is a single-story spike; the only "MVP" is the spike running
PASS in both target browsers. Sequence:

1. Phase 1 (T001–T002) — directory + pinning module.
2. Phase 2 (T003–T004 in parallel) — fixture + HTML shell.
3. Phase 3 (T005–T013) — runtime logic, in dependency order above.
4. Phase 4 (T014–T018) — manual verification and E0 record. **Stop
   here and do not proceed to Spike B until Phase 4 is complete and
   green.**
5. Phase 5 (T019–T020) — polish.

If T014 or T015 fails:

- The spike has failed in that browser. Capture the FAIL run record
  per the contract anyway — that record IS the spike's deliverable
  in the failure case.
- Update `docs/architecture.md` go/no-go to reflect re-plan signal
  (frictionless-js fallback or alternative runtime).
- Update `docs/limitations.md` with the proximate cause.
- **Stop** the epic and surface the finding to the user before
  starting Spike B (#2) or Measurement C (#3).

---

## Notes

- [P] tasks operate on different files with no shared state.
- The single user story label is `[US1]` per spec.md.
- No automated tests; verification is manual reproduction (FR-001).
- Constitution gates: Pinning (VI) closed by T002+T016; Limitations
  (VII) closed by T018; Backend (IV), Research-first (I), Phased
  Demonstrability (V) inherent to the spike's shape.
- Commit cadence in epic mode: one commit for this whole item once
  Phase 4 is green (per CLAUDE.md "commit per item, not per skill").
