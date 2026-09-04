import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads without errors', async ({ page }) => {
    await expect(page).not.toHaveTitle(/Error/);
  });

  test('shows hero section with title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Understand phishing');
  });

  test('shows navigation links', async ({ page }) => {
    await expect(page.locator('nav')).toContainText('Check Website');
    await expect(page.locator('nav')).toContainText('Learn');
    await expect(page.locator('nav')).toContainText('Pattern Learning');
    await expect(page.locator('nav')).toContainText('Simulator');
  });

  test('navigates to check page', async ({ page }) => {
    await page.click('text=Check Website');
    await expect(page).toHaveURL(/\/check/);
  });

  test('navigates to learn page', async ({ page }) => {
    await page.click('text=Learn');
    await expect(page).toHaveURL(/\/learn/);
  });

  test('navigates to patterns page', async ({ page }) => {
    await page.click('text=Pattern Learning');
    await expect(page).toHaveURL(/\/patterns/);
  });

  test('navigates to simulator page', async ({ page }) => {
    await page.click('text=Simulator');
    await expect(page).toHaveURL(/\/simulator/);
  });
});