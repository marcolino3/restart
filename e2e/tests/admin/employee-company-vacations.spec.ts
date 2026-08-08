import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, ensureEmployee, signInAsSuperAdmin } from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:4000'

/**
 * Employee company-vacation assignments (Betriebsferien-Zuweisung) + the
 * time-tracking period anchor (Org-Stichtag). Route:
 * /en/admin/employees/[employeeId]?tab=timetracking
 * /en/admin/time-tracking-settings (periods tab)
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

const gqlRaw = async (
  page: Page,
  query: string,
  variables?: Record<string, unknown>,
) => {
  const res = await page.request.post(`${BACKEND_URL}/graphql`, {
    data: { query, variables },
  })
  return res.json() as Promise<{
    data?: Record<string, unknown>
    errors?: { message: string }[]
  }>
}

/** Unique ISO date far from today so runs never collide. */
const uniqueDate = (offsetDays: number) => {
  const d = new Date('2031-06-01T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

/**
 * companyVacationsForEmployee only returns segments that fall in the org's
 * CURRENT accounting period (anchor-relative window around today) — see
 * CompanyVacationAssignmentsService.findForEmployee. Dates from `uniqueDate`
 * (year 2031) are far outside that window and would silently vanish from
 * the panel even though the assignment persisted. Pick a short, unique-ish
 * window a few days out from today instead, so it always lands inside the
 * current period regardless of the org's configured anchor.
 */
const currentPeriodDates = (stamp: number) => {
  const offset = 2 + (stamp % 5) // 2..6 days out — stays clear of "today" collisions
  const start = new Date()
  start.setUTCDate(start.getUTCDate() + offset)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 3)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const CreateCompanyVacationDoc = `mutation CreateCompanyVacation($input: CreateCompanyVacationInput!) {
  createCompanyVacation(input: $input) { id name startDate endDate effectiveDays }
}`
const DeleteCompanyVacationDoc = `mutation DeleteCompanyVacation($id: ID!) {
  deleteCompanyVacation(id: $id)
}`
const AssignDoc = `mutation AssignCompanyVacationToEmployee($companyVacationId: ID!, $employeeId: ID!) {
  assignCompanyVacationToEmployee(companyVacationId: $companyVacationId, employeeId: $employeeId) { id }
}`
const UnassignDoc = `mutation UnassignCompanyVacationFromEmployee($companyVacationId: ID!, $employeeId: ID!) {
  unassignCompanyVacationFromEmployee(companyVacationId: $companyVacationId, employeeId: $employeeId)
}`

test.describe('Employee company vacation assignments — happy path', () => {
  test('assigns a company vacation to an employee and shows effective days', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const { employeeId } = await ensureEmployee(page)

    const stamp = Date.now()
    const name = `E2E Betriebsferien ${stamp}`
    const { startDate, endDate } = currentPeriodDates(stamp)

    const created = await gql<{
      createCompanyVacation: {
        id: string
        name: string
        effectiveDays: number
      }
    }>(page, CreateCompanyVacationDoc, {
      input: { name, startDate, endDate },
    })
    const companyVacationId = created.createCompanyVacation.id
    expect(created.createCompanyVacation.effectiveDays).toBeGreaterThan(0)

    try {
      await page.goto(`/en/admin/employees/${employeeId}?tab=timetracking`, {
        waitUntil: 'networkidle',
      })
      await expect(
        page.getByText(/company vacations and other leave/i),
      ).toBeVisible({ timeout: 15000 })

      // --- Assign via the panel's combobox -----------------------------
      // Note: this trigger's accessible name isn't picked up by
      // getByRole(..., { name }) — the combobox carries both
      // aria-expanded and aria-haspopup="dialog", which Chromium's
      // accessibility tree does not resolve into the usual name via
      // getByRole role+name matching. getByText is reliable here.
      await page.getByText('Assign company vacation…').click()
      await page.getByRole('option', { name: new RegExp(name) }).click()
      await page.getByRole('button', { name: /^assign$/i }).click()

      const row = page.getByRole('row').filter({
        has: page.getByRole('cell', { name, exact: true }),
      })
      await expect(row).toBeVisible({ timeout: 15000 })
      await expect(row).toContainText(
        String(created.createCompanyVacation.effectiveDays),
      )

      // --- Unassign via UI to also cover the removal flow ---------------
      await row.getByRole('button', { name: /^remove$/i }).click()
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /^delete$/i })
        .click()
      await expect(row).toHaveCount(0, { timeout: 15000 })
    } finally {
      // Teardown: make sure the assignment and the company vacation are
      // gone regardless of where the test failed.
      await gqlRaw(page, UnassignDoc, { companyVacationId, employeeId })
      await gqlRaw(page, DeleteCompanyVacationDoc, { id: companyVacationId })
    }
  })
})

