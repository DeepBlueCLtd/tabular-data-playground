# JupyterLite Demo

A self-contained in-browser JupyterLite site that ships one example notebook
(`demo.ipynb`) loading a sample CSV and rendering matplotlib figures inline.
Everything runs in the browser via Pyodide — no server, no account required.

Published at `/jupyterlite/` on the GitHub Pages site alongside the frozen
playground (`/playground/`). The two surfaces are built by independent
toolchains and share no pins.

## Requirements

Python 3.11+ (build-time only). The notebook runs against the JupyterLite
Pyodide kernel's bundled Python in-browser; no local Python is used at
runtime.

## Single reproducible build command

From the **repository root**:

```bash
pip install -r jupyterlite/requirements.txt
jupyter lite build \
  --config jupyterlite/jupyter_lite_config.json \
  --output-dir jupyterlite/_output
```

The output is written to `jupyterlite/_output/`. Serve locally with:

```bash
jupyter lite serve \
  --config jupyterlite/jupyter_lite_config.json \
  --output-dir jupyterlite/_output
```

Then open `http://localhost:8000` (or the URL printed in the terminal),
navigate to `demo.ipynb`, and run all cells — a matplotlib figure should
render inline.

## Base URL parameterisation

For deployment under a sub-path, pass `--base-url` to the build command:

```bash
jupyter lite build \
  --config jupyterlite/jupyter_lite_config.json \
  --output-dir jupyterlite/_output \
  --base-url /tabular-data-playground/jupyterlite/
```

The CI workflows set the correct base URL for production
(`/tabular-data-playground/jupyterlite/`) and for PR previews
(`/tabular-data-playground/pr-preview/pr-<N>/jupyterlite/`).

## Pinned toolchain

Versions are pinned in `requirements.txt`. Do **not** bump them without
verifying the demo notebook still renders correctly, and update the
"Pinned versions" table in `README.md` at the repository root accordingly.

| Package | Version |
|---------|---------|
| jupyterlite-core | 0.8.0 |
| jupyterlite-pyodide-kernel | 0.8.1 |

## Directory layout

```
jupyterlite/
├── requirements.txt         # Build-time Python deps (pinned)
├── jupyter_lite_config.json # Build configuration
├── jupyter-lite.json        # Runtime configuration (kernel, disabled features)
├── README.md                # This file
├── .gitignore               # Excludes _output/ from version control
└── files/                   # Content shipped into the JupyterLite site
    ├── demo.ipynb           # Example notebook
    └── data/
        └── sample.csv       # Generic sample dataset
```

The `_output/` directory is the build artefact and is **not committed** to
version control (see `.gitignore`).
