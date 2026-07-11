import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Chats — the org-internal messenger (three-column: conversation list,
 * message thread, composer). Realtime delivery runs over graphql-ws.
 *
 * Scope note: the CI database seeds only the superadmin, so this suite covers
 * the auth gate and that the page renders its shell (search, filter tabs, new
 * chat). The full two-user realtime roundtrip (Anna sends → Thomas receives
 * without reload) is exercised against a live backend by the backend node
 * checks; bringing it into Playwright CI would require seeding a second
 * credential user in the same org — a separate fixture task.
 */
test.describe('Chats — access control', () => {
  test('page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/chats', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Chats — shell', () => {
  const openPage = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/chats', { waitUntil: 'networkidle' })
  }

  test('renders the messenger shell (search, filters, new chat)', async ({
    page,
  }) => {
    await openPage(page)

    // Search box for conversations.
    await expect(
      page.getByPlaceholder(/search chats/i),
    ).toBeVisible({ timeout: 15000 })

    // Filter tabs from the design template.
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^direct$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^groups$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^teams$/i })).toBeVisible()

    // New-chat button opens the dialog.
    await page.getByRole('button', { name: /new chat/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
  })
})
