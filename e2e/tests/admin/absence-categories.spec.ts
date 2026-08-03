import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Absence categories — org-specific absence reasons with multilingual labels,
 * behavior flags, archive, active toggle and drag-and-drop reorder.
 */
test.describe('Absence categories — access control', () => {
  test('page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/absence-categories', {
      waitUntil: 'networkidle',
    })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Absence categories — CRUD', () => {
  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/absence-categories', {
      waitUntil: 'networkidle',
    })
    await expect(
      page.getByRole('heading', { name: /^absence categories$/i, level: 1 }),
    ).toBeVisible({ timeout: 15000 })
  }

  const openCreateForm = async (page: Page) => {
    await page.getByRole('button', { name: /^new category$/i }).click()
    await expect(
      page.getByRole('heading', { name: /^new absence category$/i, level: 1 }),
    ).toBeVisible()
  }

  test.describe('create', () => {
    test('creates a category with a German label', async ({ page }) => {
      const unique = `E2E Absence ${Date.now()}`
      await openPage(page)
      await openCreateForm(page)

      await page.getByLabel(/^name \(german\)$/i).fill(unique)
      await page.getByRole('button', { name: /^save$/i }).click()

      await expect(page).toHaveURL(/\/admin\/absence-categories$/, {
        timeout: 15000,
      })
      await expect(page.getByText(unique, { exact: true })).toBeVisible({
        timeout: 15000,
      })
    })
  })

  test.describe('update', () => {
    test('renames a category', async ({ page }) => {
      const unique = `E2E Update ${Date.now()}`
      const renamed = `${unique} renamed`
      await openPage(page)
      await openCreateForm(page)
      await page.getByLabel(/^name \(german\)$/i).fill(unique)
      await page.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByText(unique, { exact: true })).toBeVisible({
        timeout: 15000,
      })

      const row = page.getByRole('row', { name: new RegExp(unique) })
      await row.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()
      await expect(
        page.getByRole('heading', { name: new RegExp(unique, 'i'), level: 1 }),
      ).toBeVisible()
      await page.getByLabel(/^name \(german\)$/i).fill(renamed)
      await page.getByRole('button', { name: /^save$/i }).click()

      await expect(page.getByText(renamed, { exact: true })).toBeVisible({
        timeout: 15000,
      })
    })
  })

  test.describe('archive', () => {
    test('removes a custom category from the list', async ({ page }) => {
      const unique = `E2E Archive ${Date.now()}`
      await openPage(page)
      await openCreateForm(page)
      await page.getByLabel(/^name \(german\)$/i).fill(unique)
      await page.getByRole('button', { name: /^save$/i }).click()
      const row = page.getByRole('row', { name: new RegExp(unique) })
      await expect(row).toBeVisible({ timeout: 15000 })

      await row
        .getByRole('button')
        .filter({ has: page.locator('.lucide-archive') })
        .click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /^archive$/i })
        .click()

      await expect(row).toHaveCount(0, { timeout: 15000 })
    })
  })

  test.describe('active toggle', () => {
    test('deactivates a category', async ({ page }) => {
      const unique = `E2E Toggle ${Date.now()}`
      await openPage(page)
      await openCreateForm(page)
      await page.getByLabel(/^name \(german\)$/i).fill(unique)
      await page.getByRole('button', { name: /^save$/i }).click()
      const row = page.getByRole('row', { name: new RegExp(unique) })
      await expect(row).toBeVisible({ timeout: 15000 })

      await row.getByRole('switch').click()
      await expect(page.getByText(/deactivated/i)).toBeVisible({
        timeout: 15000,
      })
    })
  })

  test.describe('reorder', () => {
    test('persists a new order via drag and drop', async ({ page }) => {
      await openPage(page)

      const a = `E2E Sort A ${Date.now()}`
      const b = `E2E Sort B ${Date.now()}`
      for (const name of [a, b]) {
        await openCreateForm(page)
        await page.getByLabel(/^name \(german\)$/i).fill(name)
        await page.getByRole('button', { name: /^save$/i }).click()
        await expect(page.getByText(name, { exact: true })).toBeVisible({
          timeout: 15000,
        })
      }

      const rowA = page.getByRole('row', { name: new RegExp(a) })
      const rowB = page.getByRole('row', { name: new RegExp(b) })
      const handleA = rowA.getByLabel(/change order/i)
      const handleBox = await handleA.boundingBox()
      const targetBox = await rowB.boundingBox()
      if (!handleBox || !targetBox) {
        throw new Error('rows not visible for drag')
      }

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

      await expect(page.getByText(/order saved/i)).toBeVisible({
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
    })
  })
})
