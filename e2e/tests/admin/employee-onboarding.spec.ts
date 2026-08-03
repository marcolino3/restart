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
    // Wait for the role picker itself — the stepper label "3 · Roles & access"
    // is always visible, and Step 2 also has radios (exact-times toggle).
    await expect(
      page.getByRole("main").getByRole("heading", { name: /^role$/i }),
    ).toBeVisible({ timeout: 15000 })

    // --- Step 3: Roles --------------------------------------------------
    // Pick the Employee role card explicitly (not invitation radios / toggles).
    const employeeRole = page
      .getByRole("main")
      .getByRole("radio", { name: /^employee\b/i })
    await employeeRole.click()
    await expect(employeeRole).toHaveAttribute("aria-checked", "true")

    await page.getByRole("button", { name: /create & send invitation/i }).click()

    // Back on the list; the new employee (draft or active) is visible.
    await expect(page).toHaveURL(/\/admin\/employees(\?|$)/, { timeout: 20000 })
    await expect(page.getByText(new RegExp(`Wizard ${stamp}`))).toBeVisible({
      timeout: 15000,
    })
  })

  /**
   * The contract step only renders the fields that apply to the chosen type
   * (matrix in `contract-type-rules.ts`, enforced again server-side). Hourly
   * staff are paid per hour, so they get a rate instead of a monthly salary and
   * no workload share at all.
   */
  test('renders only the fields that apply to the chosen contract type', async ({
    page,
  }) => {
    const stamp = Date.now()

    await openWizard(page)

    // --- Step 1: Person, so the wizard lets us into the contract step -----
    await page.getByLabel(/first name/i).fill('E2E')
    await page.getByLabel(/last name/i).fill(`Contract ${stamp}`)
    await page
      .getByLabel(/e-?mail/i)
      .first()
      .fill(`e2e.contract.${stamp}@example.com`)
    await page.getByRole('button', { name: /^next$/i }).click()

    await expect(
      page.getByText(/contract & workload|2 · contract/i).first(),
    ).toBeVisible({ timeout: 15000 })

    const contractType = page.getByLabel(/^contract type$/i)
    const grossSalary = page.getByLabel(/gross salary/i)
    const hourlyRate = page.getByLabel(/^hourly rate$/i)
    const workload = page.getByLabel(/^workload$/i)
    const thirteenthSalary = page.getByLabel(/13th salary/i)

    // --- Hourly: rate only, no monthly salary and no workload ------------
    await contractType.click()
    await page.getByRole('option', { name: /^hourly$/i }).click()

    await expect(hourlyRate).toBeVisible()
    await expect(grossSalary).toHaveCount(0)
    await expect(workload).toHaveCount(0)
    await expect(thirteenthSalary).toHaveCount(0)

    // --- Permanent: the inverse ------------------------------------------
    await contractType.click()
    await page.getByRole('option', { name: /^permanent$/i }).click()

    await expect(grossSalary).toBeVisible()
    await expect(workload).toBeVisible()
    await expect(hourlyRate).toHaveCount(0)

    // --- Temporary: end date becomes mandatory --------------------------
    await contractType.click()
    await page.getByRole('option', { name: /^temporary$/i }).click()

    await expect(
      page.getByRole('button', { name: /^end date$/i }),
    ).toBeVisible()
  })
})
