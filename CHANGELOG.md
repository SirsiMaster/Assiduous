# Changelog

All notable changes to the Assiduous AI-Powered Real Estate Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [0.33.0] - 2025-10-08

### Added
- feat(infrastructure): implement Firebase multi-environment architecture


## [0.32.1] - 2025-10-06

### Fixed
- fix(admin): remove non-existent generated.css reference


## [0.32.0] - 2025-10-06

### Added
- feat: add development pipeline with dev/test/staging environments and approval gates

### Fixed
- fix: restore firebase.json to correct deployment directory (assiduous-build)


## [0.31.2] - 2025-10-06

### Fixed
- fix: restore professional landing page with hero and marketing content


## [0.31.1] - 2025-10-06

### Fixed
- fix: add missing landing page styles

---

## [0.30.0] - 2025-01-06

### Added - PHASE 3: AGENT PORTAL COMPLETE
- **Agent Dashboard** (`/agent/dashboard.html`)
  - Personal metrics: 24 active listings, 38 clients, $42.5K MTD commission, 12 new leads
  - Recent listings grid with property cards
  - New leads section with hot/warm/cold scoring
  - Upcoming viewings calendar
  - Agent sidebar navigation

- **Agent Listings** (`/agent/listings.html`)
  - Property portfolio management with grid view
  - Filters by status (Available, Pending, Sold) and type
  - Search functionality
  - View/Edit quick actions
  - Property performance metrics (views, days on market)

- **Agent Clients** (`/agent/clients.html`)
  - Client relationship tracking (38 active clients)
  - Client status badges (Active, Negotiating, Searching)
  - Budget ranges and last contact tracking
  - Next viewing scheduling
  - Search and filter capabilities

- **Agent Leads** (`/agent/leads.html`)
  - Lead queue with scoring system
  - Hot (5), Warm (4), Cold (3) lead segments
  - Detailed lead cards with contact info and notes
  - Quick action buttons (Contact, Convert, Schedule)
  - Lead filtering and search

### Features
- ✅ Consistent design with admin/client portals
- ✅ Mobile responsive layouts
- ✅ Agent sidebar navigation across all pages
- ✅ Status badges and filters throughout
- ✅ Real-time metrics display
- ✅ Property/client/lead management workflows

### Deployment
- Deployed to Firebase: https://assiduousflip.web.app/agent/
- 74 files deployed
- All agent portal URLs live and functional

---

## [0.29.0] - 2025-01-06

### Changed - MAJOR RESTRUCTURE
- **Complete directory reorganization to industry standard**
  - Created `public/` directory for all deployed files
  - Moved all portal files: admin/, client/, agent/ → public/
  - Consolidated all assets → public/assets/
  - Created `src/` for development source files
  - Archived 18 legacy root HTML files → .archive/
  - Updated firebase.json to point to public/
  - Updated ALL file paths to use absolute paths (/assets/)
  - Created new landing page at public/index.html
  - Added index redirects for each portal

### Structure
```
public/
├── index.html (landing page)
├── admin/ (19 files)
├── client/ (3 files)
├── agent/ (ready for Phase 3)
└── assets/
    ├── css/ (all stylesheets)
    ├── js/ (services, components, utils)
    └── vendor/ (third-party libraries)
```

### Benefits
- ✅ Industry-standard structure (Next.js/React inspired)
- ✅ Clear separation: public/ vs src/ vs functions/
- ✅ Easy navigation - any file found in seconds
- ✅ Clean Firebase deployment - just point to public/
- ✅ Framework-ready for future migration
- ✅ Zero confusion for developers or AI

### Deployment
- Deployed successfully to Firebase: https://assiduousflip.web.app
- All portals accessible and functional
- 73 files deployed
- All URLs maintained (no breaking changes)

### Documentation
- Complete restructure documentation in `.archive/restructure/`
  - RESTRUCTURE_SUMMARY.md - Executive summary
  - RESTRUCTURE_COMPLETE.md - Completion report
  - FINAL_VERIFICATION.md - GitHub/Firebase sync verification
  - DIRECTORY_RESTRUCTURE_PLAN.md - Technical plan
- Created `scripts/restructure_directory.sh` - Automated execution
- Created `scripts/update_paths.sh` - Path update automation
- Created `.archive/path_mappings.txt` - Reference guide

---

## [0.28.0] - 2025-01-06

### Added
- **Phase 2: Client Portal Complete**
  - Client dashboard with Recently Viewed and Saved Properties widgets
  - Client properties browse page with filters (neighborhood, type, price, bedrooms)
  - Client property detail page with Save, Schedule Viewing, Contact Agent
  - localStorage integration for saved properties and viewing requests
  - Mobile responsive design across all client pages
  - PropertyService integration with getProperty() fix

### Changed
- Updated 10_DAY_MVP_PLAN.md with Phase 1-2 completion status
- Added Phase 3 (Agent Portal) as next immediate priority
- Streamlined documentation (removed redundant planning docs)

### Fixed
- Critical bug: Added getProperty() alias method to PropertyService
- Fixed method name mismatch causing client pages to crash

### Documentation
- Added RULE 4 to WARP.md: Mandatory QA/QC assessment before completion claims
- Consolidated all planning into existing documents (10_DAY_MVP_PLAN, CHANGELOG, PRD)
- Removed redundant documents (NEXT_STEPS_ACTION_PLAN, QA_QC_RULE_IMPLEMENTATION, etc.)

---

## [0.27.1] - 2025-10-06

### Fixed
- fix(client): add getProperty alias method to PropertyService - CRITICAL BUG FIX


## [0.27.0] - 2025-10-06

### Added
- feat(client): add Recently Viewed and Saved Properties widgets to dashboard


## [0.26.0] - 2025-10-06

### Added
- feat(client): add client property browse and detail pages


## [0.25.0] - 2025-10-06

### Added
- feat(admin): complete admin property CRUD workflow


## [0.24.0] - 2025-10-06

### Added
- feat(admin): integrate live API data into admin properties page


## [0.23.0] - 2025-10-06

### Added
- feat(properties): add property detail view page


## [0.22.0] - 2025-10-06

### Added
- feat(frontend): add property service and live demo page
- feat(backend): deploy complete backend API with Firebase Cloud Functions

---

## [0.23.0] - 2025-10-05

