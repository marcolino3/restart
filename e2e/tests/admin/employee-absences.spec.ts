import { test, expect, type Page } from '@playwright/test'
import {
  ensureActiveOrg,
  ensureEmployee,
  signInAsSuperAdmin,
} from '../helpers/auth'

/**
 * Employee absences — admin CRUD on the employee detail "Absences" tab.
 */
test.describe('Employee absences — access control', () => {
  test('create page requires authentication', async ({ page }) => {
    await page.goto('/en/admin/employees/some-id/absences/edit', {
      waitUntil: 'networkidle',
    })
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page).toHaveURL(/sign-in/)
  })
})

test.describe('Employee absences — CRUD', () => {
  const openAbsencesTab = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const { employeeId } = await ensureEmployee(page)
    await page.goto(`/en/admin/employees/${employeeId}?tab=absences`, {
      waitUntil: 'networkidle',
    })
    await expect(page.getByRole('tab', { name: /^absences$/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(
      page.getByRole('link', { name: /^record absence$/i }),
    ).toBeVisible({ timeout: 15000 })
    return { employeeId }
  }

  const pickCalendarDay = async (page: Page, fieldLabel: RegExp) => {
    await page.getByRole('button', { name: fieldLabel }).click()
    await page.getByRole('gridcell', { name: '15' }).first().click()
  }

  test('creates, edits and deletes an absence', async ({ page }) => {
    const note = `E2E absence ${Date.now()}`
    const updatedNote = `${note} updated`
    const { employeeId } = await openAbsencesTab(page)

    await page.getByRole('link', { name: /^record absence$/i }).click()
    await expect(
      page.getByRole('heading', { name: /^record absence$/i, level: 1 }),
    ).toBeVisible()

    await page.getByRole('combobox', { name: /^category$/i }).click()
    await page.getByRole('option', { name: /sick leave/i }).click()
    await pickCalendarDay(page, /^start date$/i)
    await pickCalendarDay(page, /^end date$/i)
    await page.getByLabel(/^note$/i).fill(note)
    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/admin/employees/${employeeId}\\?tab=absences`),
      { timeout: 15000 },
    )
    await expect(page.getByText(note, { exact: true })).toBeVisible({
      timeout: 15000,
    })

    const row = page.getByRole('row', { name: new RegExp(note) })
    await row.getByRole('link', { name: /^edit$/i }).click()
    await expect(
      page.getByRole('heading', { name: /^edit absence$/i, level: 1 }),
    ).toBeVisible()
    await page.getByLabel(/^note$/i).fill(updatedNote)
    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(page.getByText(updatedNote, { exact: true })).toBeVisible({
      timeout: 15000,
    })

    const updatedRow = page.getByRole('row', { name: new RegExp(updatedNote) })
    // Deletion goes through DeleteConfirmationDialog, not window.confirm.
    await updatedRow.getByRole('button', { name: /^delete$/i }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(page.getByText(updatedNote)).toHaveCount(0, {
      timeout: 15000,
    })
  })

  test('uploads a medical certificate with an inline label', async ({
    page,
  }) => {
    const note = `E2E cert ${Date.now()}`
    const { employeeId } = await openAbsencesTab(page)

    await page.getByRole('link', { name: /^record absence$/i }).click()
    await page.getByRole('combobox', { name: /^category$/i }).click()
    await page.getByRole('option', { name: /sick leave/i }).click()
    await pickCalendarDay(page, /^start date$/i)
    await pickCalendarDay(page, /^end date$/i)
    await page.getByLabel(/^note$/i).fill(note)

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page
        .getByRole('button', { name: /^upload medical certificate$/i })
        .click(),
    ])
    await fileChooser.setFiles({
      name: 'certificate.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 e2e'),
    })

    const labelInput = page.getByPlaceholder(
      /initial certificate|follow-up|accident report/i,
    )
    await expect(labelInput).toBeVisible({ timeout: 15000 })
    await labelInput.fill('Initial certificate')
    await labelInput.press('Enter')

    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/admin/employees/${employeeId}\\?tab=absences`),
      { timeout: 20000 },
    )
    await expect(
      page.getByRole('link', { name: 'Initial certificate' }),
    ).toBeVisible({ timeout: 15000 })
  })
})
