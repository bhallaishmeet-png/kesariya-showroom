const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Firebase Database Compatibility SDK Script
const fbAuthScript = '<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>';
const fbDbScript = '<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>\n  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>';

if (content.includes(fbAuthScript) && !content.includes('firebase-database-compat.js')) {
  console.log('Inserting Firebase Database compat SDK...');
  content = content.replace(fbAuthScript, fbDbScript);
}

// 2. Add Cart Icon in Header utility row
const profileBtnBlock = `<!-- Profile/Account Trigger Button -->
        <button id="profile-btn" class="text-charcoal hover:text-pink text-base md:text-lg transition" aria-label="Profile Account">
          <i id="profile-icon" class="fa-regular fa-user"></i>
        </button>`;

const profileAndCartBlock = `<!-- Profile/Account Trigger Button -->
        <button id="profile-btn" class="text-charcoal hover:text-pink text-base md:text-lg transition" aria-label="Profile Account">
          <i id="profile-icon" class="fa-regular fa-user"></i>
        </button>

        <!-- Cart Bag Trigger Button -->
        <button id="cart-btn" class="relative text-charcoal hover:text-pink text-base md:text-lg transition" aria-label="Shopping Cart">
          <i class="fa-solid fa-bag-shopping"></i>
          <span id="cart-badge" class="absolute -top-1.5 -right-2 bg-pink text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold hidden">0</span>
        </button>`;

if (content.includes(profileBtnBlock) && !content.includes('id="cart-btn"')) {
  console.log('Inserting Header Cart Trigger Button...');
  content = content.replace(profileBtnBlock, profileAndCartBlock);
}

