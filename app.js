/* app.js - strict reference visual integration for Kesariya Saree Showroom */

document.addEventListener('DOMContentLoaded', () => {
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

  // --- Search UI & Filter Logic ---
  const searchBtn = document.getElementById('search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const closeSearchBtn = document.getElementById('close-search');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  // Exact catalog list matching index.html items
  const showroomCatalog = [
    // SAREES
    { name: 'Banarasi Saree', category: 'Sarees', desc: 'Rich woven silk with traditional gold zari border detailing.', link: '#sarees' },
    { name: 'Silk Saree', category: 'Sarees', desc: 'Classic traditional pure handloom silk saree drape.', link: '#sarees' },
    { name: 'Designer Saree', category: 'Sarees', desc: 'Bespoke modern saree featuring delicate styling accents.', link: '#sarees' },
    { name: 'Party Wear Saree', category: 'Sarees', desc: 'Fluid and glamorous saree designed for social gatherings.', link: '#sarees' },
    { name: 'Festive Saree', category: 'Sarees', desc: 'Traditional weave highlighting ceremonial colors.', link: '#sarees' },
    { name: 'Printed Saree', category: 'Sarees', desc: 'Lightweight contemporary printed floral pattern saree.', link: '#sarees' },
    { name: 'Georgette Saree', category: 'Sarees', desc: 'Soft and fluid premium georgette saree.', link: '#sarees' },
    { name: 'Cotton Saree', category: 'Sarees', desc: 'Breathable handloom daily wear cotton saree.', link: '#sarees' },
    
    // SUITS
    { name: 'Designer Suit', category: 'Suits', desc: 'Grand matching ethnic salwar suit with premium detailing.', link: '#suits' },
    { name: 'Party Wear Suit', category: 'Suits', desc: 'Sophisticated style set featuring elegant embroidery details.', link: '#suits' },
    { name: 'Anarkali Suit', category: 'Suits', desc: 'Flowy flared traditional suit with matching dupatta.', link: '#suits' },
    { name: 'Salwar Suit', category: 'Suits', desc: 'Classic comfortable unstitched/semi-stitched traditional suit.', link: '#suits' },
    { name: 'Festive Suit', category: 'Suits', desc: 'Rich embroidery design suit for ceremonies.', link: '#suits' },
    { name: 'Punjabi Suit', category: 'Suits', desc: 'Comfortable patiala style traditional Punjabi suit.', link: '#suits' },
    
    // FABRICS
    { name: 'Premium Suit Fabric', category: 'Fabrics', desc: 'Fine thread counts suit material for bespoke styling.', link: '#fabrics' },
    { name: 'Dress Material', category: 'Fabrics', desc: 'Premium unstitched fabric matching top and bottom patterns.', link: '#fabrics' },
    { name: 'Cotton Fabric', category: 'Fabrics', desc: 'Soft and high-quality pure cotton by the meter.', link: '#fabrics' },
    { name: 'Designer Fabric', category: 'Fabrics', desc: 'Detailed brocade or sequence fabric for blouses/dresses.', link: '#fabrics' },
    { name: 'Printed Fabric', category: 'Fabrics', desc: 'Bespoke pattern print fabrics by the meter.', link: '#fabrics' }
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
