# Quickstart — Spike A

How to run the spike and capture its result for `docs/architecture.md`.

## Run from the repo

```sh
# From the repo root:
cd app/spikes/spike-a
python3 -m http.server 8000
# In a fresh tab:
#   http://localhost:8000/
```

A bare `file://` open also works in most browsers, but Pyodide's CDN
fetch is more reliable through `http://`. If you hit a CORS issue with
`file://`, switch to `http.server`.

## Run the spike

1. Click **Run**.
2. Watch the four steps progress: `pyodide_load` →
   `micropip_install_frictionless` → `frictionless_version` →
   `frictionless_validate`.
3. The page renders a **PASS** or **FAIL** banner and a step table.

Expected on a successful run:

- Banner: `PASS`
- `frictionless_version` stdout: a non-empty version string.
- `frictionless_validate` stdout: a tabular validation report
  referencing `sample.csv`.
- All exit-codes: `0`.

## Capture the result

1. Click **Copy results**. The clipboard now contains a markdown block
   in the format defined by
   [`contracts/run-record.md`](contracts/run-record.md).
2. Edit the `Notes` line if you observed anything noteworthy
   (cross-origin isolation absent, slow cold start, micropip warning,
   etc.).
3. Paste the block into `docs/architecture.md` under the Phase 0
   section. Repeat for both Chrome and Firefox.

## What to do if it fails

The page itself shows which step failed and the captured
stderr / exit-code. Treat the failure as the spike's primary finding:

- Copy the (failing) result block into `docs/architecture.md` anyway —
  the failure mode is the deliverable in that case.
- Record the proximate cause in `docs/limitations.md` (Constitution
  Principle VII).
- Update the E0 go/no-go in `docs/architecture.md` to reflect that
  Phase 0 returned a re-plan signal (frictionless-js fallback or
  alternative runtime).
- **Stop**. Do not start E1 work.

## What to verify before declaring item #1 done

- [ ] Spike runs to PASS on latest Chrome on a developer-class machine.
- [ ] Spike runs to PASS on latest Firefox on a developer-class machine.
- [ ] Both run records pasted into `docs/architecture.md`.
- [ ] Pinned Pyodide version recorded in `docs/architecture.md`.
- [ ] Resolved Frictionless version recorded in
      `docs/architecture.md`.
- [ ] Any sharp edges added to `docs/limitations.md` in the same
      change.
- [ ] Backlog row #1 status bumped to `complete` and `Updated` to
      today's date.
