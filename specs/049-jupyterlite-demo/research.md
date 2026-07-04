# Phase 0 Research: JupyterLite Demo Page

All Technical-Context unknowns are resolved below. No `NEEDS CLARIFICATION`
markers remain.

## R1 — Build tool: `jupyter lite build` (jupyterlite-core)

- **Decision**: Build the demo with the JupyterLite CLI: `jupyter lite build`
  driven by a `jupyterlite-core` pinned in `jupyterlite/requirements.txt`. The
  CLI reads `jupyter_lite_config.json`, ingests `jupyterlite/content/`, and
  emits a static site to `_output/`.
- **Rationale**: This is the canonical, single-command JupyterLite build (the
  issue's "reproducible via a single documented command" acceptance). It
  produces a fully static tree suitable for `gh-pages`, matching how the site
  already publishes static artefacts via peaceiris.
- **Alternatives considered**: Hand-rolling a Pyodide notebook UI inside the
  existing app — rejected: it would touch the frozen playground runtime and
  isn't a real JupyterLite surface. Using a hosted JupyterLite template repo —
  rejected: adds an opaque external template; in-repo source keeps pins and
  content reviewable and reproducible.

## R2 — Kernel: `jupyterlite-pyodide-kernel`

- **Decision**: Ship the Pyodide kernel (`jupyterlite-pyodide-kernel`, pinned)
  so notebooks run Python in-browser. matplotlib is obtained in-browser via
  the kernel's `piplite`/Pyodide package index at notebook runtime (a
  `%pip install matplotlib` or `piplite.install` cell), or is already present
  in the kernel's Pyodide distribution.
- **Rationale**: The Pyodide kernel is the standard way to get client-side
  Python + scientific stack in JupyterLite, and it is what makes matplotlib
  render inline with zero server. Keeping matplotlib install explicit in the
  notebook makes the payload weight visible and controllable (issue's
  "payload weight" consideration).
- **Alternatives considered**: Bundling/vendoring wheels into the site for an
  offline path — explicitly **out of scope** (issue) and heavier; the demo is
  online-only by design. The pure-JS/xeus kernels — rejected: no Python/
  matplotlib.

## R3 — Pinning strategy (Constitution VI + gate 5)

- **Decision**: Pin exact versions in `jupyterlite/requirements.txt` with
  `==` (no ranges), e.g.:
  ```
  jupyterlite-core==<X.Y.Z>
  jupyterlite-pyodide-kernel==<A.B.C>
  ```
  The concrete version numbers are locked at implementation time from the
  build environment (`pip index versions` / the installed set) and recorded
  in `README.md`'s "Pinned versions" table alongside the Pyodide version the
  kernel carries and the matplotlib version the notebook installs. The demo's
  pins are **independent** of the frozen playground's Pyodide `0.27.7`.
- **Rationale**: The constitution makes pinning non-negotiable and requires
  pins recorded in the README; exact `==` pins make any tagged build
  reproducible. Independence from the frozen playground honours "must not
  modify or share the frozen runtime."
- **Alternatives considered**: Sharing the playground's Pyodide pin — rejected:
  couples the demo to the freeze. Unpinned "latest" — rejected: violates
  Principle VI and makes builds non-reproducible.
- **Note**: Exact version strings are an implementation detail, not a scope
  decision, so they are not `NEEDS CLARIFICATION`; the *mechanism* (pinned
  `requirements.txt` + README rows) is fixed here.

## R4 — Publish path & workflow integration (additive)

- **Decision**: Publish to `/jupyterlite/`. In both `deploy.yml` and
  `pr-preview.yml`, add — **after** the existing IDE copy — a step that:
  (a) sets up Python, (b) `pip install -r jupyterlite/requirements.txt`,
  (c) runs `jupyter lite build` (output configured for base URL
  `/tabular-data-playground/jupyterlite/` on deploy and the PR-scoped base on
  previews), (d) copies `_output/.` into `_site/jupyterlite/`. The existing
  pnpm IDE build, `keep_files: true`, and sample-package handling are
  untouched.
- **Rationale**: Mirrors the established pattern where `/slides/` and
  `/playground/` are assembled into `_site` from independent sources; keeps
  the change additive and the frozen playground build byte-for-byte unchanged
  (FR-007, FR-008). PR previews get the demo too, so it's reviewable before
  merge (the preview bot already lists welcome/slides/IDE URLs; the demo joins
  that tree).
- **Alternatives considered**: A separate standalone workflow — rejected:
  duplicates checkout/publish plumbing and risks racing peaceiris publishes to
  the same `gh-pages` branch. Publishing the demo at the site root — rejected:
  the issue asks for a dedicated subdirectory and root is the welcome page.
- **Base-path caveat**: JupyterLite bakes its base URL at build time. Deploy
  and PR-preview builds therefore need different base URLs (like the IDE's
  `VITE_BASE_PATH`). This is captured in `contracts/build-command.md`.

## R5 — Landing-page link target (FR-004)

- **Decision**: Add the visible, labelled link to the **static site welcome
  page** `web/index.html` (served at `/`), pointing at `/jupyterlite/`.
- **Rationale**: "Linked from the landing page" most naturally means the
  public site entry point that every visitor hits first; `web/index.html` is
  static, reproducible, and outside the frozen app, so the link needs no app
  rebuild. It sits beside the existing welcome→slides/playground links.
- **Alternatives considered**: Linking from the in-app React landing page
  (spec 041, inside `/playground/`) — rejected: that lives inside the frozen
  playground and would mean editing the frozen app; the issue's intent (site
  discoverability) is served better and more cheaply from the site welcome
  page. If the maintainer wants both, adding the in-app link later is a
  separate, optional change.

## R6 — Sample data (FR-003, FR-009, payload weight)

- **Decision**: Ship one small, generic CSV (e.g. a handful of columns × a few
  dozen rows — a neutral dataset such as monthly values or a classic public
  sample) under `jupyterlite/content/data/sample.csv`. The notebook reads it
  with the standard library `csv` (or a light pandas read if pandas is already
  pulled) and plots with matplotlib.
- **Rationale**: Keeps the wheel download light (the issue flags numpy/pandas
  weight) and the data unambiguously shareable/non-sensitive. A pure-`csv`
  read avoids forcing pandas into the payload unless a plot genuinely needs it.
- **Alternatives considered**: A Frictionless datapackage sample — acceptable
  per the spec but heavier to justify for a plotting demo; CSV is the lightest
  path to the headline (a rendered figure). Fetching remote data at runtime —
  rejected: adds a failure mode and offline surprise beyond the intended
  Pyodide/CDN fetch.

## R7 — Verification approach (FR-005, testing)

- **Decision**: Primary verification is a manual cold-load check in Chrome and
  Firefox: open `/jupyterlite/`, open `demo.ipynb`, Run All, confirm a
  matplotlib figure renders inline. CI adds a cheap guard that
  `jupyter lite build` succeeds and `_output/` is non-empty. An optional
  Playwright Chromium smoke can open the built page and assert a figure
  element appears.
- **Rationale**: The acceptance criteria are visitor-facing and browser-bound;
  a build-succeeds guard catches the common regression (broken build) cheaply,
  while the manual cold-load check covers the real "works from cold load"
  criterion. Full headless notebook execution in CI is higher-cost and can be
  deferred.
- **Alternatives considered**: Full automated notebook execution in CI (e.g.
  headless Run-All) — deferred: valuable but not required for the MVP and adds
  CI weight; can be added later if the demo grows.
