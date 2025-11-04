# Universal Component System (UCS) - Implementation Plan

**Project:** Assiduous Real Estate Platform  
**Version:** 1.0.0  
**Status:** Phase 0 - Infrastructure Setup Complete  
**Date:** January 4, 2025

---

## Executive Summary

The **Universal Component System (UCS)** solves the critical problem of inconsistent design, hardcoded paths, and duplicated code across the Assiduous platform. This build-time component framework ensures all pages automatically inherit the gold-standard admin design while eliminating manual path management.

### What Was Broken

1. **Hardcoded Path Hell**: Every component had 15+ conditional path checks
2. **Design Drift**: New pages didn't follow admin design standards
3. **Code Duplication**: Same component HTML copied to 50+ pages
4. **Manual Dependencies**: Each page manually specifies CSS/JS imports
5. **No Single Source**: Changes required editing multiple files

### What UCS Fixes

✅ **Zero hardcoded paths** - Build system resolves all paths automatically  
✅ **Guaranteed consistency** - Admin design propagates to all pages  
✅ **Single source of truth** - Edit once, update everywhere  
✅ **Automatic dependencies** - Components bring their own CSS/JS  
✅ **Staging-first** - Safe testing before prod  
✅ **Admin protected** - Existing admin pages untouched  

---

## Current Status

### ✅ Phase 0: Complete

**Infrastructure Files Created:**

1. **`public/assiduous.config.js`** - Global configuration
   - Environment settings (dev, staging, prod)
   - Path configurations
   - Role definitions (admin = gold standard)
   - Asset bundle definitions
   - Build behavior settings
   - Migration phase controls

2. **`public/components/registry.json`** - Component registry
   - Component schemas (header, sidebar, footer)
   - Prop validation rules
   - Role variants
   - Asset dependencies
   - Bundle definitions

3. **`docs/COMPONENT_SYSTEM.md`** - Complete UCS documentation
   - Architecture diagrams
   - Component directives syntax
   - Token system explained
   - Usage examples
   - Troubleshooting guide

### ⏸️ Pending Implementation

**Next Steps (In Order):**

1. ✅ Config files created
2. ✅ Registry created
3. ✅ Documentation written
4. ⬜ Standardize component templates (header, sidebar)
5. ⬜ Build system script (`scripts/build-pages.js`)
6. ⬜ Watch script (`scripts/watch-and-build.js`)
7. ⬜ Package.json scripts
8. ⬜ Test on simple page
9. ⬜ Phase 1: Migrate client/docs pages
10. ⬜ Deploy to staging
11. ⬜ Visual QA approval
12. ⬜ Phase 2: Admin development pages
13. ⬜ Phase 3: Core admin pages (with extreme caution)

---

## How UCS Works

### Build-Time Magic

```
┌─ You write this: ─────────────────┐
│                                   │
│ <!-- @component:header            │
│      role="admin"                 │
│      title="Dashboard" -->        │
│                                   │
└───────────────────────────────────┘
            │
            ▼
      [Build System]
            │
            ▼
┌─ UCS outputs this: ──────────────┐
│                                   │
│ <header class="admin-header">     │
│   <div class="admin-topbar">      │
│     <div class="topbar-left">     │
│       <h1>Dashboard</h1>          │
│     </div>                        │
│     ...                           │
│   </div>                          │
│ </header>                         │
│                                   │
└───────────────────────────────────┘
```

### Key Features

**1. Comment-Based Directives (Zero Runtime)**

```html
<!-- @component:header role="admin" title="My Page" -->
<!-- @component:sidebar active="dashboard" role="admin" -->
<!-- @css:add name="core" -->
<!-- @js:add name="firebase" -->
```

**2. Token Replacement System**

```html
<!-- In component template: -->
<link rel="stylesheet" href="{{BASE_PATH}}assiduous.css">
<h1>{{PROP_title}}</h1>

<!-- Builder outputs: -->
<link rel="stylesheet" href="../assiduous.css">
<h1>Dashboard</h1>
```

