import { test, expect } from '@playwright/test'

test('visits the about page', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('h1')).toHaveText('Solve Propositional Logic Problems Online!')
})
