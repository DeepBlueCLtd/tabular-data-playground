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

## Runtime architecture (E1 + E2)

The deployed app is a single static SPA. Three computational
contexts cooperate:

```
Browser                                       │ Pyodide Web Worker
                                              │
┌──────────────────────────────────────────┐  │  ┌────────────────────────┐
│ React UI                                 │  │  │ Pyodide                │
│ ─────────                                │  │  │ ──────                 │
│ AppShell ─ ActivityBar / SidePanel       │  │  │ • IDBFS @ /workspace   │
│            EditorArea / TerminalPanel    │  │  │ • micropip install    │
│            StatusBar                     │  │  │   frictionless==5.19.0│
│                                          │  │  │ • CLI bridge          │
│ LessonView ─ CurriculumIndex / Renderer  │  │  │   (#28)                │
│              CopyRunBar / LoadFiles      │  │  │                        │
│                                          │  │  │ os.chdir('/workspace') │
│ MiniShell                                │  │  │ once at mount          │
│  tokenise → parse → execute              │  │  │                        │
│   ├── builtins (ls, cat, mkdir, …)       │◄─┼──►│                        │
│   └── frictionless * → bridge ───────────┼──┼──►│ stdin/stdout/stderr   │
│                                          │  │  │ + exit-code capture   │
│ VFS facade ──── postMessage ─────────────┼──┼──►│                        │
│   (read/write/readdir/mkdir/remove)      │  │  │                        │
│                                          │  │  └────────────────────────┘
└──────────────────────────────────────────┘  │
                                              │  Web Worker boundary —
                                              │  Pyodide CDN load happens
                                              │  here; main thread stays
                                              │  responsive.
```

### Why a Web Worker?

