import { test, expect } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Consent management (Einwilligungen) — the Datenschutz-Center. Org admins /
 * secretariat define org-configurable consent purposes and record per-subject
 * decisions. This suite covers the auth gate plus the UI-driven happy path of
 * creating a purpose and seeing it persisted in the list.
 *
 * The authenticated test signs in through the real UI (credential account
 * seeded by the Playwright global-setup) and provisions an active org, so it
 * also runs against a fresh CI database.
 */
test.describe('Consent — access control', () => {
  test('data-protection center requires authentication', async ({ page }) => {
    await page.goto('/en/admin/data-protection', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Consent — purpose happy path', () => {
  test('creates a consent purpose and lists it', async ({ page }) => {
    const stamp = Date.now()
    const purposeName = `Consent E2E ${stamp}`

    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    await page.goto('/en/admin/data-protection', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /data protection center/i, level: 1 }),
    ).toBeVisible({ timeout: 15000 })

    // Open the create dialog (button, not the dialog heading of the same text).
    await page.getByRole('button', { name: /add purpose/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Name → slug is auto-generated; "Applies to" is required (min 1).
    await dialog.getByLabel(/^name$/i).fill(purposeName)
    await dialog.getByRole('checkbox', { name: /employee/i }).click()
    // Legal basis defaults to "Consent" — no interaction needed.

    await dialog.getByRole('button', { name: /^save$/i }).click()

    // Dialog closes and the new purpose is listed.
    await expect(dialog).toBeHidden({ timeout: 15000 })
    await expect(page.getByText(purposeName)).toBeVisible({ timeout: 15000 })
  })
})
