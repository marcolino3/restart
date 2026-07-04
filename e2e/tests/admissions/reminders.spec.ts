import { test, expect } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Admissions reminders ("Erinnerungen").
 *
 * Covers the auth gate plus the UI-driven happy path: create an application,
 * add a reminder through the unified reminder dialog, and see it surface both on
 * the application's reminders panel and on the searchable org-wide reminders
 * table.
 *
 * The reminder → task chain (a reminder auto-creates a personal task for its
 * assignee, shown under "My Tasks" with an "Admission: <child>" source badge) is
 * not asserted here: `createOrganization` seeds no membership for the superadmin
 * fixture, so a reminder created by that actor has no assignee and therefore no
 * task is produced. That linkage is covered end-to-end at the unit level in
 * apps/backend/.../admission-reminders.service.spec.ts (create mirrors a task;
 * complete/uncomplete/remove keep it in sync; cross-org isolation).
 */
test.describe('Admissions reminders — access control', () => {
  test('reminders page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/admissions/reminders', {
      waitUntil: 'networkidle',
    })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Admissions reminders — happy path', () => {
  test('create an application, add a reminder, and see it listed', async ({
    page,
  }) => {
    const stamp = Date.now()
    const childFirst = `Rem${stamp}`
    const childLast = 'Testkind'
    const childName = `${childFirst} ${childLast}`
    const reminderTitle = `Callback ${stamp}`

    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    // 1. Create an application on the kanban board.
    await page.goto('/en/admin/admissions/kanban', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /new application/i }).click()

    const createDialog = page.getByRole('dialog')
    await expect(createDialog).toBeVisible()
    await createDialog.getByLabel(/child first name/i).fill(childFirst)
    await createDialog.getByLabel(/child last name/i).fill(childLast)
    // Stage defaults to the first seeded stage, source to MANUAL — only the
    // child's name is required.
    await createDialog.getByRole('button', { name: /^save$/i }).click()
    await expect(createDialog).toBeHidden({ timeout: 15000 })

    // 2. Open the new application's detail page (its card is the only one).
    await page.getByText(childName).first().click()
    await expect(page).toHaveURL(/\/admin\/admissions\/[0-9a-f-]{36}/, {
      timeout: 15000,
    })

    // 3. Add a reminder through the unified reminder dialog.
    await page.getByRole('button', { name: /new reminder/i }).click()
    const reminderDialog = page.getByRole('dialog')
    await expect(reminderDialog).toBeVisible()
    await reminderDialog
      .getByPlaceholder(/call mother back/i)
      .fill(reminderTitle)
    await reminderDialog
      .getByRole('button', { name: /create reminder/i })
      .click()
    await expect(reminderDialog).toBeHidden({ timeout: 15000 })

    // The reminder shows in the application's reminders panel.
    await expect(page.getByText(reminderTitle)).toBeVisible({ timeout: 15000 })

    // 4. It also appears on the searchable org-wide reminders table.
    await page.goto('/en/admin/admissions/reminders', {
      waitUntil: 'networkidle',
    })
    await expect(
      page.getByRole('heading', { name: /^reminders$/i, level: 1 }),
    ).toBeVisible({ timeout: 15000 })
    await page
      .getByPlaceholder(/search reminder, child or assignee/i)
      .fill(reminderTitle)
    await expect(page.getByText(reminderTitle)).toBeVisible({ timeout: 15000 })
  })
})