test.describe('Employee company vacation assignments — access control', () => {
  test('a non-admin employee cannot assign company vacations', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    const orgId = await ensureActiveOrg(page)
    const { employeeId } = await ensureEmployee(page)

    const stamp = Date.now()
    const name = `E2E Vacation NoAccess ${stamp}`
    const startDate = uniqueDate((stamp % 1000) + 400)
    const endDate = uniqueDate((stamp % 1000) + 402)

    const created = await gql<{ createCompanyVacation: { id: string } }>(
      page,
      CreateCompanyVacationDoc,
      { input: { name, startDate, endDate } },
    )
    const companyVacationId = created.createCompanyVacation.id

    // Fresh browser context for a plain EMPLOYEE persona, same org — mirrors
    // setupSecondOrgUser's sign-up flow but stays in the admin's org so the
    // only difference under test is persona/permissions, not tenant.
    const employeeEmail = `e2e.no-admin.${stamp}@example.com`
    const employeePassword = 'change-me-too-123!'
    const employeeCreated = await gql<{ createEmployee: { id: string } }>(
      page,
      `mutation Create($input: CreateEmployeeInput!) {
        createEmployee(createEmployeeInput: $input) { id }
      }`,
      {
        input: {
          firstName: 'E2E',
          lastName: `NoAdmin${stamp}`,
          email: employeeEmail,
          persona: 'EMPLOYEE',
        },
      },
    )

    const context = await browser.newContext()
    const employeePage = await context.newPage()
    try {
      const signUp = await employeePage.request.post(
        `${BACKEND_URL}/api/auth/sign-up/email`,
        {
          headers: { origin: FRONTEND_ORIGIN },
          data: {
            email: employeeEmail,
            password: employeePassword,
            name: `E2E NoAdmin${stamp}`,
          },
        },
      )
      expect(signUp.ok()).toBeTruthy()
      await context.clearCookies()

      await employeePage.goto('/en/sign-in', { waitUntil: 'networkidle' })
      await employeePage
        .getByRole('textbox', { name: /e-?mail/i })
        .fill(employeeEmail)
      await employeePage
        .locator('input[name="password"]')
        .fill(employeePassword)
      await employeePage.getByRole('button', { name: /sign in/i }).click()
      // The login form's onSubmit fires a client-side router.push('/admin')
      // after sign-in resolves, without the test awaiting it. If that soft
      // navigation is still in flight when we later hard-navigate to the
      // employee-detail page, it can land AFTER our goto and silently
      // overwrite the server-side redirect to /admin/forbidden. Wait for it
      // to fully settle on /admin first so the subsequent goto is the only
      // navigation in flight.
      await expect(employeePage).toHaveURL(/\/admin$/, { timeout: 20000 })

      const switched = await employeePage.request.post(
        `${BACKEND_URL}/api/org/switch`,
        { data: { orgId } },
      )
      expect(switched.ok()).toBeTruthy()

      // UI: the admin employee-detail page redirects non-admin personas.
      // Next.js server-side redirect() aborts the initial navigation
      // request in Chromium's eyes (net::ERR_ABORTED) even though the
      // redirect completes fine — swallow it and assert on the final URL.
      await employeePage
        .goto(`/en/admin/employees/${employeeId}?tab=timetracking`, {
          waitUntil: 'load',
        })
        .catch(() => {})
      await expect(employeePage).toHaveURL(/admin\/forbidden/, {
        timeout: 15000,
      })

      // API: the mutation itself must reject a non-admin persona/role.
      const res = await employeePage.request.post(`${BACKEND_URL}/graphql`, {
        data: {
          query: AssignDoc,
          variables: { companyVacationId, employeeId },
        },
      })
      const json = (await res.json()) as { errors?: { message: string }[] }
      expect(json.errors?.length).toBeGreaterThan(0)
    } finally {
      await context.close()
      // Teardown: remove the seeded company vacation (and any assignment
      // that may have unexpectedly succeeded) plus the throwaway employee.
      await gqlRaw(page, UnassignDoc, { companyVacationId, employeeId })
      await gqlRaw(page, DeleteCompanyVacationDoc, { id: companyVacationId })
      // No hard-delete mutation exists for employees — deactivate instead so
      // the throwaway account does not linger as an active member.
      const employeeCreatedId = employeeCreated.createEmployee.id
      await gqlRaw(
        page,
        `mutation Deactivate($input: UpdateEmployeeInput!) {
          updateEmployee(updateEmployeeInput: $input) { id }
        }`,
        { input: { id: employeeCreatedId, isActive: false } },
      )
    }
  })
})

test.describe('Time tracking settings — period anchor', () => {
  test('saves the org cut-off date and keeps it after reload', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const AnchorDoc = `{ timeTrackingPeriodAnchor }`
    const original = await gql<{ timeTrackingPeriodAnchor: string }>(
      page,
      AnchorDoc,
    )
    const originalAnchor = original.timeTrackingPeriodAnchor

    try {
      await page.goto('/en/admin/time-tracking-settings', {
        waitUntil: 'networkidle',
      })
      await page.getByRole('tab', { name: /accounting periods/i }).click()
      await expect(
        page.getByText('Cut-off date', { exact: true }),
      ).toBeVisible({
        timeout: 15000,
      })

      await page.getByLabel(/^month$/i).click()
      await page.getByRole('option', { name: /^april$/i }).click()
      await page.getByLabel(/^day$/i).click()
      await page.getByRole('option', { name: '01', exact: true }).click()
      await page.getByRole('button', { name: /^save$/i }).click()

      await page.reload({ waitUntil: 'networkidle' })
      await page.getByRole('tab', { name: /accounting periods/i }).click()
      await expect(page.getByLabel(/^month$/i)).toContainText(/april/i, {
        timeout: 15000,
      })
      await expect(page.getByLabel(/^day$/i)).toContainText('01')

      const after = await gql<{ timeTrackingPeriodAnchor: string }>(
        page,
        AnchorDoc,
      )
      expect(after.timeTrackingPeriodAnchor).toBe('04-01')
    } finally {
      // Teardown: restore the org's original anchor so later tests/periods
      // computed off it are unaffected.
      await gqlRaw(
        page,
        `mutation SetTimeTrackingPeriodAnchor($anchor: String!) {
          setTimeTrackingPeriodAnchor(anchor: $anchor)
        }`,
        { anchor: originalAnchor },
      )
    }
  })
})
