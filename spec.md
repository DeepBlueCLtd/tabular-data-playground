# Frictionless Data Explorer — Software Specification

**Version:** 0.5 (consistency pass; decisions log restored, body brought into line)
**Status:** Pre-build — ready for de-risking spike
**Licence:** MIT

-----

## 1. Purpose & goals

### What this project actually is

This is a **research artefact** for evaluating the Frictionless Data ecosystem. The author is consciously assessing several data-validation options (“legs”) of which Frictionless is one. The artefact is the Frictionless leg of that assessment.

The author’s working hypothesis is that **Frictionless will fit**. The purpose of the build is therefore *confirmatory with adversarial probes*: working through the ecosystem systematically to verify that hypothesis, while deliberately seeking out the weak spots, sharp edges, and friction points that any honest evaluation must surface. The strategy is **build-it-to-learn-it** — forcing the construction of a working IDE and an eight-lesson curriculum around Frictionless is itself the research method.

### What it’s not

- It is not a teaching product for a wide community. The “mixed audience” framing is a discipline aid — writing as if a beginner and a developer might both read it forces clarity — but the actual readers are the author and a small number of colleagues.
- It is not a product that needs to grow. Once the evaluation completes, the artefact freezes as a public, dated reference: *“this is what we found in 2026”*. No long-term maintenance is planned.
- It is not yet a fitness assessment for the maritime acoustics domain. v1 builds the foundation using stub CSVs and deliberately defers the domain-fitness question — does Frictionless gracefully handle dB reference levels, per-row spectra arrays, hierarchical campaign/run/pass structures, and controlled vocabularies aligned to ISO standards. That question is owned by v1.1 and is the most important remaining one.

### Domain framing

Lesson examples will eventually centre on radiated noise levels of maritime shipping plus sonar performance characteristics. The data is non-sensitive and the project is fully open. v1 uses minimal stub CSVs that demonstrate Frictionless mechanics; synthetic-but-realistic domain data is the v1.1 step that converts the foundation into a fitness assessment.

### Expected outcome and the artefact’s job

The author expects Frictionless to work. The artefact’s job is therefore to:

1. **Verify** that the core ecosystem (describe, schema, validate, package, transform, dialect, inquiry, publish) does what the author expects it to do.
1. **Identify weak spots** — places where Frictionless creaks, requires workarounds, or simply doesn’t address a need that maritime acoustic data will eventually present.
1. **Capture both faithfully** — each lesson template includes a **Notes & Observations** section so that “this worked smoothly”, “this needed a workaround”, and “this was unexpectedly fiddly” findings are recorded at the moment of contact, not reconstructed later.

A confirmation with well-articulated caveats is the most likely and most useful outcome. The Notes sections aggregated across lessons become the evidence base for the v1.1 fitness assessment and any eventual write-up.

-----

## 2. User experience shape

The UI is a single-page web app, presenting an IDE-like layout (VS Code style):

- **Left rail (collapsible):** Activity bar selecting between
  - **Lesson panel** — the current lesson rendered as markdown (default view: curriculum index)
  - **File tree** — virtual filesystem rooted at `/workspace`, organised as one folder per lesson (`/workspace/01-describe/`, `/workspace/02-schema/`, etc.). Right-click menu: New file, New folder, Rename, Delete. Drag-and-drop file *and folder* import (folders imported recursively); 10 MB hard cap per file with clear error.
- **Centre:** Tabbed editor area (Monaco) supporting drag-to-split horizontal panes — open as many files as wanted; JSON, YAML, CSV, Markdown, Python all syntax-highlighted; JSON Schema validation enabled by case-insensitive filename match (`datapackage.json`, `dialect.json`, `schema.json`/`*.schema.json`); debounced auto-save ~500 ms after last keystroke; tabs persist across reload.
- **Status bar** (between editor and bottom panel): file path of focused tab, cursor position, encoding, active JSON Schema (if any), save state.
- **Bottom panel:** Terminal (xterm.js) — single panel, no separate Output view. `frictionless` already produces well-formatted, colour-coded output; no benefit in re-rendering it elsewhere.

A first-time visitor lands on a brief landing page (“What is this? Who’s it for?”) and clicks Start to enter the IDE; a localStorage flag suppresses the landing page on return visits, with a “What is this?” link in the IDE chrome to revisit it.

Lessons are **static markdown**. No completion detection, no checkpointing, no auto-progression, no progress tracking — lessons are stateless. Navigation is free: any lesson, any time. Bash code blocks have **Copy** and **Run** buttons; Run types the command into the terminal and submits it. Lessons begin with a `cd <lesson-folder>` step and use short paths thereafter; pwd persists in the terminal session.

A **“Load lesson files”** action populates the lesson’s folder with starter files. If the folder already contains user-edited files, a modal confirms overwrite (“Folder 02-schema exists. Overwrite all files? Your edits will be lost.”). Drag-drop of user files also confirms on filename collision — confirm-on-destruction is consistent throughout the app.

**No in-IDE note-taking.** IndexedDB persistence is for lesson-state continuity, not as a notebook. Persistent observations belong in durable, project-external places (docs, wiki, issue tracker). The author’s build-time observations live in each lesson’s **Notes & Observations** template section in the source repo, not in user-facing storage.

