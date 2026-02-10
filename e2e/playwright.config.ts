import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'cd ../apps/backend && npm run start:dev',
      port: 4001,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'cd ../apps/web && npm run dev',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserType: 'chromium' } },
  ],
})
