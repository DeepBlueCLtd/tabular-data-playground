# Feature Specification: ESLint + Prettier (Standard Config)

**Feature Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Created**: 2026-05-08
**Status**: Draft
**Input**: Backlog item #6 — "ESLint + Prettier standard config wired into CI."

## User Scenarios & Testing

### User Story 1 — Lint catches mistakes before review (P1)

A contributor runs the project's lint command and any obvious problems (unused imports, missing return types in strict zones, React hook misuse) are flagged before they reach a PR.

**Independent Test**: From `app/`, `pnpm run lint` exits 0 on the current scaffold (no findings). Introducing a deliberate violation (e.g. `let x; x = 1; x = 2;`) makes `pnpm run lint` exit non-zero with a readable error pointing at the offending file and line.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** `pnpm run lint` runs, **Then** it exits 0 with no findings.
2. **Given** a file with an obvious violation, **When** lint runs, **Then** it exits non-zero and points to the file/line.
3. **Given** the standard config, **When** rules disagree with Prettier, **Then** ESLint defers to Prettier (no formatting fights).

### User Story 2 — Format is consistent and machine-checked (P1)

Code formatting is a tool decision, not a person decision. Contributors run `pnpm run format` to apply, or `pnpm run format:check` to verify, the project's formatting rules.

**Independent Test**: From `app/`, `pnpm run format:check` exits 0 on the current scaffold. Manually de-formatting a file (e.g. mixed quotes) makes `format:check` exit non-zero; `pnpm run format` fixes it.

### Edge Cases

- The lint config must respect the `app/` boundary — running lint elsewhere in the repo (e.g. `specs/`, `docs/`, root markdown) is out of scope. Markdown linting is not part of v1.
- The format config must match what the scaffold already produced (so no churn commit). Concretely: 2-space indent, single quotes for JS, trailing commas, semicolons.
- ESLint 9 uses flat config (`eslint.config.js`). This is the only option for new ESLint projects in 2024+.
- The `pnpm-lock.yaml` and `dist/` are not linted/formatted; both ignored.

## Requirements

- **FR-001**: `pnpm run lint` MUST exist and run ESLint against `app/src/**/*.{ts,tsx}` and `app/vite.config.ts` and exit 0 on the current scaffold.
- **FR-002**: `pnpm run lint:fix` MUST exist and apply ESLint auto-fixes.
- **FR-003**: `pnpm run format` MUST exist and apply Prettier to `app/src/**`, `app/*.{ts,tsx,json,html,md}`, and `app/index.html`.
- **FR-004**: `pnpm run format:check` MUST exist and exit non-zero on any file that doesn't match Prettier rules.
- **FR-005**: ESLint rules MUST NOT conflict with Prettier (use `eslint-config-prettier` to disable formatting rules).
- **FR-006**: All ESLint and Prettier dependencies MUST be added with exact-version pins (Constitution Principle VI).
- **FR-007**: Lint MUST pass cleanly against the existing scaffold files; if any pre-existing code violates the config, fix the code (not the config).
- **FR-008**: A `.prettierrc.json` file at `app/` MUST record the formatting rules.
- **FR-009**: A `.prettierignore` file at `app/` MUST exclude `dist/`, `node_modules/`, and `pnpm-lock.yaml`.
- **FR-010**: An `eslint.config.js` file at `app/` (flat config) MUST configure TypeScript, React, react-hooks, and react-refresh plugins, plus the `eslint-config-prettier` integration.

## Success Criteria

- **SC-001**: `pnpm run lint && pnpm run format:check` exits 0 on a clean checkout.
- **SC-002**: Lint runs in under 10 s on a typical workstation for the current source size.
- **SC-003**: Adding a typical violation surfaces in the lint output and points the contributor at the right file/line.

## Assumptions

- ESLint 9.x flat-config style. Older `.eslintrc*` formats are out.
- Prettier 3.x.
- Lint scope is `app/` only; no markdown linting; no root-level lint pass in v1.
- CI invocation is item #33.
