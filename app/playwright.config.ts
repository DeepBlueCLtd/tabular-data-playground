import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const HOST = '127.0.0.1';

export default defineConfig({
  testDir: './e2e',
  // The capture suite ships under e2e/capture/ and is invoked
  // separately via `pnpm capture:screenshots` (playwright.capture.config.ts).
  testIgnore: /capture\//,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  retries: process.env.CI ? 1 : 0,
  // Run tests sequentially so a single shared webServer is enough.
  workers: 1,
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Pin vite preview to 127.0.0.1 so it always matches baseURL —
    // some CI runners default-bind to ::1 only and Playwright dials
    // 127.0.0.1, which manifests as ERR_CONNECTION_REFUSED.
    // VITE_INCLUDE_DEV_LESSONS=1 makes the lesson loader (#38) include
    // underscore-prefixed lessons (e.g. content/lessons/_sample) in
    // the test build so e2e has something to render. Real `pnpm build`
    // omits the env var and excludes them.
    command: `VITE_INCLUDE_DEV_LESSONS=1 pnpm run build && pnpm exec vite preview --port ${PORT} --strictPort --host ${HOST}`,
    url: `http://${HOST}:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
