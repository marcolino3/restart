import { defineConfig } from '@playwright/test'

// Ports follow the URLs so a run against a second worktree (e.g. web on 4100,
// backend on 4101) reuses those servers instead of starting new ones on 4000/4001.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4000'
const backendURL = process.env.BACKEND_URL ?? 'http://localhost:4001'

export default defineConfig({
  testDir: './tests',
  // Seeds a better-auth credential account for the superadmin so the
  // authenticated suites can sign in via the UI (see helpers/global-setup).
  globalSetup: './tests/helpers/global-setup.ts',
  // Deletes every organization/user the fixtures created, so a run leaves the
  // database as it found it (set E2E_SKIP_TEARDOWN=true to inspect leftovers).
  globalTeardown: './tests/helpers/global-teardown.ts',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  // CI: github annotations + HTML report (uploaded as artifact on failure).
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
  },
  webServer: [
    {
      command: 'cd ../apps/backend && npm run start:dev',
      port: Number(new URL(backendURL).port),
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../apps/web && npm run dev',
      port: Number(new URL(baseURL).port),
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserType: 'chromium' } },
  ],
})
