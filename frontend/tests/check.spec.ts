import { test, expect } from '@playwright/test';

test.describe('URL Checker Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/check');
  });

  test('loads without errors', async ({ page }) => {
    await expect(page).not.toHaveTitle(/Error/);
  });

  test('shows input and button', async ({ page }) => {
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button:has-text("Analyze URL")')).toBeVisible();
  });

  test('shows error for empty input', async ({ page }) => {
    await page.click('button:has-text("Analyze URL")');
    await expect(page.locator('text=Please enter a URL to analyze')).toBeVisible();
  });

  test('accepts URL input', async ({ page }) => {
    await page.fill('input[type="text"]', 'https://example.com');
    await expect(page.locator('input[type="text"]')).toHaveValue('https://example.com');
  });
});