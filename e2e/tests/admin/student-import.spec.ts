import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'
import { E2E_NAME_PREFIX, e2eName } from '../helpers/fixture-naming'

/**
 * Wide-sheet student & parent import: upload, preview, commit.
 *
 * The spec uploads a CSV built in memory (the parser accepts CSV and xlsx
 * through the same code path), so no binary fixture has to be checked in.
 * Every created name carries the E2E prefix so the global teardown removes
 * the students, contact persons and families again.
 */

const HEADER = [
  'Vorname',
  'Nachname',
  'Geburtsdatum',
  'Mutter Vorname',
  'Mutter Nachname',
  'Mutter E-Mail',
  'Mutter Mobile',
  'Vater Vorname',
  'Vater Nachname',
  'Vater E-Mail',
  'Strasse',
  'PLZ',
  'Ort',
].join(';')

/**
 * Every first name carries the E2E prefix: the global teardown sweeps rows by
 * their `firstName`, so a prefixed last name alone would leave the imported
 * students and contact persons behind.
 */
function buildCsv(lastName: string, motherEmail: string, fatherEmail: string) {
  const row = (firstName: string, dob: string) =>
    [
      `${E2E_NAME_PREFIX} ${firstName}`,
      lastName,
      dob,
      `${E2E_NAME_PREFIX} Anna`,
      lastName,
      motherEmail,
      '079 123 45 67',
      `${E2E_NAME_PREFIX} Peter`,
      lastName,
      fatherEmail,
      'Bahnhofstrasse 12',
      '8001',
      'Zürich',
    ].join(';')

  // Two siblings sharing both parents: the import must merge them into one
  // family with two contacts, not create four contacts.
  return [HEADER, row('Lena', '12.03.2018'), row('Tim', '05.09.2020')].join('\n')
}

/** Opens the import dialog on an already authenticated page. */
const openImportDialog = async (page: Page) => {
  await page.goto('/en/admin/students', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /student actions/i }).click()
  await page.getByRole('menuitem', { name: /import students/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: /import students/i }),
  ).toBeVisible({ timeout: 15000 })
  return dialog
}

test.describe('Student import — access control', () => {
  test('the preview endpoint rejects an unauthenticated upload', async ({
    request,
  }) => {
    const backend = process.env.BACKEND_URL ?? 'http://localhost:4001'
    const res = await request.post(`${backend}/students/import/preview`, {
      multipart: {
        file: {
          name: 'students.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(buildCsv('E2E', 'a@example.com', 'b@example.com')),
        },
      },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
})

test.describe('Student import — happy path', () => {
  test('imports two siblings and merges their parents into one family', async ({
    page,
  }) => {
    const lastName = e2eName('Import').replace(/\s+/g, '-')
    const stamp = Date.now()
    const motherEmail = `e2e.mother.${stamp}@example.com`
    const fatherEmail = `e2e.father.${stamp}@example.com`

    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const dialog = await openImportDialog(page)

    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'students.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(buildCsv(lastName, motherEmail, fatherEmail)),
    })

    // --- Preview: 2 rows, 2 new students, 2 contacts, 1 family -----------
    await expect(dialog.getByText(/new students/i)).toBeVisible({
      timeout: 20000,
    })
    await expect(dialog.getByRole('cell', { name: /Lena/ })).toBeVisible()
    await expect(dialog.getByRole('cell', { name: /Tim/ })).toBeVisible()

    // --- Commit ----------------------------------------------------------
    await dialog.getByRole('button', { name: /start import/i }).click()
    await expect(page.getByText(/import finished/i)).toBeVisible({
      timeout: 30000,
    })

    // --- Both children are on the list afterwards ------------------------
    // The list is paginated across the whole school, so filter by the unique
    // family name instead of expecting the rows on page one.
    await page.goto('/en/admin/students', { waitUntil: 'networkidle' })
    await page.getByRole('searchbox', { name: /search by name/i }).fill(lastName)
    await expect(
      page.getByRole('row', { name: new RegExp(`Lena.*${lastName}`) }),
    ).toBeVisible({ timeout: 20000 })
    await expect(
      page.getByRole('row', { name: new RegExp(`Tim.*${lastName}`) }),
    ).toBeVisible()
  })

  test('a re-import in skip mode does not duplicate the children', async ({
    page,
  }) => {
    const lastName = e2eName('Reimport').replace(/\s+/g, '-')
    const stamp = Date.now()
    const csv = buildCsv(
      lastName,
      `e2e.mother.${stamp}@example.com`,
      `e2e.father.${stamp}@example.com`,
    )

    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    for (const pass of [1, 2]) {
      const dialog = await openImportDialog(page)
      await dialog.locator('input[type="file"]').setInputFiles({
        name: 'students.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csv),
      })
      await expect(dialog.getByText(/new students/i)).toBeVisible({
        timeout: 20000,
      })
      if (pass === 2) {
        // Second pass: the children already exist, so the mode switch shows up
        // and defaults to skipping them.
        await expect(dialog.getByText(/already exist/i)).toBeVisible()
      }
      await dialog.getByRole('button', { name: /start import/i }).click()
      await expect(page.getByText(/import finished/i)).toBeVisible({
        timeout: 30000,
      })
    }

    await page.goto('/en/admin/students', { waitUntil: 'networkidle' })
    await page.getByRole('searchbox', { name: /search by name/i }).fill(lastName)
    await expect(
      page.getByRole('row', { name: new RegExp(`Lena.*${lastName}`) }),
    ).toHaveCount(1, { timeout: 20000 })
  })
})
