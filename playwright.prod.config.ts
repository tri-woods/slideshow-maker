import { defineConfig, devices } from '@playwright/test';

// Production smoke tests against the live site: npm run test:prod
// Separate from playwright.config.ts so the localhost suite keeps its
// webServer and full browser matrix; this one hits https://cinema-slide.app
// with chromium only and must stay cheap enough to run ad hoc.
export default defineConfig({
  testDir: './tests/prod',
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: 'list',
  timeout: 60_000,

  use: {
    baseURL: 'https://cinema-slide.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
