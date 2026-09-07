import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'
import { E2E_NAME_PREFIX } from '../helpers/fixture-naming'

/**
 * Employee CSV/Excel import: one row imports person, HR profile, emergency
 * contact and first contract in one go.
 *
 * The CSV is built in memory (the backend reads CSV and xlsx through the same
 * code path). Every account uses an `e2e.*@example.com` address and an E2E
 * prefixed first name so the global teardown removes the users, memberships
 * and employees again.
 */

const HEADER = [
  'email',
  'firstName',
  'lastName',
  'persona',
  'contactPhone',
  'street',
  'postalCode',
  'city',
  'onboardingStatus',
  'contact1Name',
  'contact1Relationship',
  'contractStartDate',
  'contractType',
  'workloadPercent',
  'grossSalary',
].join(';')

function buildCsv(email: string, firstName: string) {
  const row = [
    email,
    `${E2E_NAME_PREFIX} ${firstName}`,
    'Import',
    'EMPLOYEE',
    '+41 79 123 45 67',
    'Bahnhofstrasse 12',
    '8001',
    'Zürich',
    'IN_PROGRESS',
    `${E2E_NAME_PREFIX} Kontakt`,
    'SPOUSE',
    '2025-08-01',
    'PERMANENT',
    '80',
    '6500',
  ].join(';')
  return [HEADER, row].join('\n')
}

const openImportDialog = async (page: Page) => {
  await page.goto('/en/admin/employees', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /open menu/i }).first().click()
  await page.getByRole('menuitem', { name: /csv\/excel import/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: /csv\/excel import/i }),
  ).toBeVisible({ timeout: 15000 })
  return dialog
}

const uploadCsv = async (dialog: ReturnType<Page['getByRole']>, csv: string) =>
  dialog.locator('input[type="file"]').setInputFiles({
    name: 'employees.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })

test.describe('Employee import — access control', () => {
  test('the upload endpoint rejects an unauthenticated request', async ({
    request,
  }) => {
    const backend = process.env.BACKEND_URL ?? 'http://localhost:4001'
    const res = await request.post(`${backend}/employees/upload`, {
      multipart: {
        file: {
          name: 'employees.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(buildCsv('e2e.nobody@example.com', 'Nobody')),
        },
      },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
})

test.describe('Employee import — happy path', () => {
  test('imports an employee with profile and contract, skips it on re-upload', async ({
    page,
  }) => {
    const stamp = Date.now()
    const email = `e2e.import.${stamp}@example.com`

    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const dialog = await openImportDialog(page)

    await uploadCsv(dialog, buildCsv(email, `Import${stamp}`))
    await expect(dialog.getByRole('heading', { name: /^created \(/i })).toBeVisible({ timeout: 30000 })
    await expect(dialog.getByText(email, { exact: true })).toBeVisible()
    await expect(dialog.getByText(/created with warnings/i)).toHaveCount(0)
    await expect(dialog.getByRole('heading', { name: /^failed \(/i })).toHaveCount(0)

    // Second upload of the same file: the existing employee is skipped.
    await uploadCsv(dialog, buildCsv(email, `Import${stamp}`))
    await expect(dialog.getByRole('heading', { name: /^failed \(/i })).toBeVisible({ timeout: 30000 })
    await expect(dialog.getByText(/already exists/i)).toBeVisible()
  })

  test('rejects a file with an unknown column', async ({ page }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const dialog = await openImportDialog(page)

    await uploadCsv(
      dialog,
      ['email;shoeSize', 'e2e.unknown@example.com;42'].join('\n'),
    )
    await expect(page.getByText(/unknown columns: shoeSize/i)).toBeVisible({
      timeout: 15000,
    })
  })
})
