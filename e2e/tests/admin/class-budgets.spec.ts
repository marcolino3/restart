import { test, expect, type Page } from '@playwright/test'
import {
  ensureActiveOrg,
  setupSecondOrgUser,
  signInAsSuperAdmin,
} from '../helpers/auth'
import { e2eName } from '../helpers/fixture-naming'

/**
 * Class budgets — a budget per class and school year, expenses with a private
 * receipt, budget status with overrun warning.
 *
 * Everything a test creates carries an `e2eName()` and is removed again in
 * afterEach through the app itself (so receipts leave the storage too); the
 * global teardown is only the safety net. Categories can only be archived by
 * design — those rows are swept by their E2E name.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'

const PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
)

type GqlResult = {
  data?: Record<string, any>
  errors?: { message: string }[]
}

async function gql(
  page: Page,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GqlResult> {
  const res = await page.request.post(`${BACKEND_URL}/graphql`, {
    data: { query, variables },
  })
  return res.json() as Promise<GqlResult>
}

async function uploadReceipt(page: Page, schoolClassId: string) {
  return page.request.post(
    `${BACKEND_URL}/api/expense-receipts?schoolClassId=${schoolClassId}`,
    {
      multipart: {
        file: { name: 'receipt.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES },
      },
    },
  )
}

/** Every way into org A's class must fail for a session of another org. */
async function expectForeignOrgLockedOut(
  otherPage: Page,
  target: {
    schoolClassId: string
    categoryId: string
    expenseId: string
    fileId: string
  },
) {
  const summary = await gql(
    otherPage,
    'query S($c: ID!, $y: Int!) { classBudgetSummary(schoolClassId: $c, schoolYearStart: $y) { spent } }',
    { c: target.schoolClassId, y: new Date().getFullYear() },
  )
  expect(summary.data?.classBudgetSummary ?? null).toBeNull()
  expect(summary.errors?.length).toBeGreaterThan(0)

  const foreignExpense = await gql(
    otherPage,
    'mutation C($input: CreateClassExpenseInput!) { createClassExpense(input: $input) { id } }',
    {
      input: {
        schoolClassId: target.schoolClassId,
        categoryId: target.categoryId,
        expenseDate: new Date().toLocaleDateString('sv-SE'),
        amount: 1,
      },
    },
  )
  expect(foreignExpense.data?.createClassExpense ?? null).toBeNull()

  const foreignDelete = await gql(
    otherPage,
    'mutation D($id: ID!) { deleteClassExpense(id: $id) { id } }',
    { id: target.expenseId },
  )
  expect(foreignDelete.data?.deleteClassExpense ?? null).toBeNull()

  const foreignReceipt = await otherPage.request.get(
    `${BACKEND_URL}/api/expense-receipts/${target.fileId}?schoolClassId=${target.schoolClassId}`,
  )
  expect(foreignReceipt.status()).toBe(404)

  const foreignAnalysis = await gql(
    otherPage,
    'mutation A($c: ID!, $f: String!) { analyzeExpenseReceipt(schoolClassId: $c, fileId: $f) { vendor } }',
    { c: target.schoolClassId, f: target.fileId },
  )
  expect(foreignAnalysis.data?.analyzeExpenseReceipt ?? null).toBeNull()
}

test.describe('Class budgets — access control', () => {
  test('page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/class-budgets', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })

  test('receipts are not reachable without a session', async ({ request }) => {
    const res = await request.get(
      `${BACKEND_URL}/api/expense-receipts/00000000-0000-4000-8000-000000000000.pdf?schoolClassId=00000000-0000-4000-8000-000000000000`,
    )
    expect([401, 403]).toContain(res.status())
  })
})

