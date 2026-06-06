# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/login.spec.ts >> Login Flow >> should show magic link button
- Location: tests/auth/login.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /magic link/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: /magic link/i })

```

```yaml
- link "R Restart":
  - /url: "#"
- text: Welcome Sign in with your account
- button "Mit Google anmelden":
  - img
  - text: Mit Google anmelden
- text: or
- tablist:
  - tab "Password" [selected]
  - tab "Magic Link"
- tabpanel "Password":
  - text: Email
  - textbox "Email":
    - /placeholder: name@example.com
  - text: Password
  - link "Forgot password?":
    - /url: "#"
  - textbox "Password"
  - button "Sign in"
- text: By signing in you accept our
- link "Terms of Service":
  - /url: "#"
- text: and
- link "Privacy Policy":
  - /url: "#"
- text: .
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Login Flow', () => {
  4  |   test('should display the sign-in page', async ({ page }) => {
  5  |     await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
  6  |     // Should show the login form with email input (label is "E-Mail")
  7  |     await expect(page.getByRole('textbox', { name: /e-?mail/i })).toBeVisible({ timeout: 15000 })
  8  |   })
  9  | 
  10 |   test('should show magic link button', async ({ page }) => {
  11 |     await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
  12 |     // Should have a button to send the magic link
> 13 |     await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible({ timeout: 15000 })
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  14 |   })
  15 | 
  16 |   test('should reject empty email submission', async ({ page }) => {
  17 |     await page.goto('/en/sign-in', { waitUntil: 'networkidle' })
  18 | 
  19 |     // Wait for the form to be interactive
  20 |     const submitButton = page.getByRole('button', { name: /magic link/i })
  21 |     await expect(submitButton).toBeVisible({ timeout: 15000 })
  22 |     await submitButton.click()
  23 |     // Should not navigate away from sign-in
  24 |     await expect(page).toHaveURL(/sign-in/)
  25 |   })
  26 | })
  27 | 
```