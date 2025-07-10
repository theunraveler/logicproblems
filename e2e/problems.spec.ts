import { test, expect } from '@playwright/test';

test('visits the problems page', async ({ page }) => {
  await page.goto('/problems');
  await expect(page.locator('h1')).toHaveText('All Problems');
})

test('shows all problems', async ({ page }) => {
  await page.goto('/problems');
  await expect(
    page.getByTestId('problems').locator('.card:first-of-type .card-header')
  ).toHaveText('Course Orientation Test');
})

test.describe('filtering by chapter', () => {
  test('shows the correct page title', async ({ page }) => {
    await page.goto('/problems?chapter=4');
    await expect(page.locator('h1')).toHaveText('Chapter Four');
  })
  test('shows only problems in the specified chapter', async ({ page }) => {
    await page.goto('/problems?chapter=4');
    await expect(
      page.getByTestId('problems').locator('.card:first-of-type .card-header')
    ).toHaveText('Chapter Four #1');
  })
})

test('paginates correctly', async ({ page }) => {
  await page.goto('/problems');
  await page.getByTestId('problem-paginator').getByText('2').click();
  await expect(
    page.getByTestId('problems').locator('.card:first-of-type .card-header')
  ).toHaveText('Chapter Three Packet #17');
})
