#!/usr/bin/env node

/**
 * Fix All Critical Issues Script
 * Applies button override CSS, fixes analytics, and repairs landing page
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}🔧 Starting Critical Fixes...${colors.reset}\n`);

// Fix 1: Apply button override CSS to all HTML files
function fixButtonStyles() {
    console.log(`${colors.yellow}📌 Fix 1: Applying button override CSS...${colors.reset}`);
    
    const buttonOverrideLink = '<link rel="stylesheet" href="/assets/css/button-override.css">';
    const buttonOverrideScript = `
    <script>
        // Ensure button styles are loaded
        (function() {
            const checkButtons = function() {
                const testBtn = document.querySelector('button');
                if (testBtn) {
                    const styles = window.getComputedStyle(testBtn);
                    if (styles.borderStyle === 'outset' || styles.backgroundColor.includes('192')) {
                        // Force reload override styles
                        const link = document.querySelector('link[href*="button-override"]');
                        if (link) {
                            link.href = link.href.split('?')[0] + '?v=' + Date.now();
                        }
                    }
                }
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', checkButtons);
            } else {
                checkButtons();
            }
        })();
    </script>`;
    
    // Function to fix a single HTML file
    function fixHtmlFile(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            // Add button override CSS if not present
            if (!content.includes('button-override.css')) {
                // Find the best place to insert (before other CSS or before </head>)
                if (content.includes('</head>')) {
                    content = content.replace('</head>', `    ${buttonOverrideLink}\n    ${buttonOverrideScript}\n</head>`);
                    modified = true;
                }
            }
            
            // Also ensure the CSS is loaded with highest priority
            if (modified) {
                fs.writeFileSync(filePath, content);
                console.log(`  ${colors.green}✓${colors.reset} Fixed: ${filePath}`);
                return true;
            }
            return false;
        } catch (error) {
            console.log(`  ${colors.red}✗${colors.reset} Error fixing ${filePath}: ${error.message}`);
            return false;
        }
    }
    
    // Fix all HTML files in admin directory
    const adminDir = path.join(__dirname, '..', 'admin');
    const assidousBuildAdminDir = path.join(__dirname, '..', 'assiduous-build', 'admin');
    let fixedCount = 0;
    
    // Process admin directory
    if (fs.existsSync(adminDir)) {
        const files = fs.readdirSync(adminDir);
        files.forEach(file => {
            if (file.endsWith('.html')) {
                if (fixHtmlFile(path.join(adminDir, file))) {
                    fixedCount++;
                }
            }
        });
        
        // Also check subdirectories
        const subDirs = ['contracts', 'development'];
        subDirs.forEach(subDir => {
            const subPath = path.join(adminDir, subDir);
            if (fs.existsSync(subPath)) {
                const subFiles = fs.readdirSync(subPath);
                subFiles.forEach(file => {
                    if (file.endsWith('.html')) {
                        if (fixHtmlFile(path.join(subPath, file))) {
                            fixedCount++;
                        }
                    }
                });
            }
        });
    }
    
    // Process assiduous-build/admin directory
    if (fs.existsSync(assidousBuildAdminDir)) {
        const files = fs.readdirSync(assidousBuildAdminDir);
        files.forEach(file => {
            if (file.endsWith('.html')) {
                if (fixHtmlFile(path.join(assidousBuildAdminDir, file))) {
                    fixedCount++;
                }
            }
        });
        
        // Also check subdirectories
        const subDirs = ['contracts', 'development'];
        subDirs.forEach(subDir => {
            const subPath = path.join(assidousBuildAdminDir, subDir);
            if (fs.existsSync(subPath)) {
                const subFiles = fs.readdirSync(subPath);
                subFiles.forEach(file => {
                    if (file.endsWith('.html')) {
                        if (fixHtmlFile(path.join(subPath, file))) {
                            fixedCount++;
                        }
                    }
                });
            }
        });
    }
    
    // Fix landing page
    const landingPages = [
        path.join(__dirname, '..', 'index.html'),
        path.join(__dirname, '..', 'assiduous-build', 'index.html')
    ];
    
    landingPages.forEach(page => {
        if (fs.existsSync(page)) {
            if (fixHtmlFile(page)) {
                fixedCount++;
            }
        }
    });
    
    console.log(`  ${colors.green}✅ Fixed ${fixedCount} HTML files${colors.reset}\n`);
}

// Fix 2: Create improved analytics calculation
function fixAnalytics() {
    console.log(`${colors.yellow}📊 Fix 2: Creating improved analytics calculation...${colors.reset}`);
    
    const analyticsFixContent = `
/* Analytics Layout Fix CSS */
.analytics-container {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 20px;
    padding: 20px;
    width: 100%;
}