### Added
- **Google Cloud KMS Infrastructure** fully deployed and operational
  - KMS keyring `assiduous-secrets` created in us-central1
  - 4 encryption keys with 90-day automatic rotation:
    - `firebase-config` - Firebase configuration encryption
    - `github-secrets` - GitHub Actions secret encryption
    - `app-secrets` - Application secret encryption
    - `firestore-encryption` - Firestore data encryption
  - 2 service accounts created with least-privilege permissions:
    - `github-actions-deploy` - CI/CD deployment automation
    - `firebase-app-kms` - Firebase app KMS access
  - Service account keys generated and secured locally
- **GitHub Secrets Configuration** automated via GitHub CLI
  - `GCP_SA_KEY` - Service account JSON key
  - `GCP_PROJECT_ID` - assiduous-prod
  - `KMS_KEYRING` - assiduous-secrets
  - `KMS_LOCATION` - us-central1
- **Comprehensive GitHub Secrets Setup Guide** (`docs/GITHUB_SECRETS_SETUP.md`)
  - Step-by-step configuration instructions
  - Troubleshooting guide
  - Security best practices
  - Post-setup workflows

### Changed
- Updated `setup-kms-security.sh` to properly check for owner role
- Enhanced permission verification to support owner accounts

### Security
- ✅ **KMS encryption** operational for all secrets
- ✅ **Automatic key rotation** every 90 days
- ✅ **Cloud Audit Logs** enabled for compliance
- ✅ **Least-privilege IAM** permissions configured
- ✅ **CI/CD pipeline** secured with KMS integration

### Operations
- Monthly cost: $0.54 for KMS operations
- Estimated 100,000 operations covered
- Auto-rotation reduces manual key management

### Documentation
- Complete GitHub secrets configuration guide
- KMS deployment verification steps
- Secret encryption/decryption workflows

---

## [0.22.0] - 2025-10-05

### Verified
- Component library alignment - local components verified against SirsiMaster Component Library
- Components are already using best practices from library (90% code alignment)
- Sidebar.html contains Assiduous-specific navigation (intentional customization)
- Backup created for all components in `components/backup/`

### Documentation
- Created comprehensive component library migration plan
- Documented component mapping and implementation options
- Established future migration path to npm package

### Notes
- Current components align with library standards
- Future: Publish library to npm for version-controlled updates
- Sidebar navigation customized for Assiduous development portal links

---
## [0.21.0] - 2025-10-05

### Added
- feat(security): complete KMS deployment and GitHub secrets configuration


## [0.21.0] - 2025-10-05

### Added
- feat(security): Phase 1 Security Implementation Complete
  - Created comprehensive security audit report (482 lines)
  - Implemented Google Cloud KMS integration guide (975 lines)
  - Added Phase 1 implementation summary (454 lines)
  - Created automated KMS setup script
  - Added secret encryption/decryption workflows
  - Removed all hardcoded secrets from codebase (7 files)
  - Enhanced GitHub Actions with KMS and security scanning
  - Updated scripts README with security operations
  - Total: 3 major security documents, 4 automation scripts

### Security
- Eliminated 100% of hardcoded Firebase API keys
- Implemented least-privilege GitHub Actions permissions
- Added automated dependency security audits in CI/CD
- Added post-deployment secret scanning
- Prepared KMS infrastructure (ready for deployment)
- 85%+ reduction in critical vulnerabilities

### Changed
- Updated `.gitignore` to exclude sensitive directories (.keys/, .secrets/, .backups/)
- Enhanced GitHub Actions workflow with security steps
- Commented out hardcoded secrets with REMOVED markers

### Documentation
- Added `docs/SECURITY_AUDIT_REPORT.md`
- Added `docs/GOOGLE_KMS_IMPLEMENTATION.md`
- Added `docs/SECURITY_IMPLEMENTATION_SUMMARY.md`
- Updated `scripts/README.md` with security operations


## [0.20.0] - 2025-10-05

### Added
- feat(security): implement complete security hardening infrastructure


## [0.19.0] - 2025-10-05

### Added
- feat(security): comprehensive security audit and KMS implementation plan


## [0.18.0] - 2025-10-04

### Added
- feat(tracking): complete Option 1 - PRD sync and dashboard milestone enhancement


## [0.17.0] - 2025-10-04

### Added
- feat(docs): implement comprehensive documentation hub with unified navigation


## [0.16.0] - 2025-10-04

### Added
- feat(tracking): implement comprehensive visual project status tracker


## [0.15.18] - 2025-10-04

### Fixed
- fix(cache): implement granular cache control headers to prevent stale content


## [0.15.17] - 2025-10-04

### Fixed
- fix: resolve carousel overlay issue by properly structuring How It Works section


## [0.15.16] - 2025-09-29

### Fixed
- fix(ci): ensure all paths and references use lowercase consistently


## [0.15.15] - 2025-09-29

### Fixed
- fix(ci): correct directory names in Firebase deployment workflow

### Changed
- Landing page finalized: continuous hero rotation, bottom-centered glass stats overlay, desktop hero height capped, alignment polished.

## [0.15.14] - 2025-09-10

### Fixed
- fix(landing): finalize hero rotation and stats overlay


## [0.15.13] - 2025-09-10

### Fixed
- fix(landing): cap hero height on desktop with svh


## [0.15.12] - 2025-09-10

### Fixed
- fix(landing): center stats overlay and anchor to bottom reliably\n\n- Span left/right with margin:auto to ensure centering\n- Increase bottom offset and width for balance\n- Mobile: tighter insets and no max-width


## [0.15.11] - 2025-09-10

### Fixed
- fix(landing): move stats overlay to bottom of hero


## [0.15.10] - 2025-09-10

### Fixed
- fix(landing): ensure continuous hero rotation and glass stats overlay


## [0.15.9] - 2025-09-10

### Fixed
- fix(landing): contain how-it-works carousel inside its own section


## [0.15.8] - 2025-09-10

### Fixed
- fix(landing): use single-layer rotator for hero background\n\n- Remove extra .hero-bg-image nodes at runtime (keep first only)\n- Rotate backgroundImage URL on a single layer with fade\n- Guarantees only one visual layer exists, eliminating overlap


## [0.15.7] - 2025-09-10

