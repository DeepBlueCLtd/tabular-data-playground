# Implementation Plan: JupyterLite Demo Page

**Branch**: `claude/speckit-issue-21-hjjn3n` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/049-jupyterlite-demo/spec.md`

## Summary

Publish a self-contained JupyterLite site to `/jupyterlite/` on the existing
GitHub Pages tree. It ships one example notebook that loads a light, generic
sample CSV and renders a matplotlib figure inline — all in the browser, no
server, no accounts. The build (`jupyter lite build`) runs as an **additive**
step in the existing deploy and PR-preview workflows and copies its output
into the assembled `_site/jupyterlite/`, leaving the frozen playground's
build (`/playground/`) and pins entirely untouched. The demo carries its own
Python pins in a dedicated `jupyterlite/` source directory. Because
JupyterLite is a **new infrastructural dependency**, this feature carries a
required **constitution amendment** (Technology Constraints) and updates to
`README.md` pins and `docs/limitations.md` — all landed in the same change as
the implementation.

## Technical Context

**Language/Version**: Python 3.11+ (build-time only, for `jupyter lite build`); notebooks run against the JupyterLite Pyodide kernel's bundled Python in-browser. No change to the app's TypeScript/React stack.
**Primary Dependencies**: `jupyterlite-core` (pinned), `jupyterlite-pyodide-kernel` (pinned); matplotlib provided in-browser by the Pyodide kernel / `piplite`. Build orchestrated by `jupyter lite build`.
**Storage**: None. Static files only. Notebooks and sample data are shipped read-only; visitor edits live in the browser (JupyterLite's own IndexedDB), never persisted server-side.
**Testing**: Manual cold-load verification in Chrome + Firefox (run-all-cells → figure renders). Optional Playwright Chromium smoke against the built `/jupyterlite/` page (open notebook, run, assert an `<img>`/canvas figure appears). CI must confirm the build produces a non-empty `_output/`.
**Target Platform**: Static GitHub Pages (`gh-pages` branch); WASM/Pyodide in current Chrome & Firefox.
**Project Type**: Additive static sub-site alongside an existing single-page app; independent build pipeline.
**Performance Goals**: Not a hot path. Set expectations for cold-load: first uncached visit fetches Pyodide + matplotlib wheels from CDN (tens of MB); subsequent loads are browser-cached. No hard latency budget beyond "loads and runs on a cold visit."
**Constraints**: Online-only by design (runtime CDN fetch; no offline/air-gapped path). Must not modify, rebuild, or share the frozen `/playground/` runtime or pins. Generic/shareable sample data only.
**Scale/Scope**: One JupyterLite site, one (optionally two) example notebook(s), one small sample CSV. Single visitor per browser session; no shared state (Constitution Principle IV).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Per-feature gates (constitution "Development Workflow & Quality Gates"):

1. **Research-first** — PASS. The demo evaluates a complementary slice of the
   in-browser Python/plotting story (Pyodide + matplotlib via JupyterLite) and
   is a legitimate research surface, not product scope creep. It is explicitly
   additive and disposable relative to the frozen playground.
2. **Notes-section** — N/A. This is not a curriculum lesson template, so the
   Notes & Observations requirement does not apply. (Observations about
   JupyterLite/matplotlib-under-Pyodide still land in `docs/limitations.md`.)
3. **Destruction** — PASS. No flow overwrites or deletes user content. Visitor
   edits are sandboxed in JupyterLite's own browser storage; nothing touches
   the playground's `/workspace` or IndexedDB. No modal confirmation needed.
4. **Backend** — PASS. No backend, account, or telemetry. All execution is
   in-browser; the only network use is fetching pinned static assets and
   CDN-hosted Pyodide/wheels, which Principle IV expressly permits.
5. **Pinning** — CONDITIONAL. The feature introduces new external
   dependencies (`jupyterlite-core`, `jupyterlite-pyodide-kernel`, the
   in-browser matplotlib/Pyodide the kernel pulls). They MUST land pinned and
   recorded in `README.md`. **Additionally**, the constitution's Technology
   Constraints class this as *adding a new infrastructural dependency*, which
   "IS an amendment." → tracked in Complexity Tracking; a constitution
   amendment (Technology Constraints + Sync Impact Report + version bump) is
   part of the implementation change.
6. **Limitations** — CONDITIONAL. The demo introduces new sharp edges
   (online-only, no air-gapped path; cold-load wheel weight; separate pin set
   from the frozen playground). `docs/limitations.md` MUST be updated in the
   same change. Satisfied by FR-010 and a planned limitations entry.

**Gate verdict**: No hard violation. Two conditional gates (Pinning as an
amendment, Limitations) are honoured by scoping the constitution amendment,
README pins, and limitations entry into the implementation. See Complexity
Tracking.

Post-Phase-1 re-check: design keeps the demo in its own `jupyterlite/` source
tree with its own pins and an additive workflow step; the frozen playground's
build and pins are unchanged. Gates still hold.

## Project Structure

### Documentation (this feature)

```text
specs/049-jupyterlite-demo/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (URL surface + build-command contract)
│   ├── site-surface.md
│   └── build-command.md
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # /speckit-tasks output (NOT created here)
```

### Source Code (repository root)

```text
jupyterlite/                     # NEW — self-contained demo source, own pins
├── requirements.txt             # Pinned: jupyterlite-core, jupyterlite-pyodide-kernel
├── jupyter_lite_config.json     # Build config (output dir, base URL /jupyterlite/)
├── jupyter-lite.json            # Runtime config (kernel, disabled features)
├── README.md                    # One documented build command (FR-006)
└── content/                     # Shipped into the JupyterLite site
    ├── demo.ipynb               # Example notebook: load CSV → matplotlib figure
    └── data/
        └── sample.csv           # Generic, light sample tabular dataset

