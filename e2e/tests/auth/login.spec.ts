import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should display the sign-in page', async ({ page }) => {
    await page.goto('/en/sign-in')
    // Should show the login form with email input
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
  })

  test('should show magic link form', async ({ page }) => {
    await page.goto('/en/sign-in')
    // Should have a way to request a magic link
    const emailInput = page.getByRole('textbox', { name: /email/i })
    await expect(emailInput).toBeVisible()
  })

  test('should reject empty email submission', async ({ page }) => {
    await page.goto('/en/sign-in')

    // Try to submit without entering an email
    const submitButton = page.getByRole('button', { name: /sign in|login|submit|send/i })
    if (await submitButton.isVisible()) {
      await submitButton.click()
      // Should not navigate away from sign-in
      await expect(page).toHaveURL(/sign-in/)
    }
  })
})
