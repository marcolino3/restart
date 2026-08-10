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

  test('contract form hides grossSalary and still submits when the field is permission-hidden', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

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
          lastName: `Form${Date.now()}`,
          email: `e2e.form.${Date.now()}@example.com`,
          persona: 'EMPLOYEE',
        },
      },
    )
    const employeeId = employee.data?.createEmployee?.id
    expect(employee.errors ?? []).toEqual([])
    expect(employeeId).toBeTruthy()

    const created = await gql(
      owner.page,
      `mutation Create($input: CreateRoleInput!) {
         createRole(input: $input) { id name }
       }`,
      {
        input: {
          name: `NoSalaryForm${Date.now()}`,
          permissionCodes: ['EMPLOYEE_READ', 'EMPLOYEE_WRITE'],
        },
      },
    )
    expect(created.errors ?? []).toEqual([])
    const restrictedRoleId = created.data?.createRole?.id
    expect(restrictedRoleId).toBeTruthy()

    // The seeded ORG_OWNER role is a system role — updateRoleFieldPermissions
    // rejects any modification to it ("System role ... cannot be modified or
    // deleted"), so owner cannot first acquire hourlyRate for itself to then
    // delegate it. Grant it directly to the restricted (non-system) role as
    // superadmin instead, which bypasses the escalation guard entirely.
    await page.request.post(`${BACKEND_URL}/api/org/switch`, {
      data: { orgId },
    })
    const hourlyRateGrant = await gql(
      page,
      `mutation Grant($input: UpdateRoleFieldPermissionsInput!) {
         updateRoleFieldPermissions(input: $input) { id }
       }`,
      {
        input: {
          roleId: restrictedRoleId,
          fieldPermissions: [
            {
              resource: 'employeeContract',
              field: 'hourlyRate',
              // The contract page under test is the create form
              // (contracts/edit with no contractId — see
              // EmployeeContractForm.tsx, mode={contract ? "update" :
              // "create"}), so canWriteField checks the `create` action,
              // not `update`. Grant both so the field is editable
              // regardless of which form this ends up exercising.
              actions: ['read', 'create', 'update'],
            },
          ],
        },
      },
    )
    expect(hourlyRateGrant.errors ?? []).toEqual([])

    // grossSalary stays ungranted on the restricted role (default deny), so
    // the form is otherwise fully usable — isolates the check to that one
    // field, and PERMANENT contracts require grossSalary to be filled
    // (contract-type-rules.ts), which is exactly the case the
    // permission-hidden superRefine fix (buildEmployeeContractFormSchema)
    // must cover. owner still lacks grossSalary itself, so it cannot
    // strip/grant it either — the field simply never appears in a grant.

    const stamp = Date.now()
    const restrictedEmail = `e2e.restrictedform.${stamp}@example.com`
    const restrictedPassword = 'change-me-too-123!'

    const restrictedEmployee = await gql(
      owner.page,
      `mutation Create($input: CreateEmployeeInput!) {
         createEmployee(createEmployeeInput: $input) { id }
       }`,
      {
        input: {
          firstName: 'E2E',
          lastName: `RestrictedForm${stamp}`,
          email: restrictedEmail,
          persona: 'ADMIN',
        },
      },
    )
    expect(restrictedEmployee.errors ?? []).toEqual([])
    const restrictedEmployeeId = restrictedEmployee.data?.createEmployee?.id

    // requireAdminRole() (server guard on /admin/* pages) checks for one of
    // the hardcoded system roles (ORG_OWNER/ORG_ADMIN/HR_MANAGER/OFFICE), not
    // permission codes — a custom role alone never passes it, regardless of
    // its granted permissions. Add OFFICE alongside the restricted role so
    // the browser session can actually reach the contract form page; the
    // field-permission grants under test still come only from restrictedRoleId.
    const orgRoles = await gql(
      owner.page,
      `query { rolesByOrgId { id name } }`,
    )
    const officeRoleId = orgRoles.data?.rolesByOrgId?.find(
      (r: { name: string }) => r.name === 'OFFICE',
    )?.id
    expect(officeRoleId).toBeTruthy()

    const roleAssign = await gql(
      owner.page,
      `mutation AssignRole($input: EmployeeOnboardingInput!) {
         upsertEmployeeOnboardingDraft(input: $input) { id }
       }`,
      {
        input: {
          id: restrictedEmployeeId,
          firstName: 'E2E',
          lastName: `RestrictedForm${stamp}`,
          roleIds: [restrictedRoleId, officeRoleId],
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
          name: `E2E RestrictedForm${stamp}`,
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
    // Sign-in triggers the app's own client-side redirect navigation; without
    // waiting for it to settle, the goto() below races that in-flight
    // navigation and aborts with net::ERR_ABORTED (see setupSecondOrgUser in
    // e2e/tests/helpers/auth.ts, which needed the same fix).
    await restrictedPage.waitForLoadState('networkidle')

    const switched = await restrictedPage.request.post(
      `${BACKEND_URL}/api/org/switch`,
      { data: { orgId } },
    )
    expect(switched.ok()).toBe(true)

    await restrictedPage.goto(
      `/en/admin/employees/${restrictedEmployeeId}/contracts/edit`,
      { waitUntil: 'networkidle' },
    )

    // grossSalary must be entirely absent from the DOM (no field, no label).
    await expect(
      restrictedPage.locator('input[name="grossSalary"]'),
    ).toHaveCount(0)

    // hourlyRate stays visible + editable (full grant kept for it).
    await expect(
      restrictedPage.locator('input[name="hourlyRate"]'),
    ).toBeVisible()
    await expect(
      restrictedPage.locator('input[name="hourlyRate"]'),
    ).toBeEnabled()

    await restrictedPage
      .getByRole('combobox', { name: /contract type/i })
      .click()
    await restrictedPage.getByRole('option', { name: /permanent/i }).click()

    await restrictedPage
      .locator('input[name="position"]')
      .fill('E2E Test Position')

    // PERMANENT normally requires grossSalary — the fix under test
    // (buildEmployeeContractFormSchema) must exempt it here since it's
    // permission-hidden, so submission must succeed without that field.
    await restrictedPage.getByRole('button', { name: /save/i }).click()
    await expect(restrictedPage).toHaveURL(/contracts/, { timeout: 20000 })
    await expect(restrictedPage.getByText(/error/i)).toHaveCount(0)

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
