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
  // Tests below run against the shared fixture org from ensureActiveOrg and
  // create functions with a unique "E2E ..." label instead of a fresh org
  // per test. Track every created id here and archive (best-effort delete)
  // them in afterAll so repeated local/CI runs don't pile up leftover rows —
  // archive is used as the fallback because the "still assigned" test leaves
  // a function referenced by an onboarding draft, which the hard-delete
  // mutation intentionally refuses to remove.
  const createdFunctionIds: string[] = []
  const createdDrafts: { employeeId: string; orgId: string }[] = []

  const activeOrgId = async (page: Page): Promise<string | undefined> =>
    (await page.context().cookies()).find((c) => c.name === 'Active-Org')
      ?.value

  const trackCreatedFunction = async (page: Page, unique: string) => {
    const listed = await page.request.post(`${BACKEND_URL}/graphql`, {
      data: {
        query: `{ employeeFunctionsByOrgId(includeArchived: true) { id translations { locale name } } }`,
      },
    })
    const listedJson = (await listed.json()) as {
      data?: {
        employeeFunctionsByOrgId?: {
          id: string
          translations: { locale: string; name: string }[]
        }[]
      }
    }
    const id = listedJson.data?.employeeFunctionsByOrgId?.find((fn) =>
      fn.translations.some((tr) => tr.name === unique),
    )?.id
    if (id) createdFunctionIds.push(id)
  }

  test.afterAll(async ({ browser }) => {
    if (createdFunctionIds.length === 0 && createdDrafts.length === 0) {
      return
    }
    // The bare `request` fixture has no session cookie; sign in through a
    // throwaway page so the delete/archive mutations are authorized.
    const context = await browser.newContext()
    const page = await context.newPage()
    await signInAsSuperAdmin(page)
    // ensureActiveOrg creates a NEW org when no named org exists — it would
    // not land back on the org each fixture was created in. Function
    // deletes/archives are unscoped-by-org lookups, but the draft-employee
    // removal is org-scoped, so its own Active-Org cookie is set per draft
    // below instead of relying on a single shared org here.
    const authedRequest = page.request

    // Draft employees must go first — they're what keeps the "still
    // assigned" fixture function from hard-deleting.
    for (const { employeeId, orgId } of createdDrafts) {
      await context.addCookies([
        {
          name: 'Active-Org',
          value: orgId,
          domain: new URL(BACKEND_URL).hostname,
          path: '/',
        },
      ])
      const removed = await authedRequest.post(`${BACKEND_URL}/graphql`, {
        data: {
          query: `mutation RemoveDraft($employeeId: ID!) {
            removeEmployeeOnboardingDraft(employeeId: $employeeId)
          }`,
          variables: { employeeId },
        },
      })
      const removedJson = (await removed.json()) as {
        errors?: { message: string }[]
      }
      if (removedJson.errors?.length) {
        console.warn(
          `E2E teardown: could not remove onboarding draft ${employeeId} — ${removedJson.errors[0].message}`,
        )
      }
    }

    for (const id of createdFunctionIds) {
      const del = await authedRequest.post(`${BACKEND_URL}/graphql`, {
        data: {
          query: `mutation Delete($id: ID!) { deleteEmployeeFunction(id: $id) }`,
          variables: { id },
        },
      })
      const delJson = (await del.json()) as { errors?: { message: string }[] }
      if (delJson.errors?.length) {
        // Still assigned (e.g. the "disables delete" fixture) — archive
        // instead so it at least disappears from the default list.
        await authedRequest.post(`${BACKEND_URL}/graphql`, {
          data: {
            query: `mutation Archive($id: ID!) { archiveEmployeeFunction(id: $id) }`,
            variables: { id },
          },
        })
      }
    }
    await context.close()
  })

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
    await dialog.getByLabel(/^label$/i).fill(unique)
  }

  const submitCreate = async (page: Page, dialog: Locator) => {
    await dialog.getByRole('button', { name: /^new function$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })
  }

  /**
   * Creates a function and settles the page. `onSaved` triggers a
   * `router.refresh()`, which re-renders the table and would detach a row
   * menu opened right after; reloading also proves the row was persisted
   * server-side rather than only added to local state.
   */
  const createFunction = async (page: Page, unique: string) => {
    const dialog = await openCreateDialog(page)
    await fillCreateLabel(dialog, unique)
    await submitCreate(page, dialog)
    await page.reload({ waitUntil: 'networkidle' })
    await expect(rowFor(page, unique)).toBeVisible({ timeout: 15000 })
    await trackCreatedFunction(page, unique)
  }

  const rowFor = (page: Page, unique: string) =>
    page.getByRole('row', { name: new RegExp(unique) })

  const openRowMenu = async (page: Page, label: string) => {
    await rowFor(page, label)
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
      await editDialog.getByLabel(/^label$/i).fill(renamed)
      await editDialog.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })
      await page.reload({ waitUntil: 'networkidle' })

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
      await createFunction(page, unique)

      const listed = await page.request.post(`${BACKEND_URL}/graphql`, {
        data: {
          query: `{ employeeFunctionsByOrgId { id translations { locale name } } }`,
        },
      })
      const listedJson = (await listed.json()) as {
        data?: {
          employeeFunctionsByOrgId?: {
            id: string
            translations: { locale: string; name: string }[]
          }[]
        }
        errors?: { message: string }[]
      }
      const functionId = listedJson.data?.employeeFunctionsByOrgId?.find((fn) =>
        fn.translations.some((tr) => tr.name === unique),
      )?.id
      if (!functionId) {
        throw new Error(
          `E2E fixture: could not resolve function id — ${JSON.stringify(listedJson.errors)}`,
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
        data?: { upsertEmployeeOnboardingDraft?: { id: string } }
        errors?: { message: string }[]
      }
      if (draftJson.errors?.length) {
        throw new Error(
          `E2E fixture: could not assign function — ${draftJson.errors[0].message}`,
        )
      }
      const draftEmployeeId = draftJson.data?.upsertEmployeeOnboardingDraft?.id
      if (draftEmployeeId) {
        const orgId = await activeOrgId(page)
        if (orgId) createdDrafts.push({ employeeId: draftEmployeeId, orgId })
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
      }

      const rowA = rowFor(page, a)
      const rowB = rowFor(page, b)
      // Both rows are appended at the end of a list that can outgrow the
      // viewport; bounding boxes are viewport-relative, so scroll first.
      await rowB.scrollIntoViewIfNeeded()
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
