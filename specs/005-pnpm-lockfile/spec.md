# Feature Specification: pnpm Setup with Committed Lockfile

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #5 (Epic E1) — "pnpm setup with committed lockfile; CI uses `--frozen-lockfile` (decision #17)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Reproducible installs across contributors and CI (Priority: P1)

A contributor cloning the repo runs the standard install command and gets the exact same dependency tree the author used. Item #33 will configure CI to fail if the lockfile is out of date — this item supplies the lockfile.

**Why this priority**: Without a committed lockfile, every install drifts the dependency tree, which defeats Constitution Principle VI (Pin and Freeze). This is the single foundational change between #4's pinned `package.json` and a reproducible build.

**Independent Test**: From a fresh clone, `cd app && pnpm install --frozen-lockfile` exits 0 without warnings and produces an `app/node_modules/` consistent with the committed lockfile. Re-running the command on a second machine produces the same `node_modules/` tree (same package versions throughout).

**Acceptance Scenarios**:

1. **Given** a fresh clone, **When** the contributor runs `pnpm install --frozen-lockfile` from `app/`, **Then** the install succeeds and the lockfile is unchanged in `git status`.
2. **Given** the same clone, **When** the contributor runs `pnpm install` (without `--frozen-lockfile`) and the lockfile is up-to-date, **Then** the install succeeds with no lockfile changes.
3. **Given** a contributor adds a new dependency to `app/package.json` without updating the lockfile, **When** they run `pnpm install --frozen-lockfile`, **Then** the install fails with a clear error — exactly the behaviour CI (#33) will rely on.

---

### User Story 2 — pnpm version is pinned for the entire project (Priority: P1)

The project pins one pnpm version so contributors and CI use the same tool. Different pnpm versions can produce subtly different lockfiles.

**Why this priority**: Pinning the lockfile is meaningless if the tool that consumes it floats. Constitution Principle VI ("All external versions ... pinned").

**Independent Test**: A contributor with Corepack enabled runs `pnpm install` from `app/`; Corepack auto-installs the pinned pnpm version on first run. The pin is recorded in a single canonical place.

**Acceptance Scenarios**:

1. **Given** the scaffold, **When** a contributor with Corepack enabled runs any `pnpm` command in `app/`, **Then** Corepack uses exactly the pinned pnpm version recorded in `app/package.json`.
2. **Given** the scaffold, **When** a reviewer searches for "pnpm version," **Then** the canonical pin appears in `app/package.json` (`packageManager` field) and is referenced by `app/README.md`.

---

### Edge Cases

- The npm-generated `package-lock.json` from item #4's verification must not coexist with `pnpm-lock.yaml` in the committed tree — pnpm warns when both exist. The `package-lock.json` was gitignored in #4; this item deletes it from the working tree (it is untracked anyway).
- The gitignore stanza added in #4 that excludes `package-lock.json` is removed by this item; with pnpm there is no npm lockfile to ignore.
- Contributors without Corepack enabled must still be able to run pnpm. The `app/README.md` notes the Corepack opt-in; non-Corepack contributors install pnpm globally at the pinned version. This item does not enforce a Corepack requirement on contributors.
- The lockfile must be reviewable in PRs. pnpm's lockfile is YAML and diffable line-by-line; no `binary: true` gitattributes magic is required.
- A future minor pnpm bump (e.g. from `10.33.x` to `10.34.0`) is permitted as a strict patch/minor refresh; a major bump (e.g. 10 → 11) requires re-running this gate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `app/package.json` MUST include a `packageManager` field pinned to an exact pnpm version (e.g. `"pnpm@10.33.0"`).
- **FR-002**: A `pnpm-lock.yaml` file MUST exist at `app/pnpm-lock.yaml`, generated against the pinned dependency list from item #4 (`react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`).
- **FR-003**: The lockfile MUST be checked into git (not gitignored).
- **FR-004**: `app/.gitignore` MUST no longer contain a `package-lock.json` stanza after this item; the npm lockfile is removed from the working tree.
- **FR-005**: `app/README.md` MUST be updated so the documented install command is `pnpm install --frozen-lockfile` (and `pnpm run dev` / `pnpm run build` for the runtime commands).
- **FR-006**: `specs/004-app-scaffold/quickstart.md` MUST be updated similarly so the previous item's quickstart matches the new install verb. (Updating the prior feature's docs is the cheapest place to keep them in sync.)
- **FR-007**: `pnpm install --frozen-lockfile` MUST exit 0 against the committed lockfile on a fresh checkout.
- **FR-008**: `pnpm run build` MUST succeed and emit `app/dist/` (i.e. all #4 functionality continues to work under pnpm).
- **FR-009**: No CI workflow file (`.github/workflows/`) is added by this item; that is item #33's responsibility. This item only ensures the lockfile and scripts are pnpm-ready so #33 can wire CI without re-blocking on lockfile work.
- **FR-010**: No new dependencies are added; pnpm is itself a tool, not a runtime dependency, and is referenced via `packageManager` only.

### Key Entities

- **`pnpm-lock.yaml`**: The dependency lock file. Records exact resolved versions, integrity hashes, and the dependency graph. Source of truth for reproducible installs.
- **`packageManager` field**: A string in `package.json` (Corepack-aware) of the form `"pnpm@10.33.0"`. Pins the tool version.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A contributor can go from `git clone` to a complete install in under 30 seconds on a typical workstation with Corepack enabled (cold cache excluded).
- **SC-002**: `pnpm install --frozen-lockfile` exits 0 on a clean checkout with no warnings about lockfile drift.
- **SC-003**: The lockfile diff in this item's commit consists only of additions (creation) — no deletion of an older lockfile, since none existed before.
- **SC-004**: After this item lands, no automated install in the project relies on `package-lock.json`.

## Assumptions

- The chosen pnpm version is whatever is current and stable at the time of implementation; the implementer pins the exact version found via `pnpm --version` (constitution Principle VI lets a strict-patch refresh land at implementation time provided the swap is recorded in plan Notes).
- Contributors are expected to have Node.js installed at a version compatible with both Vite 6 and pnpm 10.x. The `app/README.md` may add a one-line note about Node version; documenting the Node version policy in the constitution is a separate amendment if needed.
- The project's CI (item #33) will use `pnpm install --frozen-lockfile`; this item only ensures the lockfile is a faithful pin so #33 has something to verify against.
- This item does not migrate root-level scripts, since `app/` is currently the only npm package in the repo. A `pnpm-workspace.yaml` is not required for v1; if a future item introduces a second package this is revisited.
