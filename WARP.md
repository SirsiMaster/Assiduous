# warp.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## ⚠️  CRITICAL DEVELOPMENT GOVERNANCE RULES (MUST FOLLOW)

### **RULE 0: CHECK SIRSIMASTER COMPONENT LIBRARY FIRST**
**Before creating ANY UI component, utility, or shared functionality:**
- **ALWAYS** check the SirsiMaster Component Library at `/Users/thekryptodragon/Development/sirsimaster-component-library`
- **USE** existing library components instead of creating new ones
- **REFERENCE** the library's WARP.md for component usage guidelines
- **CONTRIBUTE** new generic components to the library, not this project
- **Library GitHub**: https://github.com/SirsiMaster/sirsimaster-component-library

### **RULE 1: ALWAYS CHECK EXISTING DOCUMENTATION FIRST**
**Before starting ANY task, you MUST:**
- Read and understand ALL existing project documentation
- Verify what functionality already exists and is working
- Check against established project plans and architecture
- Ensure you're not duplicating work or breaking existing functionality
- Review similar implementations that already exist in the project
- **NEVER modify or break existing working files without explicit instruction**

### **RULE 2: MANDATORY COMPLETION VERIFICATION**
**Before reporting ANY task as complete, you MUST:**
- Run the completion verification script: `./scripts/verify_completion.sh`
- Test all functionality you claim to have implemented
- Verify that claimed changes actually exist in the files
- Confirm that all components/pages work as specified
- Check that nothing existing was broken by your changes
- **NEVER report completion without running verification**

### **RULE 3: VALIDATE GROUND TRUTH**
**After completing ANY development work, you MUST:**
- Test all implemented functionality against the project requirements
- Update development documentation to reflect current reality
- Ensure analytics and dashboards show accurate current status
- Report the true development status, not assumptions
- Validate that the project state matches what you report
- **The documentation and dashboards must reflect ground truth, always**

### **RULE 4: MANDATORY HARSH QA/QC ASSESSMENT BEFORE COMPLETION CLAIMS**
**Before claiming ANY feature/task is complete, you MUST perform this severe assessment:**

#### **A. Browser-Based End-to-End Testing (CRITICAL)**
1. **NEVER claim completion without actual browser testing**
2. **Open every page in a real browser** (not just HTTP status checks)
3. **Open browser DevTools Console** and check for JavaScript errors
4. **Click through EVERY user flow** from start to finish:
   - User authentication flows
   - Data entry and form submissions
   - Navigation between pages
   - Modal/dialog interactions
   - Save/edit/delete operations
   - Filter and search functionality
5. **Test on mobile device or responsive view**
6. **Verify data actually loads** (not just loading spinners)
7. **Check that all buttons and links work**
8. **Confirm all API calls succeed** (check Network tab)

#### **B. Method/Function Verification**
1. **Verify ALL called methods exist** before using them:
   - If page calls `service.getProperty()`, verify the service has this method
   - Check actual implementation, not assumptions
   - Test method signatures match usage
2. **Verify ALL imports are correct** and files exist at specified paths
3. **Check ALL event handlers** are properly bound
4. **Validate ALL data transformations** work with real data

#### **C. Complete User Workflow Validation**
For EVERY user role (client, agent, admin), verify:
1. **User can access their dashboard** - loads without errors
2. **User can view list pages** - data displays correctly
3. **User can view detail pages** - all fields populate
4. **User can perform CRUD operations** - create, read, update, delete all work
5. **User can navigate between pages** - all links work
6. **User workflows are end-to-end complete**:
   - Client: Browse → View → Save → Schedule → Contact
   - Admin: List → View → Edit → Delete → Status Change
   - Agent: Leads → Properties → Transactions → Communications

#### **D. Backend Functionality Verification**
1. **Test ALL API endpoints** actually return data
2. **Verify database operations** (create, read, update, delete)
3. **Check authentication/authorization** works correctly
4. **Validate data persistence** (localStorage, database)
5. **Confirm real-time updates** if applicable
6. **Test error handling** for failed requests

#### **E. Frontend Access Verification**
1. **Every feature is visible** on the correct page
2. **Every button/link is accessible** to the right user role
3. **Every form field is editable** and validates correctly
4. **Every modal/dialog opens and closes** properly
5. **Every navigation item works** and goes to correct page
6. **Every data display renders** correctly with real data

#### **F. Critical Self-Assessment Questions**
Before claiming completion, answer these questions HONESTLY:

1. ❓ **Did I test this in an actual browser?**
   - If NO → NOT COMPLETE
2. ❓ **Did I check the browser console for errors?**
   - If NO → NOT COMPLETE
3. ❓ **Did I click through the entire user workflow?**
   - If NO → NOT COMPLETE
4. ❓ **Did I verify all methods/functions exist?**
   - If NO → NOT COMPLETE
5. ❓ **Can a real user actually accomplish the intended task?**
   - If NO or UNSURE → NOT COMPLETE
