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

### Bundled JSON Schemas are placeholders

JSON Schema validation in the editor (#14) ships minimal
placeholder schemas at `app/src/editor/schemas/{data-package,
table-dialect,table-schema}.json`. They catch obvious mistakes
(missing required fields, wrong field type) but are NOT the
canonical Frictionless specs. On editor mount, the app fetches
the canonical schemas from `specs.frictionlessdata.io` with a 2 s
timeout and replaces the bundle on success. If the fetch fails
(offline, CORS, outage) users keep the placeholder validation —
silent fallback. Update the placeholders when the canonical specs
move.

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

## Cross-cutting (carried from `spec.md` §6.5 / §10)

These will be enumerated as their owning features land in E1/E2 and
are listed here as forward references:

- No SharedArrayBuffer (cross-origin isolation) on GitHub Pages —
  confirmed during Spike A.
- Serialised pipes in the mini-shell (no parallel stages).
- No `&&` / `||` / `;` chaining, no subshells, no env-var expansion,
  no globs, no tab completion.
- `ModuleNotFoundError` for Python packages without Pyodide-compatible
  wheels.
- No in-IDE note-taking.
- No mobile / small-screen support.
- No in-band cancellation if Pyodide ends up on the main thread
  (decision deferred to Measurement C, item #3).
