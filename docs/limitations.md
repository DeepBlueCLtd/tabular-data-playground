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

## Phase 0 — De-risking Spikes

### Spike A — Pyodide + Frictionless install proof

**Status: PENDING manual runs in Chrome and Firefox.** Update this
section after running the spike page (`app/spikes/spike-a/`) on both
browsers. Capture observations such as:

- `crossOriginIsolated === false` (GitHub Pages does not serve
  COOP/COEP headers; documented expected and verified in spike).
- Pyodide cold-start time on a developer-class machine (record an
  approximate range; precise budgeting is Measurement C, item #3).
- `micropip` install warnings or pure-Python fallbacks for
  Frictionless dependencies, if any.
- Differences between Chrome and Firefox in error handling, console
  noise, or wheel resolution.
- If the spike PASSED cleanly with no notable observations, record an
  explicit "Spike A — none observed beyond the platform constraints
  already known to the constitution."

<!-- PENDING entries go here after manual reproduction. -->

---

### Spike B — Mini-shell pipes prototype

**Status: PENDING.** See `backlog.md` item #2.

### Measurement C — Pyodide latency budget

**Status: PENDING.** See `backlog.md` item #3. Cancellation strategy
(item #31) depends on the placement decision recorded here.

---

## Cross-cutting (carried from `spec.md` §6.5 / §10)

These will be enumerated as their owning features land in E1/E2 and
are listed here as forward references so this document is not empty
during Phase 0:

- No SharedArrayBuffer (cross-origin isolation) on GitHub Pages.
- Serialised pipes in the mini-shell (no parallel stages).
- No `&&` / `||` / `;` chaining, no subshells, no env-var expansion,
  no globs, no tab completion.
- `ModuleNotFoundError` for Python packages without Pyodide-compatible
  wheels.
- No in-IDE note-taking.
- No mobile / small-screen support.
- No in-band cancellation if Pyodide ends up on the main thread
  (decision deferred to Measurement C, item #3).
