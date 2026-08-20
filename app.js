/* app.js - strict reference visual integration and Firebase Auth for Kesariya Saree Showroom */

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
  let firebaseLoaded = false;

  // Safe Firebase Initialization to prevent crashes if CDN is blocked (e.g. by adblockers/offline)
  if (typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      firebaseLoaded = true;
      console.log('Firebase initialized successfully.');
    } catch (err) {
      console.error('Firebase initialization error:', err);
    }
  } else {
    console.warn('Firebase SDK not found. Authentication features will run in offline mode.');
  }

  // --- Navigation & Mobile Menu ---
  const header = document.getElementById('main-header');
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky Header scroll styling (Dawn theme thin line border-b)
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('header-sticky', 'py-3');
      header.classList.remove('py-4', 'md:py-6');
    } else {
      header.classList.remove('header-sticky', 'py-3');
      header.classList.add('py-4', 'md:py-6');
    }
  });

  // Mobile hamburger toggling
  menuBtn.addEventListener('click', () => {
    const isOpen = menuBtn.classList.toggle('open');
    if (isOpen) {
      mobileMenu.classList.remove('translate-x-full');
      document.body.style.overflow = 'hidden'; // Lock body scroll
    } else {
      mobileMenu.classList.add('translate-x-full');
      document.body.style.overflow = ''; // Unlock body scroll
    }
  });

  // Close mobile drawer on link selection
  const mobileNavLinks = mobileMenu.querySelectorAll('a');
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      mobileMenu.classList.add('translate-x-full');
      document.body.style.overflow = '';
    });
  });

  // Active section scroll indicator
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

  // Close nav details on dropdown link clicks (for mobile/details layout)
  const dropdownDetails = document.querySelectorAll('nav details');
  dropdownDetails.forEach(details => {
    const links = details.querySelectorAll('a');
    links.forEach(l => {
      l.addEventListener('click', () => {
        details.removeAttribute('open');
      });
    });
  });

  // --- Hero Slideshow Carousel ---
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
    
    // Translate slides
    slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update dots
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
      startSlideShow(); // restart timer
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

    // Start auto slide
    startSlideShow();
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

  // Toggle Auth modal
  const openAuthModal = (open) => {
    console.log('openAuthModal called with state:', open);
    if (open) {
      authOverlay.classList.remove('hidden');
      // trigger reflow for smooth animation
      authOverlay.offsetHeight;
      authOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      resetErrors();
      
      // Fallback display if Firebase fails to load
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
            The authentication service could not be contacted. Please disable ad-blockers (which often block Firebase CDNs) or check your network connection.
          </span>
        `;
        logoutBtn.classList.add('hidden');
        return;
      }

      // Select appropriate initial view
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

  console.log('Binding profileBtn click listener...');
  profileBtn.addEventListener('click', () => {
    console.log('Profile button clicked! Opening modal...');
    openAuthModal(true);
  });
  closeAuthBtn.addEventListener('click', () => {
    console.log('Close button clicked! Closing modal...');
    openAuthModal(false);
  });
  authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) {
      console.log('Overlay clicked! Closing modal...');
      openAuthModal(false);
    }
  });

  goToSignup.addEventListener('click', () => showView('signup'));
  goToLogin.addEventListener('click', () => showView('login'));

  // Auth state changed listener
  if (firebaseLoaded && auth) {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      if (user) {
        // User is logged in
        profileIcon.className = 'fa-solid fa-user text-pink'; // Fill pink profile icon
        
        // Prefill contact form name if exists
        const formName = document.getElementById('form-name');
        if (formName && !formName.value) {
          formName.value = user.displayName || user.email.split('@')[0];
        }
      } else {
        // User is logged out
        profileIcon.className = 'fa-regular fa-user'; // Outline icon
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

  // Exact catalog list matching index.html items
  const showroomCatalog = [
    // SAREES
    { name: 'Premium Banarasi Saree', category: 'Sarees', desc: 'Rich woven silk with traditional gold zari border detailing.', link: '#latest' },
    { name: 'Designer Silk Saree', category: 'Sarees', desc: 'Classic traditional pure handloom silk saree drape.', link: '#latest' },
    { name: 'Festive Saree', category: 'Sarees', desc: 'Traditional weave highlighting ceremonial colors.', link: '#latest' },
    { name: 'Premium Georgette Saree', category: 'Sarees', desc: 'Soft and fluid premium georgette saree.', link: '#latest' },
    { name: 'Designer Party Wear Saree', category: 'Sarees', desc: 'Bespoke modern saree featuring delicate styling accents.', link: '#latest' },
    { name: 'Traditional Silk Saree', category: 'Sarees', desc: 'Fluid and glamorous saree designed for social gatherings.', link: '#latest' },
    { name: 'Premium Cotton Saree', category: 'Sarees', desc: 'Breathable handloom daily wear cotton saree.', link: '#latest' },
    { name: 'Bridal Printed Saree', category: 'Sarees', desc: 'Beautiful printed patterns on rich bridal fabric.', link: '#latest' },
    
    // SUITS
    { name: 'Designer Suit', category: 'Suits', desc: 'Grand matching ethnic salwar suit with premium detailing.', link: '#suits' },
    { name: 'Party Wear Suit', category: 'Suits', desc: 'Sophisticated style set featuring elegant embroidery details.', link: '#suits' },
    { name: 'Anarkali Suit', category: 'Suits', desc: 'Flowy flared traditional suit with matching dupatta.', link: '#suits' },
    { name: 'Salwar Suit', category: 'Suits', desc: 'Classic comfortable unstitched/semi-stitched traditional suit.', link: '#suits' },
    { name: 'Festive Suit', category: 'Suits', desc: 'Rich embroidery design suit for ceremonies.', link: '#suits' },
    { name: 'Punjabi Suit', category: 'Suits', desc: 'Comfortable patiala style traditional Punjabi suit.', link: '#suits' },
    
    // FABRICS
    { name: 'Premium Suit Fabric', category: 'Fabrics', desc: 'Fine thread counts suit material for bespoke styling.', link: '#fabrics' },
    { name: 'Designer Fabric', category: 'Fabrics', desc: 'Detailed brocade or sequence fabric for blouses/dresses.', link: '#fabrics' },
    { name: 'Cotton Fabric', category: 'Fabrics', desc: 'Soft and high-quality pure cotton by the meter.', link: '#fabrics' },
    { name: 'Printed Fabric', category: 'Fabrics', desc: 'Bespoke pattern print fabrics by the meter.', link: '#fabrics' },
    { name: 'Dress Material', category: 'Fabrics', desc: 'Premium unstitched fabric matching top and bottom patterns.', link: '#fabrics' }
  ];

  // Open search overlay
  searchBtn.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    searchInput.focus();
    document.body.style.overflow = 'hidden';
    renderSearchResults('');
  });

  // Close search overlay
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

  // Search filter output matching Dawn theme cards
  function renderSearchResults(query) {
    searchResults.innerHTML = '';
    
    if (query === '') {
      searchResults.innerHTML = '<p class="text-charcoal-light text-center py-4 text-xs">Start typing to search our catalog...</p>';
      return;
    }

    const filtered = showroomCatalog.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
      searchResults.innerHTML = '<p class="text-charcoal-light text-center py-4 text-xs">No matching products found. Try "Silk", "Banarasi", or "Suit".</p>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('a');
      card.href = item.link;
      card.className = 'block p-4 border border-gray hover:border-pink rounded transition duration-200 bg-white';
      card.innerHTML = `
        <div class="flex justify-between items-center">
          <h4 class="font-bold text-charcoal text-sm uppercase tracking-wider">${item.name}</h4>
          <span class="text-[9px] uppercase bg-pink/10 text-pink px-2.5 py-0.5 rounded-full font-bold tracking-widest">${item.category}</span>
        </div>
        <p class="text-xs text-charcoal-light mt-1.5">${item.desc}</p>
      `;
      card.addEventListener('click', () => {
        closeSearchFunc();
      });
      searchResults.appendChild(card);
    });
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

  // --- WhatsApp Contact Integration ---
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

      // Prefilled WhatsApp message
      const whatsappText = `Hello Kesariya Saree Showroom, I would like to submit an enquiry:
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

  // --- Product Enquiry Helper (Enquire Now buttons) ---
  const enquiryButtons = document.querySelectorAll('.enquire-btn');
  enquiryButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productName = e.currentTarget.getAttribute('data-product');
      const productCat = e.currentTarget.getAttribute('data-category');
      
      const categorySelect = document.getElementById('form-category');
      const messageTextarea = document.getElementById('form-message');
      
      if (categorySelect) {
        categorySelect.value = productCat || 'Sarees';
      }
      if (messageTextarea) {
        messageTextarea.value = `Hello, I am interested in details and pricing for: "${productName}". Please advise on availability.`;
      }
      
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