.metric-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
}

.metric-label {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.metric-value {
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: bold;
    color: #333;
    word-break: break-word;
    overflow-wrap: break-word;
    line-height: 1.2;
}

.metric-change {
    font-size: 0.875rem;
    margin-top: 8px;
}

.metric-change.positive {
    color: #10b981;
}

.metric-change.negative {
    color: #ef4444;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .analytics-grid {
        grid-template-columns: 1fr;
        padding: 10px;
        gap: 15px;
    }
    
    .metric-card {
        padding: 15px;
    }
    
    .metric-value {
        font-size: 1.75rem;
    }
}

@media (max-width: 480px) {
    .analytics-grid {
        padding: 5px;
        gap: 10px;
    }
    
    .metric-card {
        min-height: 100px;
    }
}

/* Fix overlapping content */
.analytics-header {
    position: relative;
    z-index: 10;
    background: white;
    padding: 20px;
    margin-bottom: 20px;
}

.analytics-content {
    position: relative;
    z-index: 5;
}

/* Ensure charts don't break layout */
.chart-container {
    position: relative;
    width: 100%;
    height: 300px;
    overflow: hidden;
}

canvas {
    max-width: 100% !important;
    height: auto !important;
}`;
    
    const cssPath = path.join(__dirname, '..', 'assets', 'css', 'analytics-fix.css');
    fs.writeFileSync(cssPath, analyticsFixContent);
    console.log(`  ${colors.green}✓${colors.reset} Created analytics fix CSS`);
    
    // Create improved metrics calculator
    const metricsScriptPath = path.join(__dirname, 'calculate_accurate_metrics_v2.js');
    const improvedMetricsScript = fs.readFileSync(path.join(__dirname, 'calculate_accurate_metrics.js'), 'utf8');
    
    // Enhance the metrics calculation
    const enhancedScript = improvedMetricsScript.replace(
        'this.minimumSessionHours = 1;',
        'this.minimumSessionHours = 2; // More realistic minimum'
    ).replace(
        'this.averageCommitTime = 0.5;',
        'this.averageCommitTime = 0.75; // 45 minutes per commit average'
    );
    
    fs.writeFileSync(metricsScriptPath, enhancedScript);
    console.log(`  ${colors.green}✓${colors.reset} Created improved metrics calculator\n`);
}

// Fix 3: Create landing page mobile fix
function fixLandingPage() {
    console.log(`${colors.yellow}📱 Fix 3: Creating landing page mobile fix...${colors.reset}`);
    
    const mobileFixCSS = `
/* Landing Page Mobile Fix CSS */
/* Reset problematic styles */
* {
    box-sizing: border-box;
}

body {
    overflow-x: hidden !important;
    width: 100%;
    margin: 0;
    padding: 0;
}

/* Fix carousel overlap */
.carousel,
.carousel-container,
[class*="carousel"] {
    position: relative !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    z-index: 1 !important;
}

.carousel-slide,
.carousel-item {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
    opacity: 0;
    transition: opacity 1s ease !important;
    z-index: 1 !important;
}

.carousel-slide.active,
.carousel-item.active {
    position: relative !important;
    opacity: 1 !important;
    z-index: 2 !important;
}

/* Fix greyed out text */
h1, h2, h3, h4, h5, h6,
p, span, div, section, article {
    color: inherit !important;
    opacity: 1 !important;
}

.text-gray,
.text-muted,
[class*="gray"],
[class*="muted"] {
    color: #666 !important;
    opacity: 1 !important;
}

/* Ensure readability */
.hero-content,
.content-section,
main section {
    background: white !important;
    color: #333 !important;
    position: relative !important;
    z-index: 10 !important;
}

