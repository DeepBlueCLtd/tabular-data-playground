import { expect, test } from '@playwright/test';

test.describe('IDE shell smoke', () => {
  test('renders chrome and surfaces Pyodide status', async ({ page }) => {
    await page.goto('/');

    // Title bar visible.
    await expect(page.getByText('Frictionless Data Explorer')).toBeVisible();

    // Activity bar buttons.
    await expect(page.getByRole('button', { name: /lessons/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /files/i })).toBeVisible();

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
});
