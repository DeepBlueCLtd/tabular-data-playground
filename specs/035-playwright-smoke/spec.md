# Feature Specification: Playwright Smoke Test (#35)

**Branch**: `claude/epic-e1-1gMf9` (epic mode)
**Input**: Backlog item #35 — Playwright Chromium-only smoke
test against the built site (decision #13).

## User Scenarios

A CI run builds the app, starts `pnpm preview`, and runs a tiny
suite of Chromium-only smoke checks: the IDE shell paints, the
activity bar is present, and the Pyodide loading status surfaces.

## Requirements

- **FR-001**: Add `@playwright/test@1.49.1` to `app/package.json`
  devDependencies (exact version, no `^`).
- **FR-002**: New `app/playwright.config.ts` configured for
  Chromium only with `webServer: { command: 'pnpm run build && pnpm preview --port 4173 --strictPort', port: 4173, reuseExistingServer: !process.env.CI }`.
- **FR-003**: New `app/e2e/smoke.spec.ts` checks:
  - the page shows the title "Frictionless Data Explorer",
  - the Pyodide loading indicator shows one of
    "Loading Python…" / "Python ready" / "Python failed to load…",
  - the Files / Lessons activity buttons are present.
- **FR-004**: New `pnpm test:e2e` script in `package.json`.
- **FR-005**: CI (`.github/workflows/ci.yml`) gains a step that
  installs Chromium and runs `pnpm test:e2e`. Step is gated to
  the build job after `pnpm test`.
- **FR-006**: `pnpm run lint && pnpm run format:check && pnpm run build`
  exit 0.

## Success Criteria

- `pnpm test:e2e` passes locally on a developer machine after
  `pnpm install` + `pnpm exec playwright install chromium`.
