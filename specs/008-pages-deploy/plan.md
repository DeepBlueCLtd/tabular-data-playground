# Implementation Plan: GitHub Pages Deploy

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

One workflow at `.github/workflows/deploy.yml`. On `push: main`, it
builds with `VITE_BASE_PATH=/tabular-data-playground/` and publishes
`app/dist/` to GitHub Pages via the official Pages action chain.

## Constitution Check

1. Research-first — pass (deployable static site is the host for the entire evaluation).
2. Notes-section — N/A.
3. Destruction — pass (workflow doesn't touch user content).
4. Backend — pass (GH Pages is fixed by Principle IV; no project backend).
5. Pinning — pass; actions pinned.
6. Limitations — pass; no new sharp edge.

## Pinned Actions

| Action | Version |
|--------|---------|
| `actions/checkout` | `v4` |
| `pnpm/action-setup` | `v4` |
| `actions/setup-node` | `v4` |
| `actions/configure-pages` | `v5` |
| `actions/upload-pages-artifact` | `v3` |
| `actions/deploy-pages` | `v4` |

## Files touched

- `.github/workflows/deploy.yml` (new)

## Phase 0 — Research

- **Pages source = "GitHub Actions"**: required for the action chain
  to work; documented in spec.md Assumptions.
- **Concurrency**: `group: pages`, `cancel-in-progress: false` —
  recommended Pages pattern; queues simultaneous pushes rather than
  cancelling.
- **Permissions split**: build job runs with default minimal perms;
  deploy job declares `pages: write` and `id-token: write` (OIDC).
- **Base path**: hard-coded to `/tabular-data-playground/` in the
  workflow env; if the repo is renamed, this is the single edit.
