import { test, expect } from '@playwright/test';

test.describe('Playground Games E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the playground directly
    await page.goto('/play');
    // Ensure the page has loaded by checking the title
    await expect(page).toHaveTitle(/Kiddlr/);
  });

  test('should load the Keyboard Zone by default without crashing', async ({ page }) => {
    // Check if bottom nav has Keyboard highlighted/available
    const keyboardBtn = page.getByLabel('Keyboard');
    await expect(keyboardBtn).toBeVisible();

    // Ensure we have at least one canvas (BackgroundEffects or the main game canvas)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached();
  });

  test('should switch to Draw mode without crashing', async ({ page }) => {
    const btn = page.getByLabel('Draw');
    // Wait for the button to be ready before clicking
    await expect(btn).toBeVisible();
    await btn.click();
    
    // Validate we're still running without page crashes
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached();

    // Ensure the BottomNav highlights Draw (or just doesn't crash)
    await expect(btn).toBeVisible();
  });

  test('should load Bubbles Game without crashing', async ({ page }) => {
    const btn = page.getByLabel('Bubbles');
    await expect(btn).toBeVisible();
    await btn.click();

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached();

    // Wait a brief moment to ensure the countdown initiates without an error
    await page.waitForTimeout(1000);
  });

  test('should load Stars Game without crashing', async ({ page }) => {
    const btn = page.getByLabel('Stars');
    await expect(btn).toBeVisible();
    await btn.click();

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached();

    // Wait a brief moment to ensure the game loop starts
    await page.waitForTimeout(1000);
  });

});
