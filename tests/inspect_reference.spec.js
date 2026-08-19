// tests/inspect_reference.spec.js
import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.setTimeout(120000); // 2 minutes timeout for the single test run

test('Visual Inspection and Specs Extraction', async ({ page }) => {
  const targetUrl = 'https://girlsglitters.com/';
  const outputDir = 'C:/Users/Hp/.gemini/antigravity/brain/61c27c5d-a94a-41f1-b404-99fcc2a59938/reference-screenshots';
  const dataFile = 'C:/Users/Hp/.gemini/antigravity/brain/61c27c5d-a94a-41f1-b404-99fcc2a59938/reference_specs.json';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Navigating to Girls Glitters homepage...');
  // Go to page once
  await page.goto(targetUrl, { waitUntil: 'commit', timeout: 60000 });
  
  // Wait for body to be visible
  await page.waitForSelector('body', { timeout: 30000 });
  
  // Wait for resources to load
  await page.waitForTimeout(5000);

  // Slow scroll to load lazy-loaded elements
  console.log('Scrolling page to trigger lazy loaded items...');
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

  // 1. Capture screenshots for each viewport using the SAME page context
  const viewports = [
    { name: 'desktop_1920', width: 1920, height: 1080 },
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'desktop_1366', width: 1366, height: 768 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_375', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    console.log(`Setting viewport to ${vp.width}x${vp.height} and capturing screenshot...`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(1000); // let layout adjust
    const screenshotPath = path.join(outputDir, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved screenshot: ${screenshotPath}`);
  }

  // 2. Extract DOM Structure and computed styles
  console.log('Extracting styles and measurements...');
  const specs = await page.evaluate(() => {
    const getStyles = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tagName: el.tagName,
        width: rect.width,
        height: rect.height,
        backgroundColor: style.backgroundColor,
        color: style.color,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        padding: style.padding,
        margin: style.margin,
        borderRadius: style.borderRadius,
        border: style.border,
        display: style.display,
        justifyContent: style.justifyContent,
        alignItems: style.alignItems,
        flexDirection: style.flexDirection,
        gap: style.gap
      };
    };

    const getCardSpecs = (gridSelector, cardSelector) => {
      const grid = document.querySelector(gridSelector);
      const card = document.querySelector(cardSelector);
      if (!card) return null;
      const cardStyle = window.getComputedStyle(card);
      const cardRect = card.getBoundingClientRect();
      const img = card.querySelector('img');
      const imgStyle = img ? window.getComputedStyle(img) : null;
      const title = card.querySelector('h3, h2, a[class*="title"], div[class*="title"]');
      const titleStyle = title ? window.getComputedStyle(title) : null;
      
      return {
        gridDisplay: grid ? window.getComputedStyle(grid).display : null,
        gridGap: grid ? window.getComputedStyle(grid).gap : null,
        gridColumns: grid ? window.getComputedStyle(grid).gridTemplateColumns : null,
        cardWidth: cardRect.width,
        cardHeight: cardRect.height,
        cardPadding: cardStyle.padding,
        cardBorderRadius: cardStyle.borderRadius,
        cardBorder: cardStyle.border,
        imageAspect: img ? (img.naturalWidth / img.naturalHeight || 'custom') : null,
        imageObjectFit: imgStyle ? imgStyle.objectFit : null,
        titleFont: titleStyle ? titleStyle.fontFamily : null,
        titleSize: titleStyle ? titleStyle.fontSize : null,
        titleWeight: titleStyle ? titleStyle.fontWeight : null,
        titleColor: titleStyle ? titleStyle.color : null
      };
    };

    return {
      global: {
        body: getStyles('body'),
        html: getStyles('html')
      },
      announcementBar: getStyles('.announcement-bar') || getStyles('[class*="announcement-bar"]'),
      header: getStyles('header.header') || getStyles('.header') || getStyles('[class*="header"]'),
      navigation: getStyles('.header__inline-menu') || getStyles('nav') || getStyles('[class*="navigation"]'),
      navLink: getStyles('.header__menu-item') || getStyles('nav a') || getStyles('[class*="nav-link"]'),
      hero: getStyles('.banner') || getStyles('[class*="hero"]') || getStyles('[class*="banner"]'),
      heroHeading: getStyles('.banner__heading') || getStyles('[class*="hero"] h1') || getStyles('[class*="banner"] h2'),
      heroButton: getStyles('.banner__buttons a') || getStyles('[class*="hero"] a') || getStyles('[class*="banner"] a'),
      productGrid: getCardSpecs('.grid--4-col-desktop', '.card-wrapper') || getCardSpecs('[class*="grid"]', '[class*="card"]'),
      footer: getStyles('footer') || getStyles('[class*="footer"]')
    };
  });

  fs.writeFileSync(dataFile, JSON.stringify(specs, null, 2));
  console.log(`Saved specifications: ${dataFile}`);
});
