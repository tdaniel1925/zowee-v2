import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Pokkit/i)
    await expect(page.locator('text=via text')).toBeVisible()
  })

  test('should display all pricing tiers', async ({ page }) => {
    await page.goto('/')

    // Check for all 5 pricing tiers
    await expect(page.locator('text=Solo')).toBeVisible()
    await expect(page.locator('text=Family')).toBeVisible()
    await expect(page.locator('text=Solo + Voice')).toBeVisible()
    await expect(page.locator('text=Family + Voice')).toBeVisible()
    await expect(page.locator('text=Business')).toBeVisible()
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

    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible()
  })
})