6. ❓ **Would this work if deployed to production right now?**
   - If NO or UNSURE → NOT COMPLETE
7. ❓ **Have I verified backend AND frontend work together?**
   - If NO → NOT COMPLETE
8. ❓ **Are there any assumptions I haven't verified?**
   - If YES → NOT COMPLETE until verified

#### **G. Completion Criteria Checklist**
A task is ONLY complete when ALL of these are TRUE:

- [ ] ✅ All code written and committed
- [ ] ✅ All files deployed to appropriate environment
- [ ] ✅ Tested in actual browser with DevTools open
- [ ] ✅ Zero JavaScript console errors
- [ ] ✅ All user workflows tested end-to-end
- [ ] ✅ All methods/functions verified to exist
- [ ] ✅ All API calls return expected data
- [ ] ✅ All database operations work correctly
- [ ] ✅ All UI elements visible and functional
- [ ] ✅ All navigation links work correctly
- [ ] ✅ All forms validate and submit correctly
- [ ] ✅ All modals/dialogs work correctly
- [ ] ✅ Mobile responsive design verified
- [ ] ✅ No broken images or missing resources
- [ ] ✅ Page loads in under 3 seconds
- [ ] ✅ Data persists correctly (localStorage/database)
- [ ] ✅ Error states display appropriately
- [ ] ✅ Loading states work correctly
- [ ] ✅ Can confidently demo to stakeholder right now
- [ ] ✅ Would recommend deploying to real users

#### **H. Reporting Standards**
When reporting completion status:

**NEVER say:**
- ❌ "100% complete" without browser testing
- ❌ "Everything works" without clicking through workflows
- ❌ "Ready for production" without end-to-end testing
- ❌ "Feature implemented" if only code is written but not tested

**ALWAYS say:**
- ✅ "Tested in browser, all workflows verified working"
- ✅ "End-to-end testing complete, found and fixed X bugs"
- ✅ "Browser console clean, no JavaScript errors"
- ✅ "Can confidently demo all features to stakeholder"
- ✅ "Ready for production deployment" (only after ALL checks pass)

**If bugs found during QA/QC:**
- ✅ Document the bugs found
- ✅ Fix all critical bugs before claiming completion
- ✅ Report actual completion percentage honestly
- ✅ Provide timeline for remaining bug fixes

#### **I. Consequences of Skipping QA/QC**
If you skip these checks and claim completion:
- 🚨 Stakeholder loses confidence in assessments
- 🚨 Bugs reach production and affect real users
- 🚨 Time wasted on emergency fixes
- 🚨 Project timelines become unreliable
- 🚨 Your credibility as a development assistant is damaged

#### **J. Example QA/QC Documentation**
After completing QA/QC, provide a report like this:

```markdown
## QA/QC Assessment Report

### Testing Performed:
✅ Opened in Chrome browser
✅ Checked DevTools Console - 0 errors
✅ Tested complete user workflow:
   - User browses properties ✅
   - User clicks property card ✅
   - Property detail page loads ✅
   - User saves property ✅
   - User schedules viewing ✅
   - User returns to dashboard ✅
   - Dashboard shows saved property ✅

### Method Verification:
✅ All service methods exist and are callable
✅ All imports resolve correctly
✅ All event handlers bound properly

### API Testing:
✅ GET /api/properties - returns data
✅ GET /api/properties/:id - returns single property
✅ POST /api/viewings - creates viewing request

### Issues Found:
❌ BUG: getProperty() method didn't exist
✅ FIXED: Added alias method
✅ RE-TESTED: All workflows now working

### Final Status:
✅ OPERATIONAL - Ready for production
✅ All user workflows verified working
✅ Zero console errors
✅ Can confidently demo to stakeholder
```

**This QA/QC assessment is MANDATORY before any completion claim.**
**Perform it EVERY TIME without exception.**

### **RULE 5: MANDATORY DEVELOPMENT PIPELINE (NEVER SKIP)**
**ALL code changes MUST flow through this pipeline. NO EXCEPTIONS.**

#### **A. Pipeline Flow (STRICT ORDER)**
```
LOCAL (Code Only) → GIT (GitHub) → STAGING (Firebase) → PROD (Firebase)
```

**Each stage is a mandatory checkpoint. You CANNOT skip stages.**

**CRITICAL: ALL functionality requires Firebase backend. NEVER test locally with static servers.**

#### **B. Environment Specifications**

| Environment | Location | Purpose | Backend | URL |
|-------------|----------|---------|---------|-----|
| **LOCAL** | Project directory | Code development only | ❌ NO TESTING | N/A |
| **GIT** | GitHub Repository | Source of truth & version control | N/A | `https://github.com/SirsiMaster/Assiduous` |
| **STAGING** | Firebase Staging Project | Full testing with Firebase backend | ✅ Complete | `https://assiduous-staging.web.app` |
| **PROD** | Firebase Production | Live production site | ✅ Complete | `https://assiduous-prod.web.app` |

