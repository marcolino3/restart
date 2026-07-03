import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Teams ("Teams") — design-handoff board: a flat grid of team cards, each
 * listing its members with a count badge and a team lead, an "add member"
 * action and drag-and-drop to move members between teams.
 *
 * The authenticated suite signs in through the real UI (credential account
 * seeded by the Playwright global-setup), so it also runs against a fresh CI
 * database.
 */
test.describe('Teams — access control', () => {
  test('page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/teams', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Teams — board', () => {
  const unique = `E2E Team ${Date.now()}`

  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/teams', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /^teams$/i, level: 2 }),
    ).toBeVisible({ timeout: 15000 })
  }

  test('create a team, open the add-member dialog and delete it', async ({
    page,
  }) => {
    await openPage(page)

    // The drag hint is part of the design and always rendered.
    await expect(page.getByText(/drag/i).first()).toBeVisible()

    // --- Create via the "New team" dialog --------------------------------
    await page.getByRole('button', { name: /new team/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: /new team/i }),
    ).toBeVisible()
    await dialog.getByLabel('Name', { exact: true }).fill(unique)
    await dialog.getByRole('button', { name: /^add$/i }).click()

    const card = page
      .locator('div.rounded-card')
      .filter({ has: page.getByText(unique, { exact: true }) })
    await expect(card).toBeVisible({ timeout: 15000 })
    // A fresh team has no members yet → count badge shows exactly "0".
    // (exact match: the unique team name contains digits too.)
    await expect(card.getByText('0', { exact: true })).toBeVisible()

    // --- Add-member dialog opens with the role options -------------------
    await card.getByRole('button', { name: /add member/i }).click()
    const addDialog = page.getByRole('dialog')
    await expect(addDialog.getByText(/function in team/i)).toBeVisible()
    await expect(
      addDialog.getByRole('button', { name: /^lead$/i }),
    ).toBeVisible()
    await addDialog.getByRole('button', { name: /^cancel$/i }).click()

    // --- Delete through the card action menu -----------------------------
    await card.getByRole('button', { name: /team actions/i }).click()
    await page.getByRole('menuitem', { name: /delete team/i }).click()
    const confirm = page.getByRole('alertdialog')
    await confirm.getByRole('button', { name: /^delete$/i }).click()

    await expect(
      page.getByText(unique, { exact: true }),
    ).toHaveCount(0, { timeout: 15000 })
  })
})
