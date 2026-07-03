import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * School classes ("Schulklassen") — design-handoff card grid + table view
 * with search, create via the form page, delete via the card/row menu and
 * drag-and-drop reordering in the table view.
 *
 * The authenticated suites sign in through the real UI; the credential
 * account is seeded once by the Playwright global-setup (see
 * helpers/global-setup), so these run in CI against a fresh database too.
 */
test.describe('School classes — access control', () => {
  test('page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/school-classes', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('School classes — CRUD', () => {
  const unique = `E2E Klasse ${Date.now()}`

  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/school-classes', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /school classes/i, level: 2 }),
    ).toBeVisible({ timeout: 15000 })
  }

  test('create, search and delete a class through the card grid', async ({
    page,
  }) => {
    await openPage(page)

    // --- Create through the form page -------------------------------------
    await page.getByRole('link', { name: /new class/i }).click()
    await expect(
      page.getByRole('heading', { name: /create school class/i }),
    ).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Name', { exact: true }).fill(unique)
    await page.getByRole('button', { name: /^save$/i }).click()

    // Back on the list, the new card is visible.
    const card = page.getByRole('link', { name: unique })
    await expect(card).toBeVisible({ timeout: 15000 })

    // --- Search filters the grid ------------------------------------------
    const search = page.getByRole('textbox', { name: /search classes/i })
    await search.fill(unique)
    await expect(page.getByRole('link', { name: unique })).toBeVisible()
    await search.fill('definitiv-kein-treffer-xyz')
    await expect(page.getByText(/no classes found for/i)).toBeVisible()
    await search.clear()

    // --- Delete via the card menu with confirmation ------------------------
    await card
      .getByRole('button', { name: new RegExp(`open menu ${unique}`, 'i') })
      .click()
    await page.getByRole('menuitem', { name: /delete/i }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(page.getByRole('link', { name: unique })).toHaveCount(0, {
      timeout: 15000,
    })
  })

  test('table view reorders classes via drag and drop', async ({ page }) => {
    await openPage(page)

    // Two throwaway classes guarantee at least two sortable rows.
    const a = `E2E Sort A ${Date.now()}`
    const b = `E2E Sort B ${Date.now()}`
    for (const name of [a, b]) {
      await page.getByRole('link', { name: /new class/i }).click()
      await expect(
        page.getByRole('heading', { name: /create school class/i }),
      ).toBeVisible({ timeout: 15000 })
      await page.getByLabel('Name', { exact: true }).fill(name)
      await page.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByRole('link', { name })).toBeVisible({
        timeout: 15000,
      })
    }

    // Switch to the table view.
    await page.getByRole('button', { name: /^table$/i }).click()
    const rowA = page.getByRole('row', { name: new RegExp(a) })
    const rowB = page.getByRole('row', { name: new RegExp(b) })
    await expect(rowA).toBeVisible()
    await expect(rowB).toBeVisible()

    // New classes are appended in creation order → A comes before B.
    const handleA = rowA.getByLabel(/drag to reorder/i)
    const handleBox = await handleA.boundingBox()
    const targetBox = await rowB.boundingBox()
    if (!handleBox || !targetBox) throw new Error('rows not visible for drag')

    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2,
    )
    await page.mouse.down()
    await page.mouse.move(handleBox.x + 10, handleBox.y + 10, { steps: 5 })
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2 + 10,
      { steps: 10 },
    )
    await page.mouse.up()

    await expect(
      page.getByText(/order saved|reihenfolge gespeichert/i),
    ).toBeVisible({ timeout: 15000 })

    // Persisted: after reload (view sticks via localStorage), A comes after B.
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
        .getByRole('button', { name: new RegExp(`open menu ${name}`, 'i') })
        .click()
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /^delete$/i })
        .click()
      await expect(row).toHaveCount(0, { timeout: 15000 })
    }
  })
})
