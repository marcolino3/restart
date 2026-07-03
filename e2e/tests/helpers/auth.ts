import { expect, type Page } from '@playwright/test'

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

  const listed = await gql('{ organizations { id } }')
  let orgId = listed.data?.organizations?.[0]?.id

  if (!orgId) {
    const created = await gql('mutation { createOrganization { id } }')
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