**3. Automatic Path Resolution**

- `public/admin/page.html` → `{{BASE_PATH}}` = `../`
- `public/admin/development/page.html` → `{{BASE_PATH}}` = `../../`
- No manual calculation needed!

**4. Asset Bundle Management**

```javascript
// Define once in config:
bundles: {
  core: {
    css: ['assiduous.css', 'components/admin-layout.css'],
    js: ['assets/js/main.js']
  }
}

// Use everywhere:
<!-- @css:add name="core" -->
```

---

## File Structure

```
assiduous/
├── public/
│   ├── assiduous.config.js           ← SINGLE SOURCE OF TRUTH
│   ├── components/
│   │   ├── registry.json             ← Component definitions
│   │   ├── universal-header.html     ← Token-based template
│   │   ├── sidebar.html              ← Token-based template
│   │   └── admin-layout.css          ← GOLD STANDARD styles
│   ├── admin/                        ← PROTECTED (Phase 3 only)
│   │   └── dashboard.html
│   ├── client/                       ← Phase 1 target
│   │   └── *.template.html
│   └── docs/                         ← Phase 1 target
│       └── *.template.html
├── scripts/
│   ├── build-pages.js                ← Build system (to create)
│   └── watch-and-build.js            ← Dev watcher (to create)
└── docs/
    ├── COMPONENT_SYSTEM.md           ← UCS usage guide
    ├── BUILD_SYSTEM.md               ← Build script reference (to create)
    └── MIGRATION_GUIDE.md            ← Migration instructions (to create)
```

---

## Usage Example

### Creating a New Page

**Step 1: Create Template File**

`public/client/new-feature.template.html`

```html
<!DOCTYPE html>
<html lang="en" data-auth-protect="client">
<head>
    <meta charset="UTF-8">
    <title>New Feature — Assiduous</title>
    <!-- UCS auto-injects CSS here -->
</head>
<body>
    <div class="admin-wrapper">
        
        <!-- Insert admin-standard header -->
        <!-- @component:header 
             role="client" 
             title="New Feature" 
             subtitle="Amazing new functionality" -->
        
        <!-- Insert admin-standard sidebar -->
        <!-- @component:sidebar 
             active="new-feature" 
             role="client" -->
        
        <!-- Your custom content -->
        <main class="main-content">
            <div class="page-content">
                <h2>Your Feature Here</h2>
                <p>This page automatically inherits admin design!</p>
            </div>
        </main>
    </div>
    
    <!-- UCS auto-injects JS here -->
    <!-- @js:add name="firebase" -->
</body>
</html>
```

**Step 2: Build**

```bash
npm run build
```

**Step 3: Deploy to Staging**

```bash
firebase deploy --only hosting --project assiduous-staging
```

**Step 4: Visual QA**

Open `https://assiduous-staging.web.app/client/new-feature.html` and verify:
- Header matches admin design
- Sidebar matches admin design
- All links work
- Console has zero errors
- Mobile responsive

**Step 5: Promote to Prod** (after approval)

```bash
firebase deploy --only hosting --project assiduous-prod
```

---

## Migration Strategy

### Phase-Based Rollout

**Current Phase: 0 - Setup** ✅
- Infrastructure in place
- Documentation written
- No pages converted yet

**Next Phase: 1 - Client & Docs**
- Target: `public/client/**` and `public/docs/**`
- Low risk; these pages need redesign anyway
- Test UCS on real pages
- Build confidence in system

**Future Phase: 2 - Admin Development**
- Target: `public/admin/development/**`
- Lower-risk admin section
- Practice converting admin pages

**Final Phase: 3 - Core Admin** (Extreme Caution)
- Target: `public/admin/*.html` (selective)
- Only migrate when UCS produces **byte-for-byte identical** output
- Visual diff must show zero changes
- Keep existing pages working as fallback

---