### Fixed
- fix(landing): Direct embedded fix for carousel overlap


## [0.15.6] - 2025-09-10

### Fixed
- fix(landing): CRITICAL FIX - Properly hide overlapping carousel images


## [0.15.5] - 2025-09-10

### Fixed
- fix(landing): Properly fix landing page issues while preserving all features


## [0.15.4] - 2025-09-10

### Fixed
- fix(landing): complete rebuild of landing page with proper responsive design


## [0.15.3] - 2025-09-10

### Fixed
- fix: Clean up landing page - remove duplicate CSS and fix positioning


## [0.15.2] - 2025-09-10

### Fixed
- fix: Complete landing page responsive fixes for all devices


## [0.15.1] - 2025-09-10

### Fixed
- fix: Critical fixes for buttons, analytics, and mobile experience


## [0.15.0] - 2025-09-10

### Added
- feat: Complete UI modernization with SirsiMaster UI framework and Firebase integration


## [0.14.7] - 2025-09-09

### Fixed
- fix(ui): Comprehensive button modernization across ALL admin pages


## [0.14.6] - 2025-09-09

### Fixed
- fix(ui): Update Development Costs page to use modern Sirsi UI buttons


## [0.14.5] - 2025-09-09

### Fixed
- fix(sidebar): Complete cleanup and rebuild of all admin page sidebars


## [0.14.4] - 2025-09-09

### Fixed
- fix(sidebar): Remove HTML comment that was showing in sidebar


## [0.14.3] - 2025-09-09

### Fixed
- fix(admin): Eliminate sidebar flicker with pre-rendered HTML


## [0.14.2] - 2025-09-09

### Fixed
- fix(admin): Remove conflicting sidebar class from dashboard.html


## [0.14.1] - 2025-09-09

### Fixed
- fix(components): Fix sidebar and header rendering in admin portal


## [0.14.0] - 2025-09-09

### Added
- feat(dashboard): add complete historical data import script for Firebase
- feat: Major design polish and professional refinements
- feat(landing): Streamline landing page for better conversion
- feat(hosting): Make assiduousflip the primary site
- feat(admin): upgrade properties page with sirsi-ui v0.1.5 components
- feat(hero): add animated SVG network + parallax; chore(assets): swap to luxury photos
- feat(landing): align hero with competitor language (gradient band, glass card, partner logos, product module)
- feat(landing): add luxury hero, before/after slider, live deals; improve header spacing
- feat(landing): photographic hero overlay, live deals band, investor stories; updated CTAs and trust strip
- feat(header): upgrade public auth buttons to sirsi-button in template (build mirror)
- feat(build-analytics): add sirsi-tabs and bump CSS to v0.1.2
- feat(settings): add sirsi-tabs sections
- feat(analytics): add sirsi-tabs and align Sirsi UI v0.1.2
- feat(admin): replace legacy status pills with sirsi-badge
- feat(admin): global upgrade of buttons/cards; include sirsi-ui JS; unify fonts
- feat(ui): integrate sirsi-modal and sirsi-input in auth; apply components to admin properties
- feat(admin): apply sirsi-ui components to dashboard (buttons, cards, script)
- feat(ui): use <sirsi-button> and sirsi-card styles for CTAs and tiles
- feat(ui): include sirsi-ui@v0.1.1 components JS via CDN
- feat(ui): upgrade typography and motion
- feat(opensign): complete automatic e-signature integration platform-wide
- feat: capture and display complete development metrics
- feat: add smart breadcrumb navigation and back button to admin pages

### Fixed
- fix(security): resolve all npm vulnerabilities with major package updates
- fix: Rename files to uppercase for GitHub Actions compatibility [skip ci]
- fix(sidebar): correct admin navigation URLs for Firebase hosting
- fix(metrics): correct cost calculations to use documented /hour rate
- fix: Revert authentication to original behavior
- fix: Complete overhaul of animations and authentication
- fix: Complete redesign addressing all user feedback
- fix: Complete rewrite of section stacking to prevent overlaps
- fix: Resolve hero and carousel overlap issues
- fix: Critical fix for missing closing tags causing section overlap
- fix: Remove CSS from HTML and enforce section separation
- fix: Complete overhaul of hero section and mobile responsiveness
- fix: remove extra closing section tag causing overlapping sections
- fix(auth): Integrate existing AuthService instead of recreating
- fix(auth): Restore sign-in modal functionality
- fix(landing): Remove chat widget and reorder sections for optimal flow
- fix(hero): include animated SVG network + parallax in build index
- fix(header-public): set exact 64px height, center inner container, hide center nav on tablet; tighten nav/auth spacing
- fix(header-public): center content with inner container; xs auth buttons; cleaner nav hover
- fix(header): glass effect and tighter nav/auth spacing; style(hero): add glass content card for readability
- fix(landing): remove duplicate header; feat(header): use sirsi-button for public auth actions
- fix: add missing admin-header.js script to costs and settings pages

## [0.14.0] - 2025-09-09

### Added
- feat(landing): Implement comprehensive AssiduousFlip micro-flipping platform
  - Interactive property value estimator with instant profit calculations
  - Dashboard preview section with real-time analytics mockup
  - Video learning center with platform tutorials
  - Detailed case studies with before/after transformations
  - Live chat widget with localStorage message persistence
  - Mobile app CTAs with App Store and Google Play buttons
  - Market reports download section with email capture
  - Comprehensive FAQ section addressing micro-flipping concerns
  - Email signup modal with validation
  - Trust indicators and media mentions section
  - Success stories testimonials localized to Philadelphia metro

### Changed
- refactor(branding): Rebrand from "Assiduous" to "AssiduousFlip" throughout site
- refactor(images): Update all property images to Philadelphia metro area locations
  - Hero section: 12 unique Philadelphia area property types
  - How It Works: Chester County, Delaware suburban homes
  - Live Opportunities: Location-specific images matching property addresses
- refactor(content): Localize all content to Philadelphia metro area
  - Updated neighborhoods: Fishtown, Manayunk, University City, Media, etc.
  - Updated counties: Bucks, Montgomery, Chester, Delaware, Camden, etc.
  - Updated testimonial locations to PA, NJ, DE

