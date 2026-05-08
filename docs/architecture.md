# Architecture

This document collects architectural decisions and the durable evidence
they rest on. The Phase 0 section below is the deliverable for epic E0
per `spec.md` §11.

## Phase 0 — De-risking Spikes

Each spike's deliverable is a recorded run, not just code. Records
below were captured by the verification harness at
`specs/001-spike-a-pyodide/verify/run-spikes.mjs`, which serves the
spike from a local static server and drives Chromium and Firefox via
Playwright headless. Raw run records are kept under
`specs/001-spike-a-pyodide/verify/results/`.

### Spike A — Pyodide + Frictionless install proof

**Status**: PASS in both Chromium and Firefox via headless Playwright
on 2026-05-08.

#### Chromium run

**Browser**: Chromium 141 (Playwright headless on Linux)
**Date**: 2026-05-08
**Outcome**: **PASS**
**Total elapsed**: ~8.4 s
**crossOriginIsolated**: false

**Versions**:

- Pyodide pinned URL: `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js`
- Pyodide runtime version: `0.27.7`
- Frictionless: `5.19.0`

| # | Step | Elapsed (ms) | Exit | Stdout (first line) |
|---|------|--------------|------|---------------------|
| 1 | pyodide_load | 2234 | 0 | `Pyodide 0.27.7 loaded.` |
| 2 | micropip_install_frictionless | 3092 | 0 | `frictionless installed via micropip` |
| 3 | frictionless_version | 2040 | 0 | `5.19.0` |
| 4 | frictionless_validate | 1067 | 0 | Rich-rendered "Dataset" header (validation report follows) |

#### Firefox run

**Browser**: Firefox 142 (Playwright headless on Linux)
**Date**: 2026-05-08
**Outcome**: **PASS**
**Total elapsed**: ~30.5 s
**crossOriginIsolated**: false

**Versions**: as Chromium (Pyodide 0.27.7 from the same pinned URL,
Frictionless 5.19.0).

| # | Step | Elapsed (ms) | Exit | Stdout (first line) |
|---|------|--------------|------|---------------------|
| 1 | pyodide_load | 8309 | 0 | `Pyodide 0.27.7 loaded.` |
| 2 | micropip_install_frictionless | 10412 | 0 | `frictionless installed via micropip` |
| 3 | frictionless_version | 8038 | 0 | `5.19.0` |
| 4 | frictionless_validate | 3768 | 0 | Rich-rendered "Dataset" header |

#### Go / no-go

**Go.** Frictionless installs via `micropip` and runs end-to-end inside
Pyodide on both Chromium and Firefox. The `--version` and `validate`
CLI surfaces both work via the corrected entry-point
(`frictionless.__main__:console`). Phase 1 (E1) may start.

#### Key findings (drove changes during the spike)

1. **CLI entry-point**: Research.md R4 originally proposed
   `from frictionless.console import program`. That symbol does not
   exist in Frictionless 5.19.0. The actual entry-point is the Typer
   app at `frictionless.__main__:console`, invoked as
   `console(prog_name="frictionless", standalone_mode=False, args=[...])`.
   This is now what the spike (and, by extension, the eventual command
   bridge in E1 item #28) drives.
2. **Path safety**: Frictionless 5.x's resource loader rejects
   absolute paths (`/sample.csv`) with the error
   *"path … is not safe"*. The spike works around this by writing the
   sample CSV under `/home/pyodide/sample.csv` and `os.chdir()`-ing
   into that directory before invoking the CLI with a relative
   filename. The eventual virtual FS facade (E1 item #11) and command
   bridge (item #28) will need to handle this — either by exposing a
   per-command CWD or by mapping virtual workspace paths to a tree
   Frictionless considers "safe".
3. **Firefox Pyodide cold-start is ~3.6× slower than Chromium**
   (≈30 s vs ≈8 s total elapsed in this measurement). This is
   informational; precise budgeting belongs to Measurement C
   (item #3).

### Spike B — Mini-shell pipes prototype

**Status: PENDING.** Implementation tracked under `backlog.md` item
#2.

### Measurement C — Pyodide latency budget

**Status: PENDING.** Implementation tracked under `backlog.md` item
#3. The Spike A timings above are a coarse first signal; Measurement C
will produce the proper recommendation on main-thread vs Web Worker
placement (which determines item #27 architecture and item #31
cancellation strategy).
