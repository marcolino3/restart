import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  // Seeds a better-auth credential account for the superadmin so the
  // authenticated suites can sign in via the UI (see helpers/global-setup).
  globalSetup: './tests/helpers/global-setup.ts',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  // CI: github annotations + HTML report (uploaded as artifact on failure).
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
  },
  webServer: [
    {
      command: 'cd ../apps/backend && npm run start:dev',
      port: 4001,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../apps/web && npm run dev',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserType: 'chromium' } },
  ],
})
