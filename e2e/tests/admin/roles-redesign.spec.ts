import { test, expect, type Locator, type Page } from '@playwright/test'
import {
  signInAsSuperAdmin,
  ensureActiveOrg,
  setupSecondOrgUser,
} from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'

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
 * The category and field-group cards are plain rounded `div`s, not `section`s —
 * only the right-hand detail rail uses `<section>`. Scope by the card that
 * carries the heading text instead of by tag name.
 */
function categorySection(page: Page, name: string) {
  return page
    .locator('div.rounded-xl.border')
    .filter({ hasText: name })
    .first()
}

/**
 * The manage-people dialog picks members through a Command popover behind a
 * readonly input that lazy-loads the employee list on click — so open the
 * popover, wait for the options, then toggle the first one.
 */
async function toggleFirstMember(page: Page, dialog: Locator) {
  await dialog.locator('input[readonly]').first().click()
  const option = page.getByRole('option').first()
  await expect(option).toBeVisible()
  await option.click()
  await page.keyboard.press('Escape')
}

/**
 * Roles & Permissions redesign: category-level toggles, "Individuell" on a
 * non-matching combination, and the field-group lock that follows the parent
 * category down to level 0. Exercises the real RoleDomainEditor /
 * RoleFieldPermissionEditor UI against the live backend, not a mock.
 */
