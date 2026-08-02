import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, setupSecondOrgUser, signInAsSuperAdmin } from '../helpers/auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4001'

async function gql(page: Page, query: string, variables?: Record<string, unknown>) {
  const res = await page.request.post(`${BACKEND_URL}/graphql`, {
    data: { query, variables },
  })
  return res.json() as Promise<{
    data?: Record<string, any>
    errors?: { message: string }[]
  }>
}

/**
 * Multi-tenant isolation for the Fortschritte / record-keeping domain: a
 * user in org B must never read or mutate org A's progress settings or
 * lesson records, even by guessing an id. Complements the mock-based
 * multi-tenant unit tests (lesson-records.service.spec.ts,
 * record-keeping-settings.service.spec.ts) with a real cross-session check
 * through the actual GraphQL guard chain.
 */
test.describe('Record keeping — multi-tenant isolation', () => {
  test('org B cannot read org A’s record-keeping settings by switching to org A’s id', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    const orgAId = await ensureActiveOrg(page)

    // Give org A a distinctive, non-default threshold so leakage is
    // unambiguous if the isolation ever breaks.
    await gql(
      page,
      `mutation Update($input: UpdateRecordKeepingSettingsInput!) {
         updateRecordKeepingSettings(input: $input) { introducedStuckDays }
       }`,
      { input: { introducedStuckDays: 7, practicedStuckDays: 8, bigGapDays: 9 } },
    )

    const { page: secondPage, orgId: orgBId } = await setupSecondOrgUser(browser, page)
    expect(orgBId).not.toBe(orgAId)

    // Org B's own settings must be the defaults, not org A's 7/8/9.
    const orgBSettings = await gql(
      secondPage,
      '{ recordKeepingSettings { introducedStuckDays practicedStuckDays bigGapDays } }',
    )
    expect(orgBSettings.data?.recordKeepingSettings?.introducedStuckDays).not.toBe(7)

    // Attempting to switch org B's session into org A must be rejected —
    // org B's user has no membership there.
    const crossSwitch = await secondPage.request.post(`${BACKEND_URL}/api/org/switch`, {
      data: { orgId: orgAId },
    })
    expect(crossSwitch.ok()).toBe(false)

    await secondPage.close()
  })

  test('org B cannot mutate org A’s record-keeping settings', async ({
    page,
    browser,
  }) => {
    await signInAsSuperAdmin(page)
    const orgAId = await ensureActiveOrg(page)
    await gql(
      page,
      `mutation Update($input: UpdateRecordKeepingSettingsInput!) {
         updateRecordKeepingSettings(input: $input) { introducedStuckDays }
       }`,
      { input: { introducedStuckDays: 11, practicedStuckDays: 12, bigGapDays: 13 } },
    )

    const { page: secondPage } = await setupSecondOrgUser(browser, page)

    // Org B writes to ITS OWN active org via the resolver — it has no way to
    // target org A's row (the resolver derives orgId from the session, not
    // from client input), so this mutation must land in org B's row only.
    await gql(
      secondPage,
      `mutation Update($input: UpdateRecordKeepingSettingsInput!) {
         updateRecordKeepingSettings(input: $input) { introducedStuckDays }
       }`,
      { input: { introducedStuckDays: 99, practicedStuckDays: 99, bigGapDays: 99 } },
    )

    const orgAAfter = await gql(
      page,
      '{ recordKeepingSettings { introducedStuckDays } }',
    )
    expect(orgAAfter.data?.recordKeepingSettings?.introducedStuckDays).toBe(11)

    await secondPage.close()
  })
})
