import { test, expect, type Page } from '@playwright/test'
import { signInAsSuperAdmin, setupSecondOrgUser, ensureActiveOrg } from '../helpers/auth'
import { e2eOrgName } from '../helpers/fixture-naming'

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

    // Must carry the fixture prefix — the global teardown deletes test orgs
    // by exactly that prefix, and this one is created through the UI.
    const orgName = e2eOrgName('Schule')

    await page.goto('/en/admin/organizations', { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: /create organization/i }).click()
    // Generous timeout: on a cold dev server this route is compiled on demand.
    await expect(page).toHaveURL(/admin\/organizations\/create/, {
      timeout: 30000,
    })
    await expect(page.locator('input[name="name"]')).toBeVisible({
      timeout: 30000,
    })

    // The create page renders the very same form as the edit page, so fields
    // from every tab must survive the create round-trip.
    // Several fields share a visible label ("Name", "Email"), so address them
    // by their form field name instead.
    const field = (name: string) => page.locator(`input[name="${name}"]`)

    // Comboboxes render a <div role="combobox">, which is not a labelable
    // element — getByLabel finds nothing. Address them through their form item
    // instead: the container that holds both the label and the trigger.
    const combobox = (label: RegExp) =>
      page
        .locator('[data-slot="form-item"]')
        .filter({ has: page.getByText(label) })
        .getByRole('combobox')

    const selectOption = async (label: RegExp, option: RegExp) => {
      await combobox(label).click()
      await page.getByRole('option', { name: option }).click()
    }

    await field('name').fill(orgName)
    await field('shortCode').fill('E2E')
    await field('legalEntity').fill('E2E Verein')

    // The four classification dimensions: single-select comboboxes plus the
    // multi-select education levels.
    await selectOption(/^sponsorship$/i, /^public$/i)
    await selectOption(/^pedagogy$/i, /^montessori$/i)
    await selectOption(/^care model$/i, /^all-day school$/i)

    // Multi-select: the popover stays open, but every pick adds a chip to the
    // trigger and reflows the list, so wait for the selection to settle before
    // clicking the next option.
    const levelsTrigger = combobox(/^education levels$/i)
    await levelsTrigger.click()
    await page.getByRole('option', { name: /^primary level$/i }).click()
    await expect(levelsTrigger).toContainText(/primary level/i)
    await page.getByRole('option', { name: /^lower secondary$/i }).click()
    await expect(levelsTrigger).toContainText(/lower secondary/i)
    await page.keyboard.press('Escape')

    await page.getByRole('tab', { name: /address/i }).click()
    await field('street').fill('Bahnhofstrasse 1')
    await field('city').fill('Zuerich')

    await page.getByRole('tab', { name: /contact/i }).click()
    const contactEmail = `e2e-contact-${Date.now()}@example.com`
    await selectOption(/^salutation$/i, /^mrs$/i)
    await field('contactTitle').fill('Dr.')
    await field('contactFirstName').fill('E2E')
    await field('contactLastName').fill('Contact')
    await field('contactEmail').fill(contactEmail)

    // Features is only available once the organization exists.
    await expect(page.getByRole('tab', { name: /features/i })).toBeDisabled()

    await page.getByRole('button', { name: /^(create|save)/i }).click()

    await expect(page).toHaveURL(/admin\/organizations\/edit\/[^/]+/, {
      timeout: 15000,
    })
    const orgId = page.url().match(/organizations\/edit\/([^/?]+)/)?.[1]
    expect(orgId).toBeTruthy()

    // Fields from the non-general tabs must have been persisted on create.
    await expect(field('shortCode')).toHaveValue('E2E')
    await expect(field('legalEntity')).toHaveValue('E2E Verein')
    // Classification round-trip, including the multi-select array column.
    await expect(combobox(/^sponsorship$/i)).toContainText(/public/i)
    await expect(combobox(/^pedagogy$/i)).toContainText(/montessori/i)
    await expect(combobox(/^care model$/i)).toContainText(/all-day/i)
    const levels = combobox(/^education levels$/i)
    await expect(levels).toContainText(/primary level/i)
    await expect(levels).toContainText(/lower secondary/i)
    await page.getByRole('tab', { name: /address/i }).click()
    await expect(field('city')).toHaveValue('Zuerich')
    await page.getByRole('tab', { name: /contact/i }).click()
    await expect(field('contactFirstName')).toHaveValue('E2E')
    await expect(field('contactLastName')).toHaveValue('Contact')
    await expect(field('contactEmail')).toHaveValue(contactEmail)

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