#### **C. Development Workflow (MANDATORY STEPS)**

**Step 1: LOCAL Development (CODE ONLY)**
1. Make ALL changes in your local project directory
2. **DO NOT test locally** - Assiduous requires Firebase backend
3. **DO NOT start local servers** - Static servers cannot provide Firebase services
4. Review code for syntax errors and obvious issues
5. Ensure imports and paths are correct
6. Run linters if available

**Step 2: Commit to GIT (GitHub)**
1. Review all changes: `git status` and `git diff`
2. Stage changes: `git add .` (or specific files)
3. Commit with conventional message: `git commit -m "type(scope): description"`
4. Push to GitHub: `git push origin main`
5. Verify push succeeded: Check GitHub repository
6. **GitHub is now the source of truth**
7. Git hooks automatically update metrics

**Step 3: Deploy to STAGING (Firebase)**
1. Copy changed files to `firebase-migration-package/assiduous-build/`
2. Maintain exact directory structure
3. Navigate to staging directory: `cd firebase-migration-package/assiduous-build`
4. Deploy to staging: `firebase use staging && firebase deploy`
5. **Wait for deployment to complete**
6. Open staging in browser: `https://assiduous-staging.web.app`
7. Run RULE 4 QA/QC assessment (full browser testing with Firebase backend)
8. Test ALL user workflows end-to-end
9. Verify Firebase services (Auth, Firestore, Storage, Functions)
10. Check browser console for errors
11. Test on mobile/responsive view
12. Fix ALL bugs found and repeat from Step 1

**Step 4: Deploy to PROD (Firebase)**
1. **ONLY after staging validation is 100% complete**
2. Ensure all changes committed to GitHub
3. Switch to production: `firebase use production`
4. Deploy to production: `firebase deploy`
5. Wait for deployment to complete
6. Verify deployment at https://assiduous-prod.web.app
7. Test critical user workflows in production
8. Monitor Firebase console for errors
9. Check analytics and metrics
10. Update deployment logs

#### **D. Pipeline Rules (ABSOLUTE)**

**NEVER:**
- ❌ Test locally with `python -m http.server` or any static server
- ❌ Test locally without Firebase backend
- ❌ Deploy to production without staging validation
- ❌ Deploy to Firebase without committing to GitHub first
- ❌ Make changes directly in `firebase-migration-package/assiduous-build/`
- ❌ Skip staging deployment and testing
- ❌ Push broken code to GitHub
- ❌ Bypass QA/QC assessment
- ❌ Claim features work without testing in staging

**ALWAYS:**
- ✅ Write code locally (Step 1)
- ✅ Commit to GitHub (Step 2)
- ✅ Deploy to staging Firebase (Step 3)
- ✅ Test in staging with full Firebase backend (Step 3)
- ✅ Run RULE 4 QA/QC in staging browser (Step 3)
- ✅ Fix bugs and repeat Steps 1-3 until perfect (Step 3)
- ✅ Deploy to production ONLY after staging is 100% validated (Step 4)
- ✅ Document what changed in commits
- ✅ Verify deployment succeeded in production

#### **E. Validation Requirements Per Stage**

**LOCAL Stage Validation:**
- ✅ Code written and syntax checked
- ✅ Imports and paths are correct
- ✅ No obvious syntax errors
- ✅ Linting passes (if configured)
- ✅ Code follows project conventions
- ✅ **NO FUNCTIONAL TESTING** - requires Firebase backend

**GIT Stage Validation:**
- ✅ All changes committed with proper conventional commit message
- ✅ Push succeeded to GitHub
- ✅ GitHub repository reflects latest changes
- ✅ No merge conflicts
- ✅ Commit history is clean and logical
- ✅ Git hooks ran successfully
- ✅ Metrics updated automatically

**STAGING Stage Validation (CRITICAL - FULL TESTING HERE):**
- ✅ Files copied correctly to assiduous-build/
- ✅ Directory structure matches production
- ✅ Deployed successfully to Firebase staging
- ✅ **Opened in browser**: https://assiduous-staging.web.app
- ✅ **Browser DevTools Console**: Zero JavaScript errors
- ✅ **Firebase Auth**: Login/logout works correctly
- ✅ **Firestore**: Data loads and saves correctly
- ✅ **Cloud Functions**: API calls succeed
- ✅ **Storage**: File uploads work (if applicable)
- ✅ **All user workflows**: Tested end-to-end in browser
- ✅ **Mobile responsive**: Tested on responsive view
- ✅ **Navigation**: All links work correctly
- ✅ **Forms**: Submit and validate correctly
- ✅ **Real-time updates**: Firestore listeners working
- ✅ **Performance**: Page load < 3 seconds
- ✅ **Production-ready quality**: No known bugs
- ✅ **RULE 4 QA/QC**: Full assessment completed

