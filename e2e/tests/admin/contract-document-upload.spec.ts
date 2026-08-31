import { test, expect, type Page } from '@playwright/test'
import {
  ensureActiveOrg,
  ensureEmployee,
  signInAsSuperAdmin,
} from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'

/** Smallest byte sequence the endpoint accepts as a contract document. */
const PDF_BYTES = Buffer.from('%PDF-1.4\ntrailer<</Root 1 0 R>>\n%%EOF\n')

const uploadDocument = async (
  page: Page,
  employeeId: string,
  file: { name: string; mimeType: string; buffer: Buffer },
) =>
  page.request.post(
    `${BACKEND_URL}/api/contract-documents?employeeId=${employeeId}`,
    { multipart: { file } },
  )

/**
 * Contract document upload — the authenticated, org-scoped PDF store behind
 * the employee contract form and the onboarding wizard.
 *
 * Regression: every failure mode of this endpoint reached the user as a bare
 * "Internal server error" — a non-UUID employeeId made Postgres reject the
 * parameter cast, and an unconfigured storage bucket threw mid-request. Both
 * now answer with a status the frontend can turn into a real message.
 *
 * Uploaded objects live in object storage, not in the database, so there is no
 * row for the global teardown to find — each test deletes its own file through
 * the endpoint instead.
 */
test.describe('Contract documents — access control', () => {
  test('upload requires authentication', async ({ request }) => {
    const res = await request.post(
      `${BACKEND_URL}/api/contract-documents?employeeId=${crypto.randomUUID()}`,
      { multipart: { file: { name: 'c.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES } } },
    )
    expect(res.status()).toBe(401)
  })

  test('download requires authentication', async ({ request }) => {
    const res = await request.get(
      `${BACKEND_URL}/api/contract-documents/${crypto.randomUUID()}`,
    )
    expect(res.status()).toBe(401)
  })
})

test.describe('Contract documents — upload', () => {
  test('stores a PDF and serves it back to the same organization', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const { employeeId } = await ensureEmployee(page)

    const res = await uploadDocument(page, employeeId, {
      name: 'E2E contract.pdf',
      mimeType: 'application/pdf',
      buffer: PDF_BYTES,
    })
    expect(res.status()).toBe(201)

    const { url, fileId } = (await res.json()) as {
      url: string
      fileId: string
    }
    expect(url).toBe(`/api/contract-documents/${fileId}`)

    const download = await page.request.get(`${BACKEND_URL}${url}`)
    expect(download.status()).toBe(200)
    expect(download.headers()['content-type']).toContain('application/pdf')

    // The object lives in storage, not in a table — clean it up here.
    const removed = await page.request.delete(`${BACKEND_URL}${url}`)
    expect(removed.status()).toBe(200)
  })

  test('rejects a non-PDF with a usable status, not a 500', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    const { employeeId } = await ensureEmployee(page)

    const res = await uploadDocument(page, employeeId, {
      name: 'E2E not-a-contract.png',
      mimeType: 'image/png',
      buffer: Buffer.from('not a pdf'),
    })

    expect(res.status()).toBe(400)
    expect(await res.text()).toContain('Only PDF documents are allowed')
  })

  test('rejects a malformed employeeId with 400 instead of an opaque 500', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const res = await uploadDocument(page, 'not-a-uuid', {
      name: 'E2E contract.pdf',
      mimeType: 'application/pdf',
      buffer: PDF_BYTES,
    })

    expect(res.status()).toBe(400)
    expect(res.status()).not.toBe(500)
  })

  test('answers 404 for a document the organization does not have', async ({
    page,
  }) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)

    const res = await page.request.get(
      `${BACKEND_URL}/api/contract-documents/${crypto.randomUUID()}`,
    )
    expect(res.status()).toBe(404)
  })
})
