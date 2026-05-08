# Implementation Plan: Spike A — Pyodide + Frictionless Install Proof

**Branch**: `claude/epic-e0-Vrtop` (epic E0; per-item branches not used) | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-spike-a-pyodide/spec.md`

## Summary

A throwaway, build-step-free static page that loads a pinned Pyodide
build from a CDN, installs `frictionless` via `micropip`, runs
`frictionless --version` and `frictionless validate <small CSV>`, and
renders captured stdout / stderr / exit-code on the page along with a
PASS/FAIL summary. The recorded outcome (versions, exit codes,
representative output, sharp edges encountered) is the deliverable —
not the page itself. Implementation lives at `app/spikes/spike-a/` and
is independent of the future Vite/React app.

## Technical Context

**Language/Version**: HTML5 + vanilla JavaScript (ES modules, no
TypeScript build step). Python is invoked indirectly via Pyodide
(version pinned, see research.md).
**Primary Dependencies**: Pyodide (CDN, pinned), `frictionless`
(installed at runtime via `micropip`).
**Storage**: None. The page is stateless across reloads. No
IndexedDB / localStorage usage in this spike.
**Testing**: Manual reproduction in latest Chrome and latest Firefox per
spec.md FR-001 / SC-001 / SC-002. No automated test harness — this is a
research spike (Constitution Principle I).
**Target Platform**: Browsers in the Constitution's support window
(latest 2 versions of Chrome, Firefox, Safari, Edge). Spike is verified
on Chrome and Firefox per spec FR-001 and the backlog row's pass
criterion.
**Project Type**: Static research artefact, single page. Not part of
the Vite/React app.
**Performance Goals**: Reach PASS in under 60 s from cleared cache on a
developer-class machine and broadband connection (spec SC-001). Detailed
latency characterisation is Measurement C (item #3), not this spike.
**Constraints**:
- Must run with no build step (spec FR-012). Open via `file://` or
  `python -m http.server`.
- Browser-only, no backend, no telemetry (Constitution IV; spec FR-008).
- Pyodide and Frictionless versions pinned and recorded
  (Constitution VI; spec FR-002, FR-003, FR-011).
- Sharp edges captured in `docs/limitations.md` in the same change
  (Constitution VII; spec FR-010).
**Scale/Scope**: Single user (the author or a reader reproducing the
record), single page, single sample CSV ≤ a few KB.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Verdict | Notes |
|------|---------|-------|
| **I. Research-first** | PASS | The spike's only purpose is to de-risk Frictionless evaluation in the browser (spec.md §10 R1). |
| **II. Notes & Observations** | N/A | This is a spike, not a lesson. Lesson Notes sections apply to E2 lesson features. |
| **III. Confirm-on-destruction** | N/A | No flow overwrites or deletes user content; the page has no persistent storage. |
| **IV. Browser-only / no backend** | PASS | Static page. Network access limited to pinned Pyodide CDN assets and the wheels `micropip` resolves for `frictionless` (spec FR-008). |
| **V. Phased demonstrability** | PASS | Spike is itself a Phase 0 demonstrable artefact: a static page a reader can open and reproduce. The recorded results in `docs/architecture.md` are the durable Phase 0 output even if E1 stalls. |
| **VI. Pin and freeze** | PASS | Pyodide is loaded from a pinned CDN URL (FR-002). Resolved Frictionless version captured and recorded (FR-003, FR-011). |
| **VII. Document limitations** | PASS | FR-010 requires `docs/limitations.md` update in the same change for any sharp edges encountered. |

**No violations. Complexity Tracking not required.**

**Per-feature gates (from constitution §Development Workflow)**:

1. *Research-first*: PASS — directly serves Frictionless evaluation.
2. *Notes-section*: N/A — not a lesson.
3. *Destruction*: N/A — no destructive flow.
4. *Backend*: PASS — static-only.
5. *Pinning*: PASS — pinned Pyodide URL; resolved Frictionless version
   recorded; new infrastructural dependencies (Pyodide,
   `frictionless`) are already named in the constitution's Technology
   Constraints.
6. *Limitations*: PASS — limitations doc update required in same
   change (FR-010).

## Project Structure

### Documentation (this feature)

