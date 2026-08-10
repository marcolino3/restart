import { test, expect, type Page } from '@playwright/test'
import {
  signInAsSuperAdmin,
  ensureActiveOrg,
  setupSecondOrgUser,
} from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:4000'

async function gql(
  page: Page,
  query: string,
  variables?: Record<string, unknown>,
) {
  const res = await page.request.post(`${BACKEND_URL}/graphql`, {
    data: { query, variables },
  })
  return res.json() as Promise<{
    data?: Record<string, any>
    errors?: { message: string }[]
  }>
}

/**
 * Field-level RBAC: a role stripped of read access to a sensitive field
 * (employeeContract.grossSalary) must never surface that field's value over
 * GraphQL, even though the same role can otherwise read the contract. This
 * exercises the real fieldPermissionMiddleware, not a mock. The raw value is
 * confirmed via superadmin (bypasses field guards) since fresh system roles
 * hold no field-permission grants until explicitly assigned.
 */
test.describe('Field-level RBAC — grossSalary read gate', () => {
  test('role without grossSalary read gets null while the raw value exists', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    // ORG_OWNER (not superadmin) does the role setup: assertNoEscalation
    // compares against the actor's own org permissions, and superadmin's
    // token carries none in this org — only an ORG_OWNER actually holds the
    // full permission set needed to create/restrict a role here.
    const owner = await setupSecondOrgUser(browser, page)
    const orgId = owner.orgId

    const employee = await gql(
      owner.page,
      `mutation Create($input: CreateEmployeeInput!) {
         createEmployee(createEmployeeInput: $input) { id }
       }`,
      {
        input: {
          firstName: 'E2E',
          lastName: `Salary${Date.now()}`,
          email: `e2e.salary.${Date.now()}@example.com`,
          persona: 'EMPLOYEE',
        },
      },
    )
    const employeeId = employee.data?.createEmployee?.id
    expect(employee.errors ?? []).toEqual([])
    expect(employeeId).toBeTruthy()

    // Fresh system roles carry no field-permission grants at all (opt-in
    // model — see FieldWriteGuard), so even ORG_OWNER cannot write
    // grossSalary yet. Create the contract as superadmin, which bypasses
    // both the field-write and field-read guards.
    await page.request.post(`${BACKEND_URL}/api/org/switch`, {
      data: { orgId },
    })
    const contract = await gql(
      page,
      `mutation Create($input: CreateEmployeeContractInput!) {
         createEmployeeContract(input: $input) { id }
       }`,
      {
        input: {
          employeeId,
          startDate: '2026-01-01',
          grossSalary: 8888,
        },
      },
    )
    expect(contract.errors ?? []).toEqual([])
    expect(contract.data?.createEmployeeContract?.id).toBeTruthy()

    const created = await gql(
      owner.page,
      `mutation Create($input: CreateRoleInput!) {
         createRole(input: $input) { id name }
       }`,
      {
        input: {
          name: `NoSalary${Date.now()}`,
          permissionCodes: ['EMPLOYEE_READ'],
        },
      },
    )
    expect(created.errors ?? []).toEqual([])
    const restrictedRoleId = created.data?.createRole?.id
    expect(restrictedRoleId).toBeTruthy()

    const stripped = await gql(
      owner.page,
      `mutation Strip($input: UpdateRoleFieldPermissionsInput!) {
         updateRoleFieldPermissions(input: $input) { id }
       }`,
      {
        input: {
          roleId: restrictedRoleId,
          fieldPermissions: [
            { resource: 'employeeContract', field: 'grossSalary', actions: [] },
          ],
        },
      },
    )
    expect(stripped.errors ?? []).toEqual([])

    const stamp = Date.now()
    const restrictedEmail = `e2e.restricted.${stamp}@example.com`
    const restrictedPassword = 'change-me-too-123!'

    const restrictedEmployee = await gql(
      owner.page,
      `mutation Create($input: CreateEmployeeInput!) {
         createEmployee(createEmployeeInput: $input) { id }
       }`,
      {
        input: {
          firstName: 'E2E',
          lastName: `Restricted${stamp}`,
          email: restrictedEmail,
          persona: 'ADMIN',
        },
      },
    )
    expect(restrictedEmployee.errors ?? []).toEqual([])
    const restrictedEmployeeId = restrictedEmployee.data?.createEmployee?.id

    const roleAssign = await gql(
      owner.page,
      `mutation AssignRole($input: EmployeeOnboardingInput!) {
         upsertEmployeeOnboardingDraft(input: $input) { id }
       }`,
      {
        input: {
          id: restrictedEmployeeId,
          firstName: 'E2E',
          lastName: `Restricted${stamp}`,
          roleIds: [restrictedRoleId],
        },
      },
    )
    expect(roleAssign.errors ?? []).toEqual([])

    const context = await browser.newContext()
    const restrictedPage = await context.newPage()

    const signUp = await restrictedPage.request.post(
      `${BACKEND_URL}/api/auth/sign-up/email`,
      {
        headers: { origin: FRONTEND_ORIGIN },
        data: {
          email: restrictedEmail,
          password: restrictedPassword,
          name: `E2E Restricted${stamp}`,
        },
      },
    )
    expect(signUp.ok()).toBe(true)
    await context.clearCookies()

    await restrictedPage.goto('/en/sign-in', { waitUntil: 'networkidle' })
    await restrictedPage
      .getByRole('textbox', { name: /e-?mail/i })
      .fill(restrictedEmail)
    await restrictedPage
      .locator('input[name="password"]')
      .fill(restrictedPassword)
    await restrictedPage.getByRole('button', { name: /sign in/i }).click()
    await expect(restrictedPage).not.toHaveURL(/sign-in/, { timeout: 20000 })

    const switched = await restrictedPage.request.post(
      `${BACKEND_URL}/api/org/switch`,
      { data: { orgId } },
    )
    expect(switched.ok()).toBe(true)

    const restrictedRead = await gql(
      restrictedPage,
      `query($employeeId: ID!) {
         employeeContractsByEmployeeId(employeeId: $employeeId) {
           id
           grossSalary
         }
       }`,
      { employeeId },
    )
    expect(restrictedRead.errors ?? []).toEqual([])
    expect(restrictedRead.data?.employeeContractsByEmployeeId?.[0]).toBeTruthy()
    expect(
      restrictedRead.data?.employeeContractsByEmployeeId?.[0]?.grossSalary,
    ).toBeNull()

    // Superadmin bypasses the field guards entirely — used here as the
    // "sees the real value" counterpart, since fresh system roles (incl.
    // ORG_OWNER) hold no field-permission grants until explicitly assigned.
    const superAdminRead = await gql(
      page,
      `query($employeeId: ID!) {
         employeeContractsByEmployeeId(employeeId: $employeeId) {
           id
           grossSalary
         }
       }`,
      { employeeId },
    )
    expect(
      superAdminRead.data?.employeeContractsByEmployeeId?.[0]?.grossSalary,
    ).toBe(8888)

    // Teardown: remove the whole fixture org (cascades employees, contracts,
    // roles, memberships) so the run leaves no test data behind.
    await gql(
      page,
      `mutation Remove($id: String!) {
         removeOrganization(id: $id) { id }
       }`,
      { id: orgId },
    )

    await restrictedPage.close()
    await owner.page.close()
  })
})
