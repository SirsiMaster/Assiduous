// Landing Page Fix Script - Preserves all existing features while fixing issues
(function() {
    'use strict';
    
    // Fix 1: Hero Background Carousel Rotation
    function fixHeroCarousel() {
        const heroImages = document.querySelectorAll('.hero-bg-image');
        if (heroImages.length === 0) return;
        
        let currentIndex = 0;
        
        // Reset all images first
        heroImages.forEach((img, index) => {
            img.style.opacity = index === 0 ? '1' : '0';
            img.classList.toggle('active', index === 0);
        });
        
        // Rotate images every 5 seconds
        setInterval(() => {
            // Fade out current
            heroImages[currentIndex].style.opacity = '0';
            heroImages[currentIndex].classList.remove('active');
            
            // Move to next
            currentIndex = (currentIndex + 1) % heroImages.length;
            
            // Fade in next
            heroImages[currentIndex].style.opacity = '1';
            heroImages[currentIndex].classList.add('active');
        }, 5000);
    }
    
    // Fix 2: Ensure proper z-index layering
    function fixZIndexLayers() {
        // Header should be on top
        const header = document.querySelector('.header');
        if (header) {
            header.style.zIndex = '1000';
        }
        
        // Hero background should be behind content
        const heroBg = document.querySelector('.hero-bg');
        if (heroBg) {
            heroBg.style.zIndex = '1';
        }
        
        // Hero content should be visible
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.zIndex = '10';
            heroContent.style.position = 'relative';
        }
        
        // Stats bar should be above hero
        const statsBar = document.querySelector('.stats-bar');
        if (statsBar) {
            statsBar.style.position = 'relative';
            statsBar.style.zIndex = '20';
            statsBar.style.background = 'white';
        }
    }
    
    // Fix 3: Text visibility
    function fixTextVisibility() {
        // Ensure hero text is visible
        const heroTitle = document.querySelector('.hero h1');
        if (heroTitle) {
            heroTitle.style.opacity = '1';
            heroTitle.style.color = 'white';
            // Keep gradient if it exists, otherwise solid white
            if (!heroTitle.style.background) {
                heroTitle.style.background = 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)';
                heroTitle.style.webkitBackgroundClip = 'text';
                heroTitle.style.webkitTextFillColor = 'transparent';
                heroTitle.style.backgroundClip = 'text';
            }
        }
        
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) {
            heroSubtitle.style.opacity = '0.95';
            heroSubtitle.style.color = '#e2e8f0';
        }
        
        // Fix any greyed out text in features
        document.querySelectorAll('.feature-title, .feature-description').forEach(el => {
            el.style.opacity = '1';
        });
    }
    
    // Fix 4: Mobile responsiveness
    function fixMobileLayout() {
        if (window.innerWidth <= 768) {
            // Fix hero content padding on mobile
            const heroContent = document.querySelector('.hero-content');
            if (heroContent) {
                heroContent.style.padding = '0 20px';
            }
            
            // Fix button layout on mobile
            const heroActions = document.querySelector('.hero-actions');
            if (heroActions) {
                heroActions.style.flexDirection = 'column';
                heroActions.style.alignItems = 'center';
                heroActions.style.width = '100%';
            }
            
            // Make buttons full width on mobile
            document.querySelectorAll('.hero-btn').forEach(btn => {
                btn.style.width = '100%';
                btn.style.maxWidth = '300px';
                btn.style.justifyContent = 'center';
            });
            
            // Fix stats grid on mobile
            const statsContainer = document.querySelector('.stats-container');
            if (statsContainer) {
                statsContainer.style.gridTemplateColumns = '1fr';
                statsContainer.style.gap = '20px';
            }
        }
    }
    
    // Fix 5: Prevent carousel overlap
    function preventCarouselOverlap() {
        const heroBg = document.querySelector('.hero-bg');
        if (heroBg) {
            heroBg.style.position = 'absolute';
            heroBg.style.top = '0';
            heroBg.style.left = '0';
            heroBg.style.right = '0';
            heroBg.style.bottom = '0';
            heroBg.style.overflow = 'hidden';
        }
        
        // Ensure only one image visible at a time
        const heroImages = document.querySelectorAll('.hero-bg-image');
        heroImages.forEach((img, index) => {
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.transition = 'opacity 2s ease-in-out';
            if (index !== 0) {
                img.style.opacity = '0';
            }
        });
    }
    
    // Initialize all fixes
    function initFixes() {
        fixZIndexLayers();
        fixTextVisibility();
        fixMobileLayout();
        preventCarouselOverlap();
        fixHeroCarousel();
        
        // Re-apply mobile fixes on resize
        window.addEventListener('resize', () => {
            fixMobileLayout();
        });
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFixes);
    } else {
        initFixes();
    }
})();
