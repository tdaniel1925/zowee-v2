import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Pokkit/i)
    await expect(page.locator('text=via text')).toBeVisible()
  })

  test('should display all pricing tiers', async ({ page }) => {
    await page.goto('/')

    // Check for all 5 pricing tiers using role-based selectors
    await expect(page.getByRole('heading', { name: 'Solo', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Family', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solo + Voice' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Family + Voice' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Business' })).toBeVisible()
  })

  test('should show Alexa compatible badge', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('text=Alexa')).toBeVisible()
    await expect(page.locator('text=compatible')).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/')

    await page.click('text=Start for Free')
    await expect(page).toHaveURL(/\/signup/)
  })

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/')

    // Check for FAQ questions instead of heading
    await expect(page.locator('text=Does it work with my phone?')).toBeVisible()
  })
})