```text
specs/001-spike-a-pyodide/
├── plan.md                  # This file
├── research.md              # Phase 0 output
├── data-model.md            # Phase 1 output (lightweight; spike has no real data model)
├── quickstart.md            # Phase 1 output — how to run the spike and capture results
├── contracts/
│   └── run-record.md        # Phase 1 output — schema of the recorded outcome
└── checklists/
    └── requirements.md      # From /speckit-specify
```

### Source Code (repository root)

```text
app/
└── spikes/
    └── spike-a/
        ├── index.html       # Single-page UI: Run button, status, output panes, PASS/FAIL banner
        ├── main.js          # ES-module: orchestrates Pyodide load, micropip install, frictionless calls, capture, render
        ├── pyodide.config.js # Tiny module exporting pinned Pyodide CDN URL + version string (single source of truth)
        └── sample.csv       # Small CSV used as input to `frictionless validate`

docs/
├── architecture.md          # NEW (or extended) — Phase 0 record: pinned versions, Chrome + Firefox results, go/no-go
└── limitations.md           # NEW (or extended) — sharp edges encountered (Constitution VII)
```

**Structure Decision**: Single directory under `app/spikes/spike-a/` so the spike is locatable, self-contained, and easy to delete after E0. Files are flat (no subfolders inside the spike) because the spike is intentionally tiny — three runtime files plus a fixture CSV. The spike is **not** wired into Vite/pnpm — Vite arrives in E1 (item #4) and the spike pre-dates it (Constitution Principle V — the previous phase must stand on its own).

The `app/` directory is created by this feature; it will later host the Vite project root (E1, item #4). Co-locating spikes under `app/spikes/` keeps the eventual app root tidy and signals that spikes are not production app code.

## Complexity Tracking

> No Constitution Check violations to justify.

---

## Phase 0 — Research Outline

Research is captured in [research.md](research.md). Topics:

1. **Pyodide version to pin** — what's current, stable, and known to
   accept `micropip.install('frictionless')` cleanly.
2. **Pyodide loading approach** — `<script type="module">` import vs
   classic `<script src="...pyodide.js">` global; pick the one with
   the simplest no-build path.
3. **stdin/stdout/stderr capture** — how to redirect Python's stdio
   inside Pyodide so the page can render captured streams without
   devtools (relevant to spec FR-005).
4. **Frictionless CLI vs library entry-point** — does
   `frictionless --version` route through `argparse` cleanly under
   Pyodide, or is it cleaner to call the library functions directly?
   The spike must answer this regardless because the eventual command
   bridge (E1 item #28) needs to know.
5. **SharedArrayBuffer / cross-origin isolation** — confirm whether
   Pyodide requires it for the operations this spike performs. If yes,
   record the implication for GitHub Pages hosting (which does not
   serve COOP/COEP headers); this is exactly the kind of sharp edge
   Constitution VII requires us to record.
6. **Sample CSV shape** — what makes a "non-trivial" report from
   `frictionless validate` without manufacturing a fake error?

## Phase 1 — Design Outputs

Generated alongside this plan:

- `research.md` — answers to the topics above (Decision / Rationale /
  Alternatives).
- `data-model.md` — minimal: the **Run Record** entity from spec.md and
  what fields it carries. There is no persistent data model.
- `contracts/run-record.md` — the format of the captured artefact that
  will be pasted into `docs/architecture.md`. This is the spike's
  "interface" — what flows out of it into the Phase 0 record.
- `quickstart.md` — how to open the spike, click Run, and copy the
  result into `docs/architecture.md`.
- Agent context (`CLAUDE.md`) — the "Active Plan" pointer (between
  `<!-- SPECKIT START -->` and `<!-- SPECKIT END -->` markers) is set
  to this plan file for the duration of the per-item cycle. (No
  markers exist yet in `CLAUDE.md`; if absent, this is a no-op for
  this item.)

## Re-evaluation of Constitution Check (post-design)

Re-checked after writing research.md, data-model.md,
contracts/run-record.md, and quickstart.md: all gates still pass.
No new dependencies introduced beyond Pyodide (already named in
Technology Constraints) and `frictionless` (the subject of evaluation,
already named in spec.md). Pinning approach (a single
`pyodide.config.js` exporting the pinned URL) is the simplest design
that satisfies Constitution VI for a build-step-free spike.
