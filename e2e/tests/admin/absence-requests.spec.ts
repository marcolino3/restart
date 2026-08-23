import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Absence approval workflow.
 * Route: /en/admin/absence-requests — the approval queue for team leads, HR
 * and admins.
 *
 * Every request created here is withdrawn or soft-deleted again in afterEach:
 * the dev database must not accumulate test data.
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'
const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL ?? 'marco@marranchelli.com'

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

/** Day far enough ahead that a request is allowed and nothing else uses it. */
const dayAhead = (offset: number) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

const ensureSelfEmployee = async (page: Page): Promise<string> => {
  const data = await gql<{ myEmployeeId: string | null }>(
    page,
    `{ myEmployeeId }`,
  )
  if (data.myEmployeeId) return data.myEmployeeId

  const created = await gql<{ createEmployee: { id: string } }>(
    page,
    `mutation CreateEmployee($input: CreateEmployeeInput!) {
      createEmployee(createEmployeeInput: $input) { id }
    }`,
    {
      input: {
        firstName: 'E2E',
        lastName: 'Self',
        email: SUPERADMIN_EMAIL,
        persona: 'ADMIN',
        timeTrackingEnabled: false,
      },
    },
  )
  return created.createEmployee.id
}

/** Category that has to be requested, so the notice lands in PENDING. */
const requestCategoryId = async (page: Page): Promise<string> => {
  const { employeeAbsenceCategoriesByOrgId } = await gql<{
    employeeAbsenceCategoriesByOrgId: {
      id: string
      isActive: boolean
      requiresApproval: boolean
    }[]
  }>(
    page,
    `{ employeeAbsenceCategoriesByOrgId { id isActive requiresApproval } }`,
  )
  const category = employeeAbsenceCategoriesByOrgId.find(
    (c) => c.isActive && c.requiresApproval,
  )
  if (!category) throw new Error('No category with requiresApproval found')
  return category.id
}

const clearAbsencesOn = async (
  page: Page,
  employeeId: string,
  isoDates: string[],
): Promise<void> => {
  const { employeeAbsencesByEmployeeId } = await gql<{
    employeeAbsencesByEmployeeId: {
      id: string
      startDate: string
      endDate: string | null
    }[]
  }>(
    page,
    `query($employeeId: ID!) {
      employeeAbsencesByEmployeeId(employeeId: $employeeId) {
        id startDate endDate
      }
    }`,
    { employeeId },
  )

  for (const absence of employeeAbsencesByEmployeeId) {
    const start = absence.startDate.slice(0, 10)
    const end = (absence.endDate ?? absence.startDate).slice(0, 10)
    const overlaps = isoDates.some((date) => date >= start && date <= end)
    if (!overlaps) continue
    await gql(page, `mutation($id: ID!) { deleteEmployeeAbsence(id: $id) }`, {
      id: absence.id,
    })
  }
}

const createRequest = async (
  page: Page,
  input: { startDate: string; endDate: string; note: string },
) => {
  const categoryId = await requestCategoryId(page)
  const data = await gql<{
    createEmployeeAbsenceNotice: { id: string; status: string }
  }>(
    page,
    `mutation CreateNotice($input: CreateEmployeeAbsenceNoticeInput!) {
      createEmployeeAbsenceNotice(createEmployeeAbsenceInput: $input) {
        id
        status
      }
    }`,
    {
      input: {
        startDate: input.startDate,
        endDate: input.endDate,
        absenceCategoryId: categoryId,
        note: input.note,
        isTeamInformed: true,
      },
    },
  )
  return data.createEmployeeAbsenceNotice
}

const absenceStatus = async (page: Page, id: string): Promise<string> => {
  const { employeeAbsenceById } = await gql<{
    employeeAbsenceById: { status: string; decisionNote: string | null }
  }>(page, `query($id: ID!) { employeeAbsenceById(id: $id) { status decisionNote } }`, {
    id,
  })
  return employeeAbsenceById.status
}

test('unauthenticated request is redirected to sign-in', async ({ page }) => {
  await page.goto('/en/admin/absence-requests', { waitUntil: 'networkidle' })
  await expect(page).toHaveURL(/sign-in/, { timeout: 15000 })
})

test.describe('Absence request approval', () => {
  // Far-future days, so this spec never collides with the sick-leave fixtures.
  const APPROVE_START = dayAhead(40)
  const APPROVE_END = dayAhead(41)
  const REJECT_START = dayAhead(60)
  const REJECT_END = dayAhead(61)
  const TEST_DAYS = [APPROVE_START, APPROVE_END, REJECT_START, REJECT_END]

  let employeeId: string

  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    employeeId = await ensureSelfEmployee(page)
    await clearAbsencesOn(page, employeeId, TEST_DAYS)
  })

  test.afterEach(async ({ page }) => {
    // Teardown: nothing this spec created may survive the run.
    await clearAbsencesOn(page, employeeId, TEST_DAYS)
  })

  test('a request lands as pending and can be approved from the queue', async ({
    page,
  }) => {
    const created = await createRequest(page, {
      startDate: APPROVE_START,
      endDate: APPROVE_END,
      note: 'E2E approve request',
    })
    expect(created.status).toBe('PENDING')

    await page.goto('/en/admin/absence-requests', { waitUntil: 'networkidle' })
    await expect(page.getByText('Absence requests').first()).toBeVisible({
      timeout: 15000,
    })
    const row = page.getByRole('row').filter({ hasText: 'E2E approve request' })
    await expect(row).toBeVisible({ timeout: 15000 })

    await row.getByRole('button', { name: 'Approve' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /approve|confirm|delete/i })
      .click()

    await expect
      .poll(() => absenceStatus(page, created.id), { timeout: 15000 })
      .toBe('APPROVED')

    await page.goto('/en/admin/my-absences', { waitUntil: 'networkidle' })
    await expect(page.getByText('Approved').first()).toBeVisible({
      timeout: 15000,
    })
  })

  test('a request can be rejected with a reason', async ({ page }) => {
    const created = await createRequest(page, {
      startDate: REJECT_START,
      endDate: REJECT_END,
      note: 'E2E reject request',
    })

    await page.goto('/en/admin/absence-requests', { waitUntil: 'networkidle' })
    const row = page.getByRole('row').filter({ hasText: 'E2E reject request' })
    await expect(row).toBeVisible({ timeout: 15000 })

    await row.getByRole('button', { name: 'Reject' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('E2E rejection reason')
    await dialog.getByRole('button', { name: 'Reject' }).click()

    await expect
      .poll(() => absenceStatus(page, created.id), { timeout: 15000 })
      .toBe('REJECTED')

    await page.goto('/en/admin/my-absences', { waitUntil: 'networkidle' })
    await expect(page.getByText('Rejected').first()).toBeVisible({
      timeout: 15000,
    })
  })
})
