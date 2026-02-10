import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should display the sign-in page', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
    // Should show the login form with email input (label is "E-Mail")
    await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({ timeout: 15000 })
  })

  test('should show magic link button', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
    // Should have a button to send the magic link
    await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible({ timeout: 15000 })
  })

  test('should reject empty email submission', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' })

    // Wait for the form to be interactive
    const submitButton = page.getByRole('button', { name: /magic link/i })
    await expect(submitButton).toBeVisible({ timeout: 15000 })
    await submitButton.click()
    // Should not navigate away from sign-in
    await expect(page).toHaveURL(/sign-in/)
  })
})
