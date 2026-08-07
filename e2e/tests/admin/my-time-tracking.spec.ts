import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

test('unauthenticated request is redirected to sign-in', async ({ page }) => {
  await page.goto('/en/admin/my-time-tracking', { waitUntil: 'networkidle' })
  await expect(page).toHaveURL(/sign-in/, { timeout: 15000 })
})

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'
const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL ?? 'marco@marranchelli.com'

/**
 * Self-service "my time tracking" page — shows own absences, company
 * vacations, and holidays alongside the time entry table.
 * Route: /en/admin/my-time-tracking
 */

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

/** Links an Employee to the currently logged-in superadmin's membership (by email match). */
const ensureSelfEmployee = async (page: Page): Promise<string> => {
  const data = await gql<{ myEmployeeId: string | null }>(
    page,
    `{ myEmployeeId }`,
  )
  if (data.myEmployeeId) {
    await gql(
      page,
      `mutation UpdateEmployee($input: UpdateEmployeeInput!) {
        updateEmployee(updateEmployeeInput: $input) { id }
      }`,
      { input: { id: data.myEmployeeId, timeTrackingEnabled: true } },
    )
    return data.myEmployeeId
  }

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
        timeTrackingEnabled: true,
      },
    },
  )
  return created.createEmployee.id
}

/**
 * Unique ISO date within the current calendar year — the "my time tracking"
 * page only loads Jan 1–Dec 31 of the current year (see
 * getMyTimeTrackingAction), so seeded dates must stay inside that range or
 * the month's accordion entry never renders. `monthOffset` varies per run
 * (via stamp, mod 12) to avoid collisions across parallel runs; `day` stays
 * within 1-27 so all dates for a single test land in the same month — the
 * UI only renders one month's data at a time.
 */
const uniqueDate = (monthOffset: number, day: number) => {
  const d = new Date(`${new Date().getUTCFullYear()}-01-01T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + monthOffset)
  d.setUTCDate(day)
  return d.toISOString().slice(0, 10)
}

test.describe('My time tracking — absences, company vacations, holidays', () => {
  test('shows own absence, a company vacation, and a holiday', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const employeeId = await ensureSelfEmployee(page)

    const categories = await gql<{
      employeeAbsenceCategoriesByOrgId: {
        id: string
        translations?: { locale: string; name: string }[]
      }[]
    }>(
      page,
      `{ employeeAbsenceCategoriesByOrgId { id translations { locale name } } }`,
    )
    const category = categories.employeeAbsenceCategoriesByOrgId[0]
    const absenceCategoryId = category.id
    const absenceCategoryName =
      category.translations?.find((t) => t.locale === 'EN')?.name ??
      category.translations?.[0]?.name

    const stamp = Date.now()
    const monthOffset = stamp % 12
    const absenceDate = uniqueDate(monthOffset, 5)
    await gql(
      page,
      `mutation CreateEmployeeAbsence($input: CreateEmployeeAbsenceInput!) {
        createEmployeeAbsence(input: $input) { id }
      }`,
      {
        input: {
          employeeId,
          absenceCategoryId,
          startDate: absenceDate,
          endDate: absenceDate,
          note: 'E2E absence',
          isTeamInformed: false,
        },
      },
    )

    const vacationName = `E2E Vacation ${stamp}`
    const vacationStart = uniqueDate(monthOffset, 10)
    const vacationEnd = uniqueDate(monthOffset, 15)
    await gql(
      page,
      `mutation CreateCompanyVacation($input: CreateCompanyVacationInput!) {
        createCompanyVacation(input: $input) { id }
      }`,
      {
        input: {
          name: vacationName,
          startDate: vacationStart,
          endDate: vacationEnd,
        },
      },
    )

    const holidayName = `E2E Holiday ${stamp}`
    const holidayDate = uniqueDate(monthOffset, 20)
    await gql(
      page,
      `mutation CreateHoliday($input: CreateHolidayInput!) {
        createHoliday(input: $input) { id }
      }`,
      { input: { date: holidayDate, name: holidayName, paidPercentage: 100 } },
    )

    await page.goto('/en/admin/my-time-tracking', { waitUntil: 'networkidle' })

    const monthDate = new Date(`${new Date().getUTCFullYear()}-01-01T12:00:00Z`)
    monthDate.setUTCMonth(monthDate.getUTCMonth() + monthOffset)
    const monthLabel = monthDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    await page.getByRole('button', { name: new RegExp(monthLabel, 'i') }).click()

    await expect(page.getByText('My absences')).toBeVisible({
      timeout: 15000,
    })
    if (absenceCategoryName) {
      await expect(page.getByText(absenceCategoryName).first()).toBeVisible()
    }
    await expect(page.getByText('Company vacations')).toBeVisible()
    await expect(page.getByText(vacationName)).toBeVisible()
    await expect(page.getByText(holidayName)).toBeVisible()
  })
})
