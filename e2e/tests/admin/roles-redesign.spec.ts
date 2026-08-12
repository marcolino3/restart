import { test, expect, type Page } from '@playwright/test'
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

    const employeesSection = owner.page
      .locator('section')
      .filter({ hasText: 'Employees' })
      .first()

    // Set the "employees" category to level 2 (Edit) — grants every level-1
    // + level-2 code in that category (EMPLOYEE_WRITE, TIMESHEET_WRITE, ...).
    await employeesSection.getByRole('radio', { name: 'Edit' }).click()
    await expect(
      employeesSection.getByRole('radio', { name: 'Edit', checked: true }),
    ).toBeVisible()

    // Expand the category and uncheck a single right: the granted set no
    // longer matches any level exactly, so the editor must fall back to
    // "Individuell" instead of silently rounding to the nearest level.
    await employeesSection.getByRole('button', { name: /Employees/ }).click()
    const timesheetWriteCheckbox = employeesSection
      .locator('label:has-text("Write")')
      .first()
      .locator('..')
      .getByRole('checkbox')
    await timesheetWriteCheckbox.click()
    await expect(employeesSection.getByText('Custom')).toBeVisible()

    // Reset the category to "None" (level 0) to verify the field-group lock:
    // any field group scoped to this category must become disabled.
    await employeesSection.getByRole('radio', { name: 'None' }).click()
    await expect(
      employeesSection.getByRole('radio', { name: 'None', checked: true }),
    ).toBeVisible()

    await owner.page.getByRole('tab', { name: /sensitive fields/i }).click()

    const hrProfileGroup = owner.page
      .locator('section')
      .filter({ hasText: 'HR profile' })
      .first()
    await expect(hrProfileGroup.getByText(/locked/i)).toBeVisible()
    await expect(
      hrProfileGroup.getByRole('radio', { name: 'Read' }),
    ).toBeDisabled()

    // Delete the role via the danger-zone confirmation dialog and verify the
    // redirect back to the overview — no leftover role in the org afterward.
    await owner.page.goto(`/en/admin/roles/${roleId}`, {
      waitUntil: 'networkidle',
    })
    const dangerZone = owner.page
      .locator('section')
      .filter({ hasText: /danger zone/i })
    await dangerZone.getByRole('button').click()
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
})
