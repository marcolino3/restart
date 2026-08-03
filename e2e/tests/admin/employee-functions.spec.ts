import { test, expect, type Locator, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'

/**
 * Employee functions ("Functions") — org-specific contract roles with
 * multilingual labels, dialog-based create/edit, archive, delete and reorder.
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
  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/employee-functions', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /^functions$/i, level: 2 }),
    ).toBeVisible({ timeout: 15000 })
  }

  const openCreateDialog = async (page: Page) => {
    await page.getByRole('button', { name: /^new function$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: /^new function$/i }),
    ).toBeVisible()
    return dialog
  }

  const fillCreateLabel = async (dialog: Locator, unique: string) => {
    await dialog.getByRole('tabpanel').getByLabel(/^label$/i).fill(unique)
  }

  const submitCreate = async (page: Page, dialog: Locator) => {
    await dialog.getByRole('button', { name: /^new function$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })
    await expect(page.getByText(/function created/i)).toBeVisible({
      timeout: 15000,
    })
  }

  const createFunction = async (page: Page, unique: string) => {
    const dialog = await openCreateDialog(page)
    await fillCreateLabel(dialog, unique)
    await submitCreate(page, dialog)
  }

  const rowFor = (page: Page, unique: string) =>
    page.getByRole('row').filter({ hasText: unique })

  const openRowMenu = async (page: Page, label: string) => {
    await page
      .getByRole('button', { name: new RegExp(`open menu for ${label}`, 'i') })
      .click()
  }

  test.describe('create', () => {
    test('requires at least one label', async ({ page }) => {
      await openPage(page)
      const dialog = await openCreateDialog(page)
      await dialog.getByRole('button', { name: /^new function$/i }).click()
      await expect(
        dialog.getByText(/please enter a label in at least one language/i),
      ).toBeVisible()
    })

    test('creates a function with a single locale', async ({ page }) => {
      const unique = `E2E Create ${Date.now()}`
      await openPage(page)
      await createFunction(page, unique)

      const row = rowFor(page, unique)
      await expect(row).toBeVisible({ timeout: 15000 })
      await expect(row.getByText('DE', { exact: true })).toBeVisible()
    })
  })

  test.describe('update', () => {
    test('renames a function', async ({ page }) => {
      const unique = `E2E Update ${Date.now()}`
      const renamed = `${unique} renamed`
      await openPage(page)
      await createFunction(page, unique)

      await openRowMenu(page, unique)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      const editDialog = page.getByRole('dialog')
      await expect(
        editDialog.getByRole('heading', { name: /^edit function$/i }),
      ).toBeVisible()
      await editDialog.getByRole('tabpanel').getByLabel(/^label$/i).fill(renamed)
      await editDialog.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })

      await expect(rowFor(page, renamed)).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('archive', () => {
    test('removes the function from the default list', async ({ page }) => {
      const unique = `E2E Archive ${Date.now()}`
      await openPage(page)
      await createFunction(page, unique)
      const row = rowFor(page, unique)
      await expect(row).toBeVisible({ timeout: 15000 })

      await openRowMenu(page, unique)
      await page.getByRole('menuitem', { name: /^archive$/i }).click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /^archive$/i })
        .click()

      await expect(row).toHaveCount(0, { timeout: 15000 })
    })
  })

  test.describe('delete', () => {
    test('hard-deletes an unused function', async ({ page }) => {
      const unique = `E2E Delete ${Date.now()}`
      await openPage(page)
      await createFunction(page, unique)
      const row = rowFor(page, unique)
      await expect(row).toBeVisible({ timeout: 15000 })

      await openRowMenu(page, unique)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /^delete$/i })
        .click()

      await expect(row).toHaveCount(0, { timeout: 15000 })
    })

    test('disables delete when the function is still assigned', async ({
      page,
    }) => {
      const unique = `E2E InUse ${Date.now()}`
      await openPage(page)

      const created = await page.request.post(`${BACKEND_URL}/graphql`, {
        data: {
          query: `mutation CreateFunction($input: CreateEmployeeFunctionInput!) {
            createEmployeeFunction(input: $input) { id name }
          }`,
          variables: {
            input: { translations: [{ locale: 'DE', name: unique }] },
          },
        },
      })
      const createdJson = (await created.json()) as {
        data?: { createEmployeeFunction?: { id: string } }
        errors?: { message: string }[]
      }
      const functionId = createdJson.data?.createEmployeeFunction?.id
      if (!functionId) {
        throw new Error(
          `E2E fixture: could not create function — ${JSON.stringify(createdJson.errors)}`,
        )
      }

      const stamp = Date.now()
      const draft = await page.request.post(`${BACKEND_URL}/graphql`, {
        data: {
          query: `mutation Upsert($input: EmployeeOnboardingInput!) {
            upsertEmployeeOnboardingDraft(input: $input) { id }
          }`,
          variables: {
            input: {
              firstName: 'E2E',
              lastName: `Assigned ${stamp}`,
              email: `e2e.function.${stamp}@example.com`,
              contract: {
                position: functionId,
                startDate: '2026-01-15',
              },
            },
          },
        },
      })
      const draftJson = (await draft.json()) as {
        errors?: { message: string }[]
      }
      if (draftJson.errors?.length) {
        throw new Error(
          `E2E fixture: could not assign function — ${draftJson.errors[0].message}`,
        )
      }

      await page.reload({ waitUntil: 'networkidle' })
      const row = rowFor(page, unique)
      await expect(row).toBeVisible({ timeout: 15000 })

      await openRowMenu(page, unique)
      await expect(
        page.getByRole('menuitem', { name: /^delete$/i }),
      ).toBeDisabled()
    })
  })

  test.describe('reorder', () => {
    test('persists a new order via drag and drop', async ({ page }) => {
      await openPage(page)

      const a = `E2E Sort A ${Date.now()}`
      const b = `E2E Sort B ${Date.now()}`
      for (const name of [a, b]) {
        await createFunction(page, name)
        await expect(rowFor(page, name)).toBeVisible({ timeout: 15000 })
      }

      const rowA = rowFor(page, a)
      const rowB = rowFor(page, b)
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

      await expect(page.getByText(/order saved/i)).toBeVisible({ timeout: 15000 })
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
