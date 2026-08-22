import { test, expect, type Page } from '@playwright/test'
import {
  ensureActiveOrg,
  ensureEmployee,
  signInAsSuperAdmin,
} from '../helpers/auth'

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
 * Drops the absences these tests leave on the shared fixture employee.
 *
 * The employee comes from `ensureEmployee` and lives in a non-fixture
 * organization, so the global teardown never touches it. The backend rejects
 * a second absence on a day that is already covered, so a run that dies before
 * its own delete step would otherwise block every later run on the same day.
 */
async function clearE2eAbsences(page: Page, employeeId: string) {
  const res = await gql(
    page,
    `query ($employeeId: ID!) {
       employeeAbsencesByEmployeeId(employeeId: $employeeId) { id note }
     }`,
    { employeeId },
  )
  if (res.errors?.length) {
    throw new Error(`absence cleanup query failed: ${res.errors[0].message}`)
  }
  const absences = res.data?.employeeAbsencesByEmployeeId ?? []
  for (const absence of absences) {
    if (!/^E2E /.test(absence.note ?? '')) continue
    const del = await gql(
      page,
      'mutation ($id: ID!) { deleteEmployeeAbsence(id: $id) }',
      { id: absence.id },
    )
    if (del.errors?.length) {
      throw new Error(`absence cleanup failed: ${del.errors[0].message}`)
    }
  }
}

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
    await clearE2eAbsences(page, employeeId)
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

  /**
   * Picks a day in the currently shown month. Each test passes its own day so
   * two tests in the same run cannot claim the same date — the backend refuses
   * a second absence covering a day the employee already has one for.
   */
  const pickCalendarDay = async (
    page: Page,
    fieldLabel: RegExp,
    day: string,
  ) => {
    await page.getByRole('button', { name: fieldLabel }).click()
    // Accessible names can be just the number or a full date, so match by
    // substring and take the first (outside-month days repeat the number).
    await page.getByRole('gridcell', { name: day }).first().click()
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
    await pickCalendarDay(page, /^start date$/i, '15')
    await pickCalendarDay(page, /^end date$/i, '15')
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
    await pickCalendarDay(page, /^start date$/i, '18')
    await pickCalendarDay(page, /^end date$/i, '18')
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

    // Unlike the CRUD test above, this one has no delete step of its own.
    await clearE2eAbsences(page, employeeId)
  })
})
