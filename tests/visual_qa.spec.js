// tests/visual_qa.spec.js
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.setTimeout(90000); // 1.5 minutes timeout

test('Visual QA and Screenshot Verification', async ({ page }) => {
  const localUrl = 'http://localhost:8000/';
  const outputDir = 'C:/Users/Hp/.gemini/antigravity/brain/61c27c5d-a94a-41f1-b404-99fcc2a59938/local-screenshots';
  const consoleErrors = [];

  // Track console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Navigating to local site: ${localUrl}`);
  await page.goto(localUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Trigger lazy loading
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve(true);
        }
      }, 50);
    });
  });

  await page.waitForTimeout(2000);

  // 1. Capture screenshots at exact same viewports
  const viewports = [
    { name: 'desktop_1920', width: 1920, height: 1080 },
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'desktop_1366', width: 1366, height: 768 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_375', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    console.log(`Capturing local screenshot at ${vp.width}x${vp.height}...`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(1000);
    const screenshotPath = path.join(outputDir, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${screenshotPath}`);
  }

  // 2. Test Interactivity (Search & Profile Auth UI)
  console.log('Testing search toggling...');
  await page.setViewportSize({ width: 1440, height: 900 });
  
  // Click search icon
  const searchBtn = page.locator('#search-btn');
  await searchBtn.click();
  await page.waitForTimeout(500);
  const searchOverlay = page.locator('#search-overlay');
  await expect(searchOverlay).toHaveClass(/open/);

  // Type in search
  const searchInput = page.locator('#search-input');
  await searchInput.fill('Silk');
  await page.waitForTimeout(500);
  const searchResults = page.locator('#search-results');
  await expect(searchResults).toContainText('Sarees');

  // Close search
  const closeSearch = page.locator('#close-search');
  await closeSearch.click();
  await page.waitForTimeout(500);
  await expect(searchOverlay).not.toHaveClass(/open/);

  // Test Profile Authentication Modal Toggle
  console.log('Testing authentication modal UI...');
  const profileBtn = page.locator('#profile-btn');
  await profileBtn.click();
  await page.waitForTimeout(500);
  const authOverlay = page.locator('#auth-overlay');
  await expect(authOverlay).toHaveClass(/open/);

  // Toggle to signup view
  const goToSignup = page.locator('#go-to-signup');
  await goToSignup.click();
  await page.waitForTimeout(500);
  const signupView = page.locator('#auth-signup-view');
  await expect(signupView).not.toHaveClass(/hidden/);

  // Toggle back to login view
  const goToLogin = page.locator('#go-to-login');
  await goToLogin.click();
  await page.waitForTimeout(500);
  const loginView = page.locator('#auth-login-view');
  await expect(loginView).not.toHaveClass(/hidden/);

  // Close Auth Modal
  const closeAuth = page.locator('#close-auth');
  await closeAuth.click();
  await page.waitForTimeout(500);
  await expect(authOverlay).not.toHaveClass(/open/);

  // Test Shopping Cart Flow
  console.log('Testing shopping cart flow...');
  const addToCartBtn = page.locator('.add-to-cart-btn').first();
  await addToCartBtn.click();
  await page.waitForTimeout(500);
  
  const cartOverlay = page.locator('#cart-drawer-overlay');
  await expect(cartOverlay).toHaveClass(/open/);

  const cartTotalQty = page.locator('#cart-total-qty');
  await expect(cartTotalQty).toContainText('1');

  // Open Checkout View
  const checkoutBtn = page.locator('#cart-checkout-btn');
  await checkoutBtn.click();
  await page.waitForTimeout(500);
  const checkoutView = page.locator('#cart-checkout-view');
  await expect(checkoutView).not.toHaveClass(/hidden/);

  // Close Cart Drawer
  const closeCart = page.locator('#close-cart');
  await closeCart.click();
  await page.waitForTimeout(500);
  await expect(cartOverlay).not.toHaveClass(/open/);

  // Test mobile menu
  console.log('Testing mobile hamburger menu...');
  await page.setViewportSize({ width: 390, height: 844 });
  const menuBtn = page.locator('#menu-btn');
  await menuBtn.click();
  await page.waitForTimeout(500);
  const mobileMenu = page.locator('#mobile-menu');
  await expect(mobileMenu).not.toHaveClass(/translate-x-full/);

  // Close mobile menu by clicking a link
  const homeLink = mobileMenu.locator('a[href="#home"]');
  await homeLink.click();
  await page.waitForTimeout(500);
  await expect(mobileMenu).toHaveClass(/translate-x-full/);

  // 3. Report console errors
  console.log(`Completed testing. Console errors found: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:');
    consoleErrors.forEach(err => console.error(`- ${err}`));
  }
  // Ignore analytic script connection failed or standard external network calls block if any
  const runtimeErrors = consoleErrors.filter(err => !err.includes('firebase') && !err.includes('analytics'));
  expect(runtimeErrors.length).toBe(0);
});
