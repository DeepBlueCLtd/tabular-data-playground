/**
 * On-demand screenshot capture for stakeholder review.
 *
 * Not part of the CI smoke run. Invoke with `pnpm capture:screenshots`
 * (see package.json). Each screenshot lands in `e2e/screenshots/` and
 * is committed to the repo so reviewers can browse via GitHub without
 * running anything.
 */
import { test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('01 — shell on first paint (Pyodide loading)', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Frictionless Data Explorer').waitFor();
  await page.screenshot({ path: 'e2e/screenshots/01-shell-loading.png', fullPage: true });
});

test('02 — editor empty state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open sample csv/i }).waitFor();
  await page.screenshot({ path: 'e2e/screenshots/02-editor-empty-state.png', fullPage: true });
});

test('03 — files panel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /files/i }).click();
  await page.getByText(/Reset workspace/i).waitFor();
  await page.screenshot({ path: 'e2e/screenshots/03-files-panel.png', fullPage: true });
});
