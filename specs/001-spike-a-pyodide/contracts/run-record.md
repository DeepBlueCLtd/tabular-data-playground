# Contract — Spike A Run Record

The spike's only "interface" is the artefact it produces for
`docs/architecture.md`. This document fixes the textual format so that
the Chrome run, the Firefox run, and any future re-run are
comparable.

## Output format (paste into docs/architecture.md)

````markdown
### Spike A — Pyodide + Frictionless install proof

**Browser**: <e.g. Chrome 134 on Linux>
**Date**: <YYYY-MM-DD>
**Outcome**: PASS | FAIL
**Total elapsed**: <N> ms

**Versions**:

- Pyodide pinned URL: `<URL>`
- Pyodide runtime version: `<X.Y.Z>`
- Frictionless: `<X.Y.Z>` (resolved by `micropip`)

**Steps**:

| # | Step | Elapsed | Exit | Stdout (first line) | Stderr |
|---|------|---------|------|---------------------|--------|
| 1 | pyodide_load | <ms> | 0 | — | — |
| 2 | micropip_install_frictionless | <ms> | 0 | — | — |
| 3 | frictionless_version | <ms> | 0 | `<version>` | — |
| 4 | frictionless_validate | <ms> | 0 | `<first stdout line>` | — |

**Notes / sharp edges observed**:

- <free-form, e.g. "crossOriginIsolated === false; no impact on this run">
- <e.g. "micropip warned about ...">
````

A FAIL record uses the same shape but marks the failing step's row
with the captured stderr / exit-code / exception.

## Required fields per outcome

For PASS:

- All four step rows present with `exit_code === 0`.
- `Pyodide pinned URL` and `Pyodide runtime version` both present and
  equal in version-number portion.
- `Frictionless` version present.
- `frictionless_version` and `frictionless_validate` rows have
  non-empty stdout (captured first-line representative).

For FAIL:

- The row of the failing step shows its actual `exit_code` and the
  first line of stderr (or exception summary if the step crashed
  before producing stderr).
- All preceding step rows still listed with their PASS-shaped data.
- Subsequent step rows omitted (the spike halts on first failure).
- `Notes` captures what the spike believed was the proximate cause.

## Definition of "ready to copy"

The on-page "Copy results" action emits exactly the markdown block
above. The author may then edit the `Notes` line before pasting into
`docs/architecture.md`. No other transformation is required.

## Non-goals

- This contract does **not** define a JSON schema. The artefact is
  meant to be human-readable in the architecture doc; structured
  storage is out of scope for the spike.
- No comparison harness across browsers. The author eyeballs the two
  records side-by-side in the architecture doc.
