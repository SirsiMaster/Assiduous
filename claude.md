# Claude AI Context for Assiduous Project

## Project Overview
Assiduous is an AI-powered real estate platform for micro-flipping with multiple user portals (Client, Agent, Admin).

## Current State (October 10, 2025)
- **Project Started**: August 10, 2025
- **Overall Completion**: ~40%
- **Latest Work**: Unified authentication system and consistent styling across all portals

## Recent Updates (October 9-10, 2025)
### Authentication System
- Implemented unified SirsiAuth component for all portals
- Created AuthGuard middleware for role-based access control
- Set up Firebase Authentication with role claims
- Test accounts created for all user types

### Portal Development
- **Admin Portal**: Fully functional with properties, agents, clients management
- **Agent Portal**: Dashboard implemented with universal auth
- **Client Portal**: Dashboard and deal analyzer deployed with consistent styling

### Styling Consistency Fix (October 10, 2025)
- Removed custom purple gradient styling from client portal
- Implemented universal header component across all dashboards
- Applied Assiduous design system CSS variables
- Created comprehensive style guide documentation at `/firebase-migration-package/assiduous-build/docs/STYLE_GUIDE.md`
- Updated client dashboard.html and deal-analyzer.html to use consistent styling
- Successfully deployed to production at https://assiduous-prod.web.app

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

## Next Development Priorities
1. Complete agent portal features (properties, leads, transactions)
2. Implement client property search and portfolio management
3. Add micro-flipping deal flow automation
4. Integrate AI property analysis
5. Set up payment processing

## Important Notes
- Always check this file before starting work
- Update this file after significant changes
- Verify CSS variable usage in all new code
- Test across all three portals after changes
- Deploy to production only after testing

## Contact
- Project Lead: SirsiMaster
- Platform: Assiduous Real Estate
- Domain: assiduousflip.com / assiduous-prod.web.app

Last Updated: October 10, 2025 04:58 UTC