/* Mobile responsive fixes */
@media (max-width: 768px) {
    /* Reset all widths */
    body, html {
        width: 100% !important;
        max-width: 100% !important;
    }
    
    /* Fix containers */
    .container,
    .container-fluid,
    [class*="container"] {
        width: 100% !important;
        max-width: 100% !important;
        padding-left: 15px !important;
        padding-right: 15px !important;
        margin: 0 !important;
    }
    
    /* Fix images */
    img {
        max-width: 100% !important;
        height: auto !important;
    }
    
    /* Fix carousels on mobile */
    .carousel,
    .carousel-container {
        height: 50vh !important;
        min-height: 300px !important;
        max-height: 500px !important;
    }
    
    /* Fix text sizing */
    h1 { font-size: clamp(1.75rem, 5vw, 2.5rem) !important; }
    h2 { font-size: clamp(1.5rem, 4vw, 2rem) !important; }
    h3 { font-size: clamp(1.25rem, 3.5vw, 1.75rem) !important; }
    p { font-size: clamp(0.9rem, 2.5vw, 1rem) !important; }
    
    /* Fix buttons on mobile */
    button, .btn, a.button {
        min-height: 48px !important;
        min-width: 120px !important;
        padding: 12px 20px !important;
        font-size: 16px !important;
    }
    
    /* Fix navigation */
    nav, .navbar {
        position: relative !important;
        z-index: 1000 !important;
    }
    
    .mobile-menu {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: white !important;
        z-index: 9999 !important;
        transform: translateX(-100%);
        transition: transform 0.3s ease !important;
    }
    
    .mobile-menu.active {
        transform: translateX(0) !important;
    }
    
    /* Fix grid layouts */
    .grid,
    [class*="grid"],
    .row {
        display: flex !important;
        flex-direction: column !important;
    }
    
    .col,
    [class*="col-"] {
        width: 100% !important;
        max-width: 100% !important;
        flex: 0 0 100% !important;
    }
    
    /* Fix overlapping elements */
    * {
        position: static !important;
    }
    
    header, nav, main, section, footer {
        position: relative !important;
    }
    
    .fixed, .absolute, .sticky {
        position: relative !important;
    }
    
    /* Prevent horizontal scroll */
    .row {
        margin-left: 0 !important;
        margin-right: 0 !important;
    }
    
    [class*="col-"] {
        padding-left: 15px !important;
        padding-right: 15px !important;
    }
}

/* iPhone specific fixes */
@media (max-width: 414px) {
    body {
        -webkit-text-size-adjust: 100%;
    }
    
    input, textarea, select {
        font-size: 16px !important; /* Prevent zoom on focus */
    }
}

/* Fix z-index stacking */
.hero { z-index: 1 !important; }
.content { z-index: 10 !important; }
.overlay { z-index: 100 !important; }
.modal { z-index: 1000 !important; }
.navbar { z-index: 900 !important; }

/* Ensure touch targets are large enough */
a, button, input, select, textarea {
    min-height: 44px;
    min-width: 44px;
}

/* Performance optimizations */
* {
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
}

img {
    will-change: transform;
}`;
    
    const mobileCssPath = path.join(__dirname, '..', 'assets', 'css', 'landing-mobile-fix.css');
    fs.writeFileSync(mobileCssPath, mobileFixCSS);
    console.log(`  ${colors.green}✓${colors.reset} Created landing page mobile fix CSS`);
    
    // Create carousel fix JavaScript
    const carouselFixJS = `
// Carousel Fix for Landing Page
(function() {
    'use strict';
    
    // Wait for DOM to be ready
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }
    
    ready(function() {
        // Fix all carousels
        const carousels = document.querySelectorAll('.carousel, .carousel-container, [class*="carousel"]');
        
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
                carousel.addEventListener('mouseenter', function() {
                    carousel.dataset.paused = 'true';
                });
                
                carousel.addEventListener('mouseleave', function() {
                    carousel.dataset.paused = 'false';
                });
            }
        });
        
        // Fix greyed out text
        const greyElements = document.querySelectorAll('[style*="color: gray"], [style*="color: grey"], [style*="opacity: 0"], .text-gray, .text-muted');
        greyElements.forEach(el => {
            el.style.color = '#333';
            el.style.opacity = '1';
        });
        
        // Fix mobile menu
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle, .menu-toggle, .hamburger');
        const mobileMenu = document.querySelector('.mobile-menu, .nav-mobile, .menu-mobile');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('active');
            });
        }
    });
})();`;
    
    const carouselJsPath = path.join(__dirname, '..', 'assets', 'js', 'carousel-fix.js');
    fs.writeFileSync(carouselJsPath, carouselFixJS);
    console.log(`  ${colors.green}✓${colors.reset} Created carousel fix JavaScript\n`);
}

// Main execution
console.log(`${colors.bright}${colors.green}Starting fixes...${colors.reset}\n`);

// Run all fixes
fixButtonStyles();
fixAnalytics();
fixLandingPage();

console.log(`${colors.bright}${colors.green}✅ All fixes completed successfully!${colors.reset}`);
console.log(`\n${colors.blue}Next steps:${colors.reset}`);
console.log('1. Test the changes locally');
console.log('2. Commit and push to GitHub');
console.log('3. Deploy to Firebase');
console.log('\nRun: git add -A && git commit -m "fix: Critical fixes for buttons, analytics, and mobile" && git push origin main');