Persistence: per-browser via IndexedDB (Pyodide IDBFS bridged with the editor’s filesystem). Theme choice persisted in localStorage. No accounts, no sharing, no backend.

-----

## 3. Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Browser (single tab)                        │
│                                                                    │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────┐   │
│  │ React UI     │  │  Virtual FS    │  │  Pyodide              │   │
│  │ + Monaco     │◄─┤  (in-memory +  │◄─┤  (frictionless-py     │   │
│  │ + xterm.js   │  │   IndexedDB)   │  │   loaded via          │   │
│  │              │  │                │  │   micropip)           │   │
│  └──────┬───────┘  └────────────────┘  └───────────┬───────────┘   │
│         │                                          │               │
│         │              Mini-shell (JS)             │               │
│         └─────────────►  parser, builtins,    ◄────┘               │
│                          pipes, redirection                        │
└────────────────────────────────────────────────────────────────────┘
                              ▲
                              │  static assets only
                       ┌──────┴──────┐
                       │ GitHub Pages│
                       └─────────────┘
```

### Core components

|Component             |Responsibility                                                                                                                                                         |Implementation                                                                          |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
|**App shell**         |Layout, panel resize/collapse, theme broadcast, single-page state for current lesson                                                                                   |React + TypeScript (no router — single SPA URL)                                         |
|**Landing page**      |First-visit “What is this?” gate; suppressed on return via localStorage flag; reachable from IDE chrome thereafter                                                     |React component                                                                         |
|**Editor**            |Tabbed file editing with syntax highlight + JSON-Schema-aware validation; drag-to-split horizontal panes; debounced auto-save                                          |`monaco-editor` + `@monaco-editor/react`, dock-layout via `react-mosaic` (or `dockview`)|
|**Status bar**        |File path of focused tab, cursor position, encoding, active JSON Schema, save state                                                                                    |React component                                                                         |
|**File tree**         |Display & navigate the virtual workspace; right-click menu (New file/folder, Rename, Delete); subscribes to `fs-changed` events                                        |`react-arborist` (or similar)                                                           |
|**Drag-drop importer**|Recursively walks `DataTransferItemList` to import files and folders into the workspace; 10 MB per-file cap; modal-confirms on filename collision                      |Custom React + HTML5 drag-drop                                                          |
|**Virtual FS**        |Single source of truth for files; bridged to Pyodide and Monaco; emits `fs-changed` events on every write/delete/rename                                                |Custom thin layer over Pyodide’s IDBFS                                                  |
|**Terminal UI**       |Render the shell session; up/down arrow command history within session; disabled while Pyodide loads                                                                   |`xterm.js` + `xterm-addon-fit` + `xterm-addon-web-links`                                |
|**Mini-shell**        |Tokenise commands, dispatch to Pyodide or JS builtins, wire pipes/redirection                                                                                          |Custom JS — see §6                                                                      |
|**Pyodide runtime**   |Execute `frictionless` and `python` commands; placement (main thread vs Web Worker) determined by Phase 0 measurement C                                                |`pyodide` loaded from CDN, `frictionless` installed via `micropip` after page paints    |
|**Lesson loader**     |Read markdown lessons from `/content/lessons/`, render via react-markdown, inject Copy/Run buttons on bash code blocks, populate per-lesson workspace folders on demand|Static fetch of bundled lesson assets                                                   |
|**Theme provider**    |Broadcast light/dark choice to Tailwind, Monaco, and xterm; persisted in localStorage                                                                                  |React context                                                                           |

### Why this shape

- **Single-tab, no backend** is a hard constraint of GitHub Pages hosting. All compute happens in the browser.
- **Pyodide rather than frictionless-js** because frictionless-py is the reference, fully-featured implementation and matches the official docs the user will read alongside; frictionless-js is older and less feature-complete.
- **Monaco rather than CodeMirror** chiefly for its first-class JSON Schema support — it gives free in-editor validation for `datapackage.json` and Table Schema files, which is genuinely educational.
- **Custom mini-shell rather than a wasm bash** because compositing pipes between Pyodide-run commands and JS-side builtins is cleaner if we own the parser; it also keeps the bundle small.
- **Tailwind + shadcn/ui** for speed of UI iteration: shadcn ships unstyled-but-accessible Radix primitives that we own in-repo, paired with Tailwind utilities. No heavy component library, no opinionated design system to fight.
- **react-markdown over MDX** because lessons are static markdown by design. The only interactivity (Copy/Run buttons) is added by overriding react-markdown’s `<code>` renderer — no compilation step per lesson, no JSX in lesson source.

-----

## 4. Tech stack

- **Build:** Vite + TypeScript + React 18+
- **Package manager:** pnpm; lockfile committed; CI uses `pnpm install --frozen-lockfile`
- **Styling:** Tailwind CSS
- **UI primitives:** shadcn/ui (Radix-based, components owned in-repo)
- **Editor:** `monaco-editor` (lazy-loaded) + `@monaco-editor/react`
- **Editor dock-layout:** `react-mosaic` (or `dockview`) for drag-to-split panes
- **File tree:** `react-arborist` (or similar)
- **Markdown:** `react-markdown` + `remark-gfm` + `rehype-highlight`; Copy/Run buttons via a `<code>` renderer override
- **Terminal:** `xterm.js`, `xterm-addon-fit`, `xterm-addon-web-links`
- **Python runtime:** Pyodide loaded from CDN, version pinned. Loading is **hybrid** — the IDE shell paints first, then Pyodide downloads in the background while the user reads the lesson; the terminal is disabled with a “Loading Python…” status until ready.
- **State:** Zustand or React context — small enough that Redux is overkill
- **Tests:** Vitest (unit), Playwright (end-to-end smoke against built site, Chromium only)
- **CI:** GitHub Actions — `pnpm build` and `pnpm test` on PR; deploy to GitHub Pages on push to `main`
- **Linting/formatting:** ESLint + Prettier, standard config

No SSR, no server. The whole site is static files.

-----

## 5. Filesystem design

A virtual workspace rooted at `/workspace`, organised as one folder per lesson (`/workspace/01-describe/`, `/workspace/02-schema/`, etc.). Accessible from both the editor and Pyodide. Pyodide’s IDBFS provides IndexedDB-backed persistence. The editor reads/writes through a thin facade so we can swap the backing store later if needed.

**Lesson scaffolding files** live in the bundle at `/content/lessons/<slug>/files/`. When the user clicks “Load lesson files”, those files are copied into `/workspace/<slug>/`. If the destination folder already contains user-edited files, a modal confirms overwrite before any destruction (see §6.5).

**Reset workspace:** a UI action behind a modal confirmation. Deletes everything in `/workspace` (the full IDBFS-backed store). Does **not** touch:

- Theme choice (lives in localStorage, not IDBFS)
- “First-visit landing page seen” flag (localStorage)
- Editor tab list (localStorage)

These survive Reset deliberately — they’re UI preferences, not workspace state.

-----

## 6. Mini-shell design

This is the most novel piece of engineering and the area most likely to bite. The user wants:

- Built-in commands: `ls`, `cat`, `cd`, `pwd`, `mkdir`, `rm`, `echo`
- External commands: `frictionless …`, `python script.py`, `python -c "…"`
- Pipes: `cmd1 | cmd2 | cmd3`
- Redirection: `> file`, `>>` append, `< file` input

**Approach:**

1. **Tokeniser** — splits a line respecting single/double quotes and escape characters. (~50 LoC)
1. **Parser** — produces an AST of pipelines and redirections. Reject for v1: subshells `$(...)`, command substitution, env-var expansion, globs. Document this clearly. (~100 LoC)
1. **Executor** — for each command in a pipeline, resolve to either a JS builtin or a Pyodide call. Stream stdout from one to the stdin of the next via async iterators / `ReadableStream`. (~200 LoC)
1. **Pyodide bridge** — wrap a Python entry-point invocation so we can feed it a stdin string and capture stdout/stderr/exit-code. Pyodide’s `runPythonAsync` plus stdin/stdout redirection patches make this tractable.

**Critical analysis:**

- Pyodide command invocations are *not free* — calling `frictionless` is a Python process startup each time (no real fork, but module imports + Typer click-tree). Expect 200–500 ms per command after the first. Acceptable for an exploratory tool, painful for tight pipe loops. Document this; don’t promise bash-level snappiness.
- `python script.py` and `python -c "…"` need to run inside the same Pyodide instance, sharing or isolating namespace per the user’s expectation. Default: each invocation gets a fresh global namespace. Document.
- Redirection to a file means *writing into the virtual FS*, then making sure the editor refreshes any open tab pointing at that file (file-watcher pattern).
- Pipe ordering: in real bash, all pipeline stages run concurrently. In our model they may end up serialised through Pyodide. Either accept that (output between stages is buffered), or drive Pyodide on a worker thread and stream genuinely. **Recommendation: serialise + buffer for v1**, mark as a known limitation, revisit if it becomes painful.
- Rejected for v1: `&&`, `||`, `;` chaining; backgrounding; signal handling. These would significantly enlarge the parser. If we discover lessons depend on `&&`, add it.
- Tab completion was originally rejected for v1 but added in iteration 048 once the rest of the shell had stabilised; the completer is a separate module (`app/src/mini-shell/complete.ts`) and does not touch the parser.

-----

## 6.5 Operational behaviours

These cross-cutting behaviours emerged from walking UI flows; they don’t fit cleanly under any single component but matter to the experience.

**Pyodide loading state.** Terminal input is disabled (greyed-out prompt) and the status line reads “Loading Python…” until Pyodide is initialised. The editor and file tree are fully functional throughout — users can read lessons, open files, browse — only Python-bearing operations are gated.

**Filesystem change events.** The mini-shell and Pyodide bridge are the *only* writers to the virtual FS. Both emit `fs-changed` events on every create/delete/rename/write. The file tree subscribes and rerenders; open editor tabs whose backing file vanishes show a “file deleted on disk” indicator (Monaco supports this natively). No polling.

**Pre-execution flush.** Before any terminal command runs, the editor flushes all dirty buffers synchronously (cancelling pending auto-save debounce timers). Eliminates the 500 ms race between editor edits and command-line reads.

**Pyodide crash recovery.** If Pyodide throws a fatal error (rare), the terminal prints the error and a “Reload runtime” button appears. The user clicks; the page reloads. Workspace is preserved (IDBFS), terminal history is not.

**Cancellation.** Decided by Phase 0 measurement C:

- *If* Pyodide runs on a Web Worker (because of latency findings) → Ctrl+C and a Cancel button both work via worker termination.
- *If* Pyodide runs on the main thread → no in-band cancellation; user reloads the page if a command goes runaway. Documented as a v1 limitation.

**Python environment limitations.** Pyodide ships some packages preloaded (numpy, etc.); others (e.g. pandas) require explicit `micropip.install(...)`. Imports of unavailable packages produce the standard Python `ModuleNotFoundError` — no auto-suggestion or auto-install. A `docs/limitations.md` page enumerates this and other quirks (no shell `&&`/`||`, no SharedArrayBuffer, serialised pipes).

**Tab persistence.** Open editor tabs (file paths only — content is loaded fresh from the FS) are persisted in localStorage and restored on reload. Closing a tab is always safe (no unsaved-state, by virtue of debounced auto-save); to reopen, click the file in the tree.

-----

## 7. Lesson system

Lessons live in the repo at `/content/lessons/`. Each lesson is a folder:

```
content/lessons/
  01-describe/
    lesson.md          # rendered in the lesson panel
    meta.json          # title, slug, order, summary, est. minutes
    files/             # optional starter files copied to /workspace/01-describe/
      data.csv
      README.md
