# Feature Specification: CI on PR

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Input**: Backlog item #33 — GitHub Actions CI: `pnpm build` and `pnpm test` on PR.

## User Scenarios

### Story 1 — PRs verify the app still installs, lints, and builds (P1)

A contributor opens a PR. CI runs against the PR head and reports green/red so reviewers know the change passes the same gates the author should have run locally.

**Independent Test**: Open a draft PR; the workflow runs and reports success on a clean change. Introducing a deliberate regression (e.g. a TS error) makes the CI run fail with a readable error pointing at the file/line.

**Acceptance**:

1. **Given** a PR targeting `main`, **When** CI runs, **Then** it executes (in order): `pnpm install --frozen-lockfile`, `pnpm run lint`, `pnpm run format:check`, `pnpm run build`, `pnpm test`.
2. **Given** a PR with a lockfile-drift change (modified `package.json` without regenerating the lockfile), **When** CI runs, **Then** it fails at the install step.
3. **Given** a PR with a lint or format violation, **When** CI runs, **Then** the appropriate step fails first.
4. **Given** a PR, **When** CI runs, **Then** the run completes within 4 minutes on a typical GitHub-hosted runner (excluding queue time).

## Requirements

- **FR-001**: A workflow file at `.github/workflows/ci.yml` MUST exist.
- **FR-002**: The workflow MUST trigger on `pull_request` against `main`.
- **FR-003**: The workflow MUST also trigger on `push` to `main` (so post-merge runs are recorded).
- **FR-004**: The workflow MUST run on `ubuntu-latest`.
- **FR-005**: The workflow MUST set up Node.js (version compatible with Vite 6 and pnpm 10) and pnpm at the version pinned in `app/package.json`'s `packageManager` field.
- **FR-006**: The workflow MUST execute, in order: install (frozen), lint, format:check, build, test, with the working directory set to `app/` for those steps.
- **FR-007**: Failure of any step MUST fail the workflow (no `continue-on-error`).
- **FR-008**: The workflow MUST be the **only** workflow added by this item; the GitHub Pages deploy is item #34.
- **FR-009**: The workflow MUST use Action versions pinned to a major or commit SHA (Constitution Principle VI extended to CI actions).
- **FR-010**: pnpm's store cache SHOULD be enabled to keep run time inside SC-001's budget.

## Success Criteria

- **SC-001**: A typical PR run completes in under 4 minutes (excluding queue time).
- **SC-002**: A second run on the same PR (cache warm) completes in under 2 minutes.
- **SC-003**: Failing a single check produces an actionable error message that names the file/line where applicable.

## Assumptions

- The repository has GitHub Actions enabled. (DeepBlueCLtd/tabular-data-playground does — established by the existence of the `claude/epic-e1-*` branch workflow.)
- Pages deployment is item #34, not this one.
- The "test" step is currently an alias for typecheck (per #4); when Vitest wires later, the same script name will run real tests with no CI change required.
