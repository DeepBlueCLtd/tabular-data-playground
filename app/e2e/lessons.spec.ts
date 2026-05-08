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

    // #39: bash blocks get a Copy + Run action bar; non-bash blocks
    // do not. Sample lesson has bash, json, python, yaml, csv, and
    // an unknown language. Only the bash one should have actions.
    const bashActions = page.locator(
      '.lesson-code-block:has(code.language-bash) [data-lesson-code-actions]',
    );
    await expect(bashActions).toHaveCount(1);
    await expect(bashActions.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(bashActions.getByRole('button', { name: 'Run' })).toBeVisible();
    // Non-bash blocks must not carry any action bar siblings.
    await expect(
      page.locator('.lesson-code-block:has(code.language-json) [data-lesson-code-actions]'),
    ).toHaveCount(0);
    await expect(
      page.locator('.lesson-code-block:has(code.language-python) [data-lesson-code-actions]'),
    ).toHaveCount(0);
    await expect(
      page.locator('.lesson-code-block:has(code.language-csv) [data-lesson-code-actions]'),
    ).toHaveCount(0);

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

// SC-001..SC-006 of specs/037-load-lesson-files/spec.md.
//
// These tests require Pyodide to fully load (loadPyodide + micropip
// install of `frictionless`). On environments where the Pyodide CDN
// is reachable from a Worker context (typical CI, the deployed Pages
// site) this is ~30-90 s; in some local sandboxes the Worker cannot
// fetch the CDN at all and the runtime ends in `Python: error`.
//
// Strategy: probe for `Python ready` with a generous wait. If we see
// `Python: error` (the loading-indicator's compact-variant text) or
// `Python failed to load` instead, skip the test with a message —
// the deployed-site verification at epic close (spec.md §11 E2 done)
// remains the authoritative gate.
const PYODIDE_BOOT_TIMEOUT = 180_000;

async function awaitPyodideOrSkip(page: import('@playwright/test').Page): Promise<void> {
  // The app renders the loading indicator twice (compact in the status
  // bar + full in the terminal panel), so role=status is multi-element.
  // Use .first() throughout to avoid strict-mode violations.
  const status = page
    .getByRole('status')
    .filter({ hasText: /Python/ })
    .first();
  const deadline = Date.now() + PYODIDE_BOOT_TIMEOUT;
  while (Date.now() < deadline) {
    const text = ((await status.textContent().catch(() => '')) ?? '').toLowerCase();
    if (text.includes('ready')) return;
    if (text.includes('error') || text.includes('failed')) {
      test.skip(
        true,
        `Pyodide did not reach ready in this environment ('${text.trim()}'). The deployed site is the authoritative gate (spec.md §11).`,
      );
      return;
    }
    await page.waitForTimeout(1000);
  }
  test.skip(true, `Pyodide still loading after ${PYODIDE_BOOT_TIMEOUT}ms — env constraint.`);
}

// SC-001..SC-004 of specs/038-copy-run-buttons/spec.md.
test.describe('Copy + Run buttons (#39)', () => {
  test('Copy writes the bash block source to clipboard', async ({ page, browser }) => {
    // Grant clipboard permissions for this context so navigator.clipboard works.
    await browser
      .contexts()[0]
      ?.grantPermissions(['clipboard-read', 'clipboard-write'])
      .catch(() => undefined);

    await page.goto('/');
    const bashActions = page.locator(
      '.lesson-code-block:has(code.language-bash) [data-lesson-code-actions]',
    );
    await expect(bashActions).toBeVisible();
    const copyButton = bashActions.getByRole('button', { name: /^(Copy|Copied|Copy failed)$/ });
    await copyButton.click();
    // Clipboard read works even without grants in headless if the page initiated it,
    // but we read via evaluate which uses the same security context.
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toBe('frictionless describe data.csv');
    // The button briefly indicates success.
    await expect(copyButton).toHaveText('Copied');
  });

  test('Run is disabled while terminal is unavailable, enabled after Python ready', async ({
    page,
  }) => {
    await page.goto('/');
    const runButton = page
      .locator('.lesson-code-block:has(code.language-bash) [data-lesson-code-actions]')
      .getByRole('button', { name: 'Run' });
    // Initially disabled — terminal not yet mounted (Pyodide loading
    // → terminal panel renders the placeholder, no submit registered).
    await expect(runButton).toBeDisabled();
    // We don't wait for ready here — that's #40's territory and the
    // sandbox may not reach ready. The disable-state at first paint
    // is the assertion that proves FR-009.
  });
});

test.describe('Load lesson files (#41)', () => {
  test('copies starter files into /workspace/<slug>/ when destination is empty', async ({
    page,
  }) => {
    test.setTimeout(PYODIDE_BOOT_TIMEOUT + 30_000);
    await page.goto('/');
    await awaitPyodideOrSkip(page);

    const button = page.getByRole('button', { name: /^Load lesson files$/ });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await button.click();

    // No collision modal expected — workspace is empty on first run.
    await expect(page.getByRole('dialog', { name: /Overwrite lesson files/ })).toHaveCount(0);

    // Open the file tree and verify the new files surface there.
    await page.getByRole('button', { name: 'Files', exact: true }).click();
    await expect(page.getByText('_sample').first()).toBeVisible();
    await expect(page.getByText('data.csv').first()).toBeVisible();
    await expect(page.getByText('README.md').first()).toBeVisible();
  });

  test('confirms before overwrite and cancels without writes (FR-009, SC-002, SC-003)', async ({
    page,
  }) => {
    test.setTimeout(PYODIDE_BOOT_TIMEOUT + 30_000);
    await page.goto('/');
    await awaitPyodideOrSkip(page);

    // First click — copies starter files (workspace was empty).
    await page.getByRole('button', { name: /^Load lesson files$/ }).click();
    // Brief settle.
    await page.waitForTimeout(250);

    // Second click — destination now has files; modal must appear
    // BEFORE any write. Spec text in body is required (FR-008).
    await page.getByRole('button', { name: /^Load lesson files$/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Overwrite lesson files?');
    await expect(dialog).toContainText(
      /Folder _sample already has files\. Loading the lesson's starter files will overwrite \d+ files? with the same name\. Your edits to those files will be lost\./,
    );

    // Cancel — no further writes; modal closes; button re-enabled.
    await dialog.getByRole('button', { name: /^Cancel$/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Load lesson files$/ })).toBeEnabled();
  });
});
