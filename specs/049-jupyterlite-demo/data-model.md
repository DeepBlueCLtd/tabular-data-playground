# Phase 1 Data Model: JupyterLite Demo Page

This feature is a static demo, not a data-processing system. There is no
persistent server-side data and no runtime schema. The "entities" below are
the shipped build artefacts and their relationships.

## Entities

### JupyterLite demo site

- **What it is**: The static site emitted by `jupyter lite build`, published at
  `/tabular-data-playground/jupyterlite/` (deploy) or the PR-scoped preview
  path.
- **Composed of**: The JupyterLite app shell + the Pyodide kernel assets +
  the ingested `content/` (notebooks + data).
- **Source of truth**: `jupyterlite/` directory (config + requirements +
  content). Output is derived and not committed.
- **Validation / invariants**:
  - Built output directory (`_output/`) is non-empty after a successful build.
  - Base URL baked at build time matches the publish path (deploy vs preview).
  - Contains no project-specific or sensitive data (FR-009).
  - Independent of the frozen playground's assets and pins (FR-008).

### Example notebook (`demo.ipynb`)

- **What it is**: The shipped notebook a visitor opens and runs.
- **Fields / structure**: An ordered list of cells that (1) optionally install
  matplotlib in-browser, (2) load `data/sample.csv`, (3) produce ≥1 matplotlib
  figure rendered inline.
- **Relationships**: Reads the Sample tabular dataset; runs on the Pyodide
  kernel; lives inside the JupyterLite demo site's `content/`.
- **Validation / invariants**:
  - Run-All produces at least one inline matplotlib figure (FR-002, FR-003).
  - Uses only the pinned kernel + explicitly installed packages.

### Sample tabular dataset (`data/sample.csv`)

- **What it is**: A generic, light CSV used as plotting input.
- **Fields / structure**: A small number of columns × a few dozen rows;
  neutral/public content.
- **Relationships**: Consumed by `demo.ipynb`.
- **Validation / invariants**:
  - Generic and shareable; no sensitive or project-specific data (FR-009).
  - Small enough to keep payload light (research R6).

### Pin set (`jupyterlite/requirements.txt` + README rows)

- **What it is**: The exact-version pins for the demo toolchain.
- **Fields**: `jupyterlite-core==X.Y.Z`, `jupyterlite-pyodide-kernel==A.B.C`,
  plus recorded Pyodide (carried by the kernel) and matplotlib versions in the
  README table.
- **Relationships**: Independent of the frozen playground's Pyodide `0.27.7`.
- **Validation / invariants**:
  - All pins are exact (`==`), no ranges (Constitution VI).
  - Every pin is recorded in `README.md` (gate 5).

## State transitions

None at runtime. The only lifecycle is the build/publish pipeline:

`jupyterlite/ source` → `jupyter lite build` → `_output/` → copied to
`_site/jupyterlite/` → published to `gh-pages` → served at `/jupyterlite/`.

Visitor-side, the notebook has ordinary Jupyter cell execution state, held
entirely in the browser (JupyterLite IndexedDB); it never reaches a server and
is out of scope for persistence.
