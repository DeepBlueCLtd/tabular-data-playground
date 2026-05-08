/**
 * Capture-only Playwright config. Inherits the base config (web server,
 * port, host pin) but targets the capture suite under `e2e/capture/`.
 * Invoked via `pnpm capture:screenshots`.
 */
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testDir: './e2e/capture',
  testIgnore: undefined,
  // Capture runs are explicit, manual things — don't retry, don't keep
  // traces (the screenshot is the artefact).
  retries: 0,
  use: {
    ...baseConfig.use,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