**PROD Stage Validation:**
- ✅ Firebase deployment succeeded
- ✅ All pages accessible at https://assiduous-prod.web.app
- ✅ Critical user workflows tested in production
- ✅ No errors in Firebase console logs
- ✅ Analytics and metrics tracking works
- ✅ Performance is acceptable (page load < 3s)
- ✅ Monitoring alerts configured
- ✅ Rollback plan ready if needed

#### **F. Emergency Hotfix Process**

For CRITICAL production bugs only:

1. Fix locally and test immediately
2. Commit to GitHub with `hotfix:` prefix
3. **MAY skip staging verification if truly urgent**
4. Deploy directly to Firebase
5. Verify hotfix works in production
6. Document why staging was skipped
7. Backfill staging after hotfix

**Criteria for emergency hotfix:**
- Production is completely broken
- Security vulnerability discovered
- Data loss occurring
- Revenue-impacting bug

**NOT emergency hotfixes:**
- UI cosmetic issues
- Feature requests
- Performance optimization
- Nice-to-have improvements

#### **G. Development Server Management**

**Start local development server:**
```bash
# From project root
cd /Users/thekryptodragon/Development/assiduous
python -m http.server 8080
```

**Access application locally:**
```bash
open http://localhost:8080/assiduousflip/
open http://localhost:8080/firebase-migration-package/assiduous-build/
```

**Stop server:**
```bash
# Press Ctrl+C in terminal
```

#### **H. Commit & Promotion Documentation**

When promoting through pipeline, document:

```markdown
## Promotion: DEV → TEST
**Date**: 2025-10-06
**Changes**:
- Added PropertyService with getProperty() method
- Created client properties browse page
- Created client property detail page

**DEV Testing**:
✅ All pages load without errors
✅ Browser console clean
✅ All links work
✅ Mobile responsive verified

**TEST Verification**:
✅ No regressions detected
✅ Integration with existing code successful
✅ Ready for STAGING promotion
```

#### **I. Pipeline Violations**

If pipeline is bypassed:
- 🚨 Changes may break production
- 🚨 No way to verify changes work
- 🚨 No rollback plan
- 🚨 No audit trail
- 🚨 Stakeholder trust damaged

**If you bypass pipeline:**
1. Stop immediately
2. Revert unauthorized changes
3. Start over from DEV
4. Follow pipeline correctly

#### **J. GitHub as Source of Truth**

**CRITICAL: GitHub is the single source of truth**

- All code in `environments/dev/` is work-in-progress
- All code in `firebase-migration-package/assiduous-build/` is committed to GitHub
- GitHub main branch = what's in production
- Never deploy to Firebase without pushing to GitHub first

**Deployment flow:**
```
DEV → TEST → STAGING → assiduous-build → GitHub → Firebase
```

#### **K. CI/CD Integration**

Once changes are in GitHub:

1. **GitHub Actions triggered automatically**
2. **Automated tests run** (when available)
3. **Firebase deployment happens** (manual trigger currently)
4. **Deployment verification** (manual currently)
5. **Metrics updated** (automated)

**Future automation goals:**
- Automated testing on GitHub push
- Automated Firebase deployment on main branch
- Automated smoke tests post-deployment
- Automated rollback on failure

**These pipeline rules apply to ALL repositories and ALL development work, current and future.**

---

## Essential Commands

### Development Server
```bash
# Start local development server (choose one)
python -m http.server 8080           # Basic Python server
python serve.py                      # If serve.py exists

# Access application
open http://localhost:8080/assiduousflip/
```

### Git Hooks Setup
```bash
# Install git hooks (required after cloning)
./scripts/hooks/install.sh

# This configures:
# - Conventional commit message validation
# - Commit template from .gitmessage
```

### Version Management
```bash
# Create a new release tag
./scripts/rollback/create_tag.sh 0.2.0 "AI integration release"

# Update changelog (prompts for version)
./scripts/changelog/update_changelog.sh [version]

# Rollback to previous version
./scripts/rollback/rollback_to_tag.sh v0.1.0
```

### Git Operations
```bash
# View available tags
git tag -l | sort -V

# Push tags to remote
git push origin --tags

# Emergency commit bypass (use sparingly)
git commit --no-verify
```

## Architecture Overview

Assiduous is an AI-powered real estate platform with dual-purpose architecture:

### Current Stack (Firebase Migration Complete - Sep 6, 2025)
- **Frontend**: Firebase Hosting (assiduous-prod.web.app)
- **Backend**: Firebase (Firestore DB, Authentication, Cloud Storage, Functions)
- **API**: Cloud Functions at `https://us-central1-assiduous-prod.cloudfunctions.net/app`
- **Security**: AES-256-GCM encryption for sensitive fields + Firebase Security Rules
- **User Roles**: Unified "client" role (buyers/sellers) + "agent" role
- **State Management**: Client-side services (`assets/js/services/`)
- **Deployment Pipeline**: Local → GitHub (Source of Truth) → Firebase

