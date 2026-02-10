import { test, expect } from '@playwright/test'

test.describe('Health Check', () => {
  test('frontend should be reachable', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBeTruthy()
    // next-intl middleware redirects to a locale prefix
    await expect(page).toHaveURL(/\/(en|de)/)
  })

  test('backend GraphQL endpoint should be reachable', async ({ request }) => {
    const response = await request.post('http://localhost:4001/graphql', {
      data: {
        query: '{ __typename }',
      },
    })
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.data.__typename).toBe('Query')
  })

  test('backend health endpoint should return ok', async ({ request }) => {
    const response = await request.get('http://localhost:4001/api/health')
    expect(response.ok()).toBeTruthy()
  })
})
