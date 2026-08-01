import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'

/**
 * Progress-entry page ("Fortschritts-Eintragung", PR3 of the RecordKeeping
 * attachments feature): pick a lesson, pick children, set a status, save.
 *
 * A fresh CI database has no curriculum, school class or students, so the
 * fixture builds the minimal chain (curriculum → level → AREA/LESSON nodes,
 * school class, one student, one active enrollment) directly through
 * GraphQL — mirrors the `ensureTeacher` pattern in helpers/auth.ts rather
 * than walking multiple admin wizards just to reach the page under test.
 */
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

async function seedRecordingFixture(page: Page) {
  const stamp = Date.now()

  const curriculum = await gql(
    page,
    `mutation Create($input: CreateCurriculumInput!) {
       createCurriculum(input: $input) { id }
     }`,
    {
      input: {
        slug: `e2e-curriculum-${stamp}`,
        translations: [{ locale: 'DE', name: `E2E Curriculum ${stamp}` }],
      },
    },
  )
  const curriculumId = curriculum.data?.createCurriculum?.id
  if (!curriculumId) {
    throw new Error(
      `E2E fixture: could not create curriculum — ${JSON.stringify(curriculum.errors)}`,
    )
  }

  const level = await gql(
    page,
    `mutation Create($input: CreateCurriculumLevelInput!) {
       createCurriculumLevel(input: $input) { id }
     }`,
    {
      input: {
        curriculumId,
        slug: `e2e-level-${stamp}`,
        translations: [{ locale: 'DE', name: `E2E Level ${stamp}` }],
      },
    },
  )
  const levelId = level.data?.createCurriculumLevel?.id
  if (!levelId) {
    throw new Error(
      `E2E fixture: could not create curriculum level — ${JSON.stringify(level.errors)}`,
    )
  }

  const area = await gql(
    page,
    `mutation Create($input: CreateCurriculumNodeInput!) {
       createCurriculumNode(input: $input) { id }
     }`,
    {
      input: {
        curriculumId,
        levelId,
        nodeType: 'AREA',
        translations: [{ locale: 'DE', name: `E2E Bereich ${stamp}` }],
      },
    },
  )
  const areaId = area.data?.createCurriculumNode?.id
  if (!areaId) {
    throw new Error(
      `E2E fixture: could not create AREA node — ${JSON.stringify(area.errors)}`,
    )
  }

  const lessonName = `E2E Lektion ${stamp}`
  const lesson = await gql(
    page,
    `mutation Create($input: CreateCurriculumNodeInput!) {
       createCurriculumNode(input: $input) { id }
     }`,
    {
      input: {
        curriculumId,
        levelId,
        parentId: areaId,
        nodeType: 'LESSON',
        translations: [{ locale: 'DE', name: lessonName }],
      },
    },
  )
  const lessonId = lesson.data?.createCurriculumNode?.id
  if (!lessonId) {
    throw new Error(
      `E2E fixture: could not create LESSON node — ${JSON.stringify(lesson.errors)}`,
    )
  }

  const schoolClassName = `E2E Klasse ${stamp}`
  const schoolClass = await gql(
    page,
    `mutation Create($input: CreateSchoolClassInput!) {
       createSchoolClass(input: $input) { id }
     }`,
    { input: { name: schoolClassName } },
  )
  const schoolClassId = schoolClass.data?.createSchoolClass?.id
  if (!schoolClassId) {
    throw new Error(
      `E2E fixture: could not create school class — ${JSON.stringify(schoolClass.errors)}`,
    )
  }

  const studentFirstName = 'E2E'
  const studentLastName = `Student${stamp}`
  const student = await gql(
    page,
    `mutation Create($input: CreateStudentInput!) {
       createStudent(input: $input) { id }
     }`,
    { input: { firstName: studentFirstName, lastName: studentLastName } },
  )
  const studentId = student.data?.createStudent?.id
  if (!studentId) {
    throw new Error(
      `E2E fixture: could not create student — ${JSON.stringify(student.errors)}`,
    )
  }

  const enrollment = await gql(
    page,
    `mutation Create($input: CreateSchoolClassEnrollmentInput!) {
       createEnrollment(input: $input) { id }
     }`,
    {
      input: {
        studentId,
        schoolClassId,
        enrolledAt: new Date().toISOString().slice(0, 10),
      },
    },
  )
  if (!enrollment.data?.createEnrollment?.id) {
    throw new Error(
      `E2E fixture: could not create enrollment — ${JSON.stringify(enrollment.errors)}`,
    )
  }

  return { schoolClassId, schoolClassName, lessonName, studentFirstName, studentLastName }
}

test.describe('Progress entry — happy path and validation', () => {
  test('records a lesson for a selected child, and blocks submit without children', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const fixture = await seedRecordingFixture(page)

    await page.goto(
      `/en/admin/record-keeping?classId=${fixture.schoolClassId}`,
      { waitUntil: 'networkidle' },
    )
    await expect(
      page.getByRole('heading', { name: /progress entry/i, level: 1 }),
    ).toBeVisible({ timeout: 15000 })

    // --- Negative case: submit without selecting any child -----------------
    await page
      .getByRole('combobox', { name: /lesson/i })
      .click()
    await page.getByRole('option', { name: fixture.lessonName }).click()

    await page.getByRole('button', { name: /^record$/i }).click()
    await expect(
      page.getByText(/select at least one (student|child)/i),
    ).toBeVisible({ timeout: 10000 })

    // --- Happy path: select the seeded child, save -------------------------
    await page
      .getByRole('button', {
        name: new RegExp(`${fixture.studentFirstName}.*${fixture.studentLastName}`, 'i'),
      })
      .click()

    await page.getByRole('button', { name: /^record$/i }).click()

    await expect(page.getByText(/saved|recorded/i).first()).toBeVisible({
      timeout: 15000,
    })

    // Sidebar "Recently recorded" reflects the just-created entry.
    await expect(
      page.getByText(fixture.lessonName).first(),
    ).toBeVisible({ timeout: 15000 })
  })
})