### Business Model Priority
- **70% Focus**: Micro-Flipping Engine ($2-5K per deal)
- **30% Focus**: Traditional Real Estate (lead generation)

### Key Services
- `firebaseservice.js`: Core database operations with encryption
- `auth.js`: Authentication and session management  
- `crm.js`: Client relationship management
- `encryptionservice.js`: Field-level encryption layer

### Firebase Collections
- `users`: Encrypted user profiles (email, phone, SSN)
- `properties`: Listings with investment scoring
- `transactions`: Deal pipeline management
- `messages`: Communication logs
- `notifications`: Real-time alerts

## Project Conventions

### Commit Messages
Follow Conventional Commits specification:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Rules**:
- Use imperative mood ("add" not "added")
- Capitalize subject first letter
- No period at subject end
- Subject max 50 chars
- Body wrapped at 72 chars

### Branching Strategy
GitFlow-inspired model:
- `main` - Production code
- `develop` - Integration branch
- `staging` - Pre-production testing
- `feature/*` - New features
- `bugfix/*` - Bug fixes for develop
- `hotfix/*` - Emergency production fixes
- `release/*` - Release preparation
- `docs/*` - Documentation updates

Branch naming: `<type>/<issue-number>-<short-description>`

### Version Tags
Semantic versioning: `vMAJOR.MINOR.PATCH[-PRERELEASE]`
- Always create annotated tags
- Include release notes
- Update rollback_registry.md

## Component System (UPDATED - Using SirsiMaster Component Library)

### 🚨 IMPORTANT: Use SirsiMaster Component Library
Assiduous now uses components from the **SirsiMaster Component Library** for all UI elements:
- **Library Location**: `/Users/thekryptodragon/Development/sirsimaster-component-library`
- **NPM Package**: `@sirsimaster/component-library` (once published)
- **GitHub**: https://github.com/SirsiMaster/sirsimaster-component-library

### Using Library Components
```javascript
// Import from library (once installed)
import { Header, Sidebar, Card, Form } from '@sirsimaster/component-library';

// Or during development
import Header from '../sirsimaster-component-library/src/components/layout/Header';
```

### Legacy Components (To Be Migrated)
These local components should be migrated to the library:
- `assiduousflip/components/admin-header.html` - Migrate to library `Header`
- `assiduousflip/components/admin-header.js` - Migrate to library `Header`
- `assiduousflip/components/admin-layout.css` - Migrate to library theme system
- `assiduousflip/components/sidebar.html` - Migrate to library `Sidebar`
- `assiduousflip/components/sidebar.js` - Migrate to library `Sidebar`

### Migration Plan
1. Use library components for all new features
2. Gradually replace legacy components with library versions
3. Contribute Assiduous-specific improvements back to the library

### Benefits
- **90% reduction** in code duplication
- **Consistent UX** across all pages
- **Easy maintenance** - update once, apply everywhere
- **Automatic path resolution** for any directory depth
- **Mobile responsive** design built-in

### Usage Guidelines
- **ALL NEW PAGES** must use standardized components
- Use `[[BASE]]` token for path references in components
- Configure via data attributes, not custom code
- Follow naming convention: `page-identifier` for data-active

## Directory Structure

```
assiduous/
├── assiduousflip/
│   ├── components/         # Standardized UI components (NEW)
│   │   ├── admin-header.html    # Universal header template
│   │   ├── admin-header.js      # Header component loader
│   │   ├── admin-layout.css     # Shared admin styles
│   │   ├── sidebar.html         # Universal sidebar template
│   │   └── sidebar.js           # Sidebar component loader
│   ├── admin/              # Admin interface (15 pages)
│   ├── client/             # Client portal
│   └── index.html          # Main application entry point
├── assets/
│   ├── css/
│   │   └── styles.css      # Responsive design system
│   ├── js/
│   │   └── main.js         # Core application logic & AI features
│   └── images/             # Visual assets
├── docs/
│   ├── ASSIDUOUS_TECHNICAL_BLUEPRINT.md  # Product requirements document
│   └── BRANCH_PROTECTION_RULES.md        # Git workflow rules
├── scripts/
│   ├── hooks/              # Git hooks for commit validation
│   ├── changelog/          # Automated changelog generation
│   └── rollback/           # Version rollback utilities
├── .github/
│   ├── CONTRIBUTING.md     # Contribution guidelines
│   └── ISSUE_TEMPLATE/     # Issue templates
├── changelog.md            # Version history
├── ROLLBACK_REGISTRY.md    # Rollback procedures & history
└── .gitmessage             # Commit message template
```

## Development Workflow

### Initial Setup
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/Assiduous.git
cd assiduous

# Add upstream
git remote add upstream https://github.com/SirsiMaster/Assiduous.git

# Install git hooks
./scripts/hooks/install.sh
```

### Feature Development
```bash
# Update local develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/123-property-search

# Make changes and commit
git add .
git commit  # Uses template, follows conventions

# Keep branch updated
git fetch upstream
git rebase upstream/develop

