import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'

/**
 * Time tracking settings — holidays & company vacations CRUD via sheet forms.
 * Route: /en/admin/time-tracking-settings
 */
test.describe('Time tracking settings — access control', () => {
  test('page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/time-tracking-settings', {
      waitUntil: 'networkidle',
    })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Time tracking settings — holidays CRUD', () => {
  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/time-tracking-settings', {
      waitUntil: 'networkidle',
    })
    await expect(
      page.getByRole('heading', { name: /^settings$/i, level: 2 }),
    ).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('tab', { name: /^holidays$/i })).toBeVisible()
  }

  /** Name lives in its own table cell — prefer exact cell match over row text. */
  const rowFor = (page: Page, name: string) =>
    page.getByRole('row').filter({
      has: page.getByRole('cell', { name, exact: true }),
    })

  const openRowMenu = async (page: Page, name: string) => {
    await rowFor(page, name)
      .getByRole('button', { name: /^open menu$/i })
      .click()
  }

  const gql = async <T>(
    page: Page,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> => {
    const res = await page.request.post(`${BACKEND_URL}/graphql`, {
      data: { query, variables },
    })
    const json = (await res.json()) as {
      data?: T
      errors?: { message: string }[]
    }
    if (json.errors?.length) {
      throw new Error(`GraphQL: ${json.errors[0].message}`)
    }
    if (!json.data) throw new Error('GraphQL: empty data')
    return json.data
  }

  /** Unique ISO date far from today so UI creates on "today" never collide. */
  const uniqueDate = (offsetDays: number) => {
    const d = new Date('2030-01-01T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + offsetDays)
    return d.toISOString().slice(0, 10)
  }

  const createHolidayViaApi = async (
    page: Page,
    input: {
      date: string
      name: string
      paidPercentage?: number
      repeatsYearly?: boolean
    },
  ) => {
    const data = await gql<{ createHoliday: { id: string; name: string } }>(
      page,
      `mutation CreateHoliday($input: CreateHolidayInput!) {
        createHoliday(input: $input) { id name }
      }`,
      { input },
    )
    return data.createHoliday
  }

  test('creates a one-off holiday and shows it in the table', async ({
    page,
  }) => {
    const stamp = Date.now()
    const unique = `E2E Holiday ${stamp}`
    // Soft-delete keeps uq_holidays_org_date occupied — always use a fresh date.
    const date = uniqueDate((stamp % 8000) + 50)

    await openPage(page)
    await createHolidayViaApi(page, {
      date,
      name: unique,
      paidPercentage: 100,
      repeatsYearly: false,
    })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(rowFor(page, unique)).toBeVisible({ timeout: 15000 })
    await expect(rowFor(page, unique)).not.toContainText(/yearly/i)
  })

  test('creates a yearly holiday and shows the yearly label', async ({
    page,
  }) => {
    const unique = `E2E Yearly ${Date.now()}`
    await openPage(page)

    const date = uniqueDate((Date.now() % 1000) + 10)
    await createHolidayViaApi(page, {
      date,
      name: unique,
      repeatsYearly: true,
    })
    await page.reload({ waitUntil: 'networkidle' })

    const row = rowFor(page, unique)
    await expect(row).toBeVisible({ timeout: 15000 })
    await expect(row).toContainText(/yearly/i)
  })

  test('creates, updates, copies and deletes a holiday via the sheet', async ({
    page,
  }) => {
    const stamp = Date.now()
    const unique = `E2E Edit ${stamp}`
    const renamed = `${unique} renamed`
    const date = uniqueDate((stamp % 1000) + 200)

    await openPage(page)
    await createHolidayViaApi(page, {
      date,
      name: unique,
      paidPercentage: 100,
      repeatsYearly: false,
    })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(rowFor(page, unique)).toBeVisible({ timeout: 15000 })

    // --- Edit -------------------------------------------------------------
    await openRowMenu(page, unique)
    await page.getByRole('menuitem', { name: /^edit$/i }).click()
    const editSheet = page.getByRole('dialog')
    await expect(
      editSheet.getByRole('heading', { name: /^edit holiday$/i }),
    ).toBeVisible()
    await editSheet.getByLabel(/^name$/i).fill(renamed)
    await editSheet.getByRole('button', { name: /^edit holiday$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(rowFor(page, renamed)).toBeVisible({ timeout: 15000 })

    // --- Copy (sheet create with next-year date) --------------------------
    await openRowMenu(page, renamed)
    await page.getByRole('menuitem', { name: /^copy$/i }).click()
    const copySheet = page.getByRole('dialog')
    await expect(
      copySheet.getByRole('heading', { name: /^copy holiday$/i }),
    ).toBeVisible()
    const copyName = `${renamed} copy`
    await copySheet.getByLabel(/^name$/i).fill(copyName)
    await copySheet.getByRole('button', { name: /^add holiday$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(rowFor(page, copyName)).toBeVisible({ timeout: 15000 })

    // --- Delete original --------------------------------------------------
    await openRowMenu(page, renamed)
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(rowFor(page, renamed)).toHaveCount(0, { timeout: 15000 })
  })
})

test.describe('Time tracking settings — company vacations CRUD', () => {
  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/time-tracking-settings', {
      waitUntil: 'networkidle',
    })
    await expect(
      page.getByRole('heading', { name: /^settings$/i, level: 2 }),
    ).toBeVisible({ timeout: 15000 })
    await page.getByRole('tab', { name: /^company vacations$/i }).click()
    await expect(
      page.getByRole('button', { name: /^add company vacation$/i }),
    ).toBeVisible()
  }

  const rowFor = (page: Page, name: string) =>
    page.getByRole('row').filter({
      has: page.getByRole('cell', { name, exact: true }),
    })

  const openRowMenu = async (page: Page, name: string) => {
    await rowFor(page, name)
      .getByRole('button', { name: /^open menu$/i })
      .click()
  }

  test('creates, updates and deletes a company vacation', async ({ page }) => {
    const stamp = Date.now()
    const unique = `E2E Vacation ${stamp}`
    const renamed = `${unique} renamed`

    await openPage(page)

    // --- Create (default range = today) -----------------------------------
    await page.getByRole('button', { name: /^add company vacation$/i }).click()
    const sheet = page.getByRole('dialog')
    await expect(
      sheet.getByRole('heading', { name: /^add company vacation$/i }),
    ).toBeVisible()
    await sheet.getByLabel(/^name$/i).fill(unique)
    await sheet.getByRole('button', { name: /^add company vacation$/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })

    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: /^company vacations$/i }).click()
    await expect(rowFor(page, unique)).toBeVisible({ timeout: 15000 })

    // --- Edit -------------------------------------------------------------
    await openRowMenu(page, unique)
    await page.getByRole('menuitem', { name: /^edit$/i }).click()
    const editSheet = page.getByRole('dialog')
    await expect(
      editSheet.getByRole('heading', { name: /^edit company vacation$/i }),
    ).toBeVisible()
    await editSheet.getByLabel(/^name$/i).fill(renamed)
    await editSheet
      .getByRole('button', { name: /^edit company vacation$/i })
      .click()
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })

    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: /^company vacations$/i }).click()
    await expect(rowFor(page, renamed)).toBeVisible({ timeout: 15000 })

    // --- Delete -----------------------------------------------------------
    await openRowMenu(page, renamed)
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(rowFor(page, renamed)).toHaveCount(0, { timeout: 15000 })
  })
})
