# Implementation Plan: Spike B — Mini-shell Pipes Prototype

**Branch**: `claude/epic-e0-Vrtop` (epic E0; per-item branches not used) | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)

## Summary

A throwaway, build-step-free static page at `app/spikes/spike-b/` that
hosts an `xterm.js` terminal wired to a custom JS shell (tokeniser →
parser → executor) supporting `echo`, `cat`, `>` redirection, and `|`
pipes against an in-memory virtual FS. The page runs an automated
self-check at load (drives the shell programmatically and asserts
expected effects), renders PASS/FAIL, and remains live for human
reproduction. The recorded outcome flows into `docs/architecture.md`
Phase 0 / Spike B.

## Technical Context

**Language/Version**: HTML5 + vanilla JavaScript (ES modules, no
TypeScript build step).
**Primary Dependencies**: `xterm.js` from CDN (pinned). No bundler.
**Storage**: None persistent. Virtual FS is a `Map<string, Uint8Array>`
that lives only for the page session.
**Testing**: An on-page self-check (FR-007) drives the shell
programmatically and asserts expected behaviour. A Playwright
verification harness (mirroring Spike A's) drives Chromium and
Firefox headless to capture pass evidence into
`specs/002-spike-b-shell/verify/results/`. No Vitest yet.
**Target Platform**: Browsers in the Constitution's support window.
Headless verification covers Chromium and Firefox.
**Project Type**: Static research artefact, single page.
**Performance Goals**: Reach PASS in under 30 s from cleared cache
(spec SC-001). The work is xterm.js paint + shell logic; no Pyodide.
**Constraints**:
- No build step (FR-001).
- No backend, no telemetry (Constitution IV; spec FR-012).
- `xterm.js` and addons pinned and recorded (Constitution VI; spec
  FR-002, FR-009).
- Sharp edges captured in `docs/limitations.md` (Constitution VII;
  spec FR-010).
- Pipes are serialised + fully buffered per `spec.md` §6 decision #4
  (spec FR-006).
**Scale/Scope**: Single user, single tab, one transcript.

## Constitution Check

| Gate | Verdict | Notes |
|------|---------|-------|
| **I. Research-first** | PASS | De-risks the mini-shell architecture for E1 items #21–#26. |
| **II. Notes & Observations** | N/A | Not a lesson. |
| **III. Confirm-on-destruction** | N/A | No persistent user content; the virtual FS lives for the page lifetime. |
| **IV. Browser-only / no backend** | PASS | Static page; only CDN call is for pinned xterm.js. |
| **V. Phased demonstrability** | PASS | The page IS the Phase 0 demonstrable artefact for the shell question. |
| **VI. Pin and freeze** | PASS | `xterm.js` and addons pinned via a `xterm.config.js` module mirroring Spike A's pattern. |
| **VII. Document limitations** | PASS | FR-010 routes sharp edges to `docs/limitations.md`. |

No violations. No Complexity Tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-spike-b-shell/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── self-check.md         # The four self-check assertions, in stable form
├── quickstart.md
├── checklists/requirements.md
├── tasks.md
└── verify/                   # Playwright harness (mirrors Spike A's)
```

### Source Code (repository root)

```text
app/
└── spikes/
    └── spike-b/
        ├── index.html         # Terminal pane + PASS/FAIL banner + Versions block + transcript log
        ├── main.js            # ES-module: wires xterm.js, runs self-check, exposes interactive prompt
        ├── shell/             # Tiny shell library (no build step)
        │   ├── tokenise.js    # Tokeniser
        │   ├── parse.js       # Parser → pipeline AST
        │   ├── execute.js     # Executor: runs pipelines against builtins + VFS
        │   ├── builtins.js    # echo, cat (and ls/pwd if cheap)
        │   └── vfs.js         # Map-backed virtual FS
        └── xterm.config.js    # Pinned xterm.js URL + version
```

**Structure Decision**: Splitting the shell into `tokenise.js`,
`parse.js`, `execute.js`, `builtins.js`, `vfs.js` keeps each file
small enough to read in one screen and lets the self-check unit-test
the parts (e.g. tokeniser given an input → expected token list)
without a test harness. The eventual E1 mini-shell (#21–#26) can
re-use the shape but is not required to share code.

## Complexity Tracking

> No Constitution Check violations to justify.
