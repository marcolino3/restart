import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Grade levels ("Stufen") — design-handoff table with search, dialog-based
 * create/edit, delete and drag-and-drop reordering.
 *
 * The authenticated suites sign in through the real UI. The credential
 * account is seeded once by the Playwright global-setup (see
 * helpers/global-setup), so these run in CI against a fresh database too.
 */
test.describe('Grade levels — access control', () => {
  test('page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/grade-levels', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Grade levels — CRUD', () => {
  const unique = `E2E Stufe ${Date.now()}`
  const renamed = `${unique} umbenannt`

  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/grade-levels', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /grade levels/i, level: 2 }),
    ).toBeVisible({ timeout: 15000 })
  }

  test('create, search, edit and delete a grade level', async ({ page }) => {
    await openPage(page)

    // --- Create via the "New grade level" dialog -------------------------
    await page.getByRole('button', { name: /new grade level/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: /create grade level/i }),
    ).toBeVisible()
    await dialog.getByLabel('Name', { exact: true }).fill(unique)
    await dialog.getByLabel(/short code/i).fill('E2E 1-3')
    await dialog.getByLabel(/age from/i).fill('6')
    await dialog.getByLabel(/age to/i).fill('9')
    await dialog.getByRole('button', { name: /save/i }).click()

    const row = page.getByRole('row', { name: new RegExp(unique) })
    await expect(row).toBeVisible({ timeout: 15000 })
    await expect(row).toContainText('E2E 1-3')
    await expect(row).toContainText('6–9 years')

    // --- Search filters by name and short code ---------------------------
    const search = page.getByRole('textbox', { name: /search grade levels/i })
    await search.fill(unique)
    await expect(page.getByRole('row', { name: new RegExp(unique) })).toBeVisible()
    await search.fill('definitiv-kein-treffer-xyz')
    await expect(page.getByText(/no grade levels found for/i)).toBeVisible()
    await search.clear()

    // --- Edit through the pre-filled dialog -------------------------------
    await row.getByRole('button', { name: /^edit$/i }).click()
    const editDialog = page.getByRole('dialog')
    await expect(editDialog.getByLabel('Name', { exact: true })).toHaveValue(
      unique,
    )
    await editDialog.getByLabel('Name', { exact: true }).fill(renamed)
    await editDialog.getByRole('button', { name: /save/i }).click()

    const renamedRow = page.getByRole('row', { name: new RegExp(renamed) })
    await expect(renamedRow).toBeVisible({ timeout: 15000 })

    // --- Delete with confirmation -----------------------------------------
    await renamedRow
      .getByRole('button', { name: new RegExp(`delete ${renamed}`, 'i') })
      .click()
    const confirm = page.getByRole('alertdialog')
    await confirm.getByRole('button', { name: /^delete$/i }).click()
    await expect(
      page.getByRole('row', { name: new RegExp(renamed) }),
    ).toHaveCount(0, { timeout: 15000 })
  })

  test('reorder persists via drag and drop', async ({ page }) => {
    await openPage(page)

    // Two throwaway levels guarantee at least two sortable rows.
    const a = `E2E Sort A ${Date.now()}`
    const b = `E2E Sort B ${Date.now()}`
    for (const name of [a, b]) {
      await page.getByRole('button', { name: /new grade level/i }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Name', { exact: true }).fill(name)
      await dialog.getByRole('button', { name: /save/i }).click()
      await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible(
        { timeout: 15000 },
      )
    }

    const rowA = page.getByRole('row', { name: new RegExp(a) })
    const rowB = page.getByRole('row', { name: new RegExp(b) })
    const handleA = rowA.getByLabel(/drag to reorder/i)

    // dnd-kit's PointerSensor needs real pointer movement, not HTML5 dragTo.
    const handleBox = await handleA.boundingBox()
    const targetBox = await rowB.boundingBox()
    if (!handleBox || !targetBox) throw new Error('rows not visible for drag')

    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2,
    )
    await page.mouse.down()
    // Two intermediate moves so the 4px activation constraint kicks in.
    await page.mouse.move(handleBox.x + 10, handleBox.y + 10, { steps: 5 })
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2 + 10,
      { steps: 10 },
    )
    await page.mouse.up()

    // Persisted: after reload, A still comes after B.
    await expect(page.getByText(/order saved|reihenfolge gespeichert/i)).toBeVisible({
      timeout: 15000,
    })
    await page.reload({ waitUntil: 'networkidle' })
    const names = await page
      .getByRole('row')
      .filter({ hasText: /E2E Sort/ })
      .allTextContents()
    const indexA = names.findIndex((n) => n.includes(a))
    const indexB = names.findIndex((n) => n.includes(b))
    expect(indexA).toBeGreaterThan(indexB)

    // Cleanup so repeated local runs do not accumulate rows.
    for (const name of [a, b]) {
      const row = page.getByRole('row', { name: new RegExp(name) })
      await row
        .getByRole('button', { name: new RegExp(`delete ${name}`, 'i') })
        .click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /^delete$/i })
        .click()
      await expect(row).toHaveCount(0, { timeout: 15000 })
    }
  })
})
