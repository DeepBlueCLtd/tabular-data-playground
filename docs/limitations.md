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

**Status: PENDING.** See `backlog.md` item #2.

### Measurement C — Pyodide latency budget

**Status: PENDING.** See `backlog.md` item #3. Cancellation strategy
(item #31) depends on the placement decision recorded after that
measurement.

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
