# Implementation Plan: ESLint + Prettier

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Date**: 2026-05-08

## Summary

Add ESLint 9 (flat config) + Prettier 3 to `app/`. Pin every new dep
exact. No CI workflow added (item #33). Existing scaffold lints clean.

## Constitution Check

1. Research-first — pass (lint catches mistakes that would otherwise
   distract from evaluating Frictionless).
2. Notes-section — N/A (infra).
3. Destruction — pass (no destructive flow).
4. Backend — pass.
5. Pinning — pass; new deps pinned in Notes below.
6. Limitations — pass; no new sharp edge.

All gates pass. No Complexity Tracking entries.

## Technical Context

- ESLint 9.17.0 (flat config).
- @eslint/js 9.17.0.
- typescript-eslint 8.18.2 (combined parser + plugin).
- eslint-plugin-react 7.37.3.
- eslint-plugin-react-hooks 5.1.0.
- eslint-plugin-react-refresh 0.4.16.
- eslint-config-prettier 9.1.0.
- globals 15.14.0 (browser globals for flat config).
- prettier 3.4.2.

## Notes — Pinned Tooling

| Package | Version |
|---------|---------|
| eslint | 9.17.0 |
| @eslint/js | 9.17.0 |
| typescript-eslint | 8.18.2 |
| eslint-plugin-react | 7.37.3 |
| eslint-plugin-react-hooks | 5.1.0 |
| eslint-plugin-react-refresh | 0.4.16 |
| eslint-config-prettier | 9.1.0 |
| globals | 15.14.0 |
| prettier | 3.4.2 |

All exact pins; lockfile (#5) records resolved transitive tree.

## Files touched

- `app/package.json` — add devDependencies + scripts (`lint`, `lint:fix`, `format`, `format:check`).
- `app/eslint.config.js` — flat config (new).
- `app/.prettierrc.json` — formatting rules (new).
- `app/.prettierignore` — exclusions (new).
- `app/pnpm-lock.yaml` — regenerated.
- `app/.gitignore` — no change needed.

## Phase 0 — Research

- **Flat config vs legacy** — flat config; ESLint 9 deprecated legacy.
- **Combined `typescript-eslint`** — single package (instead of separate `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`). Cleaner since 2024.
- **Prettier rules** — match Vite's defaults: single quotes, semis, trailing all, 2-space, 100-col print width.
- **`eslint-plugin-react-refresh`** — Vite-specific; warns if a file exports something other than React components, which breaks fast-refresh. Useful early.
- **Globals package** — required for flat config to register `window`/`document` etc. as globals in source.
