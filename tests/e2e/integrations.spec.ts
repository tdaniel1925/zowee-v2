import { test, expect } from '@playwright/test'

test.describe('Integrations Page', () => {
  test.skip('should display Alexa integration', async ({ page }) => {
    // Skip: Requires authentication
    await page.goto('/account/integrations')

    await expect(page.locator('text=Amazon Alexa')).toBeVisible()
    await expect(page.locator('text=Control your smart home devices')).toBeVisible()
  })

  test.skip('should show Alexa logo', async ({ page }) => {
    // Skip: Requires authentication
    await page.goto('/account/integrations')

    // Check for Alexa SVG logo
    const alexaLogo = page.locator('svg').first()
    await expect(alexaLogo).toBeVisible()
  })

  test.skip('should have Link Alexa button', async ({ page }) => {
    // Skip: Requires authentication
    await page.goto('/account/integrations')

    await expect(page.locator('text=Link Amazon Alexa')).toBeVisible()
  })

  test.skip('should show smart home examples', async ({ page }) => {
    // Skip: Requires authentication
    await page.goto('/account/integrations')

    await expect(page.locator('text=Turn off living room lights')).toBeVisible()
    await expect(page.locator('text=Set thermostat')).toBeVisible()
  })
})
