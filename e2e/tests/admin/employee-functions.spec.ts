import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Employee functions ("Functions") — org-specific contract roles with
 * multilingual labels, dialog-based create/edit, archive and delete.
 *
 * The authenticated suite signs in through the real UI (credential account
 * seeded by the Playwright global-setup), so it also runs against a fresh CI
 * database.
 */
test.describe('Employee functions — access control', () => {
  test('page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/employee-functions', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Employee functions — CRUD', () => {
  const unique = `E2E Function ${Date.now()}`
  const renamed = `${unique} renamed`

  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/employee-functions', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /^functions$/i, level: 2 }),
    ).toBeVisible({ timeout: 15000 })
  }

  const openRowMenu = async (page: Page, label: string) => {
    await page
      .getByRole('button', { name: new RegExp(`open menu for ${label}`, 'i') })
      .click()
  }

  test('create with a single locale, edit, archive and delete', async ({
    page,
  }) => {
    await openPage(page)

    // --- Create with DE label only (optional locales stay empty) ----------
    await page.getByRole('button', { name: /^new function$/i }).click()
    const createDialog = page.getByRole('dialog')
    await expect(
      createDialog.getByRole('heading', { name: /^new function$/i }),
    ).toBeVisible()
    await createDialog.getByLabel(/^label$/i).fill(unique)
    await createDialog.getByRole('button', { name: /^new function$/i }).click()

    const row = page.getByRole('row', { name: new RegExp(unique) })
    await expect(row).toBeVisible({ timeout: 15000 })
    await expect(row.getByText('DE', { exact: true })).toBeVisible()

    // --- Edit through the pre-filled dialog -------------------------------
    await openRowMenu(page, unique)
    await page.getByRole('menuitem', { name: /^edit$/i }).click()
    const editDialog = page.getByRole('dialog')
    await expect(
      editDialog.getByRole('heading', { name: /^edit function$/i }),
    ).toBeVisible()
    await expect(editDialog.getByLabel(/^label$/i)).toHaveValue(unique)
    await editDialog.getByLabel(/^label$/i).fill(renamed)
    await editDialog.getByRole('button', { name: /^save$/i }).click()

    const renamedRow = page.getByRole('row', { name: new RegExp(renamed) })
    await expect(renamedRow).toBeVisible({ timeout: 15000 })

    // --- Archive removes the row from the default list --------------------
    await openRowMenu(page, renamed)
    await page.getByRole('menuitem', { name: /^archive$/i }).click()
    const archiveConfirm = page.getByRole('alertdialog')
    await archiveConfirm.getByRole('button', { name: /^archive$/i }).click()
    await expect(renamedRow).toHaveCount(0, { timeout: 15000 })

    // --- Create again for hard delete -------------------------------------
    await page.getByRole('button', { name: /^new function$/i }).click()
    const deleteDialog = page.getByRole('dialog')
    await deleteDialog.getByLabel(/^label$/i).fill(unique)
    await deleteDialog.getByRole('button', { name: /^new function$/i }).click()
    const deleteRow = page.getByRole('row', { name: new RegExp(unique) })
    await expect(deleteRow).toBeVisible({ timeout: 15000 })

    await openRowMenu(page, unique)
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    const deleteConfirm = page.getByRole('alertdialog')
    await deleteConfirm.getByRole('button', { name: /^delete$/i }).click()
    await expect(deleteRow).toHaveCount(0, { timeout: 15000 })
  })
})
