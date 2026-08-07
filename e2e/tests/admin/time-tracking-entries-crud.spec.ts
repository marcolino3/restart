import { test, expect, type Page } from '@playwright/test'
import {
  ensureActiveOrg,
  signInAsSuperAdmin,
  setupSecondOrgUser,
} from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'
const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL ?? 'marco@marranchelli.com'

/**
 * CRUD-Flow für Zeiteinträge: create/update/delete + Duplikat-Tag-Regel
 * (max. ein aktiver Eintrag pro Mitarbeiter/Tag) und Multi-Tenant-Isolation.
 */

const gql = async <T>(
  page: Page,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> => {
  const res = await page.request.post(`${BACKEND_URL}/graphql`, {
    data: { query, variables },
  })
  const json = (await res.json()) as {
    data?: T
    errors?: { message: string }[]
  }
  if (json.errors?.length) {
    throw new Error(`GraphQL: ${json.errors[0].message}`)
  }
  if (!json.data) throw new Error('GraphQL: empty data')
  return json.data
}

const gqlExpectError = async (
  page: Page,
  query: string,
  variables?: Record<string, unknown>,
): Promise<string> => {
  const res = await page.request.post(`${BACKEND_URL}/graphql`, {
    data: { query, variables },
  })
  const json = (await res.json()) as { errors?: { message: string }[] }
  if (!json.errors?.length) {
    throw new Error('Expected GraphQL error but request succeeded')
  }
  return json.errors[0].message
}

const ensureSelfEmployee = async (page: Page): Promise<string> => {
  const data = await gql<{ myEmployeeId: string | null }>(
    page,
    `{ myEmployeeId }`,
  )
  if (data.myEmployeeId) {
    await gql(
      page,
      `mutation UpdateEmployee($input: UpdateEmployeeInput!) {
        updateEmployee(updateEmployeeInput: $input) { id }
      }`,
      { input: { id: data.myEmployeeId, timeTrackingEnabled: true } },
    )
    return data.myEmployeeId
  }

  const created = await gql<{ createEmployee: { id: string } }>(
    page,
    `mutation CreateEmployee($input: CreateEmployeeInput!) {
      createEmployee(createEmployeeInput: $input) { id }
    }`,
    {
      input: {
        firstName: 'E2E',
        lastName: 'CRUD',
        email: SUPERADMIN_EMAIL,
        persona: 'ADMIN',
        timeTrackingEnabled: true,
      },
    },
  )
  return created.createEmployee.id
}

const uniqueDate = (offsetDays: number) => {
  const d = new Date('2032-03-01T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

const CreateDoc = `mutation CreateTimeTracking($input: CreateTimeTrackingInput!) {
  createTimeTracking(input: $input) { id workMinutes breakMinutes }
}`
const UpdateDoc = `mutation UpdateTimeTracking($input: UpdateTimeTrackingInput!) {
  updateTimeTracking(input: $input) { id workMinutes notes }
}`
const DeleteDoc = `mutation DeleteTimeTracking($id: ID!) {
  deleteTimeTracking(id: $id)
}`
const FindOneDoc = `query TimeTrackingById($id: ID!) {
  timeTrackingById(id: $id) { id notes }
}`

test.describe('Time tracking entries — CRUD + duplicate-day guard', () => {
  test('creates, updates, and deletes an entry', async ({ page }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const employeeId = await ensureSelfEmployee(page)
    const stamp = Date.now()
    const date = uniqueDate(stamp % 1000)

    const created = await gql<{
      createTimeTracking: { id: string; workMinutes: number }
    }>(page, CreateDoc, {
      input: {
        employeeId,
        startedAt: `${date}T08:00:00.000Z`,
        endedAt: `${date}T16:30:00.000Z`,
        breakMinutes: 30,
      },
    })
    expect(created.createTimeTracking.id).toBeTruthy()
    expect(created.createTimeTracking.workMinutes).toBe(8 * 60)

    const updated = await gql<{
      updateTimeTracking: { id: string; notes: string | null }
    }>(page, UpdateDoc, {
      input: { id: created.createTimeTracking.id, notes: 'E2E updated' },
    })
    expect(updated.updateTimeTracking.notes).toBe('E2E updated')

    await gql(page, DeleteDoc, { id: created.createTimeTracking.id })

    const afterDeleteError = await gqlExpectError(page, FindOneDoc, {
      id: created.createTimeTracking.id,
    })
    expect(afterDeleteError).toMatch(/not found/i)
  })

  test('rejects a second active entry for the same employee/day', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const employeeId = await ensureSelfEmployee(page)
    const stamp = Date.now()
    const date = uniqueDate((stamp % 1000) + 300)

    await gql(page, CreateDoc, {
      input: {
        employeeId,
        startedAt: `${date}T08:00:00.000Z`,
        endedAt: `${date}T12:00:00.000Z`,
      },
    })

    const error = await gqlExpectError(page, CreateDoc, {
      input: {
        employeeId,
        startedAt: `${date}T13:00:00.000Z`,
        endedAt: `${date}T17:00:00.000Z`,
      },
    })
    expect(error).toMatch(/TIME_TRACKING_DUPLICATE_DAY/)
  })

  test('rejects reading a time entry that belongs to a different organization', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const employeeId = await ensureSelfEmployee(page)
    const stamp = Date.now()
    const date = uniqueDate((stamp % 1000) + 600)

    const created = await gql<{ createTimeTracking: { id: string } }>(
      page,
      CreateDoc,
      {
        input: {
          employeeId,
          startedAt: `${date}T08:00:00.000Z`,
          endedAt: `${date}T16:00:00.000Z`,
        },
      },
    )

    const { page: otherOrgPage } = await setupSecondOrgUser(browser, page)
    try {
      const res = await otherOrgPage.request.post(`${BACKEND_URL}/graphql`, {
        data: { query: FindOneDoc, variables: { id: created.createTimeTracking.id } },
      })
      const json = (await res.json()) as { errors?: { message: string }[] }
      expect(json.errors?.length).toBeGreaterThan(0)
      expect(json.errors?.[0].message).toMatch(/not found/i)
    } finally {
      await otherOrgPage.context().close()
    }
  })
})