```

`lesson.md` is plain CommonMark with fenced code blocks. Code blocks tagged `bash` get **two buttons**: “Copy” (clipboard) and “Run” (types the command into the terminal and submits it). The Run button is implemented via a `<code>` renderer override on react-markdown that injects an action bar above the rendered block; clicking Run uses the terminal’s public API to write the command and trigger execution.

Run-button states:

- **Disabled** while Pyodide is still loading (consistent with the terminal being disabled in that state)
- **Disabled** while a previous command is still executing — no command queueing in v1; the user must wait for the current command to finish before triggering another
- **Idle (clickable)** otherwise; the most recently-clicked block is visually marked

The Copy button is always enabled — clipboard write doesn’t depend on Pyodide.

The lesson index is built at compile time from `meta.json` files, so adding a lesson is just adding a folder and rebuilding.

-----

## 8. Curriculum (v1)

Nine lessons covering the full ecosystem arc, closing with a publishing capstone. Order is the recommended pedagogical sequence; lessons are self-contained enough that an experienced user can jump.

|#|Title                        |Core concept                                                  |Frictionless features touched                         |
|-|-----------------------------|--------------------------------------------------------------|------------------------------------------------------|
|1|**Describe a CSV**           |Auto-generate metadata from a single file                     |`frictionless describe`                               |
|2|**Write a Schema by hand**   |Hand-author a Table Schema, understand types & constraints    |Table Schema spec, `frictionless validate --schema`   |
|3|**Validate & fix errors**    |Read a validation report, iteratively fix bad data            |`frictionless validate`, error types                  |
|4|**Build a Data Package**     |Multiple resources, package-level metadata, `datapackage.json`|Data Package spec, `frictionless describe` on a folder|
|5|**Dialect & encoding quirks**|CSVs that aren’t UTF-8/comma-separated; tabs, semicolons, BOMs|Table Dialect spec                                    |
|6|**Transform**                |A small extract-transform-load: read, reshape, write          |`frictionless transform` (or pipeline)                |
|7|**Inquiry**                  |Validate many resources in one go                             |Inquiry spec, `frictionless validate <inquiry.json>`  |
|8|**Publish & consume**        |Read a remote `datapackage.json`, work with its resources     |Remote package URL, `frictionless describe <url>`     |
|9|**Publish with Livemark**    |Build a static HTML document embedding narrative, an equation, and live CSV tables from a sister folder|Livemark `build`, the `table` directive over Frictionless resources|

**Critical analysis of this curriculum:**

- Lesson 5 (Dialect) is genuinely fiddly and may not motivate well in a purely educational setting. Worth front-loading a real-world example (“here’s a sketchy CSV from a vendor — fix it”) rather than abstract dialect theory.
- Lesson 6 (Transform) is the area of Frictionless that has historically been least stable across versions and least well-documented. There’s a real risk that whatever we author here ages badly. Pin the `frictionless` version explicitly in `requirements`; surface the version in the lesson; revisit on each upgrade.
- Lesson 8 (Publish & consume) needs a real, stable remote `datapackage.json` to point at. Two options: host one ourselves in this repo (simple, but circular — we’re consuming our own bait), or point at an established public package like one from datahub.io (more authentic, but introduces a third-party dependency that could break the lesson if the host changes URLs). Recommendation: **both** — primary example uses a self-hosted package in this repo’s `gh-pages` branch (under our control), with a “now try this real one” callout pointing at a public package.
- Lesson 7 (Inquiry) is conceptually thin once Validate is understood — it’s “validation, but in a list”. Keep it short; resist padding it.
- Order of 4 and 5: Package before Dialect. Package is the *named* concept of the entire ecosystem — a learner who runs out of time mid-curriculum has still met the central idea; Dialect is plumbing that can wait.

-----

## 9. Repo structure

```
/
├── app/                       # the IDE web app
│   ├── src/
│   │   ├── components/        # React components (Layout, Editor, Terminal, FileTree, LessonPanel)
│   │   ├── shell/             # mini-shell: tokeniser, parser, executor, builtins
│   │   ├── pyodide/           # Pyodide loader, command bridge, stdout/stderr capture
│   │   ├── fs/                # virtual FS facade
│   │   ├── lessons/           # lesson loader, markdown renderer
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── content/
│   └── lessons/               # see §7
├── docs/
│   ├── spec.md                # this document
│   ├── lesson-authoring.md    # how to write a new lesson
│   ├── architecture.md        # diagrams, deeper dives, Phase 0 measurement findings
│   └── limitations.md         # known constraints (Pyodide quirks, shell limitations, etc.)
├── .github/workflows/
│   ├── ci.yml                 # build + test on PR
│   └── deploy.yml             # build + deploy to gh-pages
├── LICENSE                    # MIT
└── README.md
```

-----

## 10. Risks & de-risking

The risks below are ranked by how likely they are to wreck the project. **Phase 0** below is explicitly about retiring the top three before we commit to the full build.

|# |Risk                                                                                                                                         |Likelihood                            |Impact                             |Mitigation                                                                                                                                                                                                                                                     |
|--|---------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|R1|`frictionless-py` doesn’t install cleanly under Pyodide (transitive C-extension deps, e.g. unusual `pydantic` builds, `lxml`, native parsers)|**Medium**                            |**High** — kills the whole approach|**Phase 0 spike A**: confirm `micropip.install("frictionless")` succeeds in current Pyodide and the CLI runs. If not, identify which dep fails and either patch (PR upstream), pin to a compatible version, or pivot to frictionless-js with reduced ambitions.|
|R2|Mini-shell pipes/redirection more complex than estimated                                                                                     |**Medium**                            |**Medium** — extends timeline      |**Phase 0 spike B**: build a one-page prototype with `echo foo | cat | cat > out.txt` working end-to-end. Validates the architecture before committing.                                                                                                        |
|R3|Pyodide command latency makes the experience feel sluggish                                                                                   |Medium                                |Medium                             |**Phase 0 measurement C** times cold-start and warm calls; if median exceeds threshold, Pyodide moves to a Web Worker in Phase 1 (which also unlocks Ctrl+C cancellation). Document expected latencies in `docs/limitations.md`.                               |
|R4|Bundle size unacceptable (Pyodide alone is ~10 MB; Monaco another ~3 MB)                                                                     |**Low** (modern connections cope)     |Medium                             |Lazy-load Monaco; load Pyodide hybrid (after lesson panel paints, in the background while the user reads); rely on GH Pages’ caching headers for revisits.                                                                                                     |
|R5|IDBFS persistence semantics are surprising (sync points, quotas)                                                                             |Low                                   |Low                                |Document in `docs/limitations.md`. “Reset workspace” is the escape hatch when things go wrong.                                                                                                                                                                 |
|R6|Frictionless `transform` API churn breaks lesson 6 between writing and shipping                                                              |Low–Medium                            |Low (just lesson 6)                |Pin Frictionless version specifically; record version in README. The artefact freezes at v1.0 (decision #35), so post-launch churn is not a concern; the only window of risk is between authoring lessons and tagging v1.0.                                    |
|R7|The build-it-to-learn-it process produces lessons that the author themselves finds unilluminating                                            |Low–Medium                            |Medium (the artefact’s whole point)|Each lesson includes a Notes & Observations section that the author fills in *as they build*. If a lesson’s Notes section turns out empty or unenlightening, that’s a signal to rework that lesson before tagging v1.0.                                        |
|R8|Mobile/small-screen use                                                                                                                      |High (people will try)                |Low (it’s a desktop tool)          |Show a “best on a wider screen” notice below ~900 px; do not invest in responsive layout for v1.                                                                                                                                                               |
|R9|Solo author loses momentum mid-build, leaving a half-finished artefact                                                                       |Medium (long timeline at evening pace)|Medium                             |Phase boundaries are engineered so each phase ends at a usable artefact (Phase 1 = working playground without lessons; Phase 2 = playground + lessons; Phase 3 = polish). If momentum stalls, the previous phase still stands as a usable, public reference.   |

-----

## 11. Phased plan

### A note on timeline

The author’s stated time budget is “a few weeks at weekend-and-evening pace” — roughly 24–36 focused hours. The plan below totals **6–10 weeks of focused work** (perhaps 200+ hours). That mismatch is acknowledged: the author has chosen to accept that *the spec describes months of evenings, not weeks*, on the understanding that the journey is the point of the project. Estimates below are calendar weeks at the stated pace; they assume reasonably consistent evening/weekend availability and will stretch when life intervenes.

The phasing is engineered so that each phase ends at a meaningful, demonstrable point — if the author runs out of momentum partway, the project doesn’t leave a half-built corpse. Phase 1 alone is a useful artefact (an in-browser Frictionless playground, even without lessons). Phase 2 alone, building on Phase 1, is a useful artefact (the curriculum). Phase 3 polish can be skipped if necessary.

### Phase 0 — De-risking spike (target: ≤ 2 weeks at weekend-and-evening pace)

Goal: prove the riskiest things work, and gather measurements that inform downstream architectural choices, before investing in the full build.

- **Spike A — Pyodide + frictionless.** Static page, loads Pyodide, `micropip.install('frictionless')`, runs `frictionless --version` and `frictionless validate <small CSV>` end-to-end, captures stdout/stderr/exit-code. Pass condition: works in Chrome and Firefox.
- **Spike B — Pipes prototype.** Stripped-down xterm.js + custom shell, supports `echo`, `cat`, `>`, `|`. Pass condition: `echo hello \| cat > out.txt` writes `hello\n` to the virtual FS.
- **Measurement C — Latency budget.** As part of Spike A, time the cold-start (first `frictionless` call after page load) and warm calls (subsequent invocations). Output: a recommendation on whether v1 needs to put Pyodide on a Web Worker or can ship main-thread. Threshold: if warm-call median is under ~250 ms and cold start under ~3 s, main-thread is acceptable for v1; otherwise the worker work shifts to Phase 1.

If A fails, stop and re-plan (frictionless-js fallback, or a different runtime). If B fails, consider downgrading the terminal scope to “no pipes/redirection” before proceeding. Measurement C produces a recorded recommendation in `docs/architecture.md`.

### Phase 1 — IDE shell (≈ 4–6 weeks after Phase 0)

- App layout (panels, resize, collapse, drag-to-split horizontal editor area)
- File tree + Monaco editor + virtual FS, all reading/writing the same store; right-click context menu (New file, New folder, Rename, Delete); drag-and-drop file import
- Persistence via IDBFS, debounced auto-save (~500 ms after last keystroke), “Reset workspace” action with modal confirmation
- Terminal with full mini-shell (builtins + pipes + redirection), up/down arrow command history within session
- Pyodide command execution wired to terminal — placement (main thread vs Web Worker) determined by Phase 0 measurement C
- Markdown lesson rendering with Copy and Run buttons on bash code blocks
- Tailwind + shadcn/ui + react-markdown stack; light/dark theme toggle persisted in localStorage; theme broadcast to Tailwind, Monaco, and xterm
- “Best on a wider screen” notice below ~900 px width — no responsive layout work
- CI + GitHub Pages deployment

Demo target at end of Phase 1: an empty workspace where someone can paste in a CSV, type `frictionless describe data.csv > schema.json`, and have it work.

### Phase 2 — Lesson system + curriculum (≈ 4–6 weeks)

- Brief landing page (“What is this? Who’s it for?”) with Start button into the IDE; localStorage flag suppresses on return; “What is this?” link in IDE chrome
- Curriculum index in the lesson panel (default view)
- Lesson loader and “Load lesson files” action — populates `/workspace/<slug>/`, modal-confirms before overwriting any user edits
- Free navigation (any lesson, any time, no enforced order)
- Author the eight v1 lessons, including a **Notes & Observations** template section the author fills in while building each lesson — this is the evidence base for the eventual evaluation
- Lesson-authoring docs (`docs/lesson-authoring.md`)
- Limitations doc (`docs/limitations.md`)

### Phase 3 — Polish & v1.0 milestone (≈ 1–2 weeks)

- Solo author walkthrough of the whole curriculum, fixing whatever cracks appear
- Write the README, project intro, screenshot, and a short summary of findings drawn from the Notes & Observations sections
- Pin Frictionless and all schemas to specific versions; record those versions in the README
- Tag v1.0, announce informally if at all

The `v1.0` tag is a reproducible, dated reference build, **not** a freeze: the project remains in active pre-production development past this milestone. Pinned versions and a committed lockfile mean that any tagged build can be reconstructed; backwards compatibility is not a project goal except where it concerns external Frictionless Data artefacts (see constitution Principle VI).

-----

## 12. Decisions log

Resolved during the v0.1 → v0.2 review:

|#|Question                                        |Decision                                                                                                                                                            |
|-|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|1|“Run in terminal” buttons on lesson bash blocks?|**In v1.** Both Copy and Run buttons. (See §7.)                                                                                                                     |
|2|Inquiry & Publishing lessons in v1?             |**Both in v1.** Curriculum expanded to 8 lessons. (See §8.)                                                                                                         |
|3|Lesson 4/5 ordering — Package or Dialect first? |**Package before Dialect** — Package is the named central concept of the ecosystem, so a learner who runs out of time has still met it.                             |
|4|Pipeline concurrency model?                     |**Serialised + buffered.** Documented as a limitation. (See §6.)                                                                                                    |
|5|Web Worker for Pyodide — Phase 1 or later?      |**Decide based on Phase 0 measurement C.** If warm-call latency exceeds threshold, worker work is in Phase 1; otherwise main-thread is acceptable for v1. (See §11.)|
|6|Mobile / small-screen support?                  |**Out of scope for v1.** Show “best on a wider screen” notice below ~900 px; no responsive layout work.                                                             |

Resolved during the v0.2 → v0.3 review (technical and UX):

|# |Question                              |Decision                                                                                                                                                                                      |
|--|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|7 |Styling approach?                     |**Tailwind CSS** — recommended; fast to iterate for IDE-shaped UI.                                                                                                                            |
|8 |UI component library?                 |**shadcn/ui** — recommended; Tailwind-friendly, components owned in repo.                                                                                                                     |
|9 |Markdown renderer?                    |**react-markdown** + remark-gfm + rehype-highlight — lessons are static; MDX adds cost without proportional benefit.                                                                          |
|10|When does Pyodide load?               |**Hybrid** — start downloading after lesson panel paints, status shown in terminal panel.                                                                                                     |
|11|Frictionless version pinning?         |**Pin specific** at the moment of v1 freeze. The originally-recommended automated upgrade PRs are unnecessary because the artefact freezes (decision #19) — no ongoing maintenance is planned.|
|12|Theme support?                        |**Both light and dark, with toggle**, persisted in localStorage. Theme broadcast to Tailwind, Monaco, and xterm.                                                                              |
|13|Browser support?                      |**Modern evergreen only** — latest 2 versions of Chrome, Firefox, Safari, Edge. CI smoke-tests Chromium only.                                                                                 |
|14|Telemetry / analytics?                |**None.**                                                                                                                                                                                     |
|15|Accessibility?                        |**Best-effort** — keyboard-navigable, semantic HTML, no formal WCAG conformance commitment.                                                                                                   |
|16|Monaco JSON Schemas — fetch or bundle?|**Both** — pinned snapshot bundled, runtime fetch attempted with short timeout, fall back to bundle.                                                                                          |
|17|Package manager?                      |**pnpm** — recommended; lockfile committed, CI uses `--frozen-lockfile`.                                                                                                                      |
|18|First-time landing?                   |**Brief landing page** (“What is this? Who’s it for?”) with Start button into the IDE.                                                                                                        |
|19|Lesson workspace layout?              |~**One shared workspace** — silent overwrite~ **Reversed by #49** — see below.                                                                                                                |
|20|Bring-your-own-data?                  |**Drag-and-drop import only** onto the file tree. No upload button.                                                                                                                           |
|21|Export files?                         |**No.** Everything stays in the browser for v1.                                                                                                                                               |
|22|Lesson navigation?                    |**Free** — any lesson, any time, no enforced order.                                                                                                                                           |
|23|Track progress?                       |**No** — lessons are stateless; user knows where they are.                                                                                                                                    |
|24|Output panel?                         |**Dropped.** `frictionless` already produces well-formatted output; bottom panel is just the terminal.                                                                                        |
|25|Terminal command history?             |**Up/down arrow recall within session.** No persistence, no Ctrl+R.                                                                                                                           |
|26|File tree right-click menu?           |**Yes** — New file, New folder, Rename, Delete.                                                                                                                                               |
|27|Auto-save?                            |**Debounced**, ~500 ms after last keystroke.                                                                                                                                                  |
|28|URL routing?                          |**None** — single SPA URL, lesson selection is local UI state.                                                                                                                                |
|29|Editor splits?                        |**Yes**, drag-to-split horizontal panes; needs `react-mosaic` or `dockview` — flagged as real UI work.                                                                                        |
|30|Reset behaviour?                      |**Modal-confirmed**; deletes everything in `/workspace` only (terminal history and theme not affected).                                                                                       |

Resolved during the v0.2 → v0.3 review (project-level):

|# |Question                                    |Decision                                                                                                                                                                                                      |
|--|--------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|31|Author’s stance toward Frictionless?        |**Confirmatory with adversarial probes.** Author expects Frictionless to fit and is verifying that while hunting for weak spots. (See §1.)                                                                    |
|32|Real domain data in v1 lessons?             |**No** — stub data only in v1; synthetic-but-realistic acoustic data is v1.1’s job. v1 deliberately defers the domain-fitness question.                                                                       |
|33|Sensitivity / classification of domain data?|**None** — fully open project, public GitHub Pages.                                                                                                                                                           |
|34|Build team?                                 |**Solo.** No external contributors planned for v1.                                                                                                                                                            |
|35|Post-launch lifecycle?                      |**Frozen as a dated reference.** No automated upgrade PRs, no scheduled maintenance.                                                                                                                          |
|36|User testing in Phase 3?                    |**Removed** — Phase 3 is solo polish only. The originally-planned external user test was scoped for the “teach a community” framing that no longer matches the project’s actual purpose.                      |
|37|Time budget vs spec scope?                  |**Acknowledged mismatch.** Author has chosen to accept months-of-evenings rather than cut scope. Phasing is engineered so each phase ends at a useful, demonstrable point in case momentum falters. (See §11.)|

Resolved during the v0.3 → v0.4 review (UI flows):

|# |Question                                                 |Decision                                                                                                                                                                                         |
|--|---------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|38|On return visit, restore previously-open editor tabs?    |**Yes** — tab list persisted in localStorage, content loaded fresh from FS on open.                                                                                                              |
|39|Show landing page on every visit?                        |**First visit only.** localStorage flag suppresses thereafter; “What is this?” link in IDE chrome lets the user revisit it.                                                                      |
|40|How does Monaco identify which JSON Schema applies?      |**Filename-based.** `datapackage.json` → Data Package; `dialect.json` → Dialect; `schema.json` or `*.schema.json` → Table Schema. Lessons use canonical names so the feature is reliably visible.|
|41|Should users see schema validation is active?            |**Status bar segment** showing the active schema for the focused tab. The status bar also shows file path, cursor position, encoding, and save state.                                            |
|42|Drag-drop import — collision behaviour?                  |**Modal-confirm overwrite.** Different from lesson-load because user-dropped files are intentional and surprise destruction is worse.                                                            |
|43|Drag-drop — destination of dropped file?                 |**Drop on a folder lands in that folder; drop in empty space lands at root.**                                                                                                                    |
|44|Drag-drop — multiple files / folders?                    |**Folders too.** Recursively imports folder contents via the `DataTransferItemList` API.                                                                                                         |
|45|File-size limit on drag-drop?                            |**10 MB hard cap** with clear error message.                                                                                                                                                     |
|46|Pyodide crash recovery?                                  |**Manual “Reload runtime” button** appears in terminal on fatal error. No automatic re-init in v1.                                                                                               |
|47|Cancellation of runaway commands?                        |**Conditional on Phase 0 worker decision.** If worker → Ctrl+C and Cancel button. If main-thread → no cancellation, user reloads.                                                                |
|48|Editor-vs-terminal race condition?                       |**Force-flush before every command** — editor cancels pending auto-saves and writes synchronously before mini-shell dispatches.                                                                  |
|49|**Workspace layout — shared root or per-lesson folders?**|**Reversed from #19.** Per-lesson folders. Shared root accumulated too many footguns (silent destruction, ambiguous file ownership, debris from prior lessons).                                  |
|50|Lesson commands and paths?                               |**Lessons start with `cd <lesson-folder>` and use short paths thereafter.** pwd persists across the terminal session.                                                                            |
|51|Lesson-load when folder already exists with user files?  |**Modal-confirm overwrite** (“Folder X exists. Overwrite all files? Your edits will be lost”). Symmetric with drag-drop and Reset.                                                               |
|52|In-IDE notes feature for users?                          |**None.** IndexedDB persistence is for lesson-state continuity, not as a notebook. Persistent observations belong in durable, project-external places.                                           |
|53|File-tree refresh after terminal-side FS changes?        |**Event-based.** Mini-shell and Pyodide bridge emit `fs-changed`; file tree and editor subscribe. No polling.                                                                                    |
|54|Terminal behaviour while Pyodide loads?                  |**Disabled.** Greyed-out prompt with “Loading Python…” status until ready. Editor and file tree remain fully functional throughout.                                                              |
|55|Python imports of unavailable packages?                  |**Accept the failure mode.** Standard `ModuleNotFoundError`; no auto-suggest or pre-install. Documented in `docs/limitations.md`.                                                                |
|56|Tab close and reopen behaviour?                          |**Just close.** No close-others/recently-closed UI; user reopens from file tree.                                                                                                                 |

**Reversal note for #49:** decision #19 (shared workspace, silent overwrite) was made earlier in the interview when the consequences for lesson-switching weren’t yet concrete. Walking Flow 6 made the footguns visible — the per-lesson-folders approach is cleaner pedagogically (Data Package lesson lives in its own folder anyway), safer (destruction is bounded to one folder and confirmed), and only mildly more verbose in lesson markdown.

### v0.4 → v0.5 — consistency pass

No new decisions; this revision brought the spec body into line with the decisions log. Specifically:

- §3 component table updated: Output panel removed (#24), Status bar / Landing page / Drag-drop importer / Theme provider / dock-layout entries added (decisions #41, #18, #20+#43+#44, #12, #29). App shell description corrected — no router (#28).
- §3 “Why this shape” gained rationale entries for Tailwind + shadcn/ui (#7, #8) and react-markdown over MDX (#9).
- §4 Tech stack expanded with all decided dependencies (Tailwind, shadcn/ui, react-markdown stack, react-arborist, react-mosaic/dockview, pnpm) and clarified Pyodide’s hybrid loading.
- §5 Reset clarified — does not touch theme, landing-page flag, or tab list (which live in localStorage).
- §7 Run button states made explicit (disabled while Pyodide loads or while a previous command runs; no command queueing).
- §9 Repo structure gained `docs/limitations.md`.
- §10 Risk mitigations refreshed: R3 references Phase 0 measurement C, R4 reflects hybrid loading not on-demand, R5 drops the never-decided “sync now” affordance, R6 reflects the freeze decision (no upgrade cycle), R7 retired (mixed-audience framing changed) and replaced with a Notes-section-quality risk, R9 added (solo-author momentum risk).
- §11 Phase 2 wording fixed — no longer references the reversed “shared workspace, silent overwrite” model.
- §12 decisions 31–37 (v0.3 project-level) restored after being accidentally overwritten in the v0.4 edit.
- §12 decision #19 marked inline as reversed by #49.
- Minor: §1 redundancy trimmed; §2 schema filename matching noted as case-insensitive.

-----

## 13. Definition of done (v1.0)

- [ ] GitHub Pages site reachable, loads in <8 s on broadband cold cache
- [ ] All nine lessons authored, rendering, and runnable end-to-end without errors
- [ ] Each lesson has a populated **Notes & Observations** section recording what worked, what surprised, what required workarounds
- [ ] Terminal supports the full feature set in §6 (builtins, pipes, redirection, Pyodide commands)
- [ ] Workspace persists across reload; Reset works (modal confirmed)
- [ ] CI green: `pnpm build`, `pnpm test`, Playwright Chromium smoke pass
- [ ] README with project framing, setup, and a short summary of evaluation findings
- [ ] Frictionless version and JSON Schema versions pinned; versions recorded in README
- [ ] Repo tagged v1.0 as a reproducible, dated reference build (development continues past this milestone — see constitution Principle VI)