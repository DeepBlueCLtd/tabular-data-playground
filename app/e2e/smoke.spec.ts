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

    await page.screenshot({ path: 'e2e/screenshots/01-shell-loading.png', fullPage: true });
  });

  test('Pyodide reaches ready or surfaces a clear error', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(`console.error: ${m.text()}`);
    });
    await page.goto('/');
    // Wait up to 45s for ready OR error.
    const indicator = page
      .getByRole('status')
      .filter({ hasText: /Python ready|Python failed/ })
      .first();
    try {
      await expect(indicator).toBeVisible({ timeout: 45_000 });
    } finally {
      await page.screenshot({ path: 'e2e/screenshots/04-pyodide-final.png', fullPage: true });
      if (consoleErrors.length > 0) {
        console.log('Page errors during load:\n' + consoleErrors.join('\n'));
      }
    }
  });

  test('editor empty state offers a sample file', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /open sample csv/i })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/02-editor-empty-state.png', fullPage: true });
  });

  test('files panel shows file tree placeholder before runtime', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /files/i }).click();
    await expect(page.getByText(/Reset workspace/i)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/03-files-panel.png', fullPage: true });
  });
});