// 3. Re-map Product Card Buttons: Replace ENQUIRE NOW with ADD TO CART and BUY NOW
// Find the card grids with enquire-btn and replace them dynamically.
// We can use a regex to capture each of the button blocks.
const buttonRegex = /<div class="mt-3">\s*<button class="enquire-btn w-full btn-pill btn-pill-secondary py-2 text-xs" data-product="([^"]+)" data-category="([^"]+)">\s*ENQUIRE NOW\s*<\/button>\s*<\/div>/g;

// Also capture the py-1 variance in fabrics grid
const buttonRegexFabrics = /<div class="mt-3">\s*<button class="enquire-btn w-full btn-pill btn-pill-secondary py-1 text-xs" data-product="([^"]+)" data-category="([^"]+)">\s*ENQUIRE NOW\s*<\/button>\s*<\/div>/g;

let matchCount = 0;
content = content.replace(buttonRegex, (match, product, category) => {
  matchCount++;
  return `<div class="mt-3 flex flex-col space-y-1.5">
              <button class="add-to-cart-btn w-full btn-pill btn-pill-secondary py-1.5 text-[11px]" data-product="${product}" data-category="${category}">
                ADD TO CART
              </button>
              <button class="buy-now-btn w-full btn-pill btn-pill-primary py-1.5 text-[11px]" data-product="${product}" data-category="${category}">
                BUY NOW
              </button>
            </div>`;
});

content = content.replace(buttonRegexFabrics, (match, product, category) => {
  matchCount++;
  return `<div class="mt-3 flex flex-col space-y-1.5">
              <button class="add-to-cart-btn w-full btn-pill btn-pill-secondary py-1.5 text-[11px]" data-product="${product}" data-category="${category}">
                ADD TO CART
              </button>
              <button class="buy-now-btn w-full btn-pill btn-pill-primary py-1.5 text-[11px]" data-product="${product}" data-category="${category}">
                BUY NOW
              </button>
            </div>`;
});

console.log(`Replaced product buttons on ${matchCount} cards.`);

// 4. Insert Cart Drawer and Order Success Modal at the bottom of the body (before scripts block)
const searchOverlayBlock = '<!-- Search Panel Overlay Drawer -->';
const cartDrawerBlock = `<!-- Shopping Cart Drawer (Dawn style: white container, thin borders, black text) -->
  <div id="cart-drawer-overlay" class="fixed inset-0 bg-black/60 z-50 hidden transition duration-300 backdrop-blur-xs flex items-center justify-center">
    <div id="cart-drawer" class="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-gray shadow-2xl flex flex-col justify-between p-6 transform translate-x-full transition-transform duration-300 ease-in-out">
      
      <!-- Drawer Header -->
      <div class="border-b border-gray pb-4 flex justify-between items-center">
        <h3 class="text-lg font-bold uppercase tracking-wider text-charcoal flex items-center">
          <i class="fa-solid fa-bag-shopping mr-2 text-pink"></i>
          <span>Your Cart</span>
        </h3>
        <button id="close-cart" class="text-charcoal hover:text-pink text-2xl focus:outline-none" aria-label="Close Cart">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- VIEW 1: CART ITEMS -->
      <div id="cart-items-view" class="flex-grow overflow-y-auto py-6 space-y-4">
        <!-- Dynamic cart items will load here -->
      </div>

      <!-- VIEW 2: CHECKOUT FORM (Hidden by default) -->
      <div id="cart-checkout-view" class="flex-grow overflow-y-auto py-6 hidden space-y-4">
        <div class="text-center">
          <h4 class="text-sm font-bold uppercase tracking-widest text-charcoal">Delivery Details</h4>
          <p class="text-[11px] text-charcoal-light mt-1">Direct website order placement</p>
        </div>
        <div id="checkout-error" class="hidden text-xs text-red-600 bg-red-50 border border-red-100 p-2 text-center rounded"></div>
        <form id="checkout-form" class="space-y-4">
          <div class="flex flex-col">
            <label for="checkout-name" class="text-[11px] uppercase tracking-wider font-semibold text-charcoal mb-1">Full Name *</label>
            <input type="text" id="checkout-name" required placeholder="Enter name" class="flat-input text-charcoal py-2 px-3 text-sm">
          </div>
          <div class="flex flex-col">
            <label for="checkout-phone" class="text-[11px] uppercase tracking-wider font-semibold text-charcoal mb-1">Phone Number *</label>
            <input type="tel" id="checkout-phone" required placeholder="Enter phone" class="flat-input text-charcoal py-2 px-3 text-sm">
          </div>
          <div class="flex flex-col">
            <label for="checkout-address" class="text-[11px] uppercase tracking-wider font-semibold text-charcoal mb-1">Delivery Address *</label>
            <textarea id="checkout-address" required rows="3" placeholder="Enter full address with pincode" class="flat-input text-charcoal py-2 px-3 text-sm resize-none"></textarea>
          </div>
        </form>
      </div>

      <!-- Drawer Footer Summary & Checkout Actions -->
      <div class="border-t border-gray pt-6 space-y-4">
        
        <!-- Cart Total Summary -->
        <div id="cart-summary" class="flex justify-between items-center text-sm font-bold text-charcoal">
          <span>Total Items:</span>
          <span id="cart-total-qty">0</span>
        </div>

        <div id="cart-actions" class="space-y-2">
          <button id="cart-checkout-btn" class="w-full btn-pill btn-pill-primary py-3 text-xs">
            CHECKOUT
          </button>
          <button id="cart-submit-btn" class="w-full btn-pill btn-pill-primary py-3 text-xs hidden">
            PLACE ORDER
          </button>
          <button id="cart-back-btn" class="w-full btn-pill btn-pill-outline py-3 text-xs hidden bg-white">
            BACK TO CART
          </button>
        </div>

      </div>

    </div>
  </div>

  <!-- Order Success Modal Overlay (Displays direct checkout receipt on site) -->
  <div id="order-success-overlay" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center p-4 backdrop-blur-xs">
    <div class="relative bg-white border border-gray w-full max-w-md p-6 md:p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
      
      <i class="fa-solid fa-circle-check text-green-500 text-6xl"></i>
      
      <div>
        <h3 class="text-xl font-bold uppercase tracking-widest text-charcoal">Order Placed Successfully!</h3>
        <p class="text-xs text-charcoal-light mt-1">Thank you for shopping with Kesariya Saree Showroom</p>
      </div>

      <!-- Receipt summary box -->
      <div class="w-full border-t border-b border-gray py-4 text-xs text-left space-y-1.5 text-charcoal-light">
        <p><strong class="text-charcoal">Order ID:</strong> <span id="receipt-order-id" class="font-bold text-pink"></span></p>
        <p><strong class="text-charcoal">Customer:</strong> <span id="receipt-name"></span></p>
        <p><strong class="text-charcoal">Phone:</strong> <span id="receipt-phone"></span></p>
        <p><strong class="text-charcoal">Items:</strong> <span id="receipt-items" class="font-semibold text-charcoal"></span></p>
      </div>

      <p class="text-xs text-charcoal-light">
        We will contact you shortly to confirm shipping details.
      </p>

      <button id="close-success-modal" class="w-full btn-pill btn-pill-primary py-3 text-xs">
        CONTINUE SHOPPING
      </button>

    </div>
  </div>

  <!-- Search Panel Overlay Drawer -->`;

if (!content.includes('id="cart-drawer"')) {
  console.log('Inserting Cart Drawer and Success Overlay markup...');
  content = content.replace(searchOverlayBlock, cartDrawerBlock);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('HTML updates completed successfully.');
