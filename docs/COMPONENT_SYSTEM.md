# Assiduous Universal Component System (UCS)

**Version:** 1.0.0  
**Status:** Phase 0 - Setup Complete  
**Last Updated:** 2025-01-04

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Principles](#key-principles)
4. [Component Directives](#component-directives)
5. [Token System](#token-system)
6. [Creating Pages](#creating-pages)
7. [Component Templates](#component-templates)
8. [Asset Bundles](#asset-bundles)
9. [Role-Based Rendering](#role-based-rendering)
10. [Build Process](#build-process)
11. [Migration Guide](#migration-guide)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The **Universal Component System (UCS)** is Assiduous's build-time component framework that eliminates hardcoded paths, ensures design consistency, and enables rapid page development.

### Problems Solved

- ❌ **Before:** 15+ hardcoded path conditionals in every component
- ✅ **After:** Zero runtime path resolution; all paths computed at build-time

- ❌ **Before:** Duplicated component HTML across 50+ pages
- ✅ **After:** Single source of truth; edit once, update everywhere

- ❌ **Before:** New pages don't follow admin design standard
- ✅ **After:** All pages automatically inherit gold-standard admin layout

- ❌ **Before:** Manual CSS/JS dependency management per page
- ✅ **After:** Automatic dependency injection based on bundles

### Core Benefits

1. **Design Consistency**: Admin pages are the gold standard; all pages automatically match
2. **Zero Hardcoding**: No relative path calculations; builder resolves everything
3. **Single Source of Truth**: `assiduous.config.js` controls all paths and dependencies
4. **Build-Time Safety**: Validation catches errors before deployment
5. **Staging-First**: Safe testing on staging before prod promotion
6. **Exportable**: Components ready for SirsiMaster Component Library

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOURCE FILES                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Page Templates (.template.html)                            │
│  ┌──────────────────────────────────────┐                  │
│  │ <!DOCTYPE html>                       │                  │
│  │ <html>                                │                  │
│  │ <head>...</head>                      │                  │
│  │ <body>                                │
│  │   <!-- @component:header -->          │                  │
│  │   <!-- @component:sidebar -->         │                  │
│  │   <main>...content...</main>          │                  │
│  │ </body>                               │                  │
│  │ </html>                               │                  │
│  └──────────────────────────────────────┘                  │
│           │                                                  │
│           ▼                                                  │
│                                                              │
│  ┌────────────────┐    ┌─────────────────────┐            │
│  │  Config         │    │  Component Registry  │            │
│  │  (config.js)    │    │  (registry.json)     │            │
│  └────────────────┘    └─────────────────────┘            │
│           │                       │                          │
└───────────┼───────────────────────┼──────────────────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUILD SYSTEM                               │
│              (scripts/build-pages.js)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Discovery: Find *.template.html files                   │
│  2. Parse: Extract @component directives                    │
│  3. Validate: Check props against schema                    │
│  4. Resolve: Calculate relative paths                       │
│  5. Inject: Insert components with tokens replaced          │
│  6. Dedupe: Remove duplicate CSS/JS                         │
│  7. Output: Write production HTML                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   OUTPUT FILES                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Production HTML (page.html)                                │
│  ┌──────────────────────────────────────┐                  │
│  │ <!DOCTYPE html>                       │                  │
│  │ <html>                                │                  │
│  │ <head>                                │                  │
│  │   <link rel="stylesheet" href="../assiduous.css">       │
│  │   <link rel="stylesheet" href="../components/...">       │
│  │ </head>                               │                  │
│  │ <body>                                │                  │
│  │   <header class="admin-header">       │ ◄── Injected    │
│  │     <!-- Full header HTML -->         │                  │
│  │   </header>                           │                  │
│  │   <aside class="sidebar">             │ ◄── Injected    │
│  │     <!-- Full sidebar HTML -->        │                  │
│  │   </aside>                            │                  │
│  │   <main>...content...</main>          │                  │
│  │   <script src="../components/..."></script>              │
│  │ </body>                               │                  │
│  │ </html>                               │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
│  + Build Report (build-report.json)                         │
│  + Source Maps (.maps/*.map)                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Principles

### 1. **Admin Pages Are the Gold Standard**

All non-modal, non-index pages follow the admin page layout:
- Fixed sidebar navigation (240px width)
- Professional header with search and user menu
- Consistent spacing and typography
- Admin-layout.css as the canonical stylesheet

### 2. **Build-Time Resolution, Zero Runtime Logic**

- All paths resolved during build
- No XHR requests to load components
- No JavaScript path calculations
- Pure static HTML output

### 3. **Staging-First Deployment**

```
Local Dev → GitHub → Firebase STAGING → (manual approval) → Firebase PROD
```

- All changes test on staging first
- Visual QA gates before prod
- Admin pages protected from changes

### 4. **Single Source of Truth**

- `public/assiduous.config.js` - All configuration
- `public/components/registry.json` - Component definitions
- Changes propagate automatically on next build

---

## Component Directives

### Syntax

Components are inserted using HTML comment directives:

```html
<!-- @component:name prop1="value1" prop2="value2" -->
```

### Header Component

```html
<!-- @component:header 
     role="admin" 
     title="Dashboard" 
     subtitle="Welcome back" 
     searchPlaceholder="Search..." -->
```

**Props:**
- `role` (required): `"admin"`, `"client"`, `"agent"`, `"public"`
- `title`: Page title displayed in header
- `subtitle`: Page subtitle/description
- `searchPlaceholder`: Search input placeholder text
- `userName`: Display name of logged-in user
- `userEmail`: User's email address
- `actions`: JSON array of action buttons (see Advanced Usage)

### Sidebar Component

```html
<!-- @component:sidebar active="dashboard" role="admin" -->
```

**Props:**
- `active` (required): Key of active nav item (e.g., `"dashboard"`, `"analytics"`)
- `role` (required): User role for navigation

### Footer Component

```html
<!-- @component:footer year="2025" -->
```

**Props:**
- `year`: Copyright year
- `links`: Array of footer links (optional)

### Asset Bundle Directives

```html
<!-- @css:add name="core" -->
<!-- @css:add name="charts" -->
<!-- @js:add name="firebase" -->
```

Available bundles:
- `core`: Base CSS + admin-layout.css + button overrides
- `charts`: Chart.js for analytics pages
- `forms`: Form validation utilities
- `firebase`: Firebase SDK (auth, firestore)

---

## Token System

### Available Tokens

Tokens are replaced during build with computed values:

| Token | Description | Example Output |
|-------|-------------|----------------|
| `{{BASE_PATH}}` | Relative path to `/public` root | `../` or `../../` |
| `{{ASSETS_PATH}}` | Relative path to `/public/assets` | `../assets/` |
| `{{COMPONENTS_PATH}}` | Relative path to `/public/components` | `../components/` |
| `{{ROLE}}` | Current user role | `admin` |
| `{{PAGE_PATH}}` | Current page path | `admin/dashboard.html` |
| `{{PROP_*}}` | Any component prop | `{{PROP_title}}` → `Dashboard` |

### Using Tokens in Templates

Component templates use tokens for portability:

```html
<!-- In component template (universal-header.html) -->
<link rel="stylesheet" href="{{BASE_PATH}}assiduous.css">
<img src="{{ASSETS_PATH}}images/logo.svg" alt="Assiduous">
<h1>{{PROP_title}}</h1>
```

### Dynamic Path Resolution

The builder automatically calculates correct relative paths based on file depth:

- `public/admin/dashboard.html` → `{{BASE_PATH}}` = `../`
- `public/admin/development/reports.html` → `{{BASE_PATH}}` = `../../`
- `public/client/index.html` → `{{BASE_PATH}}` = `../`

---

## Creating Pages

### Method 1: Template Files (Recommended)

Create a `.template.html` file:

**File:** `public/client/new-page.template.html`

```html
<!DOCTYPE html>
<html lang="en" data-auth-protect="client">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Page — Assiduous</title>
    
    <!-- UCS will auto-inject CSS bundles here -->
</head>
<body>
    <div class="admin-wrapper">
        
        <!-- Insert header -->
        <!-- @component:header role="client" title="New Page" subtitle="Description here" -->
        
        <!-- Insert sidebar -->
        <!-- @component:sidebar active="new-page" role="client" -->
        
        <!-- Your page content -->
        <main class="main-content">
            <div class="page-content">
                <h2>Your Content Here</h2>
            </div>
        </main>
    </div>
    
    <!-- UCS will auto-inject JS bundles here -->
</body>
</html>
```

**Build the page:**

```bash
npm run build
```

**Output:** `public/client/new-page.html` (production-ready)

### Method 2: Inline Directives

Add directives to existing `.html` files:

```html
<!-- Existing page with inline directives -->
<!-- @component:header role="admin" title="Existing Page" -->
<!-- @component:sidebar active="dashboard" role="admin" -->
```

Builder will process any HTML file containing `@component:` directives.

---

## Component Templates

### Structure

Component templates live in `public/components/` and use tokens:

**File:** `public/components/universal-header.html`

```html
<!-- Professional Admin Top Bar -->
<div class="admin-topbar">
  <!-- Left Section: Page Title -->
  <div class="topbar-left">
    <div class="page-header-inline">
      <h1 class="page-title-header">{{PROP_title}}</h1>
      <p class="page-subtitle-header">{{PROP_subtitle}}</p>
    </div>
  </div>

  <!-- Center Section: Global Search -->
  <div class="topbar-center">
    <div class="global-search">
      <svg class="search-icon" width="16" height="16">...</svg>
      <input type="text" placeholder="{{PROP_searchPlaceholder}}" class="global-search-input">
    </div>
  </div>

  <!-- Right Section: Actions & User -->
  <div class="topbar-right">
    <!-- User avatar and dropdown -->
    <div class="user-menu">
      <span class="user-name">{{PROP_userName}}</span>
      <span class="user-role">{{PROP_userRole}}</span>
      <div class="user-avatar">{{PROP_userInitials}}</div>
    </div>
  </div>
</div>
```

### Role Variants

Define role-specific versions in `registry.json`:

```json
{
  "components": {
    "header": {
      "roleVariants": {
        "admin": "universal-header.html",
        "client": "universal-header.html",
        "agent": "universal-header.html",
        "public": "header-public.html"
      }
    }
  }
}
```

Builder automatically selects correct variant based on `role` prop.

---

## Asset Bundles

### Defining Bundles

In `assiduous.config.js`:

```javascript
bundles: {
  core: {
    css: [
      'assiduous.css',
      'components/admin-layout.css',
      'assets/css/button-override.css',
    ],
    js: [
      'assets/js/main.js',
    ]
  },
  
  charts: {
    css: [],
    js: [
      'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
    ]
  }
}
```

### Using Bundles

```html
<!-- In page template -->
<head>
    <!-- @css:add name="core" -->
    <!-- @css:add name="charts" -->
</head>
<body>
    ...
    <!-- @js:add name="core" -->
    <!-- @js:add name="charts" -->
</body>
```

### Load Order

Builder ensures deterministic order:

1. External CSS (CDN fonts, etc.)
2. Design tokens (`assiduous.css`)
3. Core layout (`admin-layout.css`)
4. Role-specific overrides
5. Component styles
6. Page-specific bundles

---

## Role-Based Rendering

### Roles

Defined in `assiduous.config.js`:

```javascript
roles: {
  admin: {
    name: 'Administrator',
    skin: 'admin-layout.css',  // GOLD STANDARD
    defaultLayout: 'sidebar-header',
  },
  client: {
    name: 'Client',
    skin: 'admin-layout.css',  // Use admin skin
    defaultLayout: 'sidebar-header',
  },
  agent: {
    name: 'Agent',
    skin: 'admin-layout.css',  // Use admin skin
    defaultLayout: 'sidebar-header',
  }
}
```

### Role-Specific Content

Use `data-role` attributes in templates:

```html
<!-- Show only for admins -->
<div data-role="admin">
  <a href="/admin/settings.html">Admin Settings</a>
</div>

<!-- Show for clients and agents -->
<div data-role="client,agent">
  <a href="/support.html">Get Support</a>
</div>
```

Builder preserves these attributes; client-side JS can toggle visibility.

---

## Build Process

### Commands

```bash
# Full build (all templates)
npm run build

# Build specific environment
npm run build:dev
npm run build:staging
npm run build:prod

# Watch mode (auto-rebuild on changes)
npm run build:watch

# Verify without building
npm run verify
```

### Build Steps

1. **Discovery**: Find all `.template.html` files and pages with directives
2. **Parse**: Extract component directives and props
3. **Validate**: Check props against JSON schemas in registry
4. **Load**: Read component templates from `public/components/`
5. **Resolve**: Calculate relative paths based on file depth
6. **Replace**: Substitute all tokens with computed values
7. **Inject**: Insert components and asset bundles
8. **Dedupe**: Remove duplicate CSS/JS references
9. **Output**: Write production HTML next to template
10. **Report**: Generate `build-report.json` with stats

### Build Report

**File:** `build-report.json`

```json
{
  "timestamp": "2025-01-04T12:00:00Z",
  "environment": "staging",
  "pages": {
    "built": 47,
    "skipped": 89,
    "errors": 0,
    "warnings": 2
  },
  "components": {
    "header": 47,
    "sidebar": 45,
    "footer": 12
  },
  "bundles": {
    "core": 47,
    "charts": 8,
    "firebase": 42
  },
  "duration": "2.3s",
  "warnings": [
    "client/old-page.html: Using deprecated prop 'data-base'"
  ]
}
```

---

## Migration Guide

### Phase 0: Setup (Current)

✅ UCS infrastructure in place  
✅ Config and registry created  
✅ Admin pages protected  
⏸️ No page conversion yet

### Phase 1: Client & Docs Pages

**Target:** `public/client/**`, `public/docs/**`

Steps:
1. Identify pages to convert
2. Create `.template.html` versions
3. Add component directives
4. Run build and test on staging
5. Visual QA approval
6. Deploy to staging

### Phase 2: Admin Development Pages

**Target:** `public/admin/development/**`

Lower-risk admin section for testing UCS with admin layout.

### Phase 3: Core Admin Pages

**Target:** `public/admin/*.html` (selective)

**CRITICAL:** Only migrate when UCS produces byte-for-byte identical output.

Requirements:
- Visual diff must show zero differences
- Browser console must have zero errors
- All navigation and interactions must work
- Performance must match or exceed current

---

## Troubleshooting

### Build Errors

**Error:** `Component 'header' not found in registry`

**Solution:** Check `registry.json` has entry for component

---

**Error:** `Invalid prop 'titel' for component 'header'`

**Solution:** Fix typo (`titel` → `title`)

---

**Error:** `Asset not found: ../assets/css/missing.css`

**Solution:** Verify file exists or remove from bundle

---

### Visual Issues

**Issue:** Sidebar overlaps main content

**Solution:** Ensure page uses `<div class="admin-wrapper">` structure

---

**Issue:** Fonts don't load

**Solution:** Check external CSS in config includes Google Fonts

---

**Issue:** Components don't match admin style

**Solution:** Verify role uses `admin-layout.css` skin in config

---

### Performance

**Issue:** Build takes over 10 seconds

**Solution:** Enable caching in config:

```javascript
build: {
  cache: {
    enabled: true,
    templates: true,
    registry: true,
  }
}
```

---

## Next Steps

1. **Read:** `docs/BUILD_SYSTEM.md` for build script details
2. **Read:** `docs/MIGRATION_GUIDE.md` for converting pages
3. **Build:** Run `npm run build:dev` to test locally
4. **Deploy:** Push to staging and verify visually

---

**Questions?** Check `docs/BUILD_SYSTEM.md` or contact the development team.
