# Implementation Plan: pnpm Setup with Committed Lockfile

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08
**Spec**: [spec.md](./spec.md)

## Summary

Wire pnpm as the project's package manager and commit `app/pnpm-lock.yaml`
so installs are reproducible across contributors and CI. Pin the pnpm
version in `app/package.json`'s `packageManager` field. Remove the
npm `package-lock.json` (left untracked by #4) and the gitignore stanza
that excluded it. Update `app/README.md` and
`specs/004-app-scaffold/quickstart.md` to use `pnpm install
--frozen-lockfile`.

No CI workflow is added — that's item #33. No new runtime dependencies.
No new sharp edges.

## Technical Context

**Tooling**: pnpm 10.33.0 (current at implementation, exact pin); Corepack
0.34.6 manages the pnpm install. Node 22.x.
**Storage**: Lockfile only (`app/pnpm-lock.yaml`).
**Testing**: Verify `pnpm install --frozen-lockfile` exits 0 and `pnpm run
build` produces `app/dist/`. Same verification surface as #4.
**Constraints**: Lockfile must stay consistent with #4's exact pins
(no version drift); `package-lock.json` deleted; `app/.gitignore` no
longer mentions it.

## Constitution Check

1. **Research-first** — Pass. Reproducible installs are foundational to
   evaluating Frictionless faithfully.
2. **Notes-section** — N/A (infra, not a lesson).
3. **Destruction** — Pass. No user-content-destroying flow. Deleting
   the npm lockfile is a working-tree change to an untracked file.
4. **Backend** — Pass. No backend.
5. **Pinning** — Pass. pnpm version pinned via `packageManager`.
   Lockfile commits the resolved tree from #4's exact pins.
6. **Limitations** — Pass. No new sharp edge. The Corepack opt-in is
   documented in `app/README.md`, not in `docs/limitations.md`, since
   it's a contributor convenience note rather than a v1 user-facing
   limitation.

All gates pass. Complexity Tracking empty.

## Project Structure

Files touched by this item:

- `app/package.json` — add `packageManager: "pnpm@10.33.0"`.
- `app/pnpm-lock.yaml` — **new**, generated, committed.
- `app/.gitignore` — remove the `package-lock.json` stanza added in #4.
- `app/README.md` — swap install command to `pnpm install --frozen-lockfile`.
- `specs/004-app-scaffold/quickstart.md` — same swap (keep prior item's docs in sync).

Files **not** touched: `app/src/**`, `app/index.html`, `app/tsconfig*.json`,
`app/vite.config.ts`, `.github/workflows/**` (item #33 owns).

## Phase 0 — Research

- **Pin pnpm version**: 10.33.0. Rationale: current stable as of
  implementation; matches the version available in the dev environment.
  A patch refresh at implementation time is permitted (Constitution
  Principle VI strict-patch policy).
- **Corepack vs. global install**: documented as opt-in. Contributors
  who don't use Corepack install pnpm globally at the pinned version.
  No enforcement mechanism in v1.
- **Lockfile format**: pnpm's default YAML lockfile (lockfileVersion
  9.x). No `binary: true` gitattributes — diffs review fine in PRs.
- **Workspace**: No `pnpm-workspace.yaml` for v1; `app/` is the only
  package. Revisit if a second package appears.

## Phase 1 — Design & Contracts

No data model. No new contracts beyond #4's npm scripts (which now run
under pnpm). Quickstart updates documented in tasks.md.

## Notes — Pinned Tooling

| Tool | Version | Pinned in |
|------|---------|-----------|
| pnpm | 10.33.0 | `app/package.json` `packageManager` |

## Complexity Tracking

None. All gates pass.