test.describe('Roles redesign — category levels and field-group lock', () => {
  test('create role, set category level, detect Individuell, lock field group, delete role', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const owner = await setupSecondOrgUser(browser, page)
    const orgId = owner.orgId

    const stamp = Date.now()
    const roleName = `E2E Role ${stamp}`

    await owner.page.goto('/en/admin/roles', { waitUntil: 'networkidle' })

    await owner.page.getByRole('button', { name: /create role/i }).click()
    await owner.page.getByLabel(/role name/i).fill(roleName)
    await owner.page
      .getByRole('dialog')
      .getByRole('button', { name: /save/i })
      .click()
    await expect(owner.page.getByRole('dialog')).toHaveCount(0)

    const rolesQuery = await gql(owner.page, `query { rolesByOrgId { id name } }`)
    const roleId = rolesQuery.data?.rolesByOrgId?.find(
      (r: { name: string }) => r.name === roleName,
    )?.id
    expect(roleId).toBeTruthy()

    await owner.page.goto(`/en/admin/roles/${roleId}`, {
      waitUntil: 'networkidle',
    })

    const employeesSection = categorySection(owner.page, 'Employees & Contracts')

    // Set the "employees" category to level 2 (Edit) — grants every level-1
    // + level-2 code in that category (EMPLOYEE_WRITE, TIMESHEET_WRITE, ...).
    // The level switcher is the shadcn Tabs segment, so the options are tabs.
    await employeesSection.getByRole('tab', { name: 'Edit' }).click()
    await expect(
      employeesSection.getByRole('tab', { name: 'Edit', selected: true }),
    ).toBeVisible()

    // Expand the category and uncheck a single right: the granted set no
    // longer matches any level exactly, so the editor must fall back to
    // "Individuell" instead of silently rounding to the nearest level.
    await employeesSection
      .getByRole('button', { name: /individual rights/i })
      .click()
    // The real input is `sr-only`, so click the wrapping label instead. Match on
    // the exact accessible name — a substring match on "Write" also picks up the
    // sibling "Read" toggle.
    const timesheetWriteCheckbox = employeesSection
      .getByRole('checkbox', { name: 'Write', exact: true })
      .first()
    await expect(timesheetWriteCheckbox).toBeChecked()
    await employeesSection
      .locator('label')
      .filter({ hasText: /^Write$/ })
      .first()
      .click()
    await expect(timesheetWriteCheckbox).not.toBeChecked()
    await expect(employeesSection.getByText('Custom')).toBeVisible()

    // Reset the category to "None" (level 0) to verify the field-group lock:
    // any field group scoped to this category must become disabled.
    await employeesSection.getByRole('tab', { name: 'None' }).click()
    await expect(
      employeesSection.getByRole('tab', { name: 'None', selected: true }),
    ).toBeVisible()

    await owner.page.getByRole('tab', { name: /sensitive fields/i }).click()

    const hrProfileGroup = categorySection(owner.page, 'HR profile')
    await expect(hrProfileGroup.getByText(/area locked/i)).toBeVisible()
    // The lock is enforced by the guard in `onValueChange` plus `pointer-events-none`
    // on the list — not by the `disabled` attribute — so assert the tab is
    // genuinely unclickable rather than merely marked disabled.
    await expect(
      hrProfileGroup.getByRole('tablist').first(),
    ).toHaveClass(/pointer-events-none/)

    // Delete the role via the danger-zone confirmation dialog and verify the
    // redirect back to the overview — no leftover role in the org afterward.
    await owner.page.goto(`/en/admin/roles/${roleId}`, {
      waitUntil: 'networkidle',
    })
    // The danger-zone heading is just "Role", so scope by its delete button.
    await owner.page.getByRole('button', { name: /delete role/i }).click()
    await owner.page.getByRole('button', { name: /^delete$/i }).click()
    await expect(owner.page).toHaveURL(/\/admin\/roles$/, { timeout: 20000 })

    const afterDelete = await gql(owner.page, `query { rolesByOrgId { id name } }`)
    expect(
      afterDelete.data?.rolesByOrgId?.some((r: { id: string }) => r.id === roleId),
    ).toBe(false)

    // Teardown: remove the whole fixture org (cascades roles, memberships)
    // so the run leaves no test data behind.
    await gql(
      page,
      `mutation Remove($id: String!) {
         removeOrganization(id: $id) { id }
       }`,
      { id: orgId },
    )

    await owner.page.close()
  })

  /**
   * System roles must stay editable in their permissions (an OrgAdmin has to be
   * able to tune what "Employee" may do) while their identity stays frozen so
   * seeding and bootstrap remain reproducible.
   */
  test('system role permissions are editable and the level survives a reload', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const owner = await setupSecondOrgUser(browser, page)
    const orgId = owner.orgId

    const rolesQuery = await gql(
      owner.page,
      `query { rolesByOrgId { id name isSystem systemCode } }`,
    )
    const systemRole = rolesQuery.data?.rolesByOrgId?.find(
      (r: { isSystem: boolean; systemCode: string | null }) =>
        r.isSystem && r.systemCode === 'EMPLOYEE',
    )
    expect(systemRole).toBeTruthy()

    await owner.page.goto(`/en/admin/roles/${systemRole.id}`, {
      waitUntil: 'networkidle',
    })

    const employeesSection = categorySection(owner.page, 'Employees & Contracts')

    await employeesSection.getByRole('tab', { name: 'Read' }).click()
    await expect(
      employeesSection.getByRole('tab', { name: 'Read', selected: true }),
    ).toBeVisible()

    // A failed save rolls the optimistic state back, so surviving a reload is
    // what proves the mutation was actually accepted by the backend.
    await owner.page.reload({ waitUntil: 'networkidle' })
    await expect(
      categorySection(owner.page, 'Employees & Contracts').getByRole('tab', {
        name: 'Read',
        selected: true,
      }),
    ).toBeVisible()

    // The identity of a system role stays locked: no delete from the UI.
    await expect(
      owner.page.getByRole('button', { name: /delete role/i }),
    ).toBeDisabled()

    await gql(
      page,
      `mutation Remove($id: String!) {
         removeOrganization(id: $id) { id }
       }`,
      { id: orgId },
    )

    await owner.page.close()
  })

  /**
   * Member assignment writes through updateRoleMembers, which is org-scoped in
   * the resolver — the dialog may only ever offer memberships of the caller org.
   */
  test('assign and remove a role member via the manage-members dialog', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const owner = await setupSecondOrgUser(browser, page)
    const orgId = owner.orgId

    const stamp = Date.now()
    const roleName = `E2E Members ${stamp}`

    const created = await gql(
      owner.page,
      `mutation Create($input: CreateRoleInput!) {
         createRole(input: $input) { id name }
       }`,
      { input: { name: roleName } },
    )
    const roleId = created.data?.createRole?.id
    expect(roleId).toBeTruthy()

    await owner.page.goto(`/en/admin/roles/${roleId}`, {
      waitUntil: 'networkidle',
    })

    const membersSection = owner.page
      .locator('section')
      .filter({ hasText: /assigned people/i })
      .first()
    await expect(membersSection.getByText(/no one assigned/i)).toBeVisible()

    await membersSection.getByRole('button', { name: /manage people/i }).click()
    const dialog = owner.page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // People are picked from a Command popover (role="option"), not checkboxes.
    await toggleFirstMember(owner.page, dialog)
    await dialog.getByRole('button', { name: /save/i }).click()
    await expect(owner.page.getByRole('dialog')).toHaveCount(0)

    const withMember = await gql(
      owner.page,
      `query { rolesByOrgId { id memberships { id } } }`,
    )
    const assigned = withMember.data?.rolesByOrgId?.find(
      (r: { id: string }) => r.id === roleId,
    )
    expect(assigned?.memberships?.length).toBe(1)

    // Deselecting the last member must clear the role, not be treated as a
    // no-op — an empty membershipIds list is a valid update.
    await owner.page.reload({ waitUntil: 'networkidle' })
    await owner.page
      .locator('section')
      .filter({ hasText: /assigned people/i })
      .first()
      .getByRole('button', { name: /manage people/i })
      .click()
    const reopened = owner.page.getByRole('dialog')
    await toggleFirstMember(owner.page, reopened)
    await reopened.getByRole('button', { name: /save/i }).click()
    await expect(owner.page.getByRole('dialog')).toHaveCount(0)

    const cleared = await gql(
      owner.page,
      `query { rolesByOrgId { id memberships { id } } }`,
    )
    expect(
      cleared.data?.rolesByOrgId?.find((r: { id: string }) => r.id === roleId)
        ?.memberships?.length,
    ).toBe(0)

    await gql(
      page,
      `mutation Remove($id: String!) {
         removeOrganization(id: $id) { id }
       }`,
      { id: orgId },
    )

    await owner.page.close()
  })
})