web/
└── index.html                  # EDIT — add visible link to /jupyterlite/ (FR-004)

.github/workflows/
├── deploy.yml                  # EDIT — additive: build JupyterLite, copy to _site/jupyterlite/
└── pr-preview.yml              # EDIT — same additive step for PR previews

README.md                       # EDIT — record JupyterLite/kernel/matplotlib pins
docs/limitations.md             # EDIT — online-only + cold-load + separate-pins entry
.specify/memory/constitution.md # EDIT — Technology Constraints amendment (+ Sync Impact, version bump)
```

**Structure Decision**: A new top-level `jupyterlite/` directory holds the
demo's source with its **own** `requirements.txt` pins, fully isolated from
`app/` (the frozen playground). The two published surfaces — `/playground/`
(Vite/pnpm) and `/jupyterlite/` (`jupyter lite build`) — are built by
independent toolchains and only meet in the workflows' "assemble `_site`"
step, where the JupyterLite `_output/` is copied to `_site/jupyterlite/`
after the existing IDE copy. This mirrors how `/slides/` and `/playground/`
already coexist and preserves `keep_files: true` / PR-preview behaviour.

## Complexity Tracking

> Filled because Constitution Check surfaced an amendment-class dependency.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| New infrastructural dependency (`jupyterlite-core` + `jupyterlite-pyodide-kernel` + a Python build step in CI) — per Technology Constraints this "IS an amendment" | The issue's headline value is an in-browser JupyterLite notebook rendering matplotlib; JupyterLite is the named vehicle and cannot be delivered with the existing Vite/pnpm stack alone | Reusing the frozen playground's Pyodide worker to fake a notebook UI would (a) modify the frozen runtime (forbidden by the issue and Principle VI) and (b) not be a real JupyterLite/notebook surface the issue asks for |
| Second pin set (demo pins independent of the frozen playground's Pyodide `0.27.7`) | The demo must not share or shift the frozen contract; its Pyodide comes from the pinned kernel, decoupled on purpose | A single shared pin set would couple the demo to the freeze and risk the "must not modify the frozen playground" constraint |

**Amendment obligation**: implementation MUST include a constitution
amendment adding a "JupyterLite demo" entry under Technology Constraints
(with Sync Impact Report + MINOR version bump), the README pin rows, and the
`docs/limitations.md` entry — all in the same PR as the code, per the
constitution's own rule and gates 5–6.
