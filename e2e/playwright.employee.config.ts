import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

// This configuration never connects to the development database or reuses its servers.
const environment = {
  DB_HOST: '127.0.0.1', DB_PORT: '5435', DB_USERNAME: 'test', DB_PASSWORD: 'test', DB_NAME: 'restart_employee_e2e',
  DB_SYNCHRONIZE: 'false', NODE_ENV: 'test',
  // Explicit test-only configuration: clean checkouts must not need a developer .env.
  SMTP_USER: 'employee-tests@example.test', GOOGLE_MAIL_REFRESH_TOKEN: 'employee-test-mail-token',
  GOOGLE_AUTH_CLIENT_ID: 'employee-test-client', GOOGLE_AUTH_CLIENT_SECRET: 'employee-test-client-secret',
  GOOGLE_AUTH_REDIRECT_URI: 'http://localhost:4101/api/auth/google/redirect',
  GOOGLE_CALENDAR_ID: 'employee-test-calendar', AUTH_UI_REDIRECT: 'http://localhost:4100',
  JWT_ACCESS_TOKEN_SECRET: 'employee-test-access-secret', JWT_ACCESS_TOKEN_EXPIRATION_MS: '900000',
  JWT_REFRESH_TOKEN_SECRET: 'employee-test-refresh-secret', JWT_REFRESH_TOKEN_EXPIRATION_MS: '604800000',
  ORG_SETTINGS_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  S3_BUCKET: '', S3_ACCESS_KEY_ID: '', S3_SECRET_ACCESS_KEY: '',
  E2E_STORAGE_DIR: resolve(__dirname, '.employee-storage'),
  BACKEND_URL: 'http://localhost:4101', BETTER_AUTH_URL: 'http://localhost:4101',
  BETTER_AUTH_SECRET: 'employee-e2e-secret-for-isolated-tests-only',
  ALLOWED_ORIGINS: 'http://localhost:4100', FRONTEND_ORIGIN: 'http://localhost:4100',
  NEXT_PUBLIC_GRAPHQL_API_URL: 'http://localhost:4101/graphql',
  INTERNAL_GRAPHQL_API_URL: 'http://localhost:4101/graphql',
  SUPERADMIN_EMAIL: 'employee-superadmin@example.test', SUPERADMIN_PASSWORD: 'Employee-Test-Password-2026',
};
Object.assign(process.env, environment);
export default defineConfig({
  testDir: './tests', testMatch: ['**/employee-basics*.spec.ts', '**/employee-account-link.spec.ts', '**/employee-onboarding.spec.ts'],
  globalSetup: './tests/helpers/global-setup.ts',
  timeout: 90000, retries: 0, workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/employee', open: 'never' }]],
  use: { baseURL: 'http://localhost:4100', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'pnpm --filter @restart/backend exec ts-node --transpile-only -r tsconfig-paths/register src/main.ts', cwd: '..', port: 4101, reuseExistingServer: false, timeout: 180000,
      env: { ...environment, PORT: '4101', E2E_MAIL_DIR: process.cwd() + '/.employee-mail' } },
    { command: 'pnpm --filter @restart/web exec next dev --port 4100', cwd: '..', port: 4100, reuseExistingServer: false, timeout: 180000,
      env: { ...environment, NODE_ENV: 'development', NEXT_DIST_DIR: '.next-employee-e2e', NEXT_FONT_GOOGLE_MOCKED_RESPONSES: resolve(__dirname, 'tests/helpers/font-responses.cjs') } },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', testMatch: ['**/employee-basics-date.spec.ts','**/employee-basics.spec.ts','**/employee-basics-saving.spec.ts'], use: { browserName: 'firefox' } },
    { name: 'webkit', testMatch: ['**/employee-basics-date.spec.ts','**/employee-basics.spec.ts','**/employee-basics-saving.spec.ts'], use: { browserName: 'webkit' } },
  ],
});
