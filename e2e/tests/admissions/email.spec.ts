import { test, expect } from '@playwright/test'

/**
 * Admissions email feature — auth/negative coverage.
 *
 * The protected admissions routes (email templates, SMTP settings) must not be
 * reachable without an authenticated session. A full happy-path (compose →
 * send → see it tracked in the history) needs an authenticated session fixture,
 * which the current harness does not provide (login is magic-link only, no
 * seeded session / storageState). That happy-path is therefore documented as a
 * skipped placeholder until an auth fixture exists.
 */
test.describe('Admissions email — access control', () => {
  test('email templates page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/admissions/email-templates', {
      waitUntil: 'networkidle',
    })
    // Unauthenticated users are bounced to the sign-in page.
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })

  test('SMTP settings page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/admissions/email-settings', {
      waitUntil: 'networkidle',
    })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })

  // Happy-path: pending an authenticated-session fixture (see file header).
  test.skip('send an email from an application and see it tracked', async () => {
    // 1. Sign in as an org admin with ADMISSION_EMAIL_SEND.
    // 2. Open an application → "Send email" → pick a template.
    // 3. Choose recipient (Vater/Mutter), edit body, send.
    // 4. Assert a new entry with status "Sent" appears in the email history.
  })
})
