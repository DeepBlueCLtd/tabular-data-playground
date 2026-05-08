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

**Status**: PASS in both Chromium and Firefox via headless Playwright
on 2026-05-08. Self-check (four assertions) passes in both browsers.

#### Chromium run

**Browser**: Chromium 141 (Playwright headless on Linux)
**Date**: 2026-05-08
**Outcome**: **PASS**

**Versions**:

- xterm.js pinned URL: `https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.js`
- xterm.js: `5.5.0`
- `@xterm/addon-fit`: `0.10.0`

| # | Name | Command | Passed | Details |
|---|------|---------|--------|---------|
| 1 | pipeline_redirect | `echo hello \| cat > out.txt` | ✓ | `out.txt = "hello\n"` (6 bytes in VFS) |
| 2 | read_back | `cat out.txt` | ✓ | stdout = `"hello\n"` |
| 3 | multistage_pipeline | `echo a \| cat \| cat` | ✓ | stdout = `"a\n"` |
| 4 | rejected_feature | `echo a && echo b` | ✓ | parser rejected with `'&&' is not supported (see docs/limitations.md)` |

#### Firefox run

**Browser**: Firefox 142 (Playwright headless on Linux)
**Date**: 2026-05-08
**Outcome**: **PASS**

Identical assertion outcomes to Chromium; identical pinned versions
(xterm 5.5.0, addon-fit 0.10.0).

#### Go / no-go

**Go.** A vanilla-JS `tokenise → parse → execute` pipeline with
`AsyncIterable<Uint8Array>` per stage and full-stage buffering
delivers the spec's pass criterion (`echo hello | cat > out.txt`
materialises `hello\n` in the virtual FS) on both target browsers.
The rejected-features list (`&&`, `||`, `;`, `$VAR`, `>>`, etc.)
is enforced at parse time with one-line messages naming the
rejected operator. E1 mini-shell items (#21–#26) may proceed.

#### Findings

1. **xterm.js does not export a runtime version constant** —
   `window.Terminal` is the only global; `Terminal.version` is not
   defined. The pin is therefore reliable only via the URL itself.
   The Versions block on the spike page records the URL; the
   resolved version inside the bundle is unobservable without
   reading `package.json` from the CDN. Documented in
   `docs/limitations.md`.
2. **No SharedArrayBuffer / no Worker required**: the buffered-pipe
   model deliberately avoids both, so this spike's success on a
   non-isolated origin (GitHub Pages) is not coincidental — it's a
   property of the chosen architecture.

### Measurement C — Pyodide latency budget

**Status**: Captured 2026-05-08 via headless Playwright on
Chromium 141 and Firefox 142 (Linux developer-class machine).

**Threshold (from `spec.md` §10 R3)**: cold call < 3000 ms AND
warm-call median < 250 ms → main-thread acceptable for v1.

#### Chromium 141 (Playwright headless)

- **Verdict**: **MAIN-THREAD-OK** — cold 995 ms < 3000 and warm
  median 66 ms < 250.
- Versions: Pyodide `0.27.7` (pinned URL as Spike A) ; Frictionless
  `5.19.0`.
- Setup (context only): pyodide_load 1979 ms, micropip_install
  3088 ms.
- Cold call: 995 ms.
- Warm calls (N = 10): median 66 ms, p95 75 ms.
  raw: 73, 67, 62, 61, 62, 65, 62, 75, 70, 66.

#### Firefox 142 (Playwright headless)

- **Verdict**: **WORKER-RECOMMENDED** — cold 3718 ms over limit
  3000; warm median 328 ms over limit 250.
- Versions: Pyodide `0.27.7` ; Frictionless `5.19.0` (identical to
  Chromium).
- Setup (context only): pyodide_load 7.4 s; micropip_install 10.6 s.
- Cold call: 3718 ms.
- Warm calls (N = 10): median 328 ms, p95 334 ms.
  raw: 325, 334, 327, 318, 329, 331, 334, 329, 326, 322.

#### Recommendation (resolves E1 items #27 and #31)

**Place Pyodide in a Web Worker for v1, on every browser.** Headless
Firefox's warm-call median (328 ms) and cold call (3718 ms) both
exceed the threshold; headless Chromium has wide headroom. Even
allowing for headed Firefox being faster than Playwright headless,
the Chromium vs Firefox gap is too large to bet on a uniformly
responsive main-thread experience.

Implications:

- **#27 Pyodide loader** — implement against `Worker` from the
  outset (not "decide later"). The loader becomes a tiny postMessage
  facade; commands and stdio go through a structured-clone protocol.
- **#31 Cancellation** — un-blocks. Ctrl+C and Cancel button are
  implementable via `worker.terminate()` followed by a fresh worker
  spawn. The "in-band cancellation if main-thread" carve-out in
  `docs/limitations.md` no longer applies; remove that line at E1.
- **Lesson 1 / E2** — the loading-state UI (#29) must remain visible
  for the cold-call window on Firefox (~3.7 s headless; expect
  ~2 s headed but still noticeable). The "Loading Python…"
  indicator should not fade out before Pyodide is genuinely ready.

#### Caveats

- These numbers come from Playwright headless on a single Linux
  developer-class machine. Headed measurements on the author's
  primary browser are authoritative for any close call near the
  threshold — re-run before tagging v1 if the gap narrows.
- The CSV used (~7 rows, 3 columns) is small; `validate` is
  dominated by Frictionless overhead, not data volume. A larger CSV
  would shift absolute numbers but is unlikely to change the
  Chromium/Firefox ordering or the verdict.

---

## Phase 0 — Overall go / no-go for E1

**Go.** All three Phase 0 items resolved with PASS or with a
recommendation that does not block E1:

- Spike A: PASS in Chromium and Firefox.
- Spike B: PASS in Chromium and Firefox.
- Measurement C: split verdict; recommendation = put Pyodide in a
  Web Worker. E1 items #27 and #31 may proceed with that
  architecture.
