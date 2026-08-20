const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to reference...');
  await page.goto('https://girlsglitters.com/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  
  // Set to desktop 1440
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  
  const slideshow = await page.evaluate(() => {
    const el = document.querySelector('#shopify-section-template--17752304943269__slideshow_NKgDfH') || document.querySelector('[id*="slideshow"]');
    if (!el) return 'No slideshow found';
    
    const rect = el.getBoundingClientRect();
    const slides = Array.from(el.querySelectorAll('.slideshow__slide, [class*="slide"]'));
    
    return {
      id: el.id,
      className: el.className,
      rectWidth: rect.width,
      rectHeight: rect.height,
      slidesCount: slides.length,
      slidesDetails: slides.map((slide, i) => {
        const img = slide.querySelector('img');
        const heading = slide.querySelector('h2, h1, [class*="heading"]');
        const text = slide.querySelector('p, [class*="text"]');
        const button = slide.querySelector('a, button');
        
        const box = slide.querySelector('.slideshow__text-box, [class*="text-box"], [class*="content"]');
        const boxStyle = box ? window.getComputedStyle(box) : null;
        
        return {
          index: i,
          imgSrc: img ? img.src : '',
          heading: heading ? heading.innerText.trim() : '',
          text: text ? text.innerText.trim() : '',
          buttonText: button ? button.innerText.trim() : '',
          boxAlign: boxStyle ? boxStyle.textAlign : '',
          boxBg: boxStyle ? boxStyle.backgroundColor : ''
        };
      })
    };
  });
  
  console.log('SLIDESHOW SPECS:');
  console.log(JSON.stringify(slideshow, null, 2));
  
  await browser.close();
})();
