# Research — Spike A (Pyodide + Frictionless install proof)

Phase 0 of `plan.md`. Each item is captured as Decision / Rationale /
Alternatives so a future reader can audit the choice.

---

## R1. Pyodide version to pin

**Decision**: Pin to a recent, generally-available Pyodide release at
the time of the spike, addressed via the canonical
`https://cdn.jsdelivr.net/pyodide/v<X.Y.Z>/full/pyodide.js` CDN path.
The exact pinned version string is recorded in
`app/spikes/spike-a/pyodide.config.js` and surfaced on the spike page
itself (spec FR-002). The page also prints `pyodide.version` at runtime
as a sanity check that the served bundle matches the pin.

**Rationale**: Constitution Principle VI mandates pinning. Recording
the version both in the config module and at runtime gives a reader a
trustworthy single source of truth and catches CDN drift. `jsdelivr`
exposes versioned paths under `/pyodide/v<X.Y.Z>/full/` which is the
distribution layout Pyodide's own docs recommend for direct script
loading.

**Alternatives considered**:

- *Vendor the Pyodide bundle locally*: rejected — Pyodide is
  ~10–15 MB; vendoring bloats the repo for a throwaway spike. The
  GitHub Pages site loads from CDN in production anyway, and pinning
  a CDN URL satisfies Principle VI without the disk cost.
- *Use `pyodide.unpkg.com` or another mirror*: rejected — `jsdelivr`
  is the path Pyodide's docs lead with and is already widely cached.
  Trying multiple mirrors during a spike is scope creep.

---

## R2. Pyodide loading approach

**Decision**: Load Pyodide via the classic `<script>` tag pattern that
exposes the `loadPyodide()` global, then `await loadPyodide({ indexURL: <pinned base URL> })`
from `main.js` (an ES module). The spike-local `main.js` is itself an
ES module via `<script type="module" src="main.js">`.

**Rationale**: This is the path Pyodide's own quickstart documents and
it works without any bundler. The `indexURL` parameter pins the asset
base for the wasm/data files alongside the JS shim, which closes the
"is the wasm coming from the same pinned version?" question. ES
modules in `main.js` give us `import` for the tiny `pyodide.config.js`
without needing a build step.

**Alternatives considered**:

