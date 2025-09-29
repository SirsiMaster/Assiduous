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

**These rules apply to ALL repositories and ALL development work, current and future.**

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
- **Frontend**: Firebase Hosting (assiduousflip.web.app)
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
**Primary Domain**: `https://assiduousflip.web.app/`  
**Alternative Domain**: `https://assiduous-prod.web.app/`  
**API Endpoint**: `https://us-central1-assiduous-prod.cloudfunctions.net/app`

#### Main Application Pages
- **Landing Page**: https://assiduousflip.web.app/
  - Login/Signup, micro-flipping features, 87% success rate showcase
- **Knowledge Base**: https://assiduousflip.web.app/knowledge-base.html
  - Redirects to Admin Portal for integrated experience
- **Reports Center**: https://assiduousflip.web.app/reports.html
  - Generate, schedule, export comprehensive reports
  - Weekly performance, monthly summary, sprint retrospectives

#### Admin Portal - Real Estate Operations
- **Admin Dashboard**: https://assiduousflip.web.app/admin/dashboard.html
  - 1,247 properties, $2.4M monthly revenue, 89 agents, 34 pending transactions
- **Real Estate Analytics**: https://assiduousflip.web.app/admin/analytics.html
  - $48.6M total sales volume, 342 properties sold, 12,384 active users
  - Sales funnel, agent performance, property type metrics
- **Market Analysis**: https://assiduousflip.web.app/admin/market.html
  - $485K median price, 42 days on market, 3,542 active listings
  - Price trends, market segments, top performing areas
- **Properties Management**: https://assiduousflip.web.app/admin/properties.html
  - 1,248 total properties (892 available, 234 pending, 122 sold)
  - $425K average price, property search and filtering
- **Agents Management**: https://assiduousflip.web.app/admin/agents.html
  - 156 total agents (142 active), $12.4M total sales, 4.8 avg rating
  - Agent directory with specializations and performance metrics
- **Clients Management**: https://assiduousflip.web.app/admin/clients.html
  - 3,842 total clients, 1,256 active, 89% satisfaction rate
  - Client directory with agent assignments and property portfolios
- **Transactions**: https://assiduousflip.web.app/admin/transactions.html
  - $48.6M total volume, 342 transactions, 89 pending
  - Transaction tracking, status updates, reporting
- **Settings**: https://assiduousflip.web.app/admin/settings.html
  - Company settings, notifications, security, integrations, API keys

#### Development Portal
- **Dev Dashboard**: https://assiduousflip.web.app/admin/development/dashboard.html
  - Project totals: 50.25 hours, $7,988 cost, 196 commits, 38,957 files
  - Live activity tracking, development progress (75% overall)
- **Dev Analytics**: https://assiduousflip.web.app/admin/development/analytics.html
  - 99.98% uptime, 1.8s page load, 200ms API response
  - Service performance metrics for Firebase services
- **Dev Documentation**: https://assiduousflip.web.app/admin/development/docs.html
  - Technical blueprints, API reference, deployment guides
  - Unified platform architecture documentation
- **Dev Reports**: https://assiduousflip.web.app/admin/development/reports.html
  - Sprint performance, GitHub activity, code quality metrics
  - Test coverage, deployment pipeline reports
- **Dev Costs**: https://assiduousflip.web.app/admin/development/costs.html
  - Development cost tracking and analysis
- **Old Dashboard (Backup)**: https://assiduousflip.web.app/admin/development/dashboard_old.html

#### Client Portal
- **Client Dashboard**: https://assiduousflip.web.app/client/
  - Property search, saved properties, agent connections
  - Viewing schedules, offers, property valuations
  - Mortgage calculator, market analysis tools

#### Documentation Center
- **Main Docs**: https://assiduousflip.web.app/docs/
  - Technical documentation, micro-flipping blueprint
  - Implementation checklist, development guides
  - Changelog, rollback registry, README
- **README (HTML)**: https://assiduousflip.web.app/docs/readme.html

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
- **Production**: `https://assiduousflip.web.app/[path-to-file]`
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
curl https://assiduousflip.web.app/assiduousflip/
```

#### Analytics & Monitoring
```bash
# View Firebase analytics in dev dashboard
open https://assiduousflip.web.app/assiduousflip/admin/development/dashboard.html

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
open https://assiduousflip.web.app/assiduousflip/admin/development/costs.html

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
