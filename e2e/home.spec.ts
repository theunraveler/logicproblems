import { test, expect } from '@playwright/test';

test('visits the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Solve Propositional Logic Problems Online!');
})