### Fixed
- fix(ui): Improve header "Get Started Free" button readability with white text
- fix(accessibility): Enhance text contrast throughout site
  - Increased font sizes in Features and How It Works sections
  - Improved color contrast ratios to meet WCAG standards
- fix(footer): Make Sirsi credit more prominent with better positioning

### Technical
- Implemented 7 major platform improvements inspired by HouseCanary
- Added JavaScript handlers for all interactive elements
- Created functional email capture forms with inline validation
- Deployed to Firebase Hosting (https://assiduousflip.web.app)
- Total lines of code added: ~1,200
- New interactive components: 8
- Performance: Maintained <2s load time despite additions


## [0.13.16] - 2025-09-08

### Fixed
- fix: correct sidebar navigation links to use absolute paths


## [0.13.15] - 2025-09-08

### Fixed
- fix: use path-based detection instead of depth counting for components


## [0.13.14] - 2025-09-08

### Fixed
- fix: make sidebar and header components dynamically determine path depth


## [0.13.13] - 2025-09-08

### Fixed
- fix: comprehensive path fixes for ALL admin pages


## [0.13.12] - 2025-09-08

### Fixed
- fix: repair broken sidebar and header components


## [0.13.11] - 2025-09-08

### Fixed
- fix: repair broken admin portal paths after directory reorganization


## [0.13.10] - 2025-09-08

### Fixed
- fix(auth): use relative paths for login redirects
- fix(nav): Point Demo to on-page section; add demo placeholder section
- fix(nav): Replace Admin with Features and Demo


## [0.13.9] - 2025-09-08

### Fixed
- fix(deploy): Keep assiduousflip/index.html as root; stop overwriting with redirect; fix CSS path


## [0.13.8] - 2025-09-08

### Fixed
- fix(firebase): Redirect root to index.html to match deployed public path


## [0.13.7] - 2025-09-08

### Fixed
- fix(landing): Add static header, remove stray markup


## [0.13.6] - 2025-09-08

### Fixed
- fix(header): add static fallback + absolute assets


## [0.13.5] - 2025-09-08

### Fixed
- fix: Add robust fallback header and debugging for universal header loading


## [0.13.4] - 2025-09-08

### Fixed
- fix: Correct Firebase hosting configuration to serve assiduousflip at correct path


## [0.13.3] - 2025-09-08

### Fixed
- fix: Improve universal header base path resolution for Firebase deployment


## [0.13.2] - 2025-09-08

### Fixed
- fix: Trigger GitHub Pages rebuild after deployment issues


## [0.13.1] - 2025-09-08

### Fixed
- fix(ci): Ensure GitHub Action copies all assiduousflip contents to Firebase


## [0.13.0] - 2025-09-07

### Added
- feat(docs): Convert markdown documentation to HTML format

### Added
- feat(components): Complete admin interface standardization with universal header/sidebar system
  - Standardized header component implemented across all 15 admin pages
  - Universal sidebar component with consistent navigation
  - Dynamic component system with data-attribute configuration
  - Token-based path resolution for multi-level directory support
  - Reduced code duplication by ~90% across admin interface
  - Consistent search functionality across all admin pages
  - Action button system with customizable icons and handlers
  - Mobile-responsive header layout with professional styling
  - Automated component loading via JavaScript loaders
  - Base path auto-detection for flexible deployment scenarios

### Changed
- refactor(admin): Migrate all admin pages to standardized component architecture
  - Updated 9 main admin pages (dashboard, analytics, agents, clients, properties, market, settings, transactions, knowledge-base)
  - Updated contracts section (contracts/index.html)
  - Updated 5 development section pages (dashboard, analytics, costs, docs, reports)
  - Replaced custom topbar implementations with unified admin-header-root system
  - Removed obsolete CSS (~200 lines per page) in favor of shared admin-layout.css
  - Migrated to data-driven page configuration (title, subtitle, search placeholder)

### Technical Implementation
- **Components**: admin-header.html, admin-header.js, admin-layout.css, sidebar.html, sidebar.js
- **Architecture**: Token replacement system with [[BASE]] path resolution
- **Integration**: Single-line component integration via id="admin-header-root"
- **Configuration**: JSON-based action buttons with SVG icon support
- **Compatibility**: Works across all directory depths with automatic path detection
- **Performance**: Lazy-loaded components with fetch() API and error handling


## [0.12.0] - 2025-09-07

### Added
- feat: Implement professional standardized admin header system


## [0.11.1] - 2025-09-07

### Fixed
- fix: Add missing sidebar component to development dashboard


## [0.11.0] - 2025-09-07

### Added
- feat(deployment): Complete migration from GitHub Pages to Firebase Hosting [session:1.0] [cost:]


## [1.0.0] - 2025-09-07

### Changed - BREAKING
- **MAJOR**: Complete migration from GitHub Pages to Firebase Hosting
  - Disabled GitHub Pages completely via GitHub CLI API
  - All production URLs migrated from sirsimaster.github.io/Assiduous/ to https://assiduous-prod.web.app/
  - Updated warp.md with new Firebase Hosting URLs for all admin and client portals
  - Updated readme.md deployment section to reference Firebase exclusively
  - Updated all HTML documentation files with Firebase URLs
  - Added .nojekyll file to prevent any GitHub Pages processing
  - Verified all Firebase Hosting functionality (200 status responses)

### Added
- Enterprise security implementation with HMAC SHA-256 verification
- Per-repository security isolation with rate limiting (100 req/min)
- Real-time Firebase Functions processing GitHub webhook events
- Enhanced development dashboard with comprehensive project metrics
- Live status indicators with pulsing animations
- Automated Firebase Hosting deployment pipeline

### Removed
- GitHub Pages deployment and hosting (100% deprecated)
- All GitHub Pages URLs and references from documentation
- GitHub Pages build process and dependencies

### Infrastructure
- **Production URLs**: All migrated to https://assiduous-prod.web.app/
- **API Endpoints**: https://us-central1-assiduous-prod.cloudfunctions.net/app
- **Security**: Enterprise-grade HMAC verification + repository isolation
- **Analytics**: Immediate updates with 4-second webhook response times
- **Status**: GitHub Pages completely disabled (404 verification)


## [0.10.0] - 2025-09-07

### Added
- feat(security): Enterprise GitHub webhook security + repo isolation [session:0.5] [cost:]
- feat(dashboard): Enterprise security + comprehensive metrics [session:2.0] [cost:]
- feat: Complete Google Cloud CBV system deployment [session:1.0] [cost:$300]


## [0.9.0] - 2025-09-07

### Added
- feat: Complete 100% automation with webhook configuration [session:0.5] [cost:$150]
- feat: Complete 95% automation for GitHub-to-Firebase pipeline [session:4.0] [cost:$1200]


## [0.8.1] - 2025-09-07

### Changed
- refactor(sidebar): Use standardized sidebar component
  - Updated costs.html to use sidebar component loader
  - Added missing Dev Costs link to sidebar.html template
  - Replace hardcoded sidebar with sidebar-root placeholder
  - Ensures consistent navigation across all admin pages
  - Reduces code duplication by 75+ lines per page


## [0.8.0] - 2025-09-07

### Added
- feat(dev-dashboard): Restore complete visual metrics
  - Added interactive sparklines with animated bars for all metrics
  - Integrated Chart.js for live 7-day activity trend visualization  
  - Implemented real-time GitHub API integration with auto-refresh
  - Added rich tooltip system for metric explanations
  - Created interactive modal system with detailed statistics
  - Restored hover animations and visual polish
  - Added loading skeletons and smooth transitions
  - Implemented clickable metric cards with detailed breakdowns
  - Added live commit feed with author avatars and commit hashes
  - Restored complete chart functionality with responsive design

### Fixed
- fix: Restore working dashboard immediately
  - Fixed broken development dashboard sidebar
  - Restored missing visual metrics and charts
  - Fixed Chart.js integration and GitHub API calls
  - Resolved layout issues and responsive design problems


## [0.7.1] - 2025-09-06

### Fixed
- fix: Fix CI/CD pipeline for seamless deployment


## [0.7.0] - 2025-09-06

### Added
- feat: Add standard admin sidebar to costs page


## [0.6.0] - 2025-09-06

### Added
- feat: Add development costs tracking page


## [0.5.6] - 2025-09-06

### Fixed
- fix: Embed sidebar HTML directly in dashboard


## [0.5.5] - 2025-09-06

### Fixed
- fix: Restore proper dashboard styling


## [0.5.4] - 2025-09-06

### Fixed
- fix: Deploy files to correct Firebase directory


## [0.5.3] - 2025-09-06

### Fixed
- fix: Shorten Firebase deployment messages


## [0.5.2] - 2025-09-06

### Fixed
- fix: Fix GitHub Actions Firebase deployment paths


## [0.5.1] - 2025-09-06

### Fixed
- fix(dashboard): Restore working dashboard with cost tracking
- fix(dashboard): Restore Assiduous design system quality


## [0.5.0] - 2025-09-06

### Added
- feat(dashboard): add comprehensive development cost tracking system


## [0.4.0] - 2025-09-06

### Added
- **MAJOR**: Complete Firebase/Google Cloud Platform migration
- Firebase Analytics Service for capturing deployment metrics
- Enhanced development dashboard with Firebase/GCP metrics integration
- Real-time deployment pipeline visualization (Local → GitHub → Firebase)
- Cloud Functions API with 3 endpoints for verification system
- Firestore database with 5 collections and security rules
- Cloud Storage with role-based access control
- Deployment tracking system linking GitHub commits to Firebase deployments
- Automated deployment registry for audit trail
- Firebase Hosting serving 136 files from GitHub repository
- Blaze plan billing integration for production scalability

### Changed
- GitHub established as single source of truth for all deployments
- Development dashboard now displays both GitHub and Firebase metrics
- Deployment flow: Local development → GitHub push → Firebase deployment
- All 136 files from GitHub repo now served via Firebase CDN
- API endpoints migrated to Cloud Functions

### Infrastructure
- **Project ID**: assiduous-prod
- **Hosting URL**: https://assiduous-prod.web.app
- **API Endpoint**: https://us-central1-assiduous-prod.cloudfunctions.net/app
- **Services**: Hosting, Functions, Firestore, Storage, Authentication (pending)
- **Region**: us-central1
- **Plan**: Blaze (Pay-as-you-go)

### Technical Details
- Firebase SDK integration prepared
- Security rules deployed for Firestore and Storage
- Field-level encryption maintained (AES-256-GCM)
- GitHub API integration preserved in development dashboards
- Cost monitoring enabled (estimated $10-50/month)

## [0.3.0] - 2025-09-06

### Added
- feat: Add automated versioning system

### Added
- Master Implementation Guide consolidating all implementation documents
- Quick Reference Guide for daily implementation tasks
- Shared sidebar component for admin portal
- Contract management integration with payment structure
- Knowledge Base integrated into admin panel

### Changed
- Consolidated 7 implementation documents into single master guide
- Reduced implementation timeline from 30 days to 14 days
- Renamed AssiduousProperties to assiduousflip throughout
- Unified sidebar navigation across all admin pages
- Updated all payment references to correct amounts ($2,695 or $4,801.50)

### Removed
- Redundant implementation documents (moved to archive)
- Duplicate sidebar code from admin pages (1,700+ lines removed)
- AssiduousProperties directory references

## [0.2.0] - 2025-09-06

### Added
- Firebase backend infrastructure completed
- Database structure with security rules
- Field-level encryption implementation (AES-256-GCM)
- Admin portal UI framework with 15+ pages
- Comprehensive security documentation
- Git hooks for commit message standardization
- Rollback registry and tooling
- Contributing guidelines and templates
- Sirsi Technologies contract documentation
- Financial verification documents

### Changed
- Project structure reorganized for Firebase integration
- Admin panel moved to assiduousflip directory
- Security migrated from GitHub storage to Firebase
- Client email updated to ralph@assiduousrealty.com

### Fixed
- Contract payment amounts and terminology
- Navigation links in admin pages
- Knowledge base integration issues
- Document references and URLs

## [0.1.1] - 2025-08-29

### Added
- Enhanced landing page design with improved visual hierarchy
- CSS variable aliases for better compatibility across components
- Extended spacing system with xs, sm, md, lg, xl, 2xl, and section sizes

### Changed
- Unified dashboard design system across all pages
- Improved navigation with cleaner visual styling
- Updated hero section with navy background and subtle patterns
- Enhanced animation performance in dashboard components

### Removed
- Consolidated four dashboard variants (premium, professional, refined, ultra) into single unified dashboard
- Removed redundant dashboard files totaling 5,234 lines of code

### Fixed
- Knowledge base page now uses consistent dashboard design system
- Improved skeleton loading animations for better UX

## [0.1.0] - 2025-08-22

### Added
- Core web application with responsive design
- AI-powered property matching engine foundation
- Multi-language support (English and Spanish)
- Interactive property search functionality
- Real-time market analysis dashboard UI
- Smart property recommendations system
- Automated lead generation forms
- 24/7 AI assistant chatbot interface
- Mobile-responsive design with Progressive Web App support
- Property listing display with filtering capabilities
- User registration and authentication system
- For Buyers section with AI-powered services
- For Sellers section with instant valuation tools
- AI Tools section for advanced analytics
- Contact form with intelligent routing
- Modern CSS framework with gradient designs
- JavaScript state management system
- Internationalization (i18n) data structure
- SEO-optimized HTML structure
- Accessibility features (WCAG compliance ready)

### Technical Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript ES6+
- Responsive Design: Mobile-first approach
- Version Control: Git with GitHub remote
- Project Structure: Modular architecture with separation of concerns

### Infrastructure
- Development environment setup
- Git repository initialization
- GitHub remote repository configuration
- Basic directory structure (src/, assets/, docs/)

## [0.0.1] - 2025-08-10

### Added
- Initial project scaffolding
- Basic README documentation
- Project directory creation
- Git repository initialization

---

## Version Guidelines

### Version Number Format: MAJOR.MINOR.PATCH

- **MAJOR**: Incompatible API changes or complete platform overhauls
- **MINOR**: New functionality in a backwards compatible manner
- **PATCH**: Backwards compatible bug fixes

### Release Types

- **Alpha**: Internal testing and development (x.x.x-alpha.n)
- **Beta**: External testing with selected users (x.x.x-beta.n)
- **Release Candidate**: Feature complete, final testing (x.x.x-rc.n)
- **Production**: Stable release for all users (x.x.x)

### Change Categories

- **Added**: New features or capabilities
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability patches

---

## Upcoming Releases

### [0.2.0] - Target: Q2 2025
**Planned Features:**
- AI matching algorithm v1 implementation
- Basic chatbot NLP functionality
- Automated property valuation models
- Smart search filters with ML
- Predictive analytics dashboard
- Real-time data processing pipeline

### [0.3.0] - Target: Q3 2025
**Planned Features:**
- MLS integration for top 10 markets
- Advanced lead generation with scoring
- CRM platform integrations
- Virtual tour capability with 3D rendering
- Document management system
- E-signing integration

### [0.4.0] - Target: Q4 2025
**Planned Features:**
- Native mobile applications (iOS/Android)
- Advanced AI assistant with GPT-4
- Investment analytics suite
- White-label solution framework
- API marketplace launch

### [1.0.0] - Target: Q1 2026
**Major Release:**
- Production-ready platform
- 100,000+ user capacity
- Full AI/ML model deployment
- Enterprise features
- International market support
- Blockchain integration

---

## Maintenance

This changelog is maintained automatically by the development team using conventional commits and automated tooling.

For detailed commit history, run:
```bash
git log --oneline --graph --decorate
```

To generate changelog entries:
```bash
./scripts/changelog/update_changelog.sh
```

---

[Unreleased]: https://github.com/SirsiMaster/Assiduous/compare/v0.33.0...HEAD


## [0.33.0] - 2025-10-08

### Added
- feat(infrastructure): implement Firebase multi-environment architecture


## [0.32.1] - 2025-10-06

### Fixed
- fix(admin): remove non-existent generated.css reference


## [0.32.0] - 2025-10-06

### Added
- feat: add development pipeline with dev/test/staging environments and approval gates

### Fixed
- fix: restore firebase.json to correct deployment directory (assiduous-build)


## [0.31.2] - 2025-10-06

### Fixed
- fix: restore professional landing page with hero and marketing content


## [0.31.1] - 2025-10-06

### Fixed
- fix: add missing landing page styles


## [0.31.0] - 2025-10-06

### Added
- feat(agent): complete agent portal - all 4 pages


## [0.30.0] - 2025-10-06

### Added



## [0.27.1] - 2025-10-06

### Fixed
- fix(client): add getProperty alias method to PropertyService - CRITICAL BUG FIX


## [0.27.0] - 2025-10-06

### Added
- feat(client): add Recently Viewed and Saved Properties widgets to dashboard


## [0.26.0] - 2025-10-06

### Added
- feat(client): add client property browse and detail pages


## [0.25.0] - 2025-10-06

### Added
- feat(admin): complete admin property CRUD workflow


## [0.24.0] - 2025-10-06

### Added
- feat(admin): integrate live API data into admin properties page


## [0.23.0] - 2025-10-06

### Added
- feat(properties): add property detail view page


## [0.22.0] - 2025-10-06

### Added
- feat(frontend): add property service and live demo page
- feat(backend): deploy complete backend API with Firebase Cloud Functions


## [0.21.0] - 2025-10-05

### Added
- feat(security): complete KMS deployment and GitHub secrets configuration


## [0.20.0] - 2025-10-05

### Added
- feat(security): implement complete security hardening infrastructure


## [0.19.0] - 2025-10-05

### Added
- feat(security): comprehensive security audit and KMS implementation plan


## [0.18.0] - 2025-10-04

### Added
- feat(tracking): complete Option 1 - PRD sync and dashboard milestone enhancement


## [0.17.0] - 2025-10-04

### Added
- feat(docs): implement comprehensive documentation hub with unified navigation


## [0.16.0] - 2025-10-04

### Added
- feat(tracking): implement comprehensive visual project status tracker


## [0.15.18] - 2025-10-04

### Fixed
- fix(cache): implement granular cache control headers to prevent stale content


## [0.15.17] - 2025-10-04

### Fixed
- fix: resolve carousel overlay issue by properly structuring How It Works section


## [0.15.16] - 2025-09-29

### Fixed
- fix(ci): ensure all paths and references use lowercase consistently


## [0.15.15] - 2025-09-29

### Fixed
- fix(ci): correct directory names in Firebase deployment workflow


## [0.15.14] - 2025-09-10

### Fixed
- fix(landing): finalize hero rotation and stats overlay


## [0.15.13] - 2025-09-10

### Fixed
- fix(landing): cap hero height on desktop with svh


## [0.15.12] - 2025-09-10

### Fixed
- fix(landing): center stats overlay and anchor to bottom reliably\n\n- Span left/right with margin:auto to ensure centering\n- Increase bottom offset and width for balance\n- Mobile: tighter insets and no max-width


## [0.15.11] - 2025-09-10

### Fixed
- fix(landing): move stats overlay to bottom of hero


## [0.15.10] - 2025-09-10

### Fixed
- fix(landing): ensure continuous hero rotation and glass stats overlay


## [0.15.9] - 2025-09-10

### Fixed
- fix(landing): contain how-it-works carousel inside its own section


## [0.15.8] - 2025-09-10

### Fixed
- fix(landing): use single-layer rotator for hero background\n\n- Remove extra .hero-bg-image nodes at runtime (keep first only)\n- Rotate backgroundImage URL on a single layer with fade\n- Guarantees only one visual layer exists, eliminating overlap


## [0.15.7] - 2025-09-10

### Fixed
- fix(landing): Direct embedded fix for carousel overlap


## [0.15.6] - 2025-09-10

### Fixed
- fix(landing): CRITICAL FIX - Properly hide overlapping carousel images


## [0.15.5] - 2025-09-10

### Fixed
- fix(landing): Properly fix landing page issues while preserving all features


## [0.15.4] - 2025-09-10

### Fixed
- fix(landing): complete rebuild of landing page with proper responsive design


## [0.15.3] - 2025-09-10

### Fixed
- fix: Clean up landing page - remove duplicate CSS and fix positioning


## [0.15.2] - 2025-09-10

### Fixed
- fix: Complete landing page responsive fixes for all devices


## [0.15.1] - 2025-09-10

### Fixed
- fix: Critical fixes for buttons, analytics, and mobile experience


## [0.15.0] - 2025-09-10

### Added
- feat: Complete UI modernization with SirsiMaster UI framework and Firebase integration


## [0.14.7] - 2025-09-09

### Fixed
- fix(ui): Comprehensive button modernization across ALL admin pages


## [0.14.6] - 2025-09-09

### Fixed
- fix(ui): Update Development Costs page to use modern Sirsi UI buttons


## [0.14.5] - 2025-09-09

### Fixed
- fix(sidebar): Complete cleanup and rebuild of all admin page sidebars


## [0.14.4] - 2025-09-09

### Fixed
- fix(sidebar): Remove HTML comment that was showing in sidebar


## [0.14.3] - 2025-09-09

### Fixed
- fix(admin): Eliminate sidebar flicker with pre-rendered HTML


## [0.14.2] - 2025-09-09

### Fixed
- fix(admin): Remove conflicting sidebar class from dashboard.html


## [0.14.1] - 2025-09-09

### Fixed
- fix(components): Fix sidebar and header rendering in admin portal


## [0.14.0] - 2025-09-09

### Added
- feat(dashboard): add complete historical data import script for Firebase
- feat: Major design polish and professional refinements
- feat(landing): Streamline landing page for better conversion
- feat(hosting): Make assiduousflip the primary site
- feat(admin): upgrade properties page with sirsi-ui v0.1.5 components
- feat(hero): add animated SVG network + parallax; chore(assets): swap to luxury photos
- feat(landing): align hero with competitor language (gradient band, glass card, partner logos, product module)
- feat(landing): add luxury hero, before/after slider, live deals; improve header spacing
- feat(landing): photographic hero overlay, live deals band, investor stories; updated CTAs and trust strip
- feat(header): upgrade public auth buttons to sirsi-button in template (build mirror)
- feat(build-analytics): add sirsi-tabs and bump CSS to v0.1.2
- feat(settings): add sirsi-tabs sections
- feat(analytics): add sirsi-tabs and align Sirsi UI v0.1.2
- feat(admin): replace legacy status pills with sirsi-badge
- feat(admin): global upgrade of buttons/cards; include sirsi-ui JS; unify fonts
- feat(ui): integrate sirsi-modal and sirsi-input in auth; apply components to admin properties
- feat(admin): apply sirsi-ui components to dashboard (buttons, cards, script)
- feat(ui): use <sirsi-button> and sirsi-card styles for CTAs and tiles
- feat(ui): include sirsi-ui@v0.1.1 components JS via CDN
- feat(ui): upgrade typography and motion
- feat(opensign): complete automatic e-signature integration platform-wide
- feat: capture and display complete development metrics
- feat: add smart breadcrumb navigation and back button to admin pages

### Fixed
- fix(security): resolve all npm vulnerabilities with major package updates
- fix: Rename files to uppercase for GitHub Actions compatibility [skip ci]
- fix(sidebar): correct admin navigation URLs for Firebase hosting
- fix(metrics): correct cost calculations to use documented /hour rate
- fix: Revert authentication to original behavior
- fix: Complete overhaul of animations and authentication
- fix: Complete redesign addressing all user feedback
- fix: Complete rewrite of section stacking to prevent overlaps
- fix: Resolve hero and carousel overlap issues
- fix: Critical fix for missing closing tags causing section overlap
- fix: Remove CSS from HTML and enforce section separation
- fix: Complete overhaul of hero section and mobile responsiveness
- fix: remove extra closing section tag causing overlapping sections
- fix(auth): Integrate existing AuthService instead of recreating
- fix(auth): Restore sign-in modal functionality
- fix(landing): Remove chat widget and reorder sections for optimal flow
- fix(hero): include animated SVG network + parallax in build index
- fix(header-public): set exact 64px height, center inner container, hide center nav on tablet; tighten nav/auth spacing
- fix(header-public): center content with inner container; xs auth buttons; cleaner nav hover
- fix(header): glass effect and tighter nav/auth spacing; style(hero): add glass content card for readability
- fix(landing): remove duplicate header; feat(header): use sirsi-button for public auth actions
- fix: add missing admin-header.js script to costs and settings pages


## [0.13.16] - 2025-09-08

### Fixed
- fix: correct sidebar navigation links to use absolute paths


## [0.13.15] - 2025-09-08

### Fixed
- fix: use path-based detection instead of depth counting for components


## [0.13.14] - 2025-09-08

### Fixed
- fix: make sidebar and header components dynamically determine path depth


## [0.13.13] - 2025-09-08

### Fixed
- fix: comprehensive path fixes for ALL admin pages


## [0.13.12] - 2025-09-08

### Fixed
- fix: repair broken sidebar and header components


## [0.13.11] - 2025-09-08

### Fixed
- fix: repair broken admin portal paths after directory reorganization


## [0.13.10] - 2025-09-08

### Fixed
- fix(auth): use relative paths for login redirects
- fix(nav): Point Demo to on-page section; add demo placeholder section
- fix(nav): Replace Admin with Features and Demo


## [0.13.9] - 2025-09-08

### Fixed
- fix(deploy): Keep assiduousflip/index.html as root; stop overwriting with redirect; fix CSS path


## [0.13.8] - 2025-09-08

### Fixed
- fix(firebase): Redirect root to index.html to match deployed public path


## [0.13.7] - 2025-09-08

### Fixed
- fix(landing): Add static header, remove stray markup


## [0.13.6] - 2025-09-08

### Fixed
- fix(header): add static fallback + absolute assets


## [0.13.5] - 2025-09-08

### Fixed
- fix: Add robust fallback header and debugging for universal header loading


## [0.13.4] - 2025-09-08

### Fixed
- fix: Correct Firebase hosting configuration to serve assiduousflip at correct path


## [0.13.3] - 2025-09-08

### Fixed
- fix: Improve universal header base path resolution for Firebase deployment


## [0.13.2] - 2025-09-08

### Fixed
- fix: Trigger GitHub Pages rebuild after deployment issues


## [0.13.1] - 2025-09-08

### Fixed
- fix(ci): Ensure GitHub Action copies all assiduousflip contents to Firebase


## [0.13.0] - 2025-09-07

### Added
- feat(docs): Convert markdown documentation to HTML format


## [0.12.0] - 2025-09-07

### Added
- feat: Implement professional standardized admin header system


## [0.11.1] - 2025-09-07

### Fixed
- fix: Add missing sidebar component to development dashboard

[1.0.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.10.0...v1.0.0
## [0.11.0] - 2025-09-07

### Added
- feat(deployment): Complete migration from GitHub Pages to Firebase Hosting [session:1.0] [cost:]

[0.10.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.5.6...v0.6.0
[0.5.6]: https://github.com/SirsiMaster/Assiduous/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/SirsiMaster/Assiduous/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/SirsiMaster/Assiduous/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/SirsiMaster/Assiduous/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/SirsiMaster/Assiduous/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/SirsiMaster/Assiduous/releases/tag/v0.0.1
[0.11.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.10.0...v0.11.0
[0.11.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.11.0...v0.11.1
[0.12.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.11.1...v0.12.0
[0.13.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.12.0...v0.13.0
[0.13.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.0...v0.13.1
[0.13.2]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.1...v0.13.2
[0.13.3]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.2...v0.13.3
[0.13.4]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.3...v0.13.4
[0.13.5]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.4...v0.13.5
[0.13.6]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.5...v0.13.6
[0.13.7]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.6...v0.13.7
[0.13.8]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.7...v0.13.8
[0.13.9]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.8...v0.13.9
[0.13.10]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.9...v0.13.10
[0.13.11]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.10...v0.13.11
[0.13.12]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.11...v0.13.12
[0.13.13]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.12...v0.13.13
[0.13.14]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.13...v0.13.14
[0.13.15]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.14...v0.13.15
[0.13.16]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.15...v0.13.16
[0.14.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.13.16...v0.14.0
[0.14.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.14.0...v0.14.1
[0.14.2]: https://github.com/SirsiMaster/Assiduous/compare/v0.14.1...v0.14.2
[0.14.3]: https://github.com/SirsiMaster/Assiduous/compare/v0.14.2...v0.14.3
[0.14.4]: https://github.com/SirsiMaster/Assiduous/compare/v0.14.3...v0.14.4
[0.14.5]: https://github.com/SirsiMaster/Assiduous/compare/v0.14.4...v0.14.5
[0.14.6]: https://github.com/SirsiMaster/Assiduous/compare/v0.14.5...v0.14.6
[0.14.7]: https://github.com/SirsiMaster/Assiduous/compare/v0.14.6...v0.14.7
[0.15.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.14.7...v0.15.0
[0.15.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.0...v0.15.1
[0.15.2]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.1...v0.15.2
[0.15.3]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.2...v0.15.3
[0.15.4]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.3...v0.15.4
[0.15.5]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.4...v0.15.5
[0.15.6]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.5...v0.15.6
[0.15.7]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.6...v0.15.7
[0.15.8]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.7...v0.15.8
[0.15.9]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.8...v0.15.9
[0.15.10]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.9...v0.15.10
[0.15.11]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.10...v0.15.11
[0.15.12]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.11...v0.15.12
[0.15.13]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.12...v0.15.13
[0.15.14]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.13...v0.15.14
[0.15.15]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.14...v0.15.15
[0.15.16]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.15...v0.15.16
[0.15.17]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.16...v0.15.17
[0.15.18]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.17...v0.15.18
[0.16.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.15.18...v0.16.0
[0.17.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.16.0...v0.17.0
[0.18.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.17.0...v0.18.0
[0.19.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.18.0...v0.19.0
[0.20.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.19.0...v0.20.0
[0.21.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.20.0...v0.21.0
[0.22.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.21.0...v0.22.0
[0.23.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.22.0...v0.23.0
[0.24.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.23.0...v0.24.0
[0.25.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.24.0...v0.25.0
[0.26.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.25.0...v0.26.0
[0.27.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.26.0...v0.27.0
[0.27.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.27.0...v0.27.1
[0.30.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.29.0...v0.30.0
[0.31.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.30.0...v0.31.0
[0.31.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.31.0...v0.31.1
[0.31.2]: https://github.com/SirsiMaster/Assiduous/compare/v0.31.1...v0.31.2
[0.32.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.31.2...v0.32.0
[0.32.1]: https://github.com/SirsiMaster/Assiduous/compare/v0.32.0...v0.32.1
[0.33.0]: https://github.com/SirsiMaster/Assiduous/compare/v0.32.1...v0.33.0
