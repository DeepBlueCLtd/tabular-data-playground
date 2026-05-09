import { expect, test } from '@playwright/test';

// Smoke assertions only — no screenshots. Run via `pnpm test:e2e`.
// Stakeholder-shareable screenshots are captured on demand via
// `pnpm capture:screenshots` (see e2e/capture-screenshots.spec.ts).
test.beforeEach(async ({ context }) => {
  // Suppress the first-visit landing page (#36) for IDE-focused tests.
  await context.addInitScript(() => {
    try {
      localStorage.setItem('landing-seen', '1');
    } catch {
      /* ignore */
    }
  });
});

test.describe('IDE shell smoke', () => {
  test('renders chrome and surfaces Pyodide status', async ({ page }) => {
    await page.goto('/');

    // Title bar visible.
    await expect(page.getByText('Frictionless Data Explorer')).toBeVisible();

    // Activity bar buttons.
    await expect(page.getByRole('button', { name: /lessons/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Files', exact: true })).toBeVisible();

    // Terminal panel header.
    await expect(page.getByRole('region', { name: /terminal/i })).toBeVisible();

    // Pyodide loading indicator surfaces SOME status text. We don't
    // wait for ready (3-30 s on Firefox per Measurement C) — just
    // confirm the indicator has rendered.
    await expect(
      page.getByRole('status').filter({ hasText: /Loading Python|Python ready|Python failed/ }),
    ).toBeVisible();

    // Status bar at the bottom.
    await expect(page.getByRole('contentinfo', { name: /status bar/i })).toBeVisible();
  });

  test('editor empty state offers a sample file', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /open sample csv/i })).toBeVisible();
  });

  test('files panel shows file tree placeholder before runtime', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Files', exact: true }).click();
    await expect(page.getByText(/Reset workspace/i)).toBeVisible();
  });
});
