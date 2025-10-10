# Assiduous Platform Style Guide

## Overview
This document defines the styling standards for all Assiduous platform pages to ensure consistency across all user portals (Client, Agent, Admin).

## Required CSS Imports
Every new HTML page MUST include these CSS files in this order:

```html
<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<!-- Assiduous Design System (REQUIRED - DO NOT SKIP) -->
<link rel="stylesheet" href="/css/assiduous.css">
<link rel="stylesheet" href="/css/admin-layout.css">
<link rel="stylesheet" href="/css/button-override.css">
<link rel="stylesheet" href="/css/sirsimaster-ui.css">
```

## CSS Variables to Use (NEVER HARDCODE COLORS)

### Primary Colors
- `var(--primary)` - Primary brand color
- `var(--sky)` - Main action color (#5EAEFF)
- `var(--dark)` - Dark text (#1a202c)
- `var(--white)` - White (#ffffff)

### Gray Scale
- `var(--gray-50)` through `var(--gray-900)`
- Use for borders, backgrounds, secondary text

### Spacing
- `var(--space-xs)` - 4px
- `var(--space-sm)` - 8px  
- `var(--space-md)` - 16px
- `var(--space-lg)` - 32px
- `var(--space-xl)` - 64px

### Border Radius
- `var(--radius)` - Standard radius (8px)
- `var(--radius-lg)` - Large radius (16px)
- `var(--radius-full)` - Full radius

### Shadows
- `var(--shadow-sm)` - Small shadow
- `var(--shadow-md)` - Medium shadow
- `var(--shadow-lg)` - Large shadow

## Universal Header Component
All dashboard pages MUST use the universal header component:

```html
<header id="universal-header-root" 
        data-user-name="" 
        data-user-role="client|agent|admin"
        data-user-email=""
        data-current-page="Page Name"
        data-breadcrumb-items='[{"label": "Home", "url": "/"}, {"label": "Current Page", "url": "/current"}]'>
</header>

<!-- Include the script -->
<script src="/components/universal-header.js"></script>
```

## Page Structure Template
```html
<div class="admin-wrapper">
    <!-- Sidebar -->
    <aside class="sidebar">
        <!-- Sidebar content -->
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
        <!-- Universal Header -->
        <header id="universal-header-root">
        </header>
        
        <!-- Page Content -->
        <div class="dashboard-content">
            <!-- Your content here -->
        </div>
    </main>
</div>
```

## ❌ DO NOT DO THIS:
```css
/* WRONG - Hardcoded colors */
.my-button {
    background: #3b82f6;
    color: #ffffff;
}

/* WRONG - Custom spacing */
.my-card {
    padding: 24px;
    margin-bottom: 20px;
}

/* WRONG - Custom shadows */
.my-box {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

## ✅ DO THIS INSTEAD:
```css
/* CORRECT - Use variables */
.my-button {
    background: var(--sky);
    color: var(--white);
}

/* CORRECT - Use spacing variables */
.my-card {
    padding: var(--space-md);
    margin-bottom: var(--space-md);
}

/* CORRECT - Use shadow variables */
.my-box {
    box-shadow: var(--shadow-sm);
}
```

## Common Components Classes

### Buttons
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary button
- `.btn-ghost` - Ghost button

### Cards
- `.card` - Standard card container
- `.stat-card` - Statistics card
- `.data-table` - Data table container

### Forms
- `.form-group` - Form field wrapper
- `.form-label` - Label element
- `.form-input` - Input field
- `.form-help` - Help text

### Layout
- `.page-header` - Page header section
- `.page-title` - Main page title
- `.page-subtitle` - Page description

## Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 968px  
  - Desktop: > 968px

## Testing Checklist for New Pages
- [ ] All required CSS files are imported
- [ ] Universal header is implemented
- [ ] No hardcoded colors (use CSS variables)
- [ ] No custom spacing values (use variables)
- [ ] Responsive on mobile, tablet, desktop
- [ ] Consistent with existing pages
- [ ] Uses existing component classes
- [ ] Tested in Chrome, Safari, Firefox

## Questions?
If you need to add custom styles, first check if:
1. An existing class already handles this
2. A CSS variable exists for this value
3. The pattern exists in other pages

Only create new styles as a last resort, and document them here.