# Architecture

This document collects architectural decisions and the durable evidence
they rest on. The Phase 0 section below is the deliverable for epic E0
per `spec.md` §11 (also referenced from `.specify/memory/constitution.md`
§Development Workflow).

## Phase 0 — De-risking Spikes

Each spike's deliverable is a recorded run, not just code. Records
below are pasted from the spike pages (`app/spikes/spike-*/`) using
the format defined in each spike's `contracts/run-record.md`.

### Spike A — Pyodide + Frictionless install proof

**Status: PENDING manual runs.** The page at
`app/spikes/spike-a/index.html` is implemented per
`specs/001-spike-a-pyodide/`. The author must:

1. Serve `app/spikes/spike-a/` with `python3 -m http.server 8000`.
2. Open `http://localhost:8000/` in latest **Chrome** with cleared
   cache; click **Run**; wait for PASS; click **Copy results**; paste
   the markdown block below as `#### Chrome run`.
3. Repeat in latest **Firefox**; paste as `#### Firefox run`.
4. Replace this PENDING block with a one-line **go/no-go**:
   - Chrome PASS AND Firefox PASS → `**Go.** Phase 1 may start (E1).`
   - Otherwise → `**No-go.** See <reason>; re-plan toward
     frictionless-js or alternative runtime.`

#### Chrome run

<!-- PENDING: paste the run record from app/spikes/spike-a/ here -->

#### Firefox run

<!-- PENDING: paste the run record from app/spikes/spike-a/ here -->

#### Go / no-go

<!-- PENDING: one-line statement after both runs land. -->

---

### Spike B — Mini-shell pipes prototype

**Status: PENDING.** Implementation tracked under
`specs/<NNN-spike-b-...>/` (backlog item #2).

---

### Measurement C — Pyodide latency budget

**Status: PENDING.** Implementation tracked under
`specs/<NNN-measurement-c-...>/` (backlog item #3). Recommendation on
main-thread vs Web Worker placement will be recorded here once the
measurement runs.
