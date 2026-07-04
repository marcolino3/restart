import { test, expect } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Retention policies (Aufbewahrungsfristen) — the "Retention" tab of the
 * Datenschutz-Center. Org admins define, per data type, how long records are
 * kept and what happens when the period lapses (delete / anonymize). Execution
 * is deferred to an admin-reviewed job; this UI only configures the rules and
 * previews currently-due records.
 *
 * Coverage: the auth gate on the data-protection center plus the UI-driven
 * happy path of configuring a policy for one entity type and seeing it
 * persisted as a badge in the list. The authenticated test signs in through the
 * real UI and provisions an active org, so it also runs on a fresh CI database.
 */
test.describe('Retention — access control', () => {
  test('data-protection center requires authentication', async ({ page }) => {
    await page.goto('/en/admin/data-protection', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Retention — policy happy path', () => {
  test('configures a retention policy and lists it', async ({ page }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    await page.goto('/en/admin/data-protection', { waitUntil: 'networkidle' })

    // Switch to the Retention tab and confirm its heading renders.
    await page.getByRole('tab', { name: /retention/i }).click()
    await expect(
      page.getByRole('heading', { name: /retention periods/i }),
    ).toBeVisible({ timeout: 15000 })

    // Scope to the active tab panel — the nav sidebar also has a "Students"
    // list item, so the row must be resolved inside the retention list only.
    const panel = page.getByRole('tabpanel')

    // Open the config dialog for the Students row (Configure when unset, Edit
    // when a prior run already persisted it — the row is stable either way).
    const studentsRow = panel
      .getByRole('listitem')
      .filter({ hasText: 'Students' })
      .first()
    await studentsRow
      .getByRole('button', { name: /configure|edit/i })
      .first()
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: /^students$/i }),
    ).toBeVisible()

    // Set a distinct retention period so the resulting badge is unambiguous.
    const months = dialog.getByLabel(/retention \(months\)/i)
    await months.fill('24')

    await dialog.getByRole('button', { name: /^save$/i }).click()

    // Dialog closes and the Students row now shows the "24 months" badge.
    await expect(dialog).toBeHidden({ timeout: 15000 })
    await expect(
      studentsRow.getByText(/24 months/i),
    ).toBeVisible({ timeout: 15000 })
  })
})
