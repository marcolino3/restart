import { test, expect, type Page } from '@playwright/test'
import { signInAsSuperAdmin, ensureActiveOrg, setupSecondOrgUser } from '../helpers/auth'

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
 * Org feature toggles: a SuperAdmin disabling a feature for an org must hide
 * the corresponding nav item AND block direct URL access for that org's
 * users — enforced server-side (OrgFeatureGuard), not just a hidden link.
 */
test.describe('Org feature toggles', () => {
  test('disabling Protocols hides the nav item and blocks direct access', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const owner = await setupSecondOrgUser(browser, page)
    const orgId = owner.orgId

    // Sanity check: Protocols visible before disabling the feature.
    await owner.page.goto('/en/admin/protocols')
    await expect(owner.page.getByRole('link', { name: /protocols/i })).toBeVisible()

    const disabled = await gql(
      page,
      `mutation Update($input: UpdateOrganizationFeatureToggleInput!) {
         updateOrganizationFeatureToggle(input: $input) { featureKey enabled }
       }`,
      { input: { organizationId: orgId, featureKey: 'PROTOCOLS', enabled: false } },
    )
    expect(disabled.errors ?? []).toEqual([])
    expect(disabled.data?.updateOrganizationFeatureToggle?.enabled).toBe(false)

    // Sidebar: nav item disappears after reload.
    await owner.page.reload()
    await expect(
      owner.page.getByRole('link', { name: /protocols/i }),
    ).not.toBeVisible()

    // Direct URL access is blocked server-side, not just hidden in the menu
    // (Protocols namespace's loadError string — see messages/en.json).
    await owner.page.goto('/en/admin/protocols')
    await expect(
      owner.page.getByText('Could not load the data.'),
    ).toBeVisible()

    const protocolsQuery = await gql(
      owner.page,
      `{ protocolsByOrg { id } }`,
    )
    expect(
      protocolsQuery.errors?.some((e) => /disabled/i.test(e.message)),
    ).toBe(true)

    // Teardown: remove the fixture org (cascades toggles/memberships/etc.).
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
