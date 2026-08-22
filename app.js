/* app.js - Kesariya Saree Showroom storefront logic with Firestore Cart & Admin integration */

document.addEventListener('DOMContentLoaded', () => {
  // --- Firebase Configuration & Initialization ---
  const firebaseConfig = {
    apiKey: "AIzaSyDTVaNtEa_B82yoHNAEXRjmFDiJxpUK40w",
    authDomain: "kesariya-saree.firebaseapp.com",
    projectId: "kesariya-saree",
    storageBucket: "kesariya-saree.firebasestorage.app",
    messagingSenderId: "708874732554",
    appId: "1:708874732554:web:1c2e72ba49249dbbfc4bf3",
    measurementId: "G-YQ1X1XCKGR"
  };

  let auth = null;
  let db = null;
  let firebaseLoaded = false;

  if (typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      firebaseLoaded = true;
      console.log('Firebase initialized successfully (Firestore mode active).');
    } catch (err) {
      console.error('Firebase initialization error:', err);
    }
  } else {
    console.warn('Firebase SDK not found. Offline simulation active.');
  }

  // --- Storefront Static Catalog (Fallback & Auto-population) ---
  const fallbackCatalog = [
    // SAREES
    { name: 'Premium Banarasi Saree', category: 'Sarees', price: 8500, stock: 15, description: 'Rich woven silk with traditional gold zari border detailing.', coverImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Designer Silk Saree', category: 'Sarees', price: 6200, stock: 20, description: 'Classic traditional pure handloom silk saree drape.', coverImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Festive Saree', category: 'Sarees', price: 4500, stock: 12, description: 'Traditional weave highlighting ceremonial colors.', coverImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Premium Georgette Saree', category: 'Sarees', price: 5800, stock: 8, description: 'Soft and fluid premium georgette saree.', coverImage: 'https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Designer Party Wear Saree', category: 'Sarees', price: 9200, stock: 10, description: 'Bespoke modern saree featuring delicate styling accents.', coverImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Traditional Silk Saree', category: 'Sarees', price: 7500, stock: 14, description: 'Fluid and glamorous saree designed for social gatherings.', coverImage: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Premium Cotton Saree', category: 'Sarees', price: 3200, stock: 25, description: 'Breathable handloom daily wear cotton saree.', coverImage: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Bridal Printed Saree', category: 'Sarees', price: 11500, stock: 5, description: 'Beautiful printed patterns on rich bridal fabric.', coverImage: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    
    // SUITS
    { name: 'Designer Suit', category: 'Suits', price: 4200, stock: 15, description: 'Grand matching ethnic salwar suit with premium detailing.', coverImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Party Wear Suit', category: 'Suits', price: 3800, stock: 18, description: 'Sophisticated style set featuring elegant embroidery details.', coverImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Anarkali Suit', category: 'Suits', price: 5500, stock: 10, description: 'Flowy flared traditional suit with matching dupatta.', coverImage: 'https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Salwar Suit', category: 'Suits', price: 2900, stock: 22, description: 'Classic comfortable unstitched/semi-stitched traditional suit.', coverImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Festive Suit', category: 'Suits', price: 4800, stock: 12, description: 'Rich embroidery design suit for ceremonies.', coverImage: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Punjabi Suit', category: 'Suits', price: 3400, stock: 14, description: 'Comfortable patiala style traditional Punjabi suit.', coverImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    
    // FABRICS
    { name: 'Premium Suit Fabric', category: 'Fabrics', price: 1800, stock: 30, description: 'Fine thread counts suit material for bespoke styling.', coverImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Designer Fabric', category: 'Fabrics', price: 2500, stock: 25, description: 'Detailed brocade or sequence fabric for blouses/dresses.', coverImage: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Cotton Fabric', category: 'Fabrics', price: 950, stock: 50, description: 'Soft and high-quality pure cotton by the meter.', coverImage: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Printed Fabric', category: 'Fabrics', price: 1200, stock: 40, description: 'Bespoke pattern print fabrics by the meter.', coverImage: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true },
    { name: 'Dress Material', category: 'Fabrics', price: 2200, stock: 20, description: 'Premium unstitched fabric matching top and bottom patterns.', coverImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&h=1067&q=80', images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&h=1067&q=80'], featured: true }
  ];

  let showroomCatalog = [...fallbackCatalog]; // dynamic runtime list

  // Render fallback catalog immediately for instant interactivity & button binding
  renderStorefrontProducts();

  // --- Real-time Firestore Products Synchronizer ---
  if (firebaseLoaded && db) {
    db.collection('products').onSnapshot(async (snapshot) => {
      if (snapshot.empty) {
        console.log('Firestore products collection is empty. Auto-populating fallback catalog...');
        // Auto populate database
        const batch = db.batch();
        fallbackCatalog.forEach(p => {
          const docId = db.collection('products').doc().id;
          const docRef = db.collection('products').doc(docId);
          batch.set(docRef, {
            ...p,
            slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        console.log('Successfully initialized products in database.');
        renderStorefrontProducts();
      } else {
        showroomCatalog = [];
        snapshot.forEach(doc => {
          showroomCatalog.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Synced ${showroomCatalog.length} products from database.`);
        renderStorefrontProducts();
      }
    });
  } else {
    // offline render
    renderStorefrontProducts();
  }

  // --- Dynamic Storefront Products Render ---
  function renderStorefrontProducts() {
    console.log('Rendering storefront cards from catalog...');
    const latestGrid = document.querySelector('#latest .grid');
    const suitsGrid = document.querySelector('#suits .grid');
    const fabricsGrid = document.querySelector('#fabrics .grid');

    if (latestGrid) latestGrid.innerHTML = '';
    if (suitsGrid) suitsGrid.innerHTML = '';
    if (fabricsGrid) fabricsGrid.innerHTML = '';

    let latestCount = 0;
    let suitsCount = 0;
    let fabricsCount = 0;

    showroomCatalog.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card flex flex-col justify-between';
      
      const priceText = p.price ? `₹${p.price}` : 'Enquire';

      card.innerHTML = `
        <div class="group">
          <div class="product-card-img-wrapper aspect-[9/16]">
            ${p.featured ? '<span class="product-card-badge">New</span>' : ''}
            <img src="${p.coverImage || p.images?.[0]}" alt="${p.name}" class="product-card-img" loading="lazy">
          </div>
          <div class="product-card-cat">${p.category}</div>
          <div class="flex justify-between items-center pr-1 mt-1">
            <a href="#contact" class="product-card-title block text-[17px] font-normal text-charcoal leading-tight">${p.name}</a>
            <span class="text-xs font-bold text-pink">${priceText}</span>
          </div>
        </div>
        <div class="mt-3 flex flex-col space-y-1.5">
          <button class="add-to-cart-btn w-full btn-pill btn-pill-secondary py-1.5 text-[11px]" data-product="${p.name}" data-category="${p.category}">
            ADD TO CART
          </button>
          <button class="buy-now-btn w-full btn-pill btn-pill-primary py-1.5 text-[11px]" data-product="${p.name}" data-category="${p.category}">
            BUY NOW
          </button>
        </div>
      `;

      // Bind actions immediately
      card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-product');
        const cat = e.currentTarget.getAttribute('data-category');
        addToCart(name, cat, true);
      });

      card.querySelector('.buy-now-btn').addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-product');
        const cat = e.currentTarget.getAttribute('data-category');
        addToCart(name, cat, false);
        openCartDrawer(true);
        showCartView('checkout');
      });

      // Filter distribution
      if (p.category === 'Sarees' && latestGrid && latestCount < 8) {
        latestGrid.appendChild(card);
        latestCount++;
      } else if (p.category === 'Suits' && suitsGrid && suitsCount < 6) {
        suitsGrid.appendChild(card);
        suitsCount++;
      } else if (p.category === 'Fabrics' && fabricsGrid && fabricsCount < 5) {
        fabricsGrid.appendChild(card);
        fabricsCount++;
      }
    });
  }

  // --- Navigation & Header ---
  const header = document.getElementById('main-header');
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('header-sticky', 'py-3');
      header.classList.remove('py-4', 'md:py-6');
    } else {
      header.classList.remove('header-sticky', 'py-3');
      header.classList.add('py-4', 'md:py-6');
    }
  });

  menuBtn.addEventListener('click', () => {
    const isOpen = menuBtn.classList.toggle('open');
    if (isOpen) {
      mobileMenu.classList.remove('translate-x-full');
      document.body.style.overflow = 'hidden';
    } else {
      mobileMenu.classList.add('translate-x-full');
      document.body.style.overflow = '';
    }
  });

  const mobileNavLinks = mobileMenu.querySelectorAll('a');
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      mobileMenu.classList.add('translate-x-full');
      document.body.style.overflow = '';
    });
  });

  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active', 'text-pink');
      link.classList.add('text-charcoal');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active', 'text-pink');
        link.classList.remove('text-charcoal');
      }
    });
  });

  const dropdownDetails = document.querySelectorAll('nav details');
  dropdownDetails.forEach(details => {
    const links = details.querySelectorAll('a');
    links.forEach(l => {
      l.addEventListener('click', () => {
        details.removeAttribute('open');
      });
    });
  });

  // --- Slideshow Banners ---
  const slidesWrapper = document.querySelector('.slides-wrapper');
  const slides = document.querySelectorAll('.slide-item');
  const prevBtn = document.getElementById('prev-slide');
  const nextBtn = document.getElementById('next-slide');
  const dots = document.querySelectorAll('.slide-dot');
  
  let currentSlide = 0;
  const slideCount = slides.length;
  let slideTimer = null;

  const showSlide = (index) => {
    if (index < 0) {
      currentSlide = slideCount - 1;
    } else if (index >= slideCount) {
      currentSlide = 0;
    } else {
      currentSlide = index;
    }
    
    if (slidesWrapper) {
      slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    
    dots.forEach((dot, idx) => {
      if (idx === currentSlide) {
        dot.classList.add('active-dot');
        dot.classList.remove('bg-white/50');
        dot.classList.add('bg-white');
      } else {
        dot.classList.remove('active-dot');
        dot.classList.add('bg-white/50');
        dot.classList.remove('bg-white');
      }
    });
  };

  const startSlideShow = () => {
    stopSlideShow();
    slideTimer = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 5000);
  };

  const stopSlideShow = () => {
    if (slideTimer) clearInterval(slideTimer);
  };

  if (prevBtn && nextBtn && slidesWrapper) {
    prevBtn.addEventListener('click', () => {
      showSlide(currentSlide - 1);
      startSlideShow();
    });

    nextBtn.addEventListener('click', () => {
      showSlide(currentSlide + 1);
      startSlideShow();
    });

    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const target = parseInt(e.currentTarget.getAttribute('data-slide'));
        showSlide(target);
        startSlideShow();
      });
    });

    startSlideShow();
  }

  // --- Shopping Cart Drawer State & Real-time Firestore Sync ---
  let cart = JSON.parse(localStorage.getItem('kesariya_cart')) || [];
  
  const cartBtn = document.getElementById('cart-btn');
  const cartBadge = document.getElementById('cart-badge');
  const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
  const closeCartBtn = document.getElementById('close-cart');
  const cartItemsView = document.getElementById('cart-items-view');
  
  const cartCheckoutView = document.getElementById('cart-checkout-view');
  const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
  const cartSubmitBtn = document.getElementById('cart-submit-btn');
  const cartBackBtn = document.getElementById('cart-back-btn');
  const cartTotalQty = document.getElementById('cart-total-qty');
  
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutError = document.getElementById('checkout-error');
  
  const orderSuccessOverlay = document.getElementById('order-success-overlay');
  const receiptOrderId = document.getElementById('receipt-order-id');
  const receiptName = document.getElementById('receipt-name');
  const receiptPhone = document.getElementById('receipt-phone');
  const receiptItems = document.getElementById('receipt-items');
  const closeSuccessModalBtn = document.getElementById('close-success-modal');

  const openCartDrawer = (open) => {
    if (open) {
      showCartView('items');
      cartDrawerOverlay.classList.remove('hidden');
      cartDrawerOverlay.offsetHeight;
      cartDrawerOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      renderCart();
    } else {
      cartDrawerOverlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!cartDrawerOverlay.classList.contains('open')) {
          cartDrawerOverlay.classList.add('hidden');
        }
      }, 250);
    }
  };

  const showCartView = (viewName) => {
    if (viewName === 'checkout') {
      cartItemsView.classList.add('hidden');
      cartCheckoutView.classList.remove('hidden');
      cartCheckoutBtn.classList.add('hidden');
      cartSubmitBtn.classList.remove('hidden');
      cartBackBtn.classList.remove('hidden');
      checkoutError.classList.add('hidden');
      checkoutError.textContent = '';
      
      if (currentUser) {
        document.getElementById('checkout-name').value = currentUser.displayName || currentUser.email.split('@')[0];
      }
    } else {
      cartItemsView.classList.remove('hidden');
      cartCheckoutView.classList.add('hidden');
      cartCheckoutBtn.classList.remove('hidden');
      cartSubmitBtn.classList.add('hidden');
      cartBackBtn.classList.add('hidden');
    }
  };

  const updateCartBadge = () => {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartTotalQty) cartTotalQty.textContent = total;
    if (total > 0) {
      cartBadge.textContent = total;
      cartBadge.classList.remove('hidden');
    } else {
      cartBadge.classList.add('hidden');
    }
  };

  // Sync Cart Array helper
  const saveCart = async () => {
    localStorage.setItem('kesariya_cart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();

    // Sync to Firestore cart/uid document if logged in
    if (firebaseLoaded && db && currentUser) {
      try {
        await db.collection('carts').doc(currentUser.uid).set({
          items: cart,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore cart sync warning:", err);
      }
    }
  };

  // Fetch/Merge cart from Firestore on Login
  const fetchAndMergeFirestoreCart = async (uid) => {
    if (!firebaseLoaded || !db) return;
    try {
      const doc = await db.collection('carts').doc(uid).get();
      if (doc.exists) {
        const firestoreCart = doc.data().items || [];
        
        // Merge guest cart with database cart (avoid duplicates)
        firestoreCart.forEach(fItem => {
          const guestItem = cart.find(g => g.name === fItem.name);
          if (guestItem) {
            guestItem.quantity = Math.max(guestItem.quantity, fItem.quantity);
          } else {
            cart.push(fItem);
          }
        });
      }
      await saveCart();
    } catch (err) {
      console.error("Error merging cart from firestore:", err);
    }
  };

  const addToCart = (productName, category, openDrawer = true) => {
    const catalogItem = showroomCatalog.find(item => item.name === productName);
    const imgSrc = catalogItem ? (catalogItem.coverImage || catalogItem.image) : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=150&q=80';
    const price = catalogItem ? catalogItem.price : 0;

    const existing = cart.find(item => item.name === productName);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        name: productName,
        category: category,
        image: imgSrc,
        priceSnapshot: price,
        quantity: 1
      });
    }
    saveCart();
    if (openDrawer) {
      openCartDrawer(true);
    }
  };

  const updateQuantity = (productName, change) => {
    const item = cart.find(i => i.name === productName);
    if (!item) return;
    
    item.quantity += change;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.name !== productName);
    }
    saveCart();
  };

  const renderCart = () => {
    cartItemsView.innerHTML = '';
    
    if (cart.length === 0) {
      cartItemsView.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
          <i class="fa-solid fa-bag-shopping text-gray-300 text-6xl"></i>
          <p class="text-sm font-semibold text-charcoal-light">Your cart is empty</p>
          <button id="cart-start-shopping" class="btn-pill btn-pill-primary py-2 px-6 text-xs">
            START SHOPPING
          </button>
        </div>
      `;
      cartCheckoutBtn.classList.add('hidden');
      
      const startShopBtn = document.getElementById('cart-start-shopping');
      if (startShopBtn) {
        startShopBtn.addEventListener('click', () => openCartDrawer(false));
      }
      return;
    }

    cartCheckoutBtn.classList.remove('hidden');

    cart.forEach(item => {
      const priceText = item.priceSnapshot ? `₹${item.priceSnapshot}` : '';
      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item';
      itemRow.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="flex justify-between items-start">
            <h4 class="cart-item-title leading-tight">${item.name}</h4>
            <span class="text-[10px] font-bold text-pink ml-2">${priceText}</span>
          </div>
          <span class="text-[9px] uppercase bg-pink/10 text-pink px-2 py-0.5 rounded font-bold tracking-widest mt-1 inline-block">${item.category}</span>
          <div class="flex items-center justify-between mt-3">
            <div class="qty-ctrl">
              <button class="qty-minus" data-name="${item.name}"><i class="fa-solid fa-minus"></i></button>
              <span>${item.quantity}</span>
              <button class="qty-plus" data-name="${item.name}"><i class="fa-solid fa-plus"></i></button>
            </div>
            <span class="remove-cart-item" data-name="${item.name}">Remove</span>
          </div>
        </div>
      `;
      cartItemsView.appendChild(itemRow);
    });

    cartItemsView.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        updateQuantity(name, -1);
      });
    });

    cartItemsView.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        updateQuantity(name, 1);
      });
    });

    cartItemsView.querySelectorAll('.remove-cart-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        cart = cart.filter(i => i.name !== name);
        saveCart();
      });
    });
  };

  if (cartBtn) {
    cartBtn.addEventListener('click', () => openCartDrawer(true));
    closeCartBtn.addEventListener('click', () => openCartDrawer(false));
    cartDrawerOverlay.addEventListener('click', (e) => {
      if (e.target === cartDrawerOverlay) openCartDrawer(false);
    });

    cartCheckoutBtn.addEventListener('click', () => showCartView('checkout'));
    cartBackBtn.addEventListener('click', () => showCartView('items'));
  }

  // Handle Checkout submission directly to Firestore Orders
  if (cartSubmitBtn) {
    cartSubmitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      checkoutError.classList.add('hidden');
      checkoutError.textContent = '';

      const name = document.getElementById('checkout-name').value.trim();
      const phone = document.getElementById('checkout-phone').value.trim();
      const address = document.getElementById('checkout-address').value.trim();

      if (!name || !phone || !address) {
        checkoutError.textContent = 'Please fill out all required fields.';
        checkoutError.classList.remove('hidden');
        return;
      }

      const orderId = `KS-${Math.floor(100000 + Math.random() * 900000)}`;
      const itemsList = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
      
      const totalAmount = cart.reduce((sum, item) => sum + (item.priceSnapshot || 0) * item.quantity, 0);

      // Write direct checkout retail order document to Firestore
      if (firebaseLoaded && db) {
        try {
          await db.collection('orders').doc(orderId).set({
            orderId: orderId,
            uid: currentUser ? currentUser.uid : "guest",
            customerName: name,
            email: currentUser ? currentUser.email : "",
            phone: phone,
            address: address,
            items: cart,
            totalAmount: totalAmount,
            status: 'Pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Order ${orderId} saved to Firestore successfully.`);
        } catch (err) {
          console.error('Firestore order write error:', err);
          alert("Order write failed. Check database connection/rules.");
          return;
        }
      } else {
        console.warn('Offline mode. Simulating success.');
      }

      receiptOrderId.textContent = orderId;
      receiptName.textContent = name;
      receiptPhone.textContent = phone;
      receiptItems.textContent = itemsList;
      
      const contactNameInput = document.getElementById('form-name');
      const contactPhoneInput = document.getElementById('form-phone');
      if (contactNameInput) contactNameInput.value = name;
      if (contactPhoneInput) contactPhoneInput.value = phone;

      cart = [];
      await saveCart();
      openCartDrawer(false);
      checkoutForm.reset();
      orderSuccessOverlay.classList.remove('hidden');
    });

    closeSuccessModalBtn.addEventListener('click', () => {
      orderSuccessOverlay.classList.add('hidden');
    });

    updateCartBadge();
  }

  // --- Firebase Authentication Modal Logic ---
  const profileBtn = document.getElementById('profile-btn');
  const profileIcon = document.getElementById('profile-icon');
  const authOverlay = document.getElementById('auth-overlay');
  const closeAuthBtn = document.getElementById('close-auth');
  
  const loginView = document.getElementById('auth-login-view');
  const signupView = document.getElementById('auth-signup-view');
  const profileView = document.getElementById('auth-profile-view');
  
  const loginError = document.getElementById('login-error');
  const signupError = document.getElementById('signup-error');
  
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  const goToSignup = document.getElementById('go-to-signup');
  const goToLogin = document.getElementById('go-to-login');
  
  const googleLoginBtn = document.getElementById('google-login-btn');
  const googleSignupBtn = document.getElementById('google-signup-btn');
  const logoutBtn = document.getElementById('auth-logout-btn');
  const profileEmailDisplay = document.getElementById('profile-email-display');

  let currentUser = null;

  const openAuthModal = (open) => {
    if (open) {
      authOverlay.classList.remove('hidden');
      authOverlay.offsetHeight;
      authOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      resetErrors();
      
      if (!firebaseLoaded) {
        loginView.classList.add('hidden');
        signupView.classList.add('hidden');
        profileView.classList.remove('hidden');
        profileEmailDisplay.innerHTML = `
          <div class="text-red-500 font-bold text-xs flex flex-col items-center space-y-2">
            <i class="fa-solid fa-circle-exclamation text-3xl"></i>
            <span>AUTHENTICATION OFFLINE</span>
          </div>
          <span class="block text-[11px] text-charcoal-light mt-3 leading-relaxed">
            The authentication service could not be contacted. Please check your network connection.
          </span>
        `;
        logoutBtn.classList.add('hidden');
        return;
      }

      if (currentUser) {
        showView('profile');
      } else {
        showView('login');
      }
    } else {
      authOverlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!authOverlay.classList.contains('open')) {
          authOverlay.classList.add('hidden');
        }
      }, 250);
    }
  };

  const showView = (viewName) => {
    loginView.classList.add('hidden');
    signupView.classList.add('hidden');
    profileView.classList.add('hidden');

    if (viewName === 'login') {
      loginView.classList.remove('hidden');
    } else if (viewName === 'signup') {
      signupView.classList.remove('hidden');
    } else if (viewName === 'profile') {
      profileView.classList.remove('hidden');
      logoutBtn.classList.remove('hidden');
      if (currentUser) {
        profileEmailDisplay.textContent = currentUser.email;
      }
    }
  };

  const resetErrors = () => {
    loginError.classList.add('hidden');
    loginError.textContent = '';
    signupError.classList.add('hidden');
    signupError.textContent = '';
  };

  if (profileBtn) {
    profileBtn.addEventListener('click', () => openAuthModal(true));
    closeAuthBtn.addEventListener('click', () => openAuthModal(false));
    authOverlay.addEventListener('click', (e) => {
      if (e.target === authOverlay) openAuthModal(false);
    });

    goToSignup.addEventListener('click', () => showView('signup'));
    goToLogin.addEventListener('click', () => showView('login'));
  }

  // Client device / platform logging helpers
  function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Unknown Browser";
  }
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
    if (/mobile|iphone|ipod|android|blackberry|opera mini/i.test(ua)) return "Mobile";
    return "PC";
  }

  // --- Auth listener & claims redirect checks ---
  if (firebaseLoaded && auth) {
    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      
      if (user) {
        profileIcon.className = 'fa-solid fa-user text-pink';
        
        const formName = document.getElementById('form-name');
        if (formName && !formName.value) {
          formName.value = user.displayName || user.email.split('@')[0];
        }

        // 1. Log Login Activity to Firestore
        try {
          await db.collection('loginLogs').add({
            uid: user.uid,
            email: user.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            browser: getBrowserName(),
            platform: navigator.platform,
            device: getDeviceType()
          });
          
          // Update profile document lastLogin
          await db.collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });

        } catch (err) {
          console.warn("Could not log activity in database:", err);
        }

        // 2. Fetch and merge cart database persistence
        fetchAndMergeFirestoreCart(user.uid);

        // 3. Custom claim role authorization button reveal
        try {
          const idTokenResult = await user.getIdTokenResult();
          const role = idTokenResult.claims.role;
          
          const adminLink = document.getElementById('profile-admin-link');
          if (adminLink) {
            if (role === 'admin' || role === 'owner') {
              adminLink.classList.remove('hidden');
            } else {
              adminLink.classList.add('hidden');
            }
          }
        } catch (err) {
          console.warn("Could not retrieve custom claims token:", err);
        }

      } else {
        profileIcon.className = 'fa-regular fa-user';
        const adminLink = document.getElementById('profile-admin-link');
        if (adminLink) adminLink.classList.add('hidden');
        cart = [];
        localStorage.removeItem('kesariya_cart');
        updateCartBadge();
        renderCart();
      }
    });

    // Action: Email/Password login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      resetErrors();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        await auth.signInWithEmailAndPassword(email, password);
        openAuthModal(false);
        loginForm.reset();
      } catch (err) {
        loginError.textContent = err.message;
        loginError.classList.remove('hidden');
      }
    });

    // Action: Email/Password registration
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      resetErrors();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      if (password !== confirmPassword) {
        signupError.textContent = "Passwords do not match.";
        signupError.classList.remove('hidden');
        return;
      }

      try {
        await auth.createUserWithEmailAndPassword(email, password);
        openAuthModal(false);
        signupForm.reset();
      } catch (err) {
        signupError.textContent = err.message;
        signupError.classList.remove('hidden');
      }
    });

    // Google OAuth sign-in triggers
    const handleGoogleSignIn = async () => {
      resetErrors();
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        await auth.signInWithPopup(provider);
        openAuthModal(false);
      } catch (err) {
        const activeError = !signupView.classList.contains('hidden') ? signupError : loginError;
        activeError.textContent = err.message;
        activeError.classList.remove('hidden');
      }
    };

    googleLoginBtn.addEventListener('click', handleGoogleSignIn);
    googleSignupBtn.addEventListener('click', handleGoogleSignIn);

    // Action: Logout
    logoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        openAuthModal(false);
      } catch (err) {
        alert("Error logging out: " + err.message);
      }
    });
  }

  // --- Search UI & Filter Logic ---
  const searchBtn = document.getElementById('search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const closeSearchBtn = document.getElementById('close-search');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchOverlay.classList.add('open');
      searchInput.focus();
      document.body.style.overflow = 'hidden';
      renderSearchResults('');
    });

    const closeSearchFunc = () => {
      searchOverlay.classList.remove('open');
      searchInput.value = '';
      document.body.style.overflow = '';
    };

    closeSearchBtn.addEventListener('click', closeSearchFunc);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchOverlay.classList.contains('open')) {
        closeSearchFunc();
      }
    });

    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value.trim());
    });

    function renderSearchResults(query) {
      searchResults.innerHTML = '';
      
      if (query === '') {
        searchResults.innerHTML = '<p class="text-charcoal-light text-center py-4 text-xs">Start typing to search our catalog...</p>';
        return;
      }

      const filtered = showroomCatalog.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length === 0) {
        searchResults.innerHTML = '<p class="text-charcoal-light text-center py-4 text-xs">No matching products found.</p>';
        return;
      }

      filtered.forEach(item => {
        const card = document.createElement('a');
        card.href = item.link || '#latest';
        card.className = 'block p-4 border border-gray hover:border-pink rounded transition duration-200 bg-white';
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <h4 class="font-bold text-charcoal text-sm uppercase tracking-wider">${item.name}</h4>
            <span class="text-[9px] uppercase bg-pink/10 text-pink px-2.5 py-0.5 rounded-full font-bold tracking-widest">${item.category}</span>
          </div>
          <p class="text-xs text-charcoal-light mt-1.5">${item.description || ''}</p>
        `;
        card.addEventListener('click', () => {
          closeSearchFunc();
        });
        searchResults.appendChild(card);
      });
    }
  }

  // --- Scroll-to-Top Button ---
  const scrollBtn = document.createElement('button');
  scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
  scrollBtn.className = 'fixed bottom-6 right-6 bg-charcoal hover:bg-pink text-white w-9 h-9 rounded-full flex items-center justify-center shadow transition duration-300 opacity-0 pointer-events-none z-50';
  document.body.appendChild(scrollBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollBtn.classList.remove('opacity-0', 'pointer-events-none');
      scrollBtn.classList.add('opacity-100');
    } else {
      scrollBtn.classList.add('opacity-0', 'pointer-events-none');
      scrollBtn.classList.remove('opacity-100');
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- WhatsApp Contact Integration (Bulk enquiry / doubts flow) ---
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('form-name').value.trim();
      const phone = document.getElementById('form-phone').value.trim();
      const category = document.getElementById('form-category').value;
      const message = document.getElementById('form-message').value.trim();

      if (!name || !phone || !message) {
        alert('Please fill out all fields.');
        return;
      }

      const whatsappText = `Hello Kesariya Saree Showroom, I have an enquiry/bulk request:
*Name:* ${name}
*Phone:* ${phone}
*Category:* ${category}
*Message:* ${message}`;
      
      const encodedMsg = encodeURIComponent(whatsappText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=919350371098&text=${encodedMsg}`;
      
      window.open(whatsappUrl, '_blank');

      formSuccess.classList.remove('hidden');
      contactForm.reset();

      setTimeout(() => {
        formSuccess.classList.add('hidden');
      }, 5000);
    });
  }

  // --- Scroll-Reveal (Intersection Observer) ---
  const animatedElements = document.querySelectorAll('.reveal-element');
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => {
      observer.observe(el);
    });
  } else {
    animatedElements.forEach(el => {
      el.classList.add('active');
    });
  }
});
