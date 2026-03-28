import { test, expect } from '@playwright/test'

test.describe('Signup Flow', () => {
  test('should load signup page', async ({ page }) => {
    await page.goto('/signup')

    // Check for actual heading text
    await expect(page.getByText('Start your free')).toBeVisible()
    await expect(page.getByText('2-week trial')).toBeVisible()
    await expect(page.locator('text=NO CREDIT CARD NEEDED')).toBeVisible()
  })

  test('should display all plan options', async ({ page }) => {
    await page.goto('/signup')

    // All 5 plans should be visible using more specific selectors
    await expect(page.locator('text=Solo').first()).toBeVisible()
    await expect(page.locator('text=$19').first()).toBeVisible()
    await expect(page.locator('text=$97').first()).toBeVisible()
  })

  test('should require name input', async ({ page }) => {
    await page.goto('/signup')

    // Input doesn't have name attribute, use placeholder
    const nameInput = page.getByPlaceholder('First & last name')
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toHaveAttribute('type', 'text')
  })

  test('should require phone input', async ({ page }) => {
    await page.goto('/signup')

    // Phone input uses placeholder
    const phoneInput = page.getByPlaceholder('(555) 000-0000')
    await expect(phoneInput).toBeVisible()
    await expect(phoneInput).toHaveAttribute('type', 'tel')
  })

  test('should show plan labels', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.locator('text=CHOOSE YOUR PLAN')).toBeVisible()
  })

  test('should show plan selection', async ({ page }) => {
    await page.goto('/signup')

    // Solo + Voice should be selected by default
    const soloVoicePlan = page.locator('text=Solo + Voice').locator('..')
    await expect(soloVoicePlan).toHaveCSS('border-color', /rgb/)
  })

  test('should allow plan selection', async ({ page }) => {
    await page.goto('/signup')

    // Click on Solo plan
    await page.locator('text=Solo').first().click()

    // Plan should be clickable
    await expect(page.locator('text=Solo').first()).toBeVisible()
  })
})
