# Implementation Plan: CI on PR

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

One GitHub Actions workflow at `.github/workflows/ci.yml`. Runs on
`pull_request` targeting `main` and `push` to `main`. Verifies the
scaffold installs, lints, formats, builds, and "tests" cleanly under
pnpm with the committed lockfile.

## Constitution Check

1. Research-first — pass (CI keeps reproducible builds verified).
2. Notes-section — N/A.
3. Destruction — pass.
4. Backend — pass (GitHub Actions is the platform's CI, not a project backend; constitution names it as the CI choice).
5. Pinning — pass; actions pinned to major versions.
6. Limitations — pass.

## Action versions (pinned)

| Action | Version |
|--------|---------|
| `actions/checkout` | `v4` |
| `pnpm/action-setup` | `v4` |
| `actions/setup-node` | `v4` |

`pnpm/action-setup@v4` reads the pnpm version from
`app/package.json`'s `packageManager` field automatically when no
explicit `version` is given. Node version pinned to `22` (LTS, matches
local dev environment).

## Files touched

- `.github/workflows/ci.yml` (new)

## Phase 0 — Research

- **pnpm in GH Actions**: `pnpm/action-setup@v4` honours the
  `packageManager` field (corepack-aware). No explicit `version:`
  needed.
- **Cache**: `actions/setup-node@v4` with `cache: 'pnpm'` and
  `cache-dependency-path: app/pnpm-lock.yaml` enables the pnpm store
  cache.
- **Working directory**: set via `defaults.run.working-directory: app`
  on the job so each step doesn't need to repeat it.
- **Triggers**: `pull_request: { branches: [main] }` plus
  `push: { branches: [main] }`. The push trigger gives a green-badge
  signal on `main` after merge and is what #34 will key off.
- **Test alias**: `pnpm test` currently runs `tsc --noEmit`. Build
  also runs typecheck via `tsc --noEmit && vite build`. Running both
  is mildly redundant but cheap; keeps the CI surface explicit.
