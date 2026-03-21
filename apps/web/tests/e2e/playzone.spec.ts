import { test, expect } from '@playwright/test';

test.describe('KiddoTaps Play Zone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display keyboard zone by default', async ({ page }) => {
    // Check if keyboard container exists (using a data-testid or class)
    await expect(page.locator('.bg-sky-900')).toBeVisible();
  });

  test('should switch to drawing mode', async ({ page }) => {
    await page.click('button[aria-label="Draw"]');
    await expect(page.locator('.bg-neutral-900')).toBeVisible();
  });

  test('should switch to bubble game', async ({ page }) => {
    await page.click('button[aria-label="Bubbles"]');
    await expect(page.getByText('Coming Soon')).toBeVisible();
  });
});

test.describe('Parent Portal', () => {
  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