Measurement C (above) found that warm-call median was ~328 ms on
Firefox vs ~66 ms on Chromium. Even Chromium's 66 ms is too long
to block the main thread on every command — the "Loading
Python…" indicator and the editor's debounced auto-save would
both stutter. The Worker decision lifts cancellation (#31) to
`worker.terminate()` and unblocks the UI thread for the entire
session.

### How a Run-button click reaches Frictionless

```
1. CopyRunBar (#39) reads the bash block source.
2. Calls submit(line) from terminal-submit-store (#39).
3. Terminal writes "$ <line>\n" to xterm display.
4. Terminal calls onCommand(line, api), which is useShellRunner.
5. useShellRunner: tokenise → parse → executePipeline.
6. Builtin? Run in JS. External? Call run(args, stdin) on the
   Pyodide bridge.
7. Bridge posts the args + stdin to the Worker over postMessage.
8. Worker: chdir('/workspace'); invoke frictionless Typer app
   with the args; capture stdout/stderr/exit-code; reply.
9. Main thread: stream stdout to api.print, which xterm renders.
10. Terminal flips running=false → all Run buttons re-enable.
```

The state-machine for `running` and `lastRunSource` is centred
in `terminal-submit-store.ts` (`useSyncExternalStore`-backed
singleton). Three independent subscribable values:

- `submit: TerminalSubmit | null` — registered by terminal on mount.
- `running: boolean` — toggled around dispatch (typed OR Run).
- `lastRunSource: string | null` — set on Run-click; persists.

### Lesson loader pipeline

```
build time:
  Vite import.meta.glob('../../../content/lessons/*/meta.json',
                        eager: true) → Map<path, raw>
  Vite import.meta.glob('../../../content/lessons/*/lesson.md',
                        eager: true, query: '?raw') → Map<path, string>
  Vite import.meta.glob('../../../content/lessons/*/files/**/*',
                        eager: true, query: '?url') → Map<path, url>

  validate.ts: per-folder check + cross-folder uniqueness check.
  load.ts: emit {entries, bySlug} index, frozen.

runtime (lesson click):
  CurriculumIndex.onSelect(slug)
    → SidePanel state: selected = slug
    → LessonView({slug})
        → getLesson(slug) → bySlug.get(slug)
        → LessonRenderer(body)
            → react-markdown + remark-gfm + rehype-highlight
            → <pre> override = LessonCodeBlock with renderActions
                → copyRunActions(lang, source)
                  → bash → CopyRunBar; otherwise null
```

### Load-lesson-files data flow

```
User clicks "Load lesson files" on lesson <slug>
  → LoadLessonFilesButton checks vfs.exists() for each
    starter file's destination path under /workspace/<slug>/
  → if collisions: ConfirmModal (Principle III)
       Cancel → zero writes
       Overwrite → proceed
  → for each starter file:
       fetch(assetUrl).arrayBuffer() ──postMessage──► Worker
       vfs.mkdir(parent, recursive) ──postMessage──► Worker
       vfs.writeFile(dest, bytes)   ──postMessage──► Worker
                                     → Worker: IDBFS write + syncfs(false)
                                     → emit fs-changed
  → file tree (#15) re-renders via fs-changed (#12)
```

### Public TS surface from `app/src/lessons/`

| Export | Purpose | Owner |
|---|---|---|
| `getLessonIndex()` | All lessons, sorted | #38 |
| `getLesson(slug)` | One lesson with body | #38 |
| `getLessonFiles(slug)` | Starter files for a lesson | #41 |
| `LessonView` | Body renderer (used by SidePanel) | #38 |
| `CurriculumIndex` | List view (used by SidePanel) | #37 |
| `LessonCodeBlock` | `<pre>` override | #38 |

### Public TS surface from `app/src/terminal/`

| Export | Purpose | Owner |
|---|---|---|
| `setTerminalSubmit(fn|null)` | Internal: terminal lifecycle | #39 |
| `useTerminalSubmit()` | React hook (Run buttons) | #39 |
| `setTerminalRunning(b)` | Internal: dispatch wrapper | #40 |
| `useTerminalRunning()` | React hook (Run-button disable) | #40 |
| `setLastRunSource(s)` | Run-button click | #40 |
| `useLastRunSource()` | React hook (most-recent marker) | #40 |

## Build & deploy

- Vite 6 builds `app/` → `app/dist/`. The `app/public/` directory
  (including `sample-package/` for lesson 8) ships as-is.
- `VITE_BASE_PATH=/tabular-data-playground/playground/` for GitHub
  Pages — the IDE is served under `/playground/`, not the root.
- The published `gh-pages` tree is assembled in `deploy.yml`:
  `web/index.html` → `/` (welcome page), `web/slides/` → `/slides/`
  (the reveal.js findings deck), `app/dist/` → `/playground/`, and
  `sample-package/` is hoisted back to the root (`/sample-package/`)
  so the URL hard-coded in lesson 8 stays valid.
- `pnpm install --frozen-lockfile` in CI; the lockfile is the
  pinning contract (Principle VI).
- E2E tests (`pnpm test:e2e`) build with
  `VITE_INCLUDE_DEV_LESSONS=1` so the underscore-prefixed
  `_sample` lesson is bundled for assertion purposes; production
  build excludes it.

## Module map

```
app/src/
├── App.tsx                 # Top-level: Landing gate → AppShell
├── main.tsx
├── components/
│   ├── shell/              # AppShell, ActivityBar, SidePanel,
│   │                       #   StatusBar, TerminalPanel, …
│   └── ui/                 # ConfirmModal, ImportOverwriteModal, …
├── editor/                 # Monaco integration, tab persistence
├── file-tree/              # react-arborist + drag-drop import,
│                           #   reset-workspace, walk
├── fs/                     # VFS facade + fs-changed events
├── landing/                # First-visit gate (#36)
├── lessons/                # Curriculum (#37, #38, #39, #40, #41)
├── mini-shell/             # tokenise / parse / execute / builtins
├── pyodide/                # Worker, command bridge, loading state
├── terminal/               # xterm + line editor + submit store
└── theme/                  # Light/dark provider
```

`content/lessons/` and `app/public/sample-package/` are static
data, not code.

## Where to read further

- Per-feature designs: `specs/<NNN-slug>/spec.md` and `plan.md`.
- Sharp edges + workarounds: `docs/limitations.md`.
- Authoring conventions: `docs/lesson-authoring.md`.
- Product spec: `spec.md`.
- Constitutional principles: `.specify/memory/constitution.md`.