## Guardrails & Safety

### Admin Pages Protected

```javascript
// In assiduous.config.js
build: {
  patterns: {
    exclude: [
      'public/admin/**',  // DO NOT TOUCH (Phase 3 only)
    ]
  }
}
```

### Staging-First Policy

```
Local → GitHub → Staging → (manual approval) → Prod
          ↓         ↓
       Git hooks  Visual QA
```

- **Never** deploy to prod without staging verification
- **Always** run visual QA on staging
- **Always** check browser console for errors
- **Always** test critical user flows

### Rollback Plan

1. Keep `.template.html` files alongside `.html` files
2. Git tag before major UCS changes: `git tag -a ucs-before-phase-1`
3. Can instantly revert: `git reset --hard ucs-before-phase-1`
4. Firebase hosts old version until new version verified

---

## Success Criteria

### Technical Goals

- [ ] Build completes in under 5 seconds
- [ ] Zero hardcoded path logic in components
- [ ] All new pages inherit admin design automatically
- [ ] Single config controls all dependencies
- [ ] Works perfectly on Firebase Hosting
- [ ] Components exportable to Sirsi library

### Business Goals

- [ ] New pages ship 10x faster
- [ ] Design consistency across all pages
- [ ] Zero path-related bugs
- [ ] Easy to train new developers
- [ ] Rapid prototyping of new features

---

## Next Steps

### Immediate (This Week)

1. **Standardize component templates** using exact admin HTML
2. **Build the build script** (`scripts/build-pages.js`)
3. **Test on one simple page** (e.g., `docs/test.template.html`)
4. **Verify output matches expectations**

### Short Term (This Month)

5. **Convert 3-5 client pages** to templates
6. **Deploy to staging**
7. **Visual QA approval**
8. **Document learnings**

### Medium Term (Next Quarter)

9. **Convert all client portal pages**
10. **Convert all docs pages**
11. **Test admin/development pages**
12. **Refine build system based on feedback**

### Long Term (Future)

13. **Selectively convert core admin pages** (with extreme caution)
14. **Extract to Sirsi Component Library**
15. **Use for rapid app development**

---

## Resources

### Documentation

- **`docs/COMPONENT_SYSTEM.md`** - Complete usage guide
- **`docs/BUILD_SYSTEM.md`** - Build script reference (to be created)
- **`docs/MIGRATION_GUIDE.md`** - Migration checklist (to be created)

### Configuration

- **`public/assiduous.config.js`** - Global config (single source of truth)
- **`public/components/registry.json`** - Component schemas

### Templates

- **`public/components/universal-header.html`** - Header template (to be standardized)
- **`public/components/sidebar.html`** - Sidebar template (to be standardized)

### Reference Implementation

- **`public/admin/dashboard.html`** - GOLD STANDARD for layout and design

---

## Questions & Support

### Common Questions

**Q: Will this break existing pages?**  
A: No. UCS only processes `.template.html` files and pages with `@component` directives. Existing pages continue to work unchanged.

**Q: What about admin pages?**  
A: Admin pages are explicitly excluded from processing (Phase 0-2). They'll only be touched in Phase 3 after extensive testing.

**Q: What if the build fails?**  
A: Build failure blocks deployment. Fix errors, re-run build, verify on staging before promoting to prod.

**Q: Can I opt out a specific page?**  
A: Yes. Don't create a `.template.html` version and don't add `@component` directives. Page stays as-is.

**Q: What's the performance impact?**  
A: Zero runtime impact. All work happens at build-time. Output is pure static HTML, same as before.

---

## Acknowledgments

- **Admin pages** serve as the gold standard for all design decisions
- **Firebase Hosting** provides the deployment infrastructure
- **SirsiMaster Component Library** will benefit from UCS lessons learned

---

**Status:** Infrastructure Ready  
**Next Action:** Standardize component templates using admin HTML  
**Owner:** Development Team  
**Last Updated:** 2025-01-04
