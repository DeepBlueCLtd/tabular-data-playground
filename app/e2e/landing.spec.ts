import { expect, test } from '@playwright/test';

// SC-001..SC-003 of specs/041-landing-page/spec.md.

test.describe('Landing page (#36)', () => {
  test('first visit shows landing; Start reveals the IDE', async ({ page }) => {
    await page.goto('/');
    // No localStorage flag → landing is visible.
    await expect(page.getByRole('dialog', { name: /Frictionless Data Explorer/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Start', exact: true }).click();

    // Landing dismissed; IDE chrome accessible.
    await expect(page.getByRole('dialog', { name: /Frictionless Data Explorer/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'What is this?' })).toBeVisible();
  });

  test('returning visitor lands directly in the IDE', async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('landing-seen', '1');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: /Frictionless Data Explorer/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'What is this?' })).toBeVisible();
  });

  test('"What is this?" re-shows landing without losing state', async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('landing-seen', '1');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'What is this?' }).click();
    await expect(page.getByRole('dialog', { name: /Frictionless Data Explorer/ })).toBeVisible();
    // The flag remains set (next reload still skips landing).
    const flag = await page.evaluate(() => localStorage.getItem('landing-seen'));
    expect(flag).toBe('1');
  });
});
