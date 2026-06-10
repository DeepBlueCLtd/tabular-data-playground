# Limitations

Known constraints of the Frictionless Data Explorer artefact.
Constitution Principle VII requires this document to exist and to be
updated in the same change as any feature that introduces a new sharp
edge.

## Conventions

- Each entry names the limitation, where it bites, and why we accept
  it (or what would change to remove it).
- Entries land here as features land, not at the end. If you find a
  sharp edge while implementing, add it now.

## Phase 0 findings

### Frictionless CLI entry-point — undocumented under Pyodide

In Frictionless 5.19.0, the CLI is exposed as a Typer app at
`frictionless.__main__:console` and as a console-script entry-point
named `frictionless` (which Pyodide does not surface as a shell
command). Importing `from frictionless.console import program` —
the path several older snippets and tutorials use — does not work in
this version. The Typer app must be invoked as
`console(prog_name="frictionless", standalone_mode=False, args=[...])`
with `sys.stdout`/`sys.stderr` redirected for capture. This is what
the eventual command bridge (E1 item #28) will need to wrap. Bites in:
`app/spikes/spike-a/main.js`; will bite again in item #28.

### Frictionless rejects absolute paths as "not safe"

`frictionless.validate("/sample.csv")` (and the equivalent CLI call)
fails with *"The data resource has an error: path '/sample.csv' is
not safe"*. Frictionless's resource loader treats absolute paths as
unsafe. The spike works around this by writing the sample CSV to
`/home/pyodide/sample.csv` and `os.chdir()`-ing into that directory
before invoking the CLI with a relative filename. The eventual
virtual FS facade (E1 item #11) and command bridge (E1 item #28)
need to ensure user-visible paths in the workspace are translated to
something Frictionless accepts — likely by chdir-ing into a workspace
root before each command, or by mapping `/workspace/...` to a relative
form.

### Pyodide cold-start is ~3.6× slower on Firefox than Chromium

In headless Playwright runs of Spike A on a developer-class Linux
host, total elapsed time was ~8.4 s on Chromium 141 and ~30.5 s on
Firefox 142 for the full sequence (load → install → version →
validate). Per-step Pyodide-load times alone were ~2.2 s vs ~8.3 s.
This is informational at Phase 0; the proper budget and the
main-thread-vs-Worker decision belong to Measurement C
(`backlog.md` item #3). Implication for the eventual loading-state
UI (E1 item #29): the "Loading Python…" status must remain visible
for a non-trivial period, especially on Firefox.

### `crossOriginIsolated === false` confirmed in this environment

GitHub Pages does not serve the COOP/COEP headers required for
cross-origin isolation, so `self.crossOriginIsolated` is `false`.
This is also true under the local `python3 -m http.server` used by
the spike. No SharedArrayBuffer / threading. Spike A does not need
either, so this is not a blocker for E0; it remains a constraint
the eventual app cannot work around.

## Phase 0 (other spikes)

### Spike B — Mini-shell pipes prototype

PASSED in Chromium 141 and Firefox 142. Findings:

- **xterm.js exposes no runtime version constant.** Pinning is
  enforceable only via the CDN URL we choose. The spike page records
  the URL and the version we wrote into `xterm.config.js`; the
  bundle itself does not let JavaScript verify that what loaded
  matches the pin. E1 will rely on the pnpm lockfile for this
  guarantee instead.
- **`Terminal.onData` does not deliver multi-character paste atomically
  on all browsers.** The spike's interactive prompt iterates the
  delivered string character by character to stay safe; that is
  enough for typed input but the eventual E1 terminal (item #21)
  must handle paste of multiline data without accidentally treating
  internal `\r` as command boundaries inside quoted strings (defer
  to E1 item #22 tokeniser).
- **Rejected-feature list enforced at parse time** (per Constitution
  Principle VII): `&&`, `||`, `;`, `&`, `(`, `)`, `$(`, `${`, `<`,
  `>>`, `*`, `?`, `~`, `$VAR`, `${VAR}`, tab completion. Each
  rejection produces a one-line message naming the operator.
  Lessons (E2) will reference this list explicitly so learners
  aren't surprised.
- **Pipe buffer cap (1 MiB) is research-mode only.** The eventual
  v1 cap and behaviour on overflow belongs to E1 item #24
  (mini-shell executor). The spike rejects overflow with an explicit
  error rather than silently truncating.

### Measurement C — Pyodide latency budget

Captured 2026-05-08 via headless Playwright. Findings:

- **Pyodide on Firefox is markedly slower than on Chromium.** Cold
  call ~3.7 s vs ~1.0 s; warm-call median 328 ms vs 66 ms (a 5×
  gap). Across both browsers, the only way to keep the warm-call
  experience responsive is to host Pyodide in a Web Worker so the
  main thread stays unblocked. The cancellation note below depends
  on this.
- **Per-call wire-up cost (Python snippet generation, JSON marshalling)
  is non-trivial.** Even on Chromium, warm calls are ~60 ms each;
  most of that is Frictionless work, but the JS↔Pyodide round-trip
  is not free either. The eventual command bridge (E1 #28) should
  avoid per-call snippet construction; pre-compile a Python helper
  on first load instead.
- **Headless Playwright timings are illustrative, not authoritative.**
  Headed-browser numbers on the author's actual machine remain the
  decision-grade signal for v1 sign-off.
- **No SharedArrayBuffer / no Worker-thread requirement for
  Worker placement.** The Web Worker decision lifts the
  "no in-band cancellation if main-thread" caveat above (now
  obsolete; this doc will lose that line at E1 once #31 lands).

## E1 findings

### IDBFS is the persistence backbone — quota and private-mode caveats

The Virtual FS facade (#11) mounts Pyodide IDBFS at `/workspace` and
calls `FS.syncfs(false, ...)` after every mutating call. Two sharp
edges:

- **Browser quota.** IndexedDB has a per-origin quota (Chrome ~60% of
  free disk, Firefox ~10 GB shared, Safari smaller). A workspace
  full of large CSVs can exhaust this. The facade does not enforce
  any cap; the drag-and-drop importer (#17) rejects single files >
  10 MB but a large sequence of small files can still hit quota.
  When quota is exceeded, `syncfs` rejects and the facade surfaces
  the underlying error code (mapped to `EUNK` in v1).
- **Private-browsing modes.** Some browsers (Safari historically,
  Firefox in private mode) restrict or zero-out IndexedDB quota. In
  those cases IDBFS still mounts but `syncfs(false)` silently
  drops to memory-only — files survive the session but not a
  reload. The facade does not detect or warn about this in v1.

### Editor split is 2-pane horizontal only

The editor split (#9) is a v1 simplification of the constitution's
"drag-to-split horizontal panes via `react-mosaic` /
`dockview`". Behaviour delivered:

- One "Split editor" toggle button creates a second pane to the
  right of the primary; "Close split" merges back.
- Drag the vertical divider to resize.
- Each pane has an independent active tab; both share the same
  global tab list.

Out of scope for v1: drag-to-split-from-empty, vertical splits,
>2 panes, drag-tabs-between-panes. Documented in
`specs/033-editor-split/plan.md` Complexity Tracking.

### Drag-and-drop importer caps and quirks

The drag-and-drop importer (#17) uses
`DataTransferItem.webkitGetAsEntry()` to walk dropped folders.
Sharp edges:

- **10 MB per-file hard cap.** Files larger than 10,485,760 bytes
  are rejected with a modal; the rest of the batch is also
  rejected (we surface the first oversized file's name and bail
  out for predictability).
- **Symlinks are not represented** by the FileSystem entries API
  in browsers. Dropping a symlinked folder follows the link
  silently if the OS resolves it; otherwise the entry is missing.
- **Large folders may stall the UI** while
  `readEntries` paginates. v1 does not show a progress indicator;
  drops over a few hundred files are out of scope for the
  evaluation artefact.

### Bundled JSON Schemas are pinned snapshots

JSON Schema validation in the editor (#14) ships canonical-spec
snapshots at `app/src/editor/schemas/{data-package,table-dialect,
table-schema}.json`, captured at the v1.0 freeze (#55):

- `data-package.json` — `https://specs.frictionlessdata.io/schemas/data-package.json`
- `table-schema.json` — `https://specs.frictionlessdata.io/schemas/table-schema.json`
- `table-dialect.json` — `https://datapackage.org/profiles/2.0/tabledialect.json`
  (the Frictionless `specs.frictionlessdata.io` host returns 404
  for `table-dialect.json`; `datapackage.org` is the canonical home
  for v2 dialect.)

On editor mount the app still attempts a runtime fetch against the
same URLs with a 2 s timeout and replaces the bundle on success;
on failure (offline, outage, dialect URL drift) the pinned bundle
is the authoritative fallback. **Re-snapshot when bumping the
upstream specs**, otherwise the live fetch and the bundled
snapshot can drift.

### Monaco loaded from jsdelivr CDN

The editor (#13) uses `@monaco-editor/react`'s default loader,
configured to fetch Monaco assets from
`https://cdn.jsdelivr.net/npm/monaco-editor@<pinned>/min/vs`. The
URL is the pin (Constitution Principle VI). Two consequences:

- A jsdelivr outage prevents the editor from loading. There is no
  bundled fallback in v1; the Suspense boundary surfaces a "Loading
  editor…" indefinite state. A future bundled fallback would cost
  ~3 MB on the main bundle, which is why we accept the CDN
  dependency.
- Monaco has no built-in CSV syntax mode. CSV files render as
  plaintext in the editor (#13). For lessons that emphasise CSV
  structure we rely on Monaco's column ruler and the lesson copy
  rather than syntax highlighting.

### Pyodide-dependent e2e tests skip when the runtime fails to load

Some Playwright tests (the `Load lesson files (#41)` flows) require
Pyodide to fully load + `micropip.install("frictionless")`. Pyodide
loads on a Web Worker (Measurement C), which means the worker context
must be able to fetch the CDN. In some local sandboxes / corporate
proxies the main thread can reach the CDN but the worker cannot —
yielding `Python: error` instead of `Python: ready`. The affected
tests detect this and call `test.skip()` with a diagnostic message
rather than fail. The deployed-site verification at epic close
(`spec.md` §11 E2 done — "live on the deployed Pages site") remains
the authoritative gate; CI on a normal runner reaches `Python: ready`
in well under the 180 s budget.

### Chrome with enterprise DLP extensions strips WebAssembly from Workers

On managed-Chrome profiles (those showing
`ExtensionInstallBlocklist: ["*"]` plus an `ExtensionInstallAllowlist`
in `chrome://policy`), a force-allowed corporate security/DLP
extension can intercept Web Worker creation and remove the
`WebAssembly` global from the worker scope, while leaving it
untouched on the main thread. Pyodide loads in a worker
(Measurement C), so it fails to start and `NoWasmScreen` (#19)
catches the case. Symptoms:

- The main-thread `typeof WebAssembly` returns `"object"` (so the
  user reasonably assumes WASM is available), but a worker
  created from a Blob URL reports `undefined` when asked the same
  thing.
- The same machine works in Microsoft Edge, because the Chrome
  ADMX policies don't apply to Edge and most orgs manage one or
  the other, not both. Firefox is similarly unaffected.

There is no code-side workaround. The product can't unstrip
`WebAssembly` once an extension removes it, and moving Pyodide
to the main thread to dodge the stripping would lose the
non-blocking UI Measurement C secured. The accepted answer is
the recommendation in `NoWasmScreen`: use Edge / Firefox, or ask
IT to allowlist this origin for the offending extension.

### Load lesson files — no rollback, "any existing file" prompts

The **Load lesson files** action (#41) copies
`/content/lessons/<slug>/files/` into `/workspace/<slug>/`. Two sharp
edges:

- **No rollback on partial failure.** If a file write fails mid-batch
  (transient worker error, IDBFS quota mid-flight), the action stops
  and surfaces the offending path. Already-written files are kept;
  un-written files are not retried. The user can delete the partial
  state via the file tree or **Reset workspace** and try again. v1
  does not implement transactional rollback because IDBFS has no
  cross-file transaction primitive over the worker bridge.
- **"Any file" treated as a user edit.** The collision check is by
  path, not by content. If a starter file at the same path is already
  present in the workspace — even one identical to the bundled
  starter, e.g. from a previous **Load lesson files** click — the
  modal still asks before overwriting. We accept the small
  over-prompt to keep Principle III's behaviour symmetric and
  inspection-free. (#17 makes the same trade-off for drag-and-drop
  imports.)

### Frictionless absolute-path workaround moved to the worker

The Phase 0 finding ("Frictionless rejects absolute paths as 'not
safe'") is handled at the worker level: after IDBFS mount, the
worker `os.chdir('/workspace')` once, and the CLI wrapper in #28
re-asserts that cwd before each invocation. Consumers can therefore
pass workspace-relative paths to the bridge without translation.

## E2 findings (lesson system, curriculum)

### Lesson 6 (Transform) is the most version-fragile in the curriculum

`frictionless transform` has changed materially across major
versions of Frictionless, and v5.19's CLI does **not** expose a
`transform` command at all — the lesson uses the Python `transform`
function via a small `python run-pipeline.py` script. Two
specific quirks recorded while authoring lesson 6:

- `row-filter` formulas operate on **raw string values**, not the
  schema's typed values. A formula like `published_year >= 1970`
  raises `TypeError`; the working form is `int(published_year) >= 1970`.
- `field-remove` takes `names` (plural list) while other steps
  take `name` (singular). Inconsistent across the step family.

The `requirements` lock (`micropip.install("frictionless==5.19.0")`)
is the version contract. **Do not bump frictionless without
re-walking lesson 6** (Principle VI; the lesson body itself
carries this warning).

### Inquiry-embedded schemas are stricter than package-level schemas

Surfaced while authoring lesson 7. Two real foot-stubs:

- `"primaryKey": "id"` (string form) is accepted in package
  schemas but **rejected** inside an inquiry's embedded schema —
  the inquiry path enforces the spec's stricter "must be array"
  rule. Use `"primaryKey": ["id"]` in inquiry contexts.
- `"schema": "schema.json"` (file reference) works in resource
  descriptors but **fails** inside an inquiry task with `'str'
  object has no attribute 'to_descriptor_source'`. Embed schemas
  inline in inquiry tasks.

Both are noted in lesson 7's body so a learner copy/pasting
schemas from lesson 2 hits the documentation, not a stack
trace.

### Type inference can mistake decimal-comma numbers for `geopoint`

Surfaced in lesson 5. A semicolon-delimited European CSV with
prices like `9,50` infers `price_eur` as `geopoint` (because the
comma reads as a coordinate separator). Override with
`{ "type": "number", "decimalChar": "," }` in the schema. Type
inference has cultural priors; the lesson uses this as a
teaching moment.

### Validate without a schema returns VALID even on broken data

The most important footgun in Frictionless. `frictionless
validate file.csv` with no `--schema` flag runs only
**structural** checks — every row has the right column count,
the file parses as CSV. Semantic checks (booleans, uniqueness,
required, foreign keys) all need a schema. Promoted to a
dedicated section in lesson 3 rather than a footnote.

### Self-hosted package URL is brittle

Lesson 8 hard-codes the deployed Pages URL
(`https://deepbluecltd.github.io/tabular-data-playground/sample-package/datapackage.json`).
If the repo / account moves, the lesson body needs an edit.
Documented inline in lesson 8's Notes section. v1.0 ships
with the URL pinned to the current account.

### Public Frictionless tutorials often cite dead URLs

Many third-party tutorials cite
`raw.githubusercontent.com/datasets/country-codes/master/datapackage.json`
— that's a 404 (the repo's default branch is `main`, not
`master`). Lesson 8 was authored against
`datasets/world-cities/main/datapackage.json` which was verified
live at authoring time. If it goes away, swap to another
`datasets/*` package on GitHub.

### Lesson 9 (Livemark) — a server tool coaxed into the browser

Livemark (`livemark 0.110.8`) is a static-site generator, not a
`frictionless` sub-command. Getting `livemark build` to run under
Pyodide 0.27.7 surfaced several sharp edges, all accepted for v1:

- **`livemark` is a lazily-installed command, not part of startup.**
  The worker installs Livemark on the *first* `livemark` invocation
  (`ensureLivemark` in `app/src/pyodide/worker.ts`) so the other eight
  lessons pay no download/latency cost. The first build therefore pauses
  for a few seconds; subsequent calls are instant (cached per session,
  lost on reload).
- **The server stack is stubbed, not installed.** `livemark`'s package
  `__init__` imports `.server`, which imports `livereload` →
  `tornado`. `tornado` ships **no** pure-Python / wasm wheel (only
  platform wheels + an sdist), so micropip cannot install it. The worker
  registers dummy `tornado` / `livereload` modules in `sys.modules` so
  the import resolves. Consequence: **`livemark start` (the live-reload
  dev server) does not work** — only `livemark build`. A browser sandbox
  can't host a socket server anyway.
- **`marko` is pinned to 1.x at startup.** `frictionless` requires
  `marko>=1.0` (which alone resolves to 2.x); `livemark` requires
  `marko==1.*`. They coexist only on `marko 1.3.1`, and it must be
  installed **before** frictionless — micropip 0.9 (Pyodide 0.27.7) has
  no `reinstall`/downgrade. The worker installs `marko==1.3.1` ahead of
  `frictionless` for every session. Harmless to frictionless (1.3.1
  satisfies `>=1.0`); recorded as a pin in
  `app/src/pyodide/config.ts` and the README.
- **Table directive key is `data:`, not `path:`.** A `path:` key yields
  `scheme "None" is not supported` (the resource source is empty). The
  lesson and its starter `report.md` use `data:`.
- **Table paths resolve against the build cwd, not the document.**
  `livemark build` must be run from the document's own folder for a
  `../data/foo.csv` path to resolve. The lesson `cd`s into `report/`
  first; building from the workspace root fails.
- **No built-in math renderer, and Markdown eats LaTeX escapes.**
  Equations need MathJax injected via raw HTML (Livemark passes raw HTML
  through). The Markdown parser runs first and strips backslash-
  *punctuation* macros (`\,`, `\!`); backslash-*letter* macros
  (`\cdot`, `\frac`, `\log`) survive. The lesson equation uses only the
  latter.
- **Built HTML is previewed in a sandboxed iframe.** Opening any `.html`
  file in the editor shows a **Preview** toggle (`app/src/editor/editor-area.tsx`)
  that renders it via `<iframe srcDoc sandbox="allow-scripts allow-popups">`
  — no `allow-same-origin`, so the framed page cannot script the host app.
  MathJax and DataTables execute, so the equation typesets and tables are
  interactive (verified headless with the real sandbox attributes). Two
  caveats: (1) the framed page pulls MathJax/DataTables/Bootstrap from their
  CDNs **at view time**, so offline it degrades to the inline content — the
  table rows still render, unstyled and non-interactive; (2) nothing leaves
  the browser (no file export), so decision #21 still holds — the preview is
  a render, not a download.
- **`gitpython` imports without a `git` binary** only because
  `GIT_PYTHON_REFRESH=quiet` is set in `ensureLivemark`. Livemark plugins
  that actually shell out to `git` (`github`, `blog`) would fail at
  runtime; none are used by this lesson.

## Cross-cutting (carried from `spec.md` §6.5 / §10)

- **No SharedArrayBuffer (cross-origin isolation) on GitHub
  Pages** — confirmed during Spike A. The deployment cannot
  serve COOP/COEP headers; threading and shared-memory APIs
  are unavailable to the Pyodide worker.
- **Serialised pipes in the mini-shell.** Each pipeline stage
  reads its input fully before the next stage starts; no
  parallel-stage streaming. Documented in
  `specs/031-shell-executor/`. Real cost: a pipeline like
  `frictionless validate big.csv | grep INVALID` buffers the
  full Frictionless output before grep starts. Acceptable for
  the curriculum's data sizes.
- **No `&&` / `||` / `;` chaining, no subshells `$(...)`, no
  env-var expansion `$VAR`, no globs `*.csv`, no tab
  completion.** The mini-shell parser rejects each of these
  with a one-line message naming the operator. Lessons that
  would naturally use these (e.g., "validate every CSV in
  this folder") are written as multi-step explicit invocations
  instead.
- **`ModuleNotFoundError` for Python packages without
  Pyodide-compatible wheels.** Pyodide ships a curated set of
  wheels; not every PyPI package is available. `frictionless`
  and its transitive deps work; arbitrary user `pip install`s
  may not. Surfaced if a learner tries to extend a lesson
  with `import pandas`.
- **The `python` shell command is script-only.** The mini-shell
  recognises `python <script.py> [args...]` and runs the file
  through the Pyodide worker (`runpy.run_path`, with `sys.argv`
  set and the workspace cwd respected). Interactive forms
  (`python`, `python -i`, `python -c "…"`) and stdin into the
  script are intentionally out of scope; lesson 6 is the only
  curriculum surface that uses `python` and only in the script
  form. Errors during the script print a Python traceback to
  the terminal and the command exits non-zero.
- **No in-IDE note-taking.** The Notes & Observations
  sections are *author-side* (Principle II); the deployed app
  has no UI for a learner to capture their own notes.
- **No mobile / small-screen support.** The "best on a wider
  screen" notice (#32) appears below ~900 px width. The
  layout assumes a desktop viewport; touch interactions are
  not designed for.
- **No in-band cancellation when Pyodide is on the main
  thread.** Resolved by Measurement C (item #3): Pyodide
  runs on a Web Worker, so Ctrl+C / Cancel terminate the
  worker (#31). This carve-out from the original
  cross-cutting list is now obsolete.

## Post-v1.0 findings

### Tab autocomplete — quoted/escaped tokens not supported

The terminal's Tab autocomplete (#48) handles unquoted word
tokens only. A token containing any single quote, double
quote, or backslash short-circuits to "no candidates" and the
bell rings — the completer does not attempt to parse
quoting/escaping rules. The lessons do not use quoted file
names, so this constraint does not bite the curriculum; it is
recorded here for completeness should a future lesson
introduce a quoted filename.

### Tab autocomplete — failure feedback is silent

The completer emits the ASCII bell character (`\a`, 0x07) on
no-match, on ambiguous prefix expansion, and at the start of a
double-Tab listing. xterm.js's default `bellStyle` is silent
(no sound, no visual flash), so failure feedback is the
*absence* of expansion rather than an audible/visual signal.
This is a deliberate choice (classroom/demo context); enabling
a bell sound would require shipping an audio asset and is out
of scope.