# Push to fork
git push origin feature/123-property-search
```

### Release Process
```bash
# Update changelog
./scripts/changelog/update_changelog.sh 0.2.0

# Create and push tag
./scripts/rollback/create_tag.sh 0.2.0 "Feature release"
git push origin v0.2.0

# Update ROLLBACK_REGISTRY.md manually
```

### Emergency Rollback
```bash
# Quick rollback to stable version
./scripts/rollback/rollback_to_tag.sh v0.1.0

# Push rollback (after testing)
git push --force-with-lease origin main
```

## Key Development Tasks

### Adding New Features
1. Create feature branch from `develop`
2. Implement in appropriate directory (`src/` for HTML, `assets/js/` for logic)
3. Update internationalization strings in `main.js`
4. Test responsive design on mobile/desktop
5. Update documentation if needed
6. Submit PR against `develop` branch

### Debugging
```bash
# Check git hooks are working
git commit -m "bad message"  # Should fail

# View recent commits
git log --oneline -10

# Check current branch and status
git status
git branch --show-current
```

### Testing Changes
1. Start local server: `python -m http.server 8080`
2. Test in multiple browsers
3. Verify mobile responsiveness
4. Check both English and Spanish translations
5. Test AI features with demo data

## AI Integration Points

The codebase is prepared for AI model integration at these key points:

- **Property Matching**: `AppState.propertyData` in main.js ready for ML-ranked results
- **Market Analysis**: Metrics dashboard configured for real-time data feeds
- **Chatbot**: UI and state management ready for NLP backend connection
- **Valuations**: Form handlers prepared for API calls to valuation models
- **Image Analysis**: Property cards support computer vision metadata

Backend services should expose REST endpoints that the frontend JavaScript can consume via fetch API.

## Important Project Rules

### Architecture Rules
- **NEVER** store sensitive data in GitHub (use Firebase)
- **ALWAYS** encrypt sensitive fields before Firestore storage
- **USE** Firebase for all backend operations (no GitHub Actions for DB)
- **MAINTAIN** unified client role (no separate buyer/seller paths)
- **PRIORITIZE** micro-flipping features (70% of dev effort)

### Development Rules  
- **Frontend**: Pure HTML/CSS/JS served from Firebase Hosting
- **Backend**: Firebase only (Firestore, Auth, Storage)
- **Dependencies**: Use package.json (Firebase, Next.js ready)
- **Security**: Multi-layer (Auth → Rules → Encryption)
- **Testing**: Jest for unit tests, manual for integration

### Coding Standards
- Git hooks enforce commit message format
- Protected branches require PR reviews
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1)

## 🔗 DEFINITIVE APPLICATION URLS (ALWAYS USE THESE)

### Production URLs (Firebase Hosting)
**Primary Domain**: `https://assiduous-prod.web.app/`  
**Alternative Domain**: `https://assiduous-prod.web.app/`  
**API Endpoint**: `https://us-central1-assiduous-prod.cloudfunctions.net/app`

#### Main Application Pages
- **Landing Page**: https://assiduous-prod.web.app/
  - Login/Signup, micro-flipping features, 87% success rate showcase
- **Knowledge Base**: https://assiduous-prod.web.app/knowledge-base.html
  - Redirects to Admin Portal for integrated experience
- **Reports Center**: https://assiduous-prod.web.app/reports.html
  - Generate, schedule, export comprehensive reports
  - Weekly performance, monthly summary, sprint retrospectives

#### Admin Portal - Real Estate Operations
- **Admin Dashboard**: https://assiduous-prod.web.app/admin/dashboard.html
  - 1,247 properties, $2.4M monthly revenue, 89 agents, 34 pending transactions
- **Real Estate Analytics**: https://assiduous-prod.web.app/admin/analytics.html
  - $48.6M total sales volume, 342 properties sold, 12,384 active users
  - Sales funnel, agent performance, property type metrics
- **Market Analysis**: https://assiduous-prod.web.app/admin/market.html
  - $485K median price, 42 days on market, 3,542 active listings
  - Price trends, market segments, top performing areas
- **Properties Management**: https://assiduous-prod.web.app/admin/properties.html
  - 1,248 total properties (892 available, 234 pending, 122 sold)
  - $425K average price, property search and filtering
- **Agents Management**: https://assiduous-prod.web.app/admin/agents.html
  - 156 total agents (142 active), $12.4M total sales, 4.8 avg rating
  - Agent directory with specializations and performance metrics
- **Clients Management**: https://assiduous-prod.web.app/admin/clients.html
  - 3,842 total clients, 1,256 active, 89% satisfaction rate
  - Client directory with agent assignments and property portfolios
- **Transactions**: https://assiduous-prod.web.app/admin/transactions.html
  - $48.6M total volume, 342 transactions, 89 pending
  - Transaction tracking, status updates, reporting
- **Settings**: https://assiduous-prod.web.app/admin/settings.html
  - Company settings, notifications, security, integrations, API keys

