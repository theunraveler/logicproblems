import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test('visits the contact page', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.locator('h1')).toHaveText('Contact Us');
})

test.describe('submitting the contact form', () => {
  const name = faker.person.firstName();
  const email = faker.internet.email();
  const message = faker.lorem.paragraph();

  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Message').fill(message);
  })

  test.describe('when successful', () => {
    test('resets the form', async ({ page }) => {
      await page.getByRole('button', {name: 'Send'}).click();
      await expect(page.getByLabel('Name')).toHaveValue('');
      await expect(page.getByLabel('Email Address')).toHaveValue('');
      await expect(page.getByLabel('Message')).toHaveValue('');
    })
  })
})
