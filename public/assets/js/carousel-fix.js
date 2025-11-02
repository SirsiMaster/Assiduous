// Carousel Fix for Landing Page
(function () {
  'use strict';

  // Wait for DOM to be ready
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    // Fix all carousels
    const carousels = document.querySelectorAll(
      '.carousel, .carousel-container, [class*="carousel"]'
    );

    carousels.forEach(carousel => {
      const slides = carousel.querySelectorAll('.carousel-slide, .carousel-item, [class*="slide"]');

      if (slides.length > 0) {
        let currentIndex = 0;

        // Reset all slides
        slides.forEach((slide, index) => {
          slide.style.position = 'absolute';
          slide.style.width = '100%';
          slide.style.height = '100%';
          slide.style.top = '0';
          slide.style.left = '0';
          slide.style.opacity = index === 0 ? '1' : '0';
          slide.style.zIndex = index === 0 ? '2' : '1';
          slide.style.transition = 'opacity 1s ease';
        });

        // Auto-advance function
        function nextSlide() {
          const prevIndex = currentIndex;
          currentIndex = (currentIndex + 1) % slides.length;

          slides[prevIndex].style.zIndex = '1';
          slides[prevIndex].style.opacity = '0';

          slides[currentIndex].style.zIndex = '2';
          slides[currentIndex].style.opacity = '1';
        }

        // Start auto-advance
        setInterval(nextSlide, 5000);

        // Pause on hover
        carousel.addEventListener('mouseenter', function () {
          carousel.dataset.paused = 'true';
        });

        carousel.addEventListener('mouseleave', function () {
          carousel.dataset.paused = 'false';
        });
      }
    });

    // Fix greyed out text
    const greyElements = document.querySelectorAll(
      '[style*="color: gray"], [style*="color: grey"], [style*="opacity: 0"], .text-gray, .text-muted'
    );
    greyElements.forEach(el => {
      el.style.color = '#333';
      el.style.opacity = '1';
    });

    // Fix mobile menu
    const mobileMenuToggle = document.querySelector(
      '.mobile-menu-toggle, .menu-toggle, .hamburger'
    );
    const mobileMenu = document.querySelector('.mobile-menu, .nav-mobile, .menu-mobile');

    if (mobileMenuToggle && mobileMenu) {
      mobileMenuToggle.addEventListener('click', function () {
        mobileMenu.classList.toggle('active');
      });
    }
  });
})();
