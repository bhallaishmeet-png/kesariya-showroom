const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to reference...');
  await page.goto('https://girlsglitters.com/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  
  const output = await page.evaluate(() => {
    const getOuter = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.outerHTML : '';
    };

    const getStyles = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return '';
      const styles = window.getComputedStyle(el);
      return `width: ${el.offsetWidth}px, height: ${el.offsetHeight}px, bg: ${styles.backgroundColor}, color: ${styles.color}, padding: ${styles.padding}, margin: ${styles.margin}`;
    };

    return {
      slideshowHtml: getOuter('#shopify-section-template--17752304943269__slideshow_NKgDfH').slice(0, 1500),
      socialHtml: getOuter('#shopify-section-template--17752304943269__custom_liquid_3phqed'),
      trustHtml: getOuter('#shopify-section-template--17752304943269__custom_liquid_gBgfVm'),
      footerHtml: getOuter('footer').slice(0, 2000),
      navMenuHtml: getOuter('.header__inline-menu') || getOuter('nav')
    };
  });
  
  console.log('SOCIAL HTML:');
  console.log(output.socialHtml);
  
  console.log('TRUST HTML:');
  console.log(output.trustHtml);

  console.log('NAV MENU HTML:');
  console.log(output.navMenuHtml);
  
  await browser.close();
})();
