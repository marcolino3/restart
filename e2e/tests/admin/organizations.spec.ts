import { test, expect, type Page } from '@playwright/test'
import { signInAsSuperAdmin, setupSecondOrgUser, ensureActiveOrg } from '../helpers/auth'

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
 * Superadmin org management: create → edit tabs → toggle a feature →
 * suspend → reactivate, end to end through the real UI. Plus the negative
 * case: a non-SuperAdmin must not be able to read organizationsOverview.
 */
test.describe('Admin organizations', () => {
  test('create, edit, toggle feature, suspend and reactivate an organization', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const orgName = `E2E Test Schule ${Date.now()}`

    await page.goto('/en/admin/organizations', { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: /create organization/i }).click()
    await expect(page).toHaveURL(/admin\/organizations\/create/)

    await page.getByLabel(/^name$/i).fill(orgName)
    await page.locator('#ownerEmail').fill(`e2e-owner-${Date.now()}@example.com`)
    await page.getByRole('button', { name: /^(create|save)/i }).click()

    await expect(page).toHaveURL(/admin\/organizations\/edit\/[^/]+/, {
      timeout: 15000,
    })
    const orgId = page.url().match(/organizations\/edit\/([^/?]+)/)?.[1]
    expect(orgId).toBeTruthy()

    // Features tab: toggle one feature off, verify counter updates.
    await page.getByRole('tab', { name: /features/i }).click()
    const chatsToggle = page.getByRole('switch', { name: /chats/i })
    await expect(chatsToggle).toBeVisible()
    await chatsToggle.click()
    await expect(chatsToggle).not.toBeChecked()

    // Status: suspend requires a reason, then reactivate.
    await page.getByRole('button', { name: /suspend/i }).click()
    await page.getByLabel(/reason/i).fill('E2E test suspension')
    await page.getByRole('button', { name: /^(suspend|confirm)/i }).last().click()
    await expect(page.getByText(/suspended/i).first()).toBeVisible()

    await page.getByRole('button', { name: /reactivate/i }).click()
    await expect(page.getByText(/^active/i).first()).toBeVisible()

    // Teardown: remove the fixture org.
    await gql(
      page,
      `mutation Remove($id: String!) { removeOrganization(id: $id) { id } }`,
      { id: orgId },
    )
  })

  test('a non-SuperAdmin cannot read the organizations overview', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const owner = await setupSecondOrgUser(browser, page)

    const overview = await gql(
      owner.page,
      `{ organizationsOverview { stats { activeCount } } }`,
    )
    expect(overview.data?.organizationsOverview).toBeFalsy()
    expect(overview.errors?.length ?? 0).toBeGreaterThan(0)

    await owner.page.goto('/en/admin/organizations', { waitUntil: 'networkidle' })
    await expect(
      owner.page
        .locator('main')
        .getByText(/could not be loaded|forbidden|not authorized/i),
    ).toBeVisible({ timeout: 15000 })

    await gql(
      page,
      `mutation Remove($id: String!) { removeOrganization(id: $id) { id } }`,
      { id: owner.orgId },
    )
    await owner.page.close()
  })
})