#### Development Portal
- **Dev Dashboard**: https://assiduous-prod.web.app/admin/development/dashboard.html
  - Project totals: 50.25 hours, $7,988 cost, 196 commits, 38,957 files
  - Live activity tracking, development progress (75% overall)
- **Dev Analytics**: https://assiduous-prod.web.app/admin/development/analytics.html
  - 99.98% uptime, 1.8s page load, 200ms API response
  - Service performance metrics for Firebase services
- **Dev Documentation**: https://assiduous-prod.web.app/admin/development/docs.html
  - Technical blueprints, API reference, deployment guides
  - Unified platform architecture documentation
- **Dev Reports**: https://assiduous-prod.web.app/admin/development/reports.html
  - Sprint performance, GitHub activity, code quality metrics
  - Test coverage, deployment pipeline reports
- **Dev Costs**: https://assiduous-prod.web.app/admin/development/costs.html
  - Development cost tracking and analysis
- **Old Dashboard (Backup)**: https://assiduous-prod.web.app/admin/development/dashboard_old.html

#### Client Portal
- **Client Dashboard**: https://assiduous-prod.web.app/client/
  - Property search, saved properties, agent connections
  - Viewing schedules, offers, property valuations
  - Mortgage calculator, market analysis tools

#### Documentation Center
- **Main Docs**: https://assiduous-prod.web.app/docs/
  - Technical documentation, micro-flipping blueprint
  - Implementation checklist, development guides
  - Changelog, rollback registry, README
- **README (HTML)**: https://assiduous-prod.web.app/docs/readme.html

### GitHub Repository URLs
- **Main Repository**: https://github.com/SirsiMaster/Assiduous
- **Component Library**: https://github.com/SirsiMaster/sirsimaster-component-library
- **Implementation Checklist**: https://github.com/SirsiMaster/Assiduous/blob/main/docs/IMPLEMENTATION_CHECKLIST.md
- **Security Docs**: https://github.com/SirsiMaster/Assiduous/blob/main/docs/SECURITY.md
- **WARP Rules (This File)**: https://github.com/SirsiMaster/Assiduous/blob/main/warp.md
- **Actions/Workflows**: https://github.com/SirsiMaster/Assiduous/actions
- **Security Alerts**: https://github.com/SirsiMaster/Assiduous/security/dependabot
- **Releases**: https://github.com/SirsiMaster/Assiduous/releases

### Firebase Console URLs
- **Project Overview**: https://console.firebase.google.com/project/assiduous-prod/overview
- **Hosting**: https://console.firebase.google.com/project/assiduous-prod/hosting
- **Cloud Functions**: https://console.firebase.google.com/project/assiduous-prod/functions
- **Firestore Database**: https://console.firebase.google.com/project/assiduous-prod/firestore
- **Cloud Storage**: https://console.firebase.google.com/project/assiduous-prod/storage
- **Usage & Billing**: https://console.firebase.google.com/project/assiduous-prod/usage

### External Resources & CDNs
- **Google Fonts**: https://fonts.googleapis.com
- **Font Awesome Icons**: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/
- **Sirsi UI Library**: https://cdn.jsdelivr.net/gh/SirsiMaster/sirsi-ui@v0.1.1/dist/sirsi-ui.css
- **SirsiMaster Component Library**: https://cdn.jsdelivr.net/gh/SirsiMaster/sirsimaster-component-library@latest/dist/sirsimaster-ui.css
- **Unsplash Images**: Multiple property images from https://images.unsplash.com/

### Local Development URLs
```bash
# Start server first: python -m http.server 8080

# Main Pages
http://localhost:8080/assiduousflip/
http://localhost:8080/assiduousflip/admin/dashboard.html
http://localhost:8080/assiduousflip/client/
```

### URL Construction Rules for AI
**IMPORTANT**: When providing URLs, ALWAYS use this format:
- **Production**: `https://assiduous-prod.web.app/[path-to-file]`
- **Local Dev**: `http://localhost:8080/assiduousflip/[path-to-file]`
- File paths are case-sensitive
- Most HTML files are in `/assiduousflip/` subdirectory

## Quick Reference

### Essential Commands
| Task | Command |
|------|---------|
| Start dev server | `python -m http.server 8080` |
| Access app | `open http://localhost:8080/assiduousflip/` |
| Install deps | `npm install` |
| Run tests | `npm test` |
| Firebase deploy | `firebase deploy` |
| View logs | `git log --oneline -10` |
| Check branch | `git branch --show-current` |

### Firebase Setup & Deployment (PRODUCTION READY)

#### Project Details
- **Project ID**: assiduous-prod
- **Hosting URL**: https://assiduous-prod.web.app
- **API Endpoint**: https://us-central1-assiduous-prod.cloudfunctions.net/app
- **Console**: https://console.firebase.google.com/project/assiduous-prod

