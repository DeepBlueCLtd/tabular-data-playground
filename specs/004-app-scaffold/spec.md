# Feature Specification: App Scaffold

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode — shared across all E1 items)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #4 (Epic E1) — "Vite + TypeScript + React 18 project scaffold under `app/` per `spec.md` §9 repo structure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Contributor can boot the app locally (Priority: P1)

A contributor clones the repo and wants to run the IDE shell on their workstation so that subsequent E1 work (FS, editor, terminal, Pyodide) has a working host page to render into.

**Why this priority**: Every other E1 item depends on a runnable scaffold. Without it, no further work can land. This is the single foundational item for the epic.

**Independent Test**: Clone the repo, run the documented dev command from `app/`, navigate to the printed local URL, and see a non-empty page rendered by the React app. No other E1 features need to exist.

**Acceptance Scenarios**:

1. **Given** a fresh clone on a workstation with the project's standard tooling installed, **When** the contributor runs the dev command from `app/`, **Then** a local dev server starts and serves an HTML page that renders a React-rendered placeholder (e.g. project name + "scaffold ready").
2. **Given** the same workstation, **When** the contributor runs the production build command from `app/`, **Then** a static asset bundle is produced under `app/dist/` and exits with status 0.
3. **Given** the production build output, **When** it is served as static files (any static server), **Then** the same placeholder page renders without console errors.
4. **Given** the scaffold, **When** a contributor opens the project in an editor with TypeScript support, **Then** type checking runs against `app/` with no errors on a fresh checkout.

---

### User Story 2 — Subsequent E1 items have a stable place to land code (Priority: P1)

The next E1 items (Tailwind, app shell layout, virtual FS, Monaco, terminal, Pyodide) need to add components, modules, and assets without first re-deciding the project layout.

**Why this priority**: A consistent layout matching `spec.md` §9 lets each downstream item compose without churn. Diverging from §9 here would force renames later.

**Independent Test**: Verify the directory tree under `app/` exists with the empty subfolders called for in `spec.md` §9 (`src/components/`, `src/shell/`, `src/pyodide/`, `src/fs/`, `src/lessons/`), and that `src/main.tsx`, `index.html`, `package.json`, `tsconfig.json`, and `vite.config.ts` are present at the documented paths.

**Acceptance Scenarios**:

1. **Given** the scaffold is in place, **When** a reviewer compares the `app/` tree to `spec.md` §9, **Then** every directory and top-level file listed in §9 exists at the same relative path. Empty subdirectories are tracked with a `.gitkeep` (or equivalent) so the layout is visible to contributors before they have anything to put in them.
2. **Given** the scaffold, **When** a contributor adds a new module under `app/src/`, **Then** existing `tsconfig.json` paths and module resolution accept it without further configuration.

---

### User Story 3 — CI can build the scaffold (Priority: P2)

A reviewer landing the scaffold wants the build verified in CI rather than only on the author's machine, even before `pnpm` (#5) and the CI workflow (#33) are in place.

**Why this priority**: This is a correctness check, not a blocker. Item #33 will introduce the actual workflow file; this item just guarantees the build *can* be invoked from a CI-style environment (clean install, no interactive prompts, no machine-specific paths).

**Independent Test**: From a fresh checkout in a clean container, run install + build commands non-interactively. Both exit 0 and produce `app/dist/`.

**Acceptance Scenarios**:

1. **Given** a clean container with no node_modules, **When** install + build are invoked non-interactively, **Then** both succeed without prompting the user and the produced bundle is byte-for-byte reproducible across two consecutive runs (modulo timestamps).
2. **Given** the scaffold, **When** the build is run, **Then** the bundle does not embed any path from the contributor's home directory.

---

### Edge Cases

