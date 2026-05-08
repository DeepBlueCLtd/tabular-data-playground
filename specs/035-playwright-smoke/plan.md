# Implementation Plan: Playwright Smoke Test

**Branch**: `claude/epic-e1-1gMf9`

## Constitution Check

5. Pinning — pass; Playwright pinned exactly.
All gates pass.

## Files touched

- `app/package.json` — devDep + script.
- `app/playwright.config.ts` — new.
- `app/e2e/smoke.spec.ts` — new.
- `app/.gitignore` — add `playwright-report/`,
  `test-results/`.
- `.github/workflows/ci.yml` — install Chromium, run e2e.
