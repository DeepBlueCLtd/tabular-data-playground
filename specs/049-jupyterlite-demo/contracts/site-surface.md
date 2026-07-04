# Contract: Published Site URL Surface

The demo adds one new path to the published `gh-pages` tree. The existing
surface is unchanged.

## Deploy (push to `main`) — served under `/tabular-data-playground/`

| Path | Serves | Status |
|------|--------|--------|
| `/` | Static welcome page (`web/index.html`) | EXISTING — **edited**: gains a labelled link to `/jupyterlite/` |
| `/slides/` | reveal.js findings deck | EXISTING — unchanged |
| `/playground/` | Frozen Vite IDE (`app/dist/`) | EXISTING — **unchanged** (frozen; FR-008) |
| `/sample-package/` | Lesson 8 Data Package | EXISTING — unchanged |
| `/jupyterlite/` | **NEW** — JupyterLite demo site (`jupyter lite build` output) | NEW |

## PR preview — served under `/pr-preview/pr-<N>/`

The same relative surface is reproduced per PR, so the demo is reviewable
before merge:

- `/pr-preview/pr-<N>/` → welcome (with the link)
- `/pr-preview/pr-<N>/slides/`
- `/pr-preview/pr-<N>/playground/`
- `/pr-preview/pr-<N>/jupyterlite/` → **NEW** demo

## Guarantees

- **G1 (discoverability, FR-004)**: The welcome page at `/` (and per-PR
  equivalent) contains a visible, labelled hyperlink whose target resolves to
  the `/jupyterlite/` demo under the same base.
- **G2 (headline, FR-002/FR-003)**: Opening `/jupyterlite/`, opening
  `demo.ipynb`, and running all cells renders ≥1 matplotlib figure inline, in
  the browser, with no server call beyond static-asset + CDN wheel fetches.
- **G3 (cold load, FR-005)**: G2 holds on a first uncached visit in current
  Chrome and Firefox.
- **G4 (isolation, FR-008)**: The `/playground/` bytes and the frozen pins are
  identical before and after this change; `keep_files: true` and PR-preview
  behaviour are preserved.
- **G5 (no leak, FR-009)**: Nothing under `/jupyterlite/` contains
  project-specific or sensitive data.
