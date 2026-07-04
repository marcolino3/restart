import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Employee onboarding wizard ("Neue:r Mitarbeiter:in") — 3-step guided flow
 * (Person → Contract & workload → Roles & access) that replaces the single
 * create form. Auto-saves a DRAFT, then finalizes and (optionally) invites.
 *
 * The authenticated suite signs in through the real UI (credential account
 * seeded by the Playwright global-setup), so it also runs against a fresh CI
 * database.
 */
test.describe('Employee onboarding — access control', () => {
  test('create route requires authentication', async ({ page }) => {
    await page.goto('/en/admin/employees/edit', { waitUntil: 'networkidle' })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })

  test('set-password page renders without a session', async ({ page }) => {
    await page.goto('/en/onboarding/set-password', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /set your password/i }),
    ).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Employee onboarding — wizard happy path', () => {
  const openWizard = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/employees/edit', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /new employee/i, level: 1 }),
    ).toBeVisible({ timeout: 15000 })
  }

  test('creates an employee through the three steps', async ({ page }) => {
    const stamp = Date.now()
    const email = `e2e.onboarding.${stamp}@example.com`

    await openWizard(page)

    // --- Step 1: Person -------------------------------------------------
    await page.getByLabel(/first name/i).fill('E2E')
    await page.getByLabel(/last name/i).fill(`Wizard ${stamp}`)
    await page.getByLabel(/e-?mail/i).first().fill(email)
    await page.getByRole('button', { name: /^next$/i }).click()

    // Draft auto-saved → step 2 heading visible.
    await expect(
      page.getByText(/contract & workload|2 · contract/i).first(),
    ).toBeVisible({ timeout: 15000 })

    // --- Step 2: Contract ----------------------------------------------
    // Entry date is required to advance. The field is a shadcn date-picker
    // trigger button (not a labelled input), so target it by role, open the
    // calendar and pick a day.
    await page.getByRole('button', { name: /^entry date$/i }).click()
    // Calendar day cell — accessible name may be just "15" or a full date, so
    // match by substring (non-exact) and take the first (outside-month days can
    // repeat the number).
    await page.getByRole('gridcell', { name: '15' }).first().click()
    await page.getByRole('button', { name: /^next$/i }).click()

    // Step 3 (Roles & access) becomes active once the entry date is set.
    await expect(
      page.getByText(/roles & access|3 · roles/i).first(),
    ).toBeVisible({ timeout: 15000 })

    // --- Step 3: Roles --------------------------------------------------
    // Pick the first role card. Scope to <main> so we don't hit the sidebar
    // theme-switcher radios; the role group renders before the invitation
    // group, and the default invitation timing (IMMEDIATE) keeps the CTA as
    // "Create & send invitation".
    await page.getByRole('main').getByRole('radio').first().click()

    await page.getByRole('button', { name: /create & send invitation/i }).click()

    // Back on the list; the new employee (draft or active) is visible.
    await expect(page).toHaveURL(/\/admin\/employees(\?|$)/, { timeout: 20000 })
    await expect(page.getByText(new RegExp(`Wizard ${stamp}`))).toBeVisible({
      timeout: 15000,
    })
  })
})
