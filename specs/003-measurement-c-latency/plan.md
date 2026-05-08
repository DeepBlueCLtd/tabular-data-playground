# Implementation Plan: Measurement C — Pyodide Latency Budget

**Branch**: `claude/epic-e0-Vrtop` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)

## Summary

Static, build-step-free page at `app/spikes/measurement-c/` that
loads the same pinned Pyodide as Spike A, installs `frictionless`,
runs one cold `frictionless validate sample.csv` call and N warm
ones, and renders cold/warm/median/p95/verdict on the page. The
verdict is computed from `spec.md` §10 R3's threshold
(cold < 3000 ms AND warm-call median < 250 ms → MAIN-THREAD-OK).

## Technical Context

**Language**: HTML5 + vanilla JS ES modules.
**Primary Dependencies**: same pinned Pyodide as Spike A; reuse
Spike A's `pyodide.config.js` directly via a relative import
(`../spike-a/pyodide.config.js`).
**Storage**: none.
**Testing**: Playwright headless harness mirroring Spikes A and B
captures Chromium and Firefox numbers into
`specs/003-measurement-c-latency/verify/results/`.
**Performance Goals**: page-side overhead negligible; the numbers
the measurement reports MUST reflect Pyodide work, not page work.
**Constraints**: no build step (FR-001), no network beyond pinned
Pyodide + micropip (FR-007).

## Constitution Check

| Gate | Verdict | Notes |
|------|---------|-------|
| Research-first | PASS | The measurement directly drives the v1 architecture decision (#27) and cancellation posture (#31). |
| Notes & Observations | N/A | Not a lesson. |
| Confirm-on-destruction | N/A | No destructive flow. |
| Backend / no telemetry | PASS | Static page; CDN for pinned Pyodide and micropip wheels only. |
| Phased demonstrability | PASS | The recorded numbers + recommendation are the Phase 0 deliverable. |
| Pin and freeze | PASS | Re-uses Spike A's pinned `pyodide.config.js`; resolved Frictionless version recorded. |
| Document limitations | PASS | FR-008 routes sharp edges to `docs/limitations.md`. |

No violations.

## Project Structure

```text
specs/003-measurement-c-latency/
├── plan.md, spec.md, research.md, data-model.md, quickstart.md
├── contracts/measurement-record.md
├── checklists/requirements.md
├── tasks.md
└── verify/                # Playwright harness

app/spikes/measurement-c/
├── index.html             # Run controls, table of warm calls, verdict, Copy-results
├── main.js                # Pyodide + micropip + cold/warm sequencing + capture + verdict
└── sample.csv             # Reuse the same shape as Spike A (kept local for self-containment)
```

`pyodide.config.js` is imported from `../spike-a/pyodide.config.js`
to keep one source of truth for the Pyodide pin across both spikes
that touch Pyodide.

## Complexity Tracking

> No violations.
