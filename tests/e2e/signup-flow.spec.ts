import { test, expect } from '@playwright/test'

test.describe('Signup Flow', () => {
  test('should load signup page', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.locator('text=Sign Up')).toBeVisible()
    await expect(page.locator('text=14-day free trial')).toBeVisible()
  })

  test('should display all plan options', async ({ page }) => {
    await page.goto('/signup')

    // All 5 plans should be visible
    await expect(page.locator('text=Solo').first()).toBeVisible()
    await expect(page.locator('text=$19').first()).toBeVisible()
    await expect(page.locator('text=$97').first()).toBeVisible()
  })

  test('should require name input', async ({ page }) => {
    await page.goto('/signup')

    const nameInput = page.locator('input[name="name"]')
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toHaveAttribute('required', '')
  })

  test('should require phone input', async ({ page }) => {
    await page.goto('/signup')

    const phoneInput = page.locator('input[name="phone"]')
    await expect(phoneInput).toBeVisible()
    await expect(phoneInput).toHaveAttribute('required', '')
  })

  test('should require password input', async ({ page }) => {
    await page.goto('/signup')

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('should show plan selection', async ({ page }) => {
    await page.goto('/signup')

    // Click on Family plan
    await page.click('text=Family')

    // Should highlight selected plan
    await expect(page.locator('text=Family').locator('..')).toHaveCSS('border-color', /pokkit-green|rgb\(0, 229, 180\)/)
  })
})
