import { test, expect } from '@playwright/test'

test('visits the contact page', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.locator('h1')).toHaveText('Contact Us')
})
