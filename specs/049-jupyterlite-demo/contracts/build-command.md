# Contract: Reproducible Build Command

Satisfies FR-006 ("reproducible via a single documented command") and FR-007
(additive workflow step).

## Single documented command (local + CI)

From the repository root, with a pinned Python environment:

```bash
pip install -r jupyterlite/requirements.txt \
  && jupyter lite build \
       --config jupyterlite/jupyter_lite_config.json \
       --output-dir jupyterlite/_output
```

`jupyter_lite_config.json` fixes the content root (`jupyterlite/content/`) and
output location; the base URL is supplied per environment (see below). This
one command is documented verbatim in `jupyterlite/README.md`.

## Base URL parameterisation

JupyterLite bakes its base URL at build time (analogous to the IDE's
`VITE_BASE_PATH`). The publish path differs by environment:

| Environment | Base URL |
|-------------|----------|
| Deploy (`main`) | `/tabular-data-playground/jupyterlite/` |
| PR preview | `/tabular-data-playground/pr-preview/pr-<N>/jupyterlite/` |

The base URL is passed via the JupyterLite config / CLI flag at build time in
each workflow; local builds may use the default/root base for quick checks.

## Workflow integration (additive)

In **`.github/workflows/deploy.yml`** and **`.github/workflows/pr-preview.yml`**,
after the existing IDE build + copy and before the peaceiris publish:

1. `actions/setup-python@<pinned>` (Python 3.11+).
2. `pip install -r jupyterlite/requirements.txt`.
3. `jupyter lite build` with the environment's base URL.
4. `cp -r jupyterlite/_output/. _site/jupyterlite/` (after
   `mkdir -p _site/jupyterlite`).

## Invariants

- **C1**: The command exits 0 and produces a non-empty output dir on a clean
  checkout (CI guard).
- **C2**: The step does **not** invoke pnpm, does not touch `app/`, and does
  not alter the existing IDE/`slides`/`sample-package` assembly. It only adds
  `_site/jupyterlite/`.
- **C3**: All Action versions and Python deps are pinned (Constitution VI).
- **C4**: Re-running on the same commit is idempotent (same inputs → same
  published tree, modulo timestamps).
