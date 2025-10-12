# Claude AI Context for Assiduous Project

## CRITICAL: Always Check WARP.md First
**WARP.md is the authoritative source.** This file supplements it with Claude-specific context.

## Brutal Reality Check (October 12, 2025)
- **Project Started**: August 10, 2025 (2 months ago)
- **Actual Completion**: ~35% (mostly UI, minimal backend integration)
- **Critical Issue**: Almost nothing has been tested in Firebase staging
- **Latest Work**: Updated Rule 5 to mandate Firebase staging testing (never local)

## MANDATORY RULES (Enforced Harshly)

### RULE 0: Check SirsiMaster Component Library First
**Before creating ANY component:**
- Check `/Users/thekryptodragon/Development/sirsimaster-component-library`
- Use existing components, don't duplicate
- Contribute generic components to library, not this project

### RULE 5: NEVER Test Locally - Firebase Staging Only
**Pipeline**: LOCAL (code only) → GIT → STAGING (Firebase) → PROD (Firebase)
- ❌ NEVER use `python -m http.server` or local static servers
- ❌ NEVER claim features work without Firebase staging testing
- ✅ ALWAYS deploy to staging Firebase first
- ✅ ALWAYS test with full Firebase backend (Auth, Firestore, Functions)
- ✅ ONLY deploy to prod after 100% staging validation

### RULE 4: Harsh QA/QC Before Any Completion Claims
**NEVER say something works without:**
- Opening in actual browser (staging Firebase)
- Checking DevTools console for errors
- Testing complete user workflows end-to-end
- Verifying Firebase services (Auth, Firestore, Storage)
- Testing on mobile/responsive view

## What Actually Works (Honest Assessment)

### ✅ Partially Working
- Basic HTML/CSS structure for portals
- Firebase SDK loaded in pages
- Git hooks update local metrics
- Charts render with Chart.js (mock data only)
- Some auth UI exists

### ❌ NOT Working / NOT Tested
- **Firebase staging**: Not configured, never tested there
- **Real data**: Dashboards use 100% mock data
- **Firestore integration**: Not connected to real collections
- **Auth workflows**: Not tested end-to-end in Firebase
- **User workflows**: None tested in actual Firebase environment
- **GitHub webhook**: Code exists but not configured in repo
- **Real-time updates**: Firestore listeners not implemented
- **Client portal**: Not loading real properties from Firestore
- **Analytics**: Completely mock data, no real metrics

## Critical Files & Locations

### Authentication
- `/components/sirsi-auth.js` - Main authentication component
- `/components/auth-guard.js` - Role-based access control
- `/components/universal-header.js` - Dynamic header component

### CSS Design System
- `/css/assiduous.css` - Main design system
- `/css/admin-layout.css` - Layout styles
- `/css/button-override.css` - Button styles
- `/css/sirsimaster-ui.css` - UI components

### Portal Pages
- `/admin/` - Admin portal (dashboard, properties, agents, clients)
- `/agent/` - Agent portal (dashboard)
- `/client/` - Client portal (dashboard, deal-analyzer)

### Documentation
- `/firebase-migration-package/assiduous-build/docs/STYLE_GUIDE.md` - Styling standards
- `/CHANGELOG.md` - Project history
- `/README.md` - Main documentation

## Development Standards

### CSS Rules (MANDATORY)
1. **NEVER hardcode colors** - Use CSS variables (e.g., `var(--sky)`, not `#3b82f6`)
2. **NEVER hardcode spacing** - Use spacing variables (e.g., `var(--space-md)`, not `16px`)
3. **ALWAYS use design system** - Import all required CSS files
4. **ALWAYS use universal header** - For consistent navigation

### Required CSS Imports for New Pages
```html
<link rel="stylesheet" href="/css/assiduous.css">
<link rel="stylesheet" href="/css/admin-layout.css">
<link rel="stylesheet" href="/css/button-override.css">
<link rel="stylesheet" href="/css/sirsimaster-ui.css">
```

### Universal Header Implementation
```html
<header id="universal-header-root" 
        data-user-name="" 
        data-user-role="client|agent|admin"
        data-user-email=""
        data-current-page="Page Name">
</header>
<script src="/components/universal-header.js"></script>
```

## Firebase Configuration
- **Production**: assiduous-prod (Firebase Project)
- **Hosting**: assiduous-prod.web.app
- **Deploy Command**: `firebase deploy --only hosting:production`

## Common Issues & Solutions

### Problem: Inconsistent Styling
**Solution**: Check that all required CSS files are imported and no custom styles are hardcoded

### Problem: Authentication Not Working
**Solution**: Ensure SirsiAuth is initialized and AuthGuard is protecting the route

### Problem: Build Failures
**Solution**: Deploy static files directly with Firebase, not through npm build

## Test Accounts
- **Admin**: admin@assiduous.ai / Admin123!
- **Agent**: agent@assiduous.ai / Agent123!
- **Client**: client@assiduous.ai / Client123!

## Current Critical Issues
1. **No staging environment** - Cannot test Firebase features
2. **Mock data everywhere** - Nothing connected to real Firestore
3. **Never tested in Firebase** - All features unverified
4. **GitHub webhook not configured** - Metrics not syncing
5. **No real user testing** - Workflows untested end-to-end

## Immediate Next Steps (In Order)
1. Configure Firebase staging project
2. Deploy current code to staging
3. Test everything in staging browser with Firebase
4. Connect dashboards to real Firestore collections
5. Implement Firestore real-time listeners
6. Test all auth flows in Firebase
7. Fix all bugs found in staging
8. Only then consider production deployment

## Key Metrics (Be Honest)
- Total Commits: 478
- Estimated Cost: $23,550
- Time Spent: 2 months
- **Actual Working Features**: ~10%
- **Code Written**: ~70%
- **Code Tested in Firebase**: 0%
- **Production-Ready Features**: 0

## Firebase Info
- **Production**: assiduous-prod.web.app
- **Staging**: NOT CONFIGURED YET
- **Test Accounts**: Exist but untested in Firebase

## Harsh Assessment Standards
**When evaluating progress, ALWAYS:**
- Assume nothing works until tested in Firebase staging
- Count only features tested end-to-end as "complete"
- Mock data = NOT complete
- UI only = NOT complete
- Code written but not tested = 0% complete
- Be pessimistic about estimates
- Report bugs immediately, honestly
- Never inflate completion percentages

Last Updated: October 12, 2025 03:52 UTC
