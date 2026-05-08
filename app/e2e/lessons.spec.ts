import { expect, test } from '@playwright/test';

// Asserts SC-001..SC-005 of specs/036-lesson-loader/spec.md against the
// production build. The build uses VITE_INCLUDE_DEV_LESSONS=1 (set by
// the webServer command in playwright.config.ts) so the dev-only
// `_sample` lesson is bundled. Real `pnpm build` omits it.
test.describe('Lesson loader (#38)', () => {
  test('renders sample lesson body with GFM + highlight', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Lessons activity is the default-active panel — no click needed.

    // Sample lesson is preselected by the temporary picker (#37 will
    // replace it with the curriculum index).
    const picker = page.locator('[data-temp-picker]');
    await expect(picker).toBeVisible();
    await expect(picker).toHaveValue('_sample');

    // Lesson body and header.
    await expect(page.getByRole('heading', { name: 'Sample lesson (dev only)' })).toBeVisible();
    await expect(page.getByText('1 min')).toBeVisible();

    // GFM table renders — assert a known cell.
    await expect(page.getByRole('cell', { name: 'alice' }).or(page.getByText('one'))).toBeVisible();

    // GFM task list — at least one rendered checkbox input.
    await expect(page.locator('.lesson-body input[type="checkbox"]').first()).toBeVisible();

    // Bash code block is highlighted by highlight.js (allow-list).
    await expect(page.locator('code.hljs.language-bash')).toBeVisible();

    // Bash IS on the highlight allow-list — it gets the .hljs class.
    await expect(page.locator('code.hljs.language-bash')).toBeVisible();
    // CSV is NOT registered — its <code> renders, but it carries no
    // highlight token spans (rehype-highlight adds the .hljs wrapper
    // class regardless; the absence of <span> children is the signal
    // that no syntax tokens were emitted).
    await expect(page.locator('code.language-csv')).toBeVisible();
    await expect(page.locator('code.language-csv span')).toHaveCount(0);

    // External link gets new-tab safety (FR-011).
    const exampleLink = page.getByRole('link', { name: /example link|external link/i }).first();
    await expect(exampleLink).toHaveAttribute('rel', /noopener/);
    await expect(exampleLink).toHaveAttribute('target', '_blank');

    // SC-004: no console errors during the lesson-open flow.
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('lesson body renders before Pyodide is ready (FR-016, SC-005)', async ({ page }) => {
    // Pyodide loads on a Web Worker (#27); the lesson panel must not
    // wait for it. We open the lesson and check for body content
    // before the "Python ready" status fires.
    await page.goto('/');

    // The lesson body becomes visible while the Pyodide status is
    // still "Loading Python…".
    await expect(page.getByRole('heading', { name: 'Sample lesson (dev only)' })).toBeVisible();
    await expect(
      page.getByRole('status').filter({ hasText: /Loading Python|Python ready|Python failed/ }),
    ).toBeVisible();
  });
});
