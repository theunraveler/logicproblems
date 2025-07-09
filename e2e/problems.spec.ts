import { test, expect } from '@playwright/test';

test('visits the problems page', async ({ page }) => {
  await page.goto('/problems');
  await expect(page.locator('h1')).toHaveText('All Problems');
})