- *Pure ES-module import of Pyodide*: rejected for this spike — the
  ES-module entry-point exists but adds path-resolution friction for a
  build-step-free page, and the script-tag path is the better-trodden
  one. If the eventual E1 loader (item #27) prefers the module path,
  it can re-evaluate then.
- *Worker-hosted Pyodide*: rejected — Measurement C (item #3) is the
  spike that decides main-thread vs worker. Spike A must stay on the
  main thread to keep that decision uncontaminated.

---

## R3. stdin / stdout / stderr capture

**Decision**: Patch `sys.stdout` and `sys.stderr` inside Pyodide to
Python `io.StringIO()` instances around each `frictionless` invocation,
then read `.getvalue()` after the call. Capture the return code by
catching `SystemExit` (which `argparse`-driven CLIs raise on exit) and
reading `e.code`; for non-CLI library calls, treat a clean return as
exit-code 0 and a raised exception as a non-zero exit-code with the
exception text routed to the stderr pane.

**Rationale**: This is the documented Pyodide pattern for capturing
Python stdio without devtools. Wrapping per-invocation (rather than
process-wide) keeps the streams tidy across the two `frictionless`
calls and matches spec FR-005 ("display stdout, stderr, and exit-code
separately"). The `SystemExit` catch is necessary because the
`frictionless` CLI uses argparse and `sys.exit(...)`.

**Alternatives considered**:

- *Pyodide's `setStdout`/`setStderr` JS-side hooks*: viable but ties
  capture to the Pyodide instance for its lifetime; per-call StringIO
  scoping is cleaner for a spike that runs two calls back-to-back.
  Either approach would satisfy the spec; this choice is taste.
- *Tee to console.log AND a buffer*: rejected — the page must be
  legible without devtools (spec SC-001). Console output is a nice
  bonus for someone debugging but not necessary.

---

## R4. Frictionless CLI vs library entry-point

**Decision**: Drive both invocations through the CLI entry-point —
`frictionless.program.program` (the Click/argparse object, exact name
verified at spike time) — invoked with argv lists like
`["--version"]` and `["validate", "/sample.csv"]`. The sample CSV is
written into Pyodide's virtual FS via
`pyodide.FS.writeFile('/sample.csv', <bytes>)` before the validate
call.

**Rationale**: The spike's pass criterion uses the CLI surface
(`frictionless --version`, `frictionless validate <CSV>`); driving
the CLI directly is the most faithful test of "does the user-visible
command surface work?" This is also the surface the eventual command
bridge (E1 item #28) needs to expose, so answering "does argparse
behave under Pyodide?" here saves work later.

**Alternatives considered**:

- *Call `frictionless.describe()` / `frictionless.validate()`
  Python APIs directly*: rejected for the spike — bypasses the CLI
  layer that the rest of the IDE will route through. Worth keeping in
  mind as a fallback if the CLI path turns out to be broken under
  Pyodide; that fallback would be a finding worth recording.
- *Spawn Pyodide subprocess*: not applicable — Pyodide doesn't fork.

**Correction made during implementation (2026-05-08)**: The original
plan above named `frictionless.console.program` as the CLI entry-point.
That symbol does not exist in Frictionless 5.19.0. The actual CLI
entry-point is the Typer app at `frictionless.__main__:console`,
invoked as
`console(prog_name="frictionless", standalone_mode=False, args=[...])`.
Additionally, Frictionless's resource loader rejects absolute paths
(`/sample.csv`) as "not safe", so the spike writes its sample CSV to
`/home/pyodide/sample.csv` and `os.chdir()`-s into that directory
before calling the CLI with a relative filename. Both findings are
recorded in `docs/limitations.md`; both will bite the eventual command
bridge (E1 item #28) and virtual FS facade (E1 item #11).

---

## R5. SharedArrayBuffer / cross-origin isolation

**Decision**: Build the spike to NOT require SharedArrayBuffer. Run
the page with no COOP/COEP headers (the GitHub Pages serving
condition). If during the spike we observe Pyodide degrading or
warning when `crossOriginIsolated === false`, record that on the page
and in `docs/limitations.md` per Constitution VII. The spike is also
not allowed to enable threading deliberately, since the production
site cannot.

**Rationale**: GitHub Pages does not serve cross-origin isolation
headers (decision recorded against several backlog items already).
Pyodide's main features work without SharedArrayBuffer; the things
that don't (e.g. some package threading hooks) are already candidates
for the limitations document. Surfacing the absence on the page is
the simplest evidence-collector.

**Alternatives considered**:

- *Run the spike behind a local server with COOP/COEP set*: rejected —
  it would mask the GitHub Pages constraint, defeating the purpose.
- *Polyfill SharedArrayBuffer*: rejected — cannot be polyfilled; it's
  a platform feature gated by the isolation headers.

---

## R6. Sample CSV shape

**Decision**: A small, hand-authored CSV with ~5–10 rows and ~3
columns, deliberately mixing types (a string, an integer-shaped
column, a date-shaped column). No deliberate errors. The file is
saved as `app/spikes/spike-a/sample.csv` and committed.

**Rationale**: The spike's job is "does `frictionless validate <CSV>`
run end-to-end and produce a non-trivial report?", not "does
Frictionless catch errors correctly?" — that's lesson 3 (item #44).
Mixed types ensure `validate` actually inspects per-cell typing and
yields a report worth reading, satisfying spec FR-004.

**Alternatives considered**:

- *Use a CSV with intentional errors*: rejected for the spike — adds
  noise to the PASS criterion (a non-zero exit-code from a
  legitimately-invalid CSV would be confused with a spike failure).
  Lesson 3 will revisit this.
- *Generate the CSV at runtime in JS*: rejected — adds a code path
  the spike doesn't need. Keep it as a static fixture file.

---

## Summary of NEEDS CLARIFICATION resolutions

The Technical Context contained no `NEEDS CLARIFICATION` markers; each
research item above was a discretionary choice and is now decided.
Phase 1 design proceeds.
