import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Theme persistence — the theme picked in the sidebar is stored on the
 * profile (membership per org; users table for the membership-less
 * SuperAdmin, which is what this suite signs in as) and re-applied on load
 * even without the localStorage fast path.
 */
// The reload/persistence path signs in through the real UI; the credential
// account is seeded once by the Playwright global-setup (see
// helpers/global-setup), so it runs in CI too.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'
const THEME_STORAGE_KEY = 'restart-theme'

const fetchProfileTheme = async (page: Page): Promise<string | null> => {
  const res = await page.request.post(`${BACKEND_URL}/graphql`, {
    data: { query: '{ authContext { theme } }' },
  })
  const json = (await res.json()) as {
    data?: { authContext?: { theme?: string | null } }
  }
  return json.data?.authContext?.theme ?? null
}

test.describe('Theme — persisted in the profile', () => {
  test('picked theme survives reload without localStorage', async ({ page }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/grade-levels', { waitUntil: 'networkidle' })

    const html = page.locator('html')

    // Pick a theme that is guaranteed to differ from the current one so the
    // test stays meaningful on repeated runs against the same database.
    const current = await html.getAttribute('data-theme')
    const target = current === 'lagune' ? 'himmel' : 'lagune'
    const targetLabel = target === 'lagune' ? 'Lagune' : 'Himmel'

    await page.getByRole('radio', { name: targetLabel }).click()
    await expect(html).toHaveAttribute('data-theme', target)

    // The picker persists fire-and-forget through a server action — wait for
    // the profile (source of truth) before reloading, otherwise the reload
    // can race the write.
    await expect
      .poll(() => fetchProfileTheme(page), { timeout: 15000 })
      .toBe(target)

    // Remove the localStorage fast path: after reload the theme can only
    // come back from the profile (new-device scenario).
    await page.evaluate(
      (key) => window.localStorage.removeItem(key),
      THEME_STORAGE_KEY,
    )
    await page.reload({ waitUntil: 'networkidle' })
    await expect(html).toHaveAttribute('data-theme', target, {
      timeout: 15000,
    })

    // The applied profile theme re-primes localStorage for the next paint.
    await expect
      .poll(() =>
        page.evaluate((key) => window.localStorage.getItem(key), THEME_STORAGE_KEY),
      )
      .toBe(target)
  })

  test('updateMyTheme rejects unauthenticated callers', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/graphql`, {
      data: {
        query: 'mutation { updateMyTheme(input: { theme: "lagune" }) }',
      },
    })
    const json = (await res.json()) as {
      data?: { updateMyTheme?: boolean } | null
      errors?: unknown[]
    }
    expect(json.errors?.length ?? 0).toBeGreaterThan(0)
    expect(json.data?.updateMyTheme ?? null).toBeNull()
  })
})
