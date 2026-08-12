import { expect, type Browser, type Page } from '@playwright/test'

/**
 * Shared auth fixture for happy-path E2E tests.
 *
 * Signs in through the real email/password form as the bootstrapped
 * superadmin (SuperAdminBootstrapService seeds it on backend boot from
 * SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD). CI must export the same two
 * variables to the Playwright step so backend seed and test agree.
 */
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? 'marco@marranchelli.com'
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? 'change-me'
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:4000'

export async function signInAsSuperAdmin(page: Page): Promise<void> {
  await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
  await page.getByRole('textbox', { name: /e-?mail/i }).fill(SUPERADMIN_EMAIL)
  await page.locator('input[name="password"]').fill(SUPERADMIN_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  // Successful login navigates away from the sign-in page (dashboard or
  // select-org, depending on how many orgs exist).
  await expect(page).not.toHaveURL(/sign-in/, { timeout: 20000 })
}

/**
 * Ensures the session has an active organization. Uses the backend API with
 * the browser context's session cookie (fixture setup, not the UI under
 * test): reads the orgs the superadmin can see, creates one on a fresh CI
 * database, then sets the Active-Org cookie via POST /api/org/switch.
 */
export async function ensureActiveOrg(page: Page): Promise<string> {
  const gql = async (query: string) => {
    const res = await page.request.post(`${BACKEND_URL}/graphql`, {
      data: { query },
    })
    return res.json() as Promise<{
      data?: Record<string, { id: string }[] & { id: string }>
      errors?: unknown[]
    }>
  }

  const listed = await gql(
    '{ organizations { id name lifecycleStatus } }',
  )
  const usable = (
    listed.data?.organizations as unknown as {
      id: string
      name: string
      lifecycleStatus?: string
    }[]
  )?.filter((o) => o.name && o.lifecycleStatus !== 'SUSPENDED')
  let orgId = usable?.[0]?.id

  if (!orgId) {
    const created = await gql(
      'mutation { createOrganization(input: {}) { id } }',
    )
    orgId = created.data?.createOrganization?.id
  }
  if (!orgId) {
    throw new Error('E2E fixture: could not resolve or create an organization')
  }

  const switched = await page.request.post(`${BACKEND_URL}/api/org/switch`, {
    data: { orgId },
  })
  if (!switched.ok()) {
    throw new Error(`E2E fixture: org switch failed (${switched.status()})`)
  }
  return orgId
}

/**
 * Ensures the active org has at least one teacher, and returns the display
 * name of one.
 *
 * Fixture setup, not the feature under test: creating a teacher through the
 * UI means walking the three-step onboarding wizard, which would make every
 * class test depend on it. A fresh CI database has no employees at all, so
 * without this the teacher assignment could not be exercised.
 */
export async function ensureTeacher(page: Page): Promise<string> {
  const gql = async (query: string, variables?: Record<string, unknown>) => {
    const res = await page.request.post(`${BACKEND_URL}/graphql`, {
      data: { query, variables },
    })
    return res.json() as Promise<{
      data?: Record<string, unknown>
      errors?: { message: string }[]
    }>
  }

  const existing = await gql(
    '{ teachersByOrgId { id membership { user { firstName lastName } } } }',
  )
  const teachers = (existing.data?.teachersByOrgId ?? []) as {
    membership?: { user?: { firstName: string; lastName: string } | null }
  }[]
  const first = teachers[0]?.membership?.user
  if (first) return `${first.firstName} ${first.lastName}`.trim()

  const stamp = Date.now()
  const firstName = 'E2E'
  const lastName = `Teacher${stamp}`
  const created = await gql(
    `mutation Create($input: CreateEmployeeInput!) {
       createEmployee(createEmployeeInput: $input) { id }
     }`,
    {
      input: {
        firstName,
        lastName,
        email: `e2e.teacher.${stamp}@example.com`,
        persona: 'TEACHER',
      },
    },
  )
  if (created.errors?.length) {
    throw new Error(
      `E2E fixture: could not create a teacher — ${created.errors[0].message}`,
    )
  }
  return `${firstName} ${lastName}`
}

/**
 * Ensures the active org has at least one employee and returns its id plus
 * display name. Used by absence CRUD E2E tests.
 */
export async function ensureEmployee(
  page: Page,
  persona: 'EMPLOYEE' | 'ADMIN' | 'TEACHER' = 'EMPLOYEE',
): Promise<{ employeeId: string; displayName: string }> {
  const gql = async (query: string, variables?: Record<string, unknown>) => {
    const res = await page.request.post(`${BACKEND_URL}/graphql`, {
      data: { query, variables },
    })
    return res.json() as Promise<{
      data?: Record<string, unknown>
      errors?: { message: string }[]
    }>
  }

  const existing = await gql(
    '{ employeesByOrgId { id membership { user { firstName lastName } } } }',
  )
  const employees = (existing.data?.employeesByOrgId ?? []) as {
    id: string
    membership?: { user?: { firstName: string; lastName: string } | null }
  }[]
  const first = employees[0]
  if (first?.id) {
    const user = first.membership?.user
    const displayName = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : first.id
    return { employeeId: first.id, displayName }
  }

  const stamp = Date.now()
  const firstName = 'E2E'
  const lastName = `Employee${stamp}`
  const created = await gql(
    `mutation Create($input: CreateEmployeeInput!) {
       createEmployee(createEmployeeInput: $input) { id }
     }`,
    {
      input: {
        firstName,
        lastName,
        email: `e2e.employee.${stamp}@example.com`,
        persona,
      },
    },
  )
  const employeeId = (created.data?.createEmployee as { id?: string } | undefined)
    ?.id
  if (!employeeId || created.errors?.length) {
    throw new Error(
      `E2E fixture: could not create an employee — ${created.errors?.[0]?.message ?? 'unknown'}`,
    )
  }
  return { employeeId, displayName: `${firstName} ${lastName}` }
}

/**
 * Sets up a second, independent user + organization for multi-tenant
 * negative tests — a fresh browser context (own cookie jar) signed in as a
 * user who belongs ONLY to a brand-new org, never the superadmin's.
 *
 * There is no single mutation that creates an org and adds a member in one
 * step (`createOrganization` is SuperAdminOnly and does not add the caller
 * as a member). So this: (1) as the superadmin, creates a fresh org and
 * switches into it, (2) registers a better-auth credential account for the
 * second user, (3) invites/creates that email as an employee of the fresh
 * org (membership resolves by email — same mechanism as the superadmin
 * bootstrap), (4) signs the second user in on their own browser context.
 *
 * Returns the second user's Page plus the org id they belong to, so a test
 * can assert that this user cannot see/mutate data scoped to a DIFFERENT
 * org (e.g. the one the superadmin/main test is using).
 */
export async function setupSecondOrgUser(
  browser: Browser,
  adminPage: Page,
): Promise<{ page: Page; orgId: string; email: string }> {
  const gql = async (query: string, variables?: Record<string, unknown>) => {
    const res = await adminPage.request.post(`${BACKEND_URL}/graphql`, {
      data: { query, variables },
    })
    return res.json() as Promise<{
      data?: Record<string, any>
      errors?: { message: string }[]
    }>
  }

  const adminCookiesBefore = await adminPage.context().cookies()
  const adminOrgId = adminCookiesBefore.find((c) => c.name === 'Active-Org')?.value

  const created = await gql(
    'mutation { createOrganization(input: {}) { id } }',
  )
  const orgId = created.data?.createOrganization?.id
  if (!orgId) {
    throw new Error(
      `E2E fixture: could not create second org — ${JSON.stringify(created.errors)}`,
    )
  }

  const switched = await adminPage.request.post(`${BACKEND_URL}/api/org/switch`, {
    data: { orgId },
  })
  if (!switched.ok()) {
    throw new Error(`E2E fixture: could not switch into second org (${switched.status()})`)
  }

  const stamp = Date.now()
  const email = `e2e.second-org.${stamp}@example.com`
  const password = 'change-me-too-123!'
  const firstName = 'E2E'
  const lastName = `SecondOrg${stamp}`

  const employee = await gql(
    `mutation Create($input: CreateEmployeeInput!) {
       createEmployee(createEmployeeInput: $input) { id }
     }`,
    { input: { firstName, lastName, email, persona: 'ADMIN' } },
  )
  if (employee.errors?.length) {
    throw new Error(
      `E2E fixture: could not create second-org employee — ${employee.errors[0].message}`,
    )
  }
  const employeeId = employee.data?.createEmployee?.id

  // createEmployee (the "minimal" path) leaves the membership without any
  // role — the second-org user would otherwise have no permissions at all
  // and every guarded query/mutation used in tests would fail at the guard
  // instead of exercising the org-scoping logic under test. Assign the
  // org's seeded ORG_OWNER system role via the onboarding-draft mutation
  // (the only mutation that accepts roleIds).
  const roles = await gql(
    `query { rolesByOrgId { id name } }`,
  )
  const orgOwnerRoleId = roles.data?.rolesByOrgId?.find(
    (r: { name: string }) => r.name === 'ORG_OWNER',
  )?.id
  if (!orgOwnerRoleId) {
    throw new Error(
      `E2E fixture: could not find seeded ORG_OWNER role for second org — ${JSON.stringify(roles.errors)}`,
    )
  }
  const roleAssign = await gql(
    `mutation AssignRole($input: EmployeeOnboardingInput!) {
       upsertEmployeeOnboardingDraft(input: $input) { id }
     }`,
    { input: { id: employeeId, firstName, lastName, roleIds: [orgOwnerRoleId] } },
  )
  if (roleAssign.errors?.length) {
    throw new Error(
      `E2E fixture: could not assign role to second-org employee — ${roleAssign.errors[0].message}`,
    )
  }

  // Independent cookie jar — this session must never see the admin's
  // Active-Org cookie or session token. Sign-up is done through THIS
  // context's request API, not adminPage's — better-auth sets the session
  // cookie for whichever cookie jar issues the sign-up request, and reusing
  // adminPage.request here would silently overwrite the admin's own session.
  const context = await browser.newContext()
  const page = await context.newPage()

  const signUp = await page.request.post(`${BACKEND_URL}/api/auth/sign-up/email`, {
    headers: { origin: FRONTEND_ORIGIN },
    data: { email, password, name: `${firstName} ${lastName}` },
  })
  if (!signUp.ok()) {
    throw new Error(
      `E2E fixture: could not sign up second user (${signUp.status()})`,
    )
  }
  // sign-up already authenticates the new user's session in this context;
  // clear that session cookie so the explicit sign-in below starts clean.
  await context.clearCookies()

  await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
  await page.getByRole('textbox', { name: /e-?mail/i }).fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).not.toHaveURL(/sign-in/, { timeout: 20000 })
  // Sign-in triggers the app's own client-side redirect navigation; without
  // waiting for it to settle, a goto() issued right after this helper returns
  // races that in-flight navigation and aborts with net::ERR_ABORTED.
  await page.waitForLoadState('networkidle')

  const switchedSecond = await page.request.post(`${BACKEND_URL}/api/org/switch`, {
    data: { orgId },
  })
  if (!switchedSecond.ok()) {
    throw new Error(
      `E2E fixture: second user could not switch into their own org (${switchedSecond.status()})`,
    )
  }

  // Restore the admin's own Active-Org — this helper must not leave a side
  // effect on adminPage's session beyond provisioning org B.
  if (adminOrgId) {
    await adminPage.request.post(`${BACKEND_URL}/api/org/switch`, {
      data: { orgId: adminOrgId },
    })
  }

  return { page, orgId, email }
}