- The scaffold must not assume a specific package manager has been wired into the repo root; pnpm wiring is item #5 and may add a `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and root config later. The scaffold's own `app/package.json` must be compatible with pnpm but should not require pnpm-only features to install (so that #5 can layer cleanly on top).
- The scaffold must not introduce dependencies outside the constitution's Technology Constraints. If something obviously useful (e.g. a router, a state library) is tempting, it stays out — every dependency must be justified by a future E1 item, not pre-emptively added here.
- The scaffold must coexist with the existing top-level files (`spec.md`, `backlog.md`, `.specify/`, `docs/`, `specs/`). It must not move or rename anything outside `app/` and `.github/` — and `.github/` is reserved for #33/#34.
- The scaffold's `index.html` must be safe to serve under a non-root path on GitHub Pages (item #34 will configure the deployment, but the Vite `base` setting should be parameterisable, not hard-coded to `/`).
- Empty placeholder content rendered by the scaffold should not imply the IDE is functional — it should clearly say "scaffold ready" or equivalent so a viewer doesn't mistake the empty page for a broken app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST contain an `app/` directory whose contents match the layout described in `spec.md` §9 (subdirectories `src/components/`, `src/shell/`, `src/pyodide/`, `src/fs/`, `src/lessons/`; top-level `src/main.tsx`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`; a `public/` directory).
- **FR-002**: The scaffold MUST provide a development command that starts a local dev server with hot module reloading.
- **FR-003**: The scaffold MUST provide a production build command that emits static assets under `app/dist/` and exits with status 0 on success.
- **FR-004**: The scaffold MUST render a minimal React 18 placeholder page (e.g. project name + "scaffold ready" line) when served, with no console errors.
- **FR-005**: The scaffold MUST be configured for TypeScript with `strict: true` so downstream items can rely on strict typing from day one.
- **FR-006**: The build's `base` path MUST be parameterisable (so item #34 can configure GitHub Pages deployment without modifying source code), with a sensible default suitable for local development.
- **FR-007**: The scaffold MUST NOT introduce npm/pnpm dependencies beyond those listed in the constitution's Technology Constraints. New dependencies introduced by this item MUST be enumerated in the plan and pinned to exact versions (Constitution Principle VI).
- **FR-008**: Empty subdirectories required by `spec.md` §9 MUST be tracked in git (via `.gitkeep` or equivalent) so the layout is visible before any code lands inside them.
- **FR-009**: The scaffold MUST not modify or move any file outside `app/` (with the explicit exception of optional updates to the root `.gitignore` to ignore `app/node_modules/` and `app/dist/`).
- **FR-010**: A short README stub at `app/README.md` MUST document the dev and build commands. This is a stub, not the project README (#54).

### Key Entities

- **App package**: The npm package rooted at `app/package.json`. Owns the dev/build scripts, dependency list, and TypeScript config for the IDE web app.
- **Scaffold placeholder page**: The minimal React component rendered by `src/main.tsx`. Exists only so contributors can confirm the build pipeline works; deleted/replaced when item #8 (app shell layout) lands.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A contributor with the project's standard tooling installed can go from `git clone` to a running dev server in under 2 minutes (cold install excluded; install timing belongs to #5 and is bounded there).
- **SC-002**: The production build completes in under 30 seconds on a typical contributor workstation for the placeholder page.
- **SC-003**: The placeholder page weighs under 200 kB gzipped end-to-end (HTML + JS + CSS) — this is a budget for the scaffold; downstream items will grow it but the scaffold itself should not pre-spend.
- **SC-004**: Type checking passes with zero errors and zero warnings on a fresh checkout.
- **SC-005**: Reviewer can map every entry in `spec.md` §9's `app/` subtree to a real path in the repo with no ambiguity.

## Assumptions

- The chosen scaffold uses Vite + React 18 + TypeScript, as named in the backlog row and in `spec.md` §9 (`vite.config.ts`). The plan step will pin exact versions per Constitution Principle VI.
- pnpm is **not** wired in this item. Item #5 owns pnpm setup, lockfile, and `--frozen-lockfile` in CI. This item's `app/package.json` is compatible with pnpm but does not depend on pnpm-specific features for install.
- ESLint/Prettier are **not** wired in this item; item #6 owns them. This item only needs `tsc --noEmit` (or equivalent type checking via `vite build`) to pass.
- Tailwind/shadcn are **not** wired in this item; item #7 owns them. The placeholder page uses inline styles or no styles.
- Theme provider, app shell layout, virtual FS, file tree, editor, terminal, Pyodide are all later items. The placeholder page is intentionally trivial.
- GitHub Actions / Pages are out of scope; items #33 and #34 own them. The scaffold must be CI-friendly (non-interactive install + build) but adds no workflow files.
- The scaffold's `app/README.md` is a stub for contributor orientation; the project-level README is item #54 in E3.
