import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Self-service sick reporting.
 * Route: /en/admin/my-absences — deliberately NOT gated on the time-tracking
 * feature, employees without time tracking have to report sick too.
 *
 * Every absence created here is removed again in afterEach: the dev database
 * must not accumulate test data.
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

/** Day in the current month, kept in 1-27 to dodge month-end edge cases. */
const dayInCurrentMonth = (day: number) => {
  const d = new Date()
  d.setUTCDate(day)
  return d.toISOString().slice(0, 10)
}

/** Employee record linked to the signed-in superadmin. */
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

/**
 * Removes every absence of the employee overlapping the given days.
 *
 * `deleteEmployeeAbsence` is a soft delete (`isActive = false`), which is all
 * the GraphQL API offers: the rows stay behind as inactive leftovers and no
 * further run can see them. Because the reserved days are fixed, repeated runs
 * reuse the same slots instead of growing the table without bound.
 */
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

const reportSickLeave = async (
  page: Page,
  input: { date: string; startTime?: string; comment?: string },
) => {
  const data = await gql<{
    reportSickLeave: {
      isExtension: boolean
      isUnchanged: boolean
      absence: { id: string; startDate: string; endDate: string | null }
    }
  }>(
    page,
    `mutation ReportSickLeave($input: ReportSickLeaveInput!) {
      reportSickLeave(input: $input) {
        isExtension
        isUnchanged
        absence { id startDate endDate }
      }
    }`,
    { input },
  )
  return data.reportSickLeave
}

test('unauthenticated request is redirected to sign-in', async ({ page }) => {
  await page.goto('/en/admin/my-absences', { waitUntil: 'networkidle' })
  await expect(page).toHaveURL(/sign-in/, { timeout: 15000 })
})

test.describe('Sick leave self-service', () => {
  // Days 20-23 are reserved for this spec so it does not collide with the
  // fixtures of my-time-tracking.spec.ts (days 1-12).
  const FIRST_DAY = dayInCurrentMonth(20)
  const SECOND_DAY = dayInCurrentMonth(21)
  const THIRD_DAY = dayInCurrentMonth(22)
  const TEST_DAYS = [FIRST_DAY, SECOND_DAY, THIRD_DAY]

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

  test('reports sick and shows the absence on the self-service page', async ({
    page,
  }) => {
    const result = await reportSickLeave(page, {
      date: FIRST_DAY,
      comment: 'E2E sick report',
    })

    expect(result.isUnchanged).toBe(false)
    expect(result.isExtension).toBe(false)
    expect(result.absence.startDate.slice(0, 10)).toBe(FIRST_DAY)

    await page.goto('/en/admin/my-absences', { waitUntil: 'networkidle' })
    await expect(page.getByText('My absences').first()).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('E2E sick report').first()).toBeVisible({
      timeout: 15000,
    })
  })

  test('a follow-up report extends the absence instead of duplicating it', async ({
    page,
  }) => {
    const first = await reportSickLeave(page, { date: FIRST_DAY })
    const second = await reportSickLeave(page, { date: SECOND_DAY })

    expect(second.isExtension).toBe(true)
    expect(second.isUnchanged).toBe(false)
    // Same record, moved end date — not a second absence.
    expect(second.absence.id).toBe(first.absence.id)
    expect((second.absence.endDate ?? '').slice(0, 10)).toBe(SECOND_DAY)

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
    const covering = employeeAbsencesByEmployeeId.filter((absence) => {
      const start = absence.startDate.slice(0, 10)
      const end = (absence.endDate ?? absence.startDate).slice(0, 10)
      return FIRST_DAY >= start && FIRST_DAY <= end
    })
    expect(covering).toHaveLength(1)
  })

  test('a repeated report for a covered day changes nothing', async ({
    page,
  }) => {
    const first = await reportSickLeave(page, { date: FIRST_DAY })
    const repeat = await reportSickLeave(page, { date: FIRST_DAY })

    // Regression: the mutation used to return only the absence, so the UI
    // showed a success toast although nothing had been written.
    expect(repeat.isUnchanged).toBe(true)
    expect(repeat.isExtension).toBe(false)
    expect(repeat.absence.id).toBe(first.absence.id)
    expect((repeat.absence.endDate ?? '').slice(0, 10)).toBe(FIRST_DAY)
  })

  test('a mid-day report keeps the reported start time', async ({ page }) => {
    const result = await reportSickLeave(page, {
      date: THIRD_DAY,
      startTime: '13:00',
      comment: 'E2E afternoon',
    })

    expect(result.isUnchanged).toBe(false)

    const { employeeAbsencesByEmployeeId } = await gql<{
      employeeAbsencesByEmployeeId: {
        id: string
        startTime: string | null
      }[]
    }>(
      page,
      `query($employeeId: ID!) {
        employeeAbsencesByEmployeeId(employeeId: $employeeId) {
          id startTime
        }
      }`,
      { employeeId },
    )
    const created = employeeAbsencesByEmployeeId.find(
      (absence) => absence.id === result.absence.id,
    )
    expect(created?.startTime).toMatch(/^13:00/)
  })

  test('the self-service page is reachable without the time-tracking feature', async ({
    page,
  }) => {
    // The entry point used to live on /admin/my-time-tracking behind the
    // time-tracking gate, which locked out exactly the employees who have no
    // time tracking.
    await page.goto('/en/admin/my-absences', { waitUntil: 'networkidle' })

    await expect(page).toHaveURL(/my-absences/)
    await expect(page.getByText('My absences').first()).toBeVisible({
      timeout: 15000,
    })
  })
})
