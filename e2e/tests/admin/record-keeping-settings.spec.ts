import { test, expect } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Record-keeping settings ("Fortschritte" thresholds) — the org-wide
 * configuration behind the attention heuristic (STUCK_INTRODUCED,
 * STUCK_PRACTICED, BIG_GAP_INTRO_TO_PRACTICED). Guarded by
 * RECORD_KEEPING_SETTINGS_MANAGE. No prior E2E existed for this form.
 */
test.describe('Record-keeping settings — CRUD and auth', () => {
  test('reads defaults, saves new thresholds, and reflects them after reload', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    await page.goto('/en/admin/settings/record-keeping', {
      waitUntil: 'networkidle',
    })

    const introducedField = page.getByLabel(/introduced → not practiced/i)
    const practicedField = page.getByLabel(/practiced → not mastered/i)
    const bigGapField = page.getByLabel(/long gap/i)

    await expect(introducedField).toBeVisible({ timeout: 15000 })

    await introducedField.fill('45')
    await practicedField.fill('120')
    await bigGapField.fill('75')

    await page.getByRole('button', { name: /save/i }).click()
    await expect(page.getByText(/saved|updated/i).first()).toBeVisible({
      timeout: 10000,
    })

    await page.reload({ waitUntil: 'networkidle' })
    await expect(introducedField).toHaveValue('45', { timeout: 10000 })
    await expect(practicedField).toHaveValue('120')
    await expect(bigGapField).toHaveValue('75')
  })

  test('unauthenticated request is redirected to sign-in', async ({ page }) => {
    await page.goto('/en/admin/settings/record-keeping', {
      waitUntil: 'networkidle',
    })
    await expect(page).toHaveURL(/sign-in/, { timeout: 15000 })
  })
})
