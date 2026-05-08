# Feature Specification: GitHub Pages Deploy

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Input**: Backlog item #34 — "GitHub Pages deploy on push to `main`."

## User Scenarios

### Story 1 — Every push to main updates the public site (P1)

The project is a static SPA hosted on GitHub Pages (Constitution Principle IV). When the epic PR merges to `main`, the deployed site updates automatically.

**Independent Test**: After this item lands, a push to `main` triggers a workflow that builds the app and publishes `app/dist/` to GitHub Pages. The deployed URL serves the current placeholder (or whatever is on `main` at the time).

**Acceptance**:

1. **Given** a push to `main`, **When** the deploy workflow runs, **Then** it builds with `VITE_BASE_PATH=/<repo>/`, uploads `app/dist/` as a Pages artefact, and deploys to GitHub Pages.
2. **Given** a deployed site, **When** a contributor visits `https://deepbluecltd.github.io/tabular-data-playground/`, **Then** the page renders the current `app/dist/index.html` with no console errors.
3. **Given** a PR (not yet merged), **When** the workflow file's triggers are inspected, **Then** the deploy job runs only on `push: main` (and `workflow_dispatch`), not on PRs.

### Edge Cases

- The repo's GitHub Pages must be configured to source from "GitHub Actions" (not "branch: gh-pages"). This item assumes that configuration; if not set, the first deploy will fail clearly until it is.
- The deploy must be idempotent — re-running on the same commit is harmless and produces the same artefact.
- Concurrent deploys (e.g. two pushes in quick succession) should serialise; using `concurrency: { group: pages, cancel-in-progress: true }` is the canonical pattern.
- The `base` path passed to Vite must match the deployed URL prefix. For `deepbluecltd/tabular-data-playground`, the Pages URL is `/tabular-data-playground/`.

## Requirements

- **FR-001**: A workflow at `.github/workflows/deploy.yml` MUST exist.
- **FR-002**: The workflow MUST trigger on `push: { branches: [main] }` and `workflow_dispatch` (manual button).
- **FR-003**: The workflow MUST run two jobs: `build` (produces the artefact) and `deploy` (publishes it). `deploy` depends on `build`.
- **FR-004**: The build step MUST set `VITE_BASE_PATH=/tabular-data-playground/` so Vite emits asset URLs that work under the Pages prefix.
- **FR-005**: The workflow MUST use `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, and `actions/deploy-pages@v4` (the official GitHub Pages action chain).
- **FR-006**: Permissions MUST be set per-job: `build` needs `contents: read`; `deploy` needs `pages: write` and `id-token: write`.
- **FR-007**: A `concurrency` group named `pages` MUST be set with `cancel-in-progress: false` (don't cancel in-flight deploys; let them finish, queue the next).
- **FR-008**: This item MUST NOT modify `ci.yml` from #33.
- **FR-009**: All Action versions pinned to a major version (Constitution VI).

## Success Criteria

- **SC-001**: After merging the epic PR to `main`, the deployed URL renders the placeholder page within 5 minutes.
- **SC-002**: Asset URLs in the deployed `index.html` are prefixed with `/tabular-data-playground/`.
- **SC-003**: The first deploy is also the first time E1's exit criterion ("paste a CSV, run frictionless describe, see output") becomes verifiable in a real browser; later items will fill in that capability.

## Assumptions

- Repo GitHub Pages is set to "Source: GitHub Actions." If not, the first deploy fails with an actionable error and the user enables it once.
- The repo URL slug is `tabular-data-playground` (matching the local checkout). If renamed, `VITE_BASE_PATH` is updated accordingly.
- The Pages site is public (Pages defaults). No auth gating is in scope (Constitution Principle IV).
