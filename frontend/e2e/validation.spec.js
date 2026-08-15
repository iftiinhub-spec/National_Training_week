import { expect, test } from '@playwright/test';

test.describe('browser validation and access safety', () => {
  test('participant registration explains an invalid full name', async ({ page }) => {
    await page.goto('/signup');

    await page.getByPlaceholder('e.g. Abdi Mohamed Hassan').fill('...........................');
    await page.getByPlaceholder('abdi@example.com').fill(`invalid-name-${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill('Participant123!');
    await page.locator('input[name="confirmPassword"]').fill('Participant123!');
    await page.getByPlaceholder('Phone number').fill('612345678');
    await page.locator('select[name="gender"]').selectOption('male');
    await page.locator('select[name="region"]').selectOption('Banaadir');
    await page.locator('select[name="participantType"]').selectOption('general_public');
    await page.locator('input[name="profession"]').fill('Student');

    const registrationResponse = page.waitForResponse((response) => response.url().includes('/api/auth/register'));
    await page.getByRole('button', { name: 'Complete Registration' }).click();
    const response = await registrationResponse;
    const payload = await response.json();

    expect(response.status()).toBe(400);
    expect(payload.message).toMatch(/^Full name: Enter a valid name using letters/i);
    await expect(page.getByText(/Full name: Enter a valid name using letters/i)).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('contact form identifies the invalid name field', async ({ page }) => {
    await page.goto('/contact');
    await page.getByPlaceholder('Your full name').fill('...........');
    await page.getByPlaceholder('your@email.com').fill('browser-test@example.com');
    await page.getByPlaceholder('e.g. Registration inquiry').fill('Registration question');
    await page.getByPlaceholder('Write your message here...').fill('This is a non-destructive browser validation test.');

    const contactResponse = page.waitForResponse((response) => response.url().includes('/api/public/contact'));
    await page.getByRole('button', { name: /Send Message/i }).click();
    const response = await contactResponse;
    const payload = await response.json();

    expect(response.status()).toBe(400);
    expect(payload.message).toMatch(/^Name: Enter a valid name using letters/i);
    await expect(page.getByText(/Name: Enter a valid name using letters/i)).toBeVisible();
    await expect(page.getByPlaceholder('Your full name')).toHaveValue('...........');
  });

  test('anonymous visitor is redirected away from protected admin pages', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole('heading', { name: /Sign In to National Training Week/i })).toBeVisible();
  });

  test('public pages render without browser errors or failed API responses', async ({ page }) => {
    const pageErrors = [];
    const failedApiResponses = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() >= 500) {
        failedApiResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    for (const route of ['/', '/about', '/trainings', '/contact', '/faq']) {
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
    expect(failedApiResponses).toEqual([]);
  });
});
