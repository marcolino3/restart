import { test, expect, type Page } from '@playwright/test'
import {
  ensureActiveOrg,
  ensureTeacher,
  signInAsSuperAdmin,
} from '../helpers/auth'

/**
 * Teacher assignment on a school class — the edit page rebuilt around role
 * (class teacher / assistant) and workload.
 *
 * The existing school-classes suite only ever creates a class by name, so the
 * whole assignment path stayed untested: a schema mismatch on
 * school_class_teachers made every query on that table fail at runtime while
 * the suite stayed green, and saving a class with assignments nulled their
 * foreign key. These tests always go through a class that has a teacher.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'

test.describe('School class teachers', () => {
  const openList = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/school-classes', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /school classes/i, level: 2 }),
    ).toBeVisible({ timeout: 15000 })
  }

  /**
   * Creates a class through the form and returns its id, so the tests can
   * navigate to the edit page directly. Matching the card by accessible name
   * is brittle — the class name sits in a nested element inside the link.
   */
  const createClass = async (page: Page, name: string): Promise<string> => {
    await page.getByRole('link', { name: /new class/i }).click()
    await expect(
      page.getByRole('heading', { name: /create school class/i }),
    ).toBeVisible({ timeout: 15000 })
    await page.getByLabel('Name', { exact: true }).fill(name)
    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page).toHaveURL(/school-classes$/, { timeout: 15000 })
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15000 })

    const res = await page.request.post(`${BACKEND_URL}/graphql`, {
      data: { query: '{ schoolClassesByOrgId { id name } }' },
    })
    const body = (await res.json()) as {
      data?: { schoolClassesByOrgId?: { id: string; name: string }[] }
    }
    const match = body.data?.schoolClassesByOrgId?.find((c) => c.name === name)
    if (!match) throw new Error(`E2E: class "${name}" not found after create`)
    return match.id
  }

  const openEdit = async (page: Page, id: string, name: string) => {
    await page.goto(`/en/admin/school-classes/edit/${id}`, {
      waitUntil: 'networkidle',
    })
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible({
      timeout: 15000,
    })
  }

  const saveAndReopen = async (page: Page, id: string, name: string) => {
    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page).toHaveURL(/school-classes$/, { timeout: 15000 })
    await openEdit(page, id, name)
  }

  /**
   * The teachers card. Scoping to it matters: the SuperAdmin impersonation
   * panel lists the same names, so a page-wide text match is ambiguous.
   */
  const teachersCard = (page: Page) =>
    page.getByTestId('teacher-assignments')

  const assignTeacher = async (page: Page, teacherName: string) => {
    await page.getByRole('combobox', { name: /assign teacher/i }).click()
    await page.getByRole('option', { name: teacherName }).click()
    await expect(teachersCard(page).getByText(teacherName)).toBeVisible()
  }

  /** Cleanup via the API — deletion has its own coverage in school-classes.spec. */
  const deleteClass = async (page: Page, id: string) => {
    await page.request.post(`${BACKEND_URL}/graphql`, {
      data: {
        query: 'mutation D($id: ID!) { deleteSchoolClass(id: $id) }',
        variables: { id },
      },
    })
  }

  test('assigns a teacher with a role and workload, and loads it back', async ({
    page,
  }) => {
    await openList(page)
    const teacherName = await ensureTeacher(page)
    const className = `E2E Teachers ${Date.now()}`
    const id = await createClass(page, className)

    await openEdit(page, id, className)
    await assignTeacher(page, teacherName)
    await page.getByRole('spinbutton', { name: /workload/i }).fill('80')

    await saveAndReopen(page, id, className)

    // Persisted, not just echoed back by the form.
    await expect(teachersCard(page).getByText(teacherName)).toBeVisible()
    await expect(
      page.getByRole('spinbutton', { name: /workload/i }),
    ).toHaveValue('80')

    await deleteClass(page, id)
  })

  test('changes the role to assistant and keeps it after reload', async ({
    page,
  }) => {
    await openList(page)
    const teacherName = await ensureTeacher(page)
    const className = `E2E Role ${Date.now()}`
    const id = await createClass(page, className)

    await openEdit(page, id, className)
    await assignTeacher(page, teacherName)

    // The role select defaults to class teacher — switch it.
    await page.getByRole('combobox', { name: /^role$/i }).first().click()
    await page.getByRole('option', { name: /^assistant$/i }).click()

    await saveAndReopen(page, id, className)

    await expect(
      page.getByRole('combobox', { name: /^role$/i }).first(),
    ).toHaveText(/assistant/i, { timeout: 15000 })

    await deleteClass(page, id)
  })

  test('removes a teacher from the class', async ({ page }) => {
    await openList(page)
    const teacherName = await ensureTeacher(page)
    const className = `E2E Remove ${Date.now()}`
    const id = await createClass(page, className)

    await openEdit(page, id, className)
    await assignTeacher(page, teacherName)
    await saveAndReopen(page, id, className)
    await expect(teachersCard(page).getByText(teacherName)).toBeVisible()

    await page.getByRole('button', { name: /remove teacher/i }).click()
    // Counting the remove buttons, not the name: once unassigned the teacher
    // becomes selectable again, so their name reappears inside the "assign"
    // dropdown within the very same card.
    await expect(
      page.getByRole('button', { name: /remove teacher/i }),
    ).toHaveCount(0, { timeout: 10000 })

    await saveAndReopen(page, id, className)
    // Gone for good — the assignment was closed server-side, not just hidden.
    await expect(
      page.getByRole('button', { name: /remove teacher/i }),
    ).toHaveCount(0, { timeout: 15000 })
    // ...and selectable again, which only holds if the row really went away.
    await expect(
      page.getByRole('combobox', { name: /assign teacher/i }),
    ).toBeVisible()

    await deleteClass(page, id)
  })

  test('keeps the teacher when only a plain field changes', async ({ page }) => {
    // Saving the class used to detach its assignments and null their
    // school_class_id, so a rename wiped the teacher — or failed outright.
    await openList(page)
    const teacherName = await ensureTeacher(page)
    const className = `E2E Rename ${Date.now()}`
    const renamed = `${className} v2`
    const id = await createClass(page, className)

    await openEdit(page, id, className)
    await assignTeacher(page, teacherName)
    await saveAndReopen(page, id, className)

    await page.getByLabel('Name', { exact: true }).fill(renamed)
    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page).toHaveURL(/school-classes$/, { timeout: 15000 })

    await openEdit(page, id, renamed)
    await expect(teachersCard(page).getByText(teacherName)).toBeVisible({
      timeout: 15000,
    })

    await deleteClass(page, id)
  })

  test('edits the short code and shows it in the summary', async ({ page }) => {
    await openList(page)
    const className = `E2E Code ${Date.now()}`
    const id = await createClass(page, className)

    await openEdit(page, id, className)
    await page.getByLabel(/short code/i).fill('PRA')
    // The summary reads from form state, so it updates before saving.
    await expect(page.getByText(/PRA/).first()).toBeVisible()

    await saveAndReopen(page, id, className)
    await expect(page.getByLabel(/short code/i)).toHaveValue('PRA')

    await deleteClass(page, id)
  })
})
