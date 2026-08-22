// tests/admin_system.spec.js
import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test('Security Route Protection - Unauthorized Admin Access Redirects to Home', async ({ page }) => {
  const adminUrl = 'http://localhost:8000/admin';
  console.log(`Navigating directly to protected route: ${adminUrl}`);
  
  await page.goto(adminUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Loading overlay should be visible
  const loadingOverlay = page.locator('#auth-loading-overlay');
  await expect(loadingOverlay).toBeVisible();

  // Wait for auth check redirect to trigger
  await page.waitForTimeout(3000);

  // Should automatically redirect back to the home storefront page
  const currentUrl = page.url();
  console.log(`Redirected to: ${currentUrl}`);
  expect(currentUrl).toBe('http://localhost:8000/');
});

test('Security Route Protection - Unauthorized Owner Access Redirects', async ({ page }) => {
  const adminsUrl = 'http://localhost:8000/admin/admins';
  console.log(`Navigating directly to protected route: ${adminsUrl}`);
  
  await page.goto(adminsUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Loading overlay should be visible
  const loadingOverlay = page.locator('#auth-loading-overlay');
  await expect(loadingOverlay).toBeVisible();

  // Wait for redirect to trigger
  await page.waitForTimeout(3000);

  // Should redirect back to home storefront page (due to unauthenticated status)
  const currentUrl = page.url();
  console.log(`Redirected to: ${currentUrl}`);
  expect(currentUrl).toBe('http://localhost:8000/');
});