#### Deployment Commands
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting           # Deploy website files
firebase deploy --only functions         # Deploy Cloud Functions
firebase deploy --only firestore:rules   # Deploy database rules
firebase deploy --only storage           # Deploy storage rules

# View deployment logs
firebase functions:log

# Run local emulators for testing
firebase emulators:start
```

#### Deployment Pipeline (GitHub as Source of Truth)
```bash
# 1. Make changes locally
edit files...

# 2. Commit to GitHub (Source of Truth)
git add .
git commit -m "feat: add new feature"
git push origin main

# 3. Deploy from GitHub to Firebase
cd firebase-migration-package
firebase deploy

# 4. Verify deployment
curl https://assiduous-prod.web.app/assiduousflip/
```

#### Analytics & Monitoring
```bash
# View Firebase analytics in dev dashboard
open https://assiduous-prod.web.app/assiduousflip/admin/development/dashboard.html

# Check Firebase Console metrics
open https://console.firebase.google.com/project/assiduous-prod/usage

# Test API endpoints
curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/app/api/v1/verification \
  -H "Content-Type: application/json" \
  -d '{"buyerId": "test", "amountCents": 250000}'
```

## 🔥 Firebase Development Metrics Workflow

### Overview
The Firebase metrics system automatically tracks development sessions, costs, commits, and deployments with real-time dashboard updates.

### Development Session Workflow
```bash
# 1. Start Development Session (Track in local files/commits)
# All development data stays in GitHub as source of truth

# 2. Code & Commit (Enhanced metadata)
git add .
git commit -m "feat(dashboard): add new feature"  # Enhanced git hooks add metadata

# 3. Push & Deploy (Fully automated)
git push origin main  # GitHub Actions → Firebase deployment
#                    # GitHub webhook → Process commit data → Firebase metrics

# 4. View Metrics (Real-time from Firebase)
open http://localhost:8080/assiduousflip/admin/development/dashboard.html
```

### Firebase Collections Structure
```
Firestore Database:
├── development_sessions/     # Individual work sessions
│   ├── sessionId
│   ├── date (YYYY-MM-DD)
│   ├── duration (hours)
│   ├── costTracking.totalCost
│   └── metrics.commitsCreated
├── development_metrics/      # Daily aggregated data
│   ├── date (YYYY-MM-DD)
│   ├── hours, cost, commits
│   ├── velocity.commitsPerHour
│   └── totals.projectCost
├── git_commits/             # Commit tracking
│   ├── hash, message, author
│   ├── timestamp, filesChanged
│   └── metrics.linesAdded
├── project_milestones/      # Major achievements
│   └── version, description
└── deployment_logs/         # Firebase deployments
    ├── timestamp, success
    └── deployer, commitHash
```

### developmentmetricsservice API
```javascript
// Available service methods:
const metricsService = new developmentmetricsservice();

// Initialize Firebase connection
await metricsService.initialize();

// Log development session
await metricsService.createSession({
  sessionId: '20250907_001',
  date: '2025-09-07',
  duration: 4.0,
  costTracking: { totalCost: 1200 },
  metrics: { commitsCreated: 32 }
});

// Get dashboard data
const metrics = await metricsService.getDashboardMetrics();
console.log('Today cost:', metrics.today.cost);

// Get recent activity
const activity = await metricsService.getRecentActivity(10);
```

### Automation Status & Next Steps

#### Currently Automated ✅
- Firebase deployment via GitHub Actions
- Dashboard metrics display with fallback
- Daily cost calculations and aggregations
- Real-time chart updates on dashboard

#### Partially Implemented ⚠️
- Session data logging (manual populate script available)
- Firestore collections structure (schema ready)
- developmentmetricsservice (Firebase integration ready)

#### Needs Implementation ❌
- Enhanced git hooks for better commit metadata
- GitHub webhook integration for data processing
- Real-time GitHub-to-Firebase data synchronization
- Automatic GitHub commit analysis for time tracking

### Quick Setup Commands
```bash
# Populate historical session data
node assiduousflip/admin/development/populate_session_data.js

# Test Firebase connection
node -e "const service = new developmentmetricsservice(); service.initialize();"

# View live dashboard with Firebase metrics
python -m http.server 8080
open http://localhost:8080/assiduousflip/admin/development/dashboard.html

# Deploy latest changes to Firebase
cd firebase-migration-package/assiduous-build
firebase deploy --only hosting
```

### Cost Tracking Integration
```bash
# Development costs automatically calculated:
# - $300/hour development rate
# - Real-time session tracking
# - Monthly/weekly aggregations
# - Project total calculations

# View cost breakdown:
open https://assiduous-prod.web.app/assiduousflip/admin/development/costs.html

# Check Firebase usage costs:
open https://console.firebase.google.com/project/assiduous-prod/usage
```

### Environment Variables Required
```bash
# Development (.env.development)
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx
ENCRYPTION_KEY=xxx

# Production (.env.production)  
# Same structure, different values
```
