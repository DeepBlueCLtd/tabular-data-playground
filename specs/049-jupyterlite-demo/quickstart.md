# Quickstart: JupyterLite Demo Page

How to build, run, and verify the demo locally, and what lands in the repo.

## Build locally

```bash
# From repo root, in a Python 3.11+ environment
pip install -r jupyterlite/requirements.txt
jupyter lite build \
  --config jupyterlite/jupyter_lite_config.json \
  --output-dir jupyterlite/_output

# Serve the built site (any static server); e.g.
python -m http.server -d jupyterlite/_output 8000
# open http://localhost:8000/
```

## Verify (matches acceptance criteria)

1. **Discoverable (FR-004, SC-001)**: On the built welcome page (`web/index.html`
   in the assembled site), a labelled link points to the JupyterLite demo.
2. **Headline (FR-002/FR-003, SC-002)**: Open the demo, open `demo.ipynb`,
   Run All → a matplotlib figure renders inline.
3. **Cold load (FR-005)**: Repeat step 2 in a fresh Chrome and Firefox profile
   (empty cache) → figure still renders (allow time for the CDN wheel fetch).
4. **In-browser only (SC-003)**: Network tab shows only static-asset + CDN
   (Pyodide/wheel) requests; no app backend, no account prompt.
5. **Isolation (FR-008, G4)**: `/playground/` assets and README pins for the
   frozen playground are unchanged by this feature.

## Files this feature adds/edits

**New** (`jupyterlite/`):
- `requirements.txt` — pinned `jupyterlite-core`, `jupyterlite-pyodide-kernel`
- `jupyter_lite_config.json`, `jupyter-lite.json` — build/runtime config
- `README.md` — the single documented build command
- `content/demo.ipynb` — example notebook
- `content/data/sample.csv` — generic sample dataset

**Edited**:
- `web/index.html` — link to `/jupyterlite/`
- `.github/workflows/deploy.yml`, `.github/workflows/pr-preview.yml` — additive
  build+copy step
- `README.md` — JupyterLite/kernel/Pyodide/matplotlib pin rows
- `docs/limitations.md` — online-only + cold-load + separate-pins entry
- `.specify/memory/constitution.md` — Technology Constraints amendment
  (+ Sync Impact Report + MINOR version bump)

## Gotchas

- **Base URL is build-time.** A build made for one path won't work served at a
  different path. Use the environment's base URL (see
  `contracts/build-command.md`).
- **First load is heavy.** Pyodide + matplotlib wheels download on the cold
  visit; this is expected and documented in `docs/limitations.md`.
- **Online-only.** No offline/air-gapped path; wheel bundling is out of scope.
- **`_output/` is derived** — do not commit it (add to `.gitignore`).
