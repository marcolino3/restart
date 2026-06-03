import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should display the sign-in page', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
    // Default tab is the email/password form; its email input must be visible.
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({ timeout: 15000 })
  })

  test('should show magic link button', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
    // The magic-link form lives behind the "Magic Link" tab and is only mounted
    // once that tab is active.
    await page.getByRole('tab', { name: /magic link/i }).click()
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible({ timeout: 15000 })
  })

  test('should reject empty email submission', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: /magic link/i }).click()

    const submitButton = page.getByRole('button', { name: /send magic link/i })
    await expect(submitButton).toBeVisible({ timeout: 15000 })
    await submitButton.click()
    // Client-side validation rejects the empty email; we stay on the sign-in page.
    await expect(page).toHaveURL(/sign-in/)
  })
})