test.describe('Class budgets', () => {
  let classIds: string[] = []
  let expenseIds: string[] = []
  let categoryIds: string[] = []

  test.beforeEach(() => {
    classIds = []
    expenseIds = []
    categoryIds = []
  })

  test.afterEach(async ({ page }) => {
    // Order matters: expenses reference class and category.
    const cleanups: [string, string[]][] = [
      ['mutation D($id: ID!) { deleteClassExpense(id: $id) { id } }', expenseIds],
      ['mutation D($id: ID!) { deleteSchoolClass(id: $id) }', classIds],
      ['mutation D($id: ID!) { archiveExpenseCategory(id: $id) }', categoryIds],
    ]
    for (const [query, ids] of cleanups) {
      for (const id of ids) {
        // Cleanup must not turn a passing test red.
        await gql(page, query, { id }).catch(() => undefined)
      }
    }
  })

  const currentStartYear = async (page: Page): Promise<number> => {
    const res = await gql(page, '{ schoolYear { startYear } }')
    return res.data?.schoolYear?.startYear as number
  }

  const createClass = async (page: Page): Promise<{ id: string; name: string }> => {
    const name = e2eName('Budget Class')
    const res = await gql(
      page,
      'mutation C($input: CreateSchoolClassInput!) { createSchoolClass(input: $input) { id } }',
      { input: { name } },
    )
    const id = res.data?.createSchoolClass?.id as string
    expect(id, JSON.stringify(res.errors)).toBeTruthy()
    classIds.push(id)
    return { id, name }
  }

  const createCategory = async (page: Page): Promise<{ id: string; name: string }> => {
    const name = e2eName('Material')
    const res = await gql(
      page,
      'mutation C($input: CreateExpenseCategoryInput!) { createExpenseCategory(input: $input) { id } }',
      { input: { name, color: '#0EA5E9' } },
    )
    const id = res.data?.createExpenseCategory?.id as string
    expect(id, JSON.stringify(res.errors)).toBeTruthy()
    categoryIds.push(id)
    return { id, name }
  }

  const setBudget = async (page: Page, schoolClassId: string, amount: number) => {
    const res = await gql(
      page,
      'mutation U($input: UpsertClassBudgetInput!) { upsertClassBudget(input: $input) { id } }',
      {
        input: {
          schoolClassId,
          schoolYearStart: await currentStartYear(page),
          amount,
          note: e2eName('Budget'),
        },
      },
    )
    expect(res.errors, JSON.stringify(res.errors)).toBeUndefined()
  }

  /** Collects the ids of the class's expenses so afterEach can remove them. */
  const trackExpenses = async (page: Page, schoolClassId: string) => {
    const res = await gql(
      page,
      'query E($y: Int!, $c: ID) { classExpenses(schoolYearStart: $y, schoolClassId: $c) { id receiptFileId } }',
      { y: await currentStartYear(page), c: schoolClassId },
    )
    const rows = (res.data?.classExpenses ?? []) as {
      id: string
      receiptFileId: string | null
    }[]
    expenseIds.push(...rows.map((row) => row.id))
    return rows
  }

  test('records an expense with a receipt and shows the budget status', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const schoolClass = await createClass(page)
    const category = await createCategory(page)
    await setBudget(page, schoolClass.id, 500)

    await page.goto(`/en/admin/class-budgets?classId=${schoolClass.id}`, {
      waitUntil: 'networkidle',
    })
    await expect(page.getByText('No expenses recorded yet.').first()).toBeVisible({
      timeout: 15000,
    })

    await page.getByRole('button', { name: /^record expense$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByTestId('receipt-input').setInputFiles({
      name: 'receipt.pdf',
      mimeType: 'application/pdf',
      buffer: PDF_BYTES,
    })
    await expect(dialog.getByRole('link', { name: /view receipt/i })).toBeVisible({
      timeout: 15000,
    })

    await dialog.getByLabel('Amount').fill('120.50')
    await dialog.getByLabel('Category').click()
    await page.getByRole('option', { name: category.name }).click()
    await dialog.getByLabel('Vendor').fill('E2E Papeterie')
    await dialog.getByRole('button', { name: /^save$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 15000 })
    await expect(page.getByRole('cell', { name: 'E2E Papeterie' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByTestId('budget-remaining')).toContainText('379.50')

    // The receipt is attached and readable by the owner org.
    const [expense] = await trackExpenses(page, schoolClass.id)
    expect(expense.receiptFileId).toBeTruthy()
    const receipt = await page.request.get(
      `${BACKEND_URL}/api/expense-receipts/${expense.receiptFileId}?schoolClassId=${schoolClass.id}`,
    )
    expect(receipt.status()).toBe(200)
  })

  test('warns on overrun but still accepts the expense', async ({ page }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const schoolClass = await createClass(page)
    const category = await createCategory(page)
    await setBudget(page, schoolClass.id, 100)

    const created = await gql(
      page,
      'mutation C($input: CreateClassExpenseInput!) { createClassExpense(input: $input) { id } }',
      {
        input: {
          schoolClassId: schoolClass.id,
          categoryId: category.id,
          expenseDate: new Date().toLocaleDateString('sv-SE'),
          amount: 150,
          vendor: 'E2E Overrun',
        },
      },
    )
    expect(created.errors, JSON.stringify(created.errors)).toBeUndefined()
    expenseIds.push(created.data?.createClassExpense?.id as string)

    await page.goto(`/en/admin/class-budgets?classId=${schoolClass.id}`, {
      waitUntil: 'networkidle',
    })
    // Next's route announcer is an (empty) alert too.
    await expect(
      page.getByRole('alert').filter({ hasText: /over budget/i }),
    ).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('budget-remaining')).toContainText('-50.00')
  })

  test('sets a budget inline on the planning page', async ({ page }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const schoolClass = await createClass(page)

    await page.goto('/en/admin/class-budgets/manage', { waitUntil: 'networkidle' })
    const input = page.getByLabel(`Budget for ${schoolClass.name}`)
    await expect(input).toBeVisible({ timeout: 15000 })
    await input.fill("1'250.00")
    await input.blur()
    await expect(page.getByText('Budget saved.')).toBeVisible({ timeout: 15000 })

    const summary = await gql(
      page,
      'query S($c: ID!, $y: Int!) { classBudgetSummary(schoolClassId: $c, schoolYearStart: $y) { budget } }',
      { c: schoolClass.id, y: await currentStartYear(page) },
    )
    expect(summary.data?.classBudgetSummary?.budget).toBe(1250)
  })

  test('another organization cannot see, book on or read receipts of the class', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const schoolClass = await createClass(page)
    const category = await createCategory(page)
    const upload = await uploadReceipt(page, schoolClass.id)
    expect(upload.ok()).toBe(true)
    const { fileId } = (await upload.json()) as { fileId: string }
    const created = await gql(
      page,
      'mutation C($input: CreateClassExpenseInput!) { createClassExpense(input: $input) { id } }',
      {
        input: {
          schoolClassId: schoolClass.id,
          categoryId: category.id,
          expenseDate: new Date().toLocaleDateString('sv-SE'),
          amount: 10,
          vendor: 'E2E Isolation',
          receiptFileId: fileId,
        },
      },
    )
    const expenseId = created.data?.createClassExpense?.id as string
    expect(expenseId, JSON.stringify(created.errors)).toBeTruthy()

    expenseIds.push(expenseId)

    // setupSecondOrgUser switches the admin session into the new org; switch
    // back in any case, otherwise afterEach could not clean up org A.
    const orgAId = (await page.context().cookies()).find(
      (c) => c.name === 'Active-Org',
    )?.value
    const { page: otherPage } = await setupSecondOrgUser(browser, page)
    try {
      await expectForeignOrgLockedOut(otherPage, {
        schoolClassId: schoolClass.id,
        categoryId: category.id,
        expenseId,
        fileId,
      })
    } finally {
      await otherPage.close()
      if (orgAId) {
        await page.request.post(`${BACKEND_URL}/api/org/switch`, {
          data: { orgId: orgAId },
        })
      }
    }
  })

  test('offers AI analysis only when the organization configured it', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const schoolClass = await createClass(page)

    const configured = await gql(page, '{ expenseAiConfigured }')
    test.skip(
      configured.data?.expenseAiConfigured === true,
      'The active org has an AI key — the unconfigured path cannot be shown.',
    )

    // Without configuration the mutation refuses before any provider call.
    const upload = await uploadReceipt(page, schoolClass.id)
    const { fileId } = (await upload.json()) as { fileId: string }
    const analysis = await gql(
      page,
      'mutation A($c: ID!, $f: String!) { analyzeExpenseReceipt(schoolClassId: $c, fileId: $f) { vendor } }',
      { c: schoolClass.id, f: fileId },
    )
    expect(analysis.data?.analyzeExpenseReceipt ?? null).toBeNull()
    expect(analysis.errors?.[0]?.message).toMatch(/not configured/i)
    await page.request.delete(
      `${BACKEND_URL}/api/expense-receipts/${fileId}?schoolClassId=${schoolClass.id}`,
    )

    await page.goto(`/en/admin/class-budgets?classId=${schoolClass.id}`, {
      waitUntil: 'networkidle',
    })
    await page.getByRole('button', { name: /^record expense$/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByTestId('receipt-input').setInputFiles({
      name: 'receipt.pdf',
      mimeType: 'application/pdf',
      buffer: PDF_BYTES,
    })
    await expect(dialog.getByRole('link', { name: /view receipt/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(dialog.getByRole('button', { name: /analyse with ai/i })).toHaveCount(0)

    // Cancelling discards the uploaded, never attached receipt.
    await dialog.getByRole('button', { name: /^cancel$/i }).click()
    await expect(dialog).toBeHidden()
  })
})
