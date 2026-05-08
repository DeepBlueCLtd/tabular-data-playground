# Data Model — Spike A

The spike has no persistent storage and no domain entities. The only
in-memory entity worth naming is the **Run Record**, which is the
artefact the spike produces and the durable Phase 0 output it feeds.

## Run Record

A single object held in memory while the spike runs and rendered to the
page; copyable as plain text for pasting into `docs/architecture.md`.

| Field | Type | Description |
|-------|------|-------------|
| `browser` | string | Human-readable browser identification (e.g. `Chrome 134 on Linux`). Sourced from `navigator.userAgent` plus a hand-edit by the author when transcribing. |
| `pyodide.pinned_url` | string | The CDN URL pinned in `pyodide.config.js`. |
| `pyodide.runtime_version` | string | `pyodide.version` read at runtime. Should match the URL. |
| `frictionless.version` | string | First non-empty line of `frictionless --version` stdout. |
| `steps[]` | array of step records | Ordered captures, one per spike step (see below). |
| `outcome` | enum: `PASS` \| `FAIL` | PASS iff every step has `exit_code === 0` and the two frictionless steps produced non-empty stdout. |
| `total_elapsed_ms` | integer | Wall-clock time from Run click to outcome render. |
| `notes` | string | Free-form text the author can edit on-page to capture sharp edges before copying out. |

### Step record

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | One of: `pyodide_load`, `micropip_install_frictionless`, `frictionless_version`, `frictionless_validate`. |
| `started_at_ms` | integer | Performance timeline offset at start. |
| `elapsed_ms` | integer | Wall-clock duration. |
| `stdout` | string | Captured stdout (may be empty for non-CLI steps). |
| `stderr` | string | Captured stderr (may be empty). |
| `exit_code` | integer | 0 on clean exit; non-zero on `SystemExit(code)` or wrapped exception. |
| `exception_summary` | string \| null | Class name + first line of message if a Python exception escaped capture; null otherwise. |

## Validation rules (in spec terms)

- `outcome === 'PASS'` iff:
  - every `steps[].exit_code === 0`, AND
  - the `frictionless_version` step's `stdout` is non-empty, AND
  - the `frictionless_validate` step's `stdout` is non-empty.
- `outcome === 'FAIL'` is the default in any other case, including
  silent timeouts (the page must time out steps explicitly rather than
  hanging — see spec edge cases and contracts/run-record.md).

## State transitions

```
idle → running(pyodide_load) → running(micropip_install) →
running(frictionless_version) → running(frictionless_validate) →
done(PASS|FAIL)
```

A second click on Run while in any `running(...)` state is ignored
(spec edge cases). After `done`, Run becomes available again so the
reader can re-time a "warm" execution.

## What is deliberately NOT modelled

- No persistence. Reload starts from `idle`.
- No history of past runs. Re-running overwrites the on-page record.
- No multi-user state. Single user, single tab.
- No virtual FS modelling beyond writing `/sample.csv` for the validate
  step. The proper virtual FS facade arrives in E1 (item #11).
