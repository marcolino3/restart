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

/**
 * Ensures the employee has an active contract covering the current month —
 * without one, plannedMinutes stays 0 every day and vacations/absences never
 * show up in the monthly balance (dailyPlannedMinutes gates on the contract).
 */
const ensureActiveContract = async (
  page: Page,
  employeeId: string,
): Promise<void> => {
  const existing = await gql<{
    employeeContractsByEmployeeId: { id: string; endDate: string | null }[]
  }>(
    page,
    `query($employeeId: ID!) {
      employeeContractsByEmployeeId(employeeId: $employeeId) { id endDate }
    }`,
    { employeeId },
  )
  const hasActiveContract = existing.employeeContractsByEmployeeId.some(
    (c) => !c.endDate || c.endDate.slice(0, 10) >= dayInCurrentMonth(1),
  )
  if (hasActiveContract) return

  const monthStart = dayInCurrentMonth(1)
  await gql(
    page,
    `mutation CreateEmployeeContract($input: CreateEmployeeContractInput!) {
      createEmployeeContract(input: $input) { id }
    }`,
    {
      input: {
        employeeId,
        startDate: monthStart,
        workloadPercent: 100,
        weeklyHours: '42',
      },
    },
  )
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
    await ensureActiveContract(page, data.myEmployeeId)
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
  await ensureActiveContract(page, created.createEmployee.id)
  return created.createEmployee.id
}

/**
 * Date within the current month/year so it falls inside the server's
 * "my time tracking" range (current calendar year only, see
 * get-my-time-tracking.action.ts) and inside the accordion month that's
 * expanded by default. `day` stays within 1-27 to dodge month-end
 * edge cases; callers pick distinct days per fixture to avoid overlap.
 */
const dayInCurrentMonth = (day: number) => {
  const d = new Date()
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
        isSystem: boolean
        translations?: { locale: string; name: string }[]
      }[]
    }>(
      page,
      `{ employeeAbsenceCategoriesByOrgId { id isSystem translations { locale name } } }`,
    )
    // Prefer a real system category (e.g. Sickness/Move) over leftover
    // custom categories other e2e specs create without cleanup.
    const category =
      categories.employeeAbsenceCategoriesByOrgId.find((c) => c.isSystem) ??
      categories.employeeAbsenceCategoriesByOrgId[0]
    const absenceCategoryId = category.id
    const absenceCategoryName =
      category.translations?.find((t) => t.locale === 'EN')?.name ??
      category.translations?.[0]?.name

    const stamp = Date.now()
    const absenceDate = dayInCurrentMonth(2)

    // Absences may not overlap for the same employee/day, so clear any
    // leftover E2E absence on this date before creating a fresh one.
    const existingAbsences = await gql<{
      employeeAbsencesByEmployeeId: { id: string; startDate: string }[]
    }>(
      page,
      `query($employeeId: ID!) {
        employeeAbsencesByEmployeeId(employeeId: $employeeId) { id startDate }
      }`,
      { employeeId },
    )
    for (const existing of existingAbsences.employeeAbsencesByEmployeeId) {
      if (existing.startDate.slice(0, 10) === absenceDate) {
        await gql(
          page,
          `mutation($id: ID!) { deleteEmployeeAbsence(id: $id) }`,
          { id: existing.id },
        )
      }
    }

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
    // must stay in the past — the monthly balance view clamps its window to
    // today (clampToToday), so a future date never shows up.
    const vacationStart = dayInCurrentMonth(3)
    const vacationEnd = dayInCurrentMonth(4)
    const { createCompanyVacation } = await gql<{
      createCompanyVacation: { id: string }
    }>(
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
    // Company vacations only count towards an employee's balance ledger
    // (is_vacation) once explicitly assigned — creating the org-wide
    // vacation alone isn't enough to make it show up here.
    await gql(
      page,
      `mutation AssignCompanyVacation($companyVacationId: ID!, $employeeId: ID!) {
        assignCompanyVacationToEmployee(companyVacationId: $companyVacationId, employeeId: $employeeId) { id }
      }`,
      { companyVacationId: createCompanyVacation.id, employeeId },
    )

    const holidayName = `E2E Holiday ${stamp}`
    // Must stay in the past (see vacation comment above) and clear of the
    // absence/vacation days (2-4) used above. Holidays are also soft-deleted
    // (uq_holidays_org_date stays enforced against inactive rows too, and the
    // `holidays` query only returns active ones), so a fixed day can collide
    // with an invisible leftover from a prior run — retry across a wider
    // pool of candidate days.
    const holidayDayCandidates = [5, 6, 7, 8, 9, 10, 11, 12]
    let holidayDate = ''
    for (let attempt = 0; attempt < holidayDayCandidates.length; attempt++) {
      const candidate = dayInCurrentMonth(holidayDayCandidates[attempt])
      try {
        await gql(
          page,
          `mutation CreateHoliday($input: CreateHolidayInput!) {
            createHoliday(input: $input) { id }
          }`,
          {
            input: { date: candidate, name: holidayName, paidPercentage: 100 },
          },
        )
        holidayDate = candidate
        break
      } catch (err) {
        const isLastAttempt = attempt === holidayDayCandidates.length - 1
        if (
          isLastAttempt ||
          !(err as Error).message.includes('uq_holidays_org_date')
        ) {
          throw err
        }
      }
    }

    await page.goto('/en/admin/my-time-tracking', { waitUntil: 'networkidle' })

    // The monthly view reads from a materialized balance ledger that's
    // recomputed asynchronously after each mutation above — poll with
    // reloads until it catches up (recompute isn't synchronous yet).
    await expect(async () => {
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page.getByText('My absences')).toBeVisible({
        timeout: 2000,
      })
      if (absenceCategoryName) {
        await expect(page.getByText(absenceCategoryName).first()).toBeVisible(
          { timeout: 2000 },
        )
      }
      await expect(page.getByText(holidayName)).toBeVisible({ timeout: 2000 })
      // "Company vacations" is a per-row badge label (rendered once per
      // VACATION-kind day), not a static section heading — wait for it
      // inside the same poll as the other ledger-derived rows.
      await expect(page.getByText('Company vacations').first()).toBeVisible({
        timeout: 2000,
      })
    }).toPass({ timeout: 30000, intervals: [1000, 2000, 3000] })
    await expect(page.getByText(vacationName).first()).toBeVisible()
    await expect(page.getByText(holidayName).first()).toBeVisible()
  })
})
