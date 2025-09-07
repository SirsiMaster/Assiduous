# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential Commands

### Development Server
```bash
# Start local development server (choose one)
python -m http.server 8080           # Basic Python server
python serve.py                      # If serve.py exists

# Access application
open http://localhost:8080/AssiduousFlip/
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
- **Frontend**: Dual hosting - GitHub Pages + Firebase Hosting
- **Backend**: Firebase (Firestore DB, Authentication, Cloud Storage, Functions)
- **API**: Cloud Functions at `https://us-central1-assiduous-prod.cloudfunctions.net/app`
- **Security**: AES-256-GCM encryption for sensitive fields + Firebase Security Rules
- **User Roles**: Unified "client" role (buyers/sellers) + "agent" role
- **State Management**: Client-side services (`assets/js/services/`)
- **Deployment Pipeline**: Local → GitHub (Source of Truth) → Firebase/GCP

### Business Model Priority
- **70% Focus**: Micro-Flipping Engine ($2-5K per deal)
- **30% Focus**: Traditional Real Estate (lead generation)

### Key Services
- `FirebaseService.js`: Core database operations with encryption
- `auth.js`: Authentication and session management  
- `crm.js`: Client relationship management
- `EncryptionService.js`: Field-level encryption layer

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
- Update ROLLBACK_REGISTRY.md

## Directory Structure

```
assiduous/
├── AssiduousFlip/
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
├── CHANGELOG.md            # Version history
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

## 🔗 LIVE APPLICATION URLS (ALWAYS USE THESE)

### Production URLs (Firebase Hosting)
**Base URL**: `https://assiduous-prod.web.app/`

#### Main Application
- **Root Redirect**: https://assiduous-prod.web.app/
- **Landing Page (Login/Signup)**: https://assiduous-prod.web.app/
- **Knowledge Base**: https://assiduous-prod.web.app/knowledge-base.html
- **Reports**: https://assiduous-prod.web.app/reports.html

#### Admin Portal
- **Admin Dashboard**: https://assiduous-prod.web.app/admin/dashboard.html
- **Analytics**: https://assiduous-prod.web.app/admin/analytics.html
- **Properties Management**: https://assiduous-prod.web.app/admin/properties.html
- **Client Management**: https://assiduous-prod.web.app/admin/clients.html
- **Agent Management**: https://assiduous-prod.web.app/admin/agents.html
- **Transactions**: https://assiduous-prod.web.app/admin/transactions.html
- **Market Analysis**: https://assiduous-prod.web.app/admin/market.html
- **Settings**: https://assiduous-prod.web.app/admin/settings.html

#### Development/Test Pages
- **Dev Dashboard**: https://assiduous-prod.web.app/admin/development/dashboard.html
- **Dev Analytics**: https://assiduous-prod.web.app/admin/development/analytics.html
- **Dev Docs**: https://assiduous-prod.web.app/admin/development/docs.html
- **Dev Reports**: https://assiduous-prod.web.app/admin/development/reports.html
- **Old Dashboard (Backup)**: https://assiduous-prod.web.app/admin/development/dashboard_old.html

#### Client Portal
- **Client Dashboard**: https://assiduous-prod.web.app/client/

#### Documentation Pages
- **API Docs**: https://assiduous-prod.web.app/docs/
- **README (HTML)**: https://assiduous-prod.web.app/docs/readme.html

### GitHub Repository URLs
- **Repository Home**: https://github.com/SirsiMaster/Assiduous
- **Implementation Checklist**: https://github.com/SirsiMaster/Assiduous/blob/main/docs/IMPLEMENTATION_CHECKLIST.md
- **Security Docs**: https://github.com/SirsiMaster/Assiduous/blob/main/docs/SECURITY.md
- **WARP Rules (This File)**: https://github.com/SirsiMaster/Assiduous/blob/main/WARP.md
- **Actions/Workflows**: https://github.com/SirsiMaster/Assiduous/actions
- **Security Alerts**: https://github.com/SirsiMaster/Assiduous/security/dependabot

### Local Development URLs
```bash
# Start server first: python -m http.server 8080

# Main Pages
http://localhost:8080/AssiduousFlip/
http://localhost:8080/AssiduousFlip/admin/dashboard.html
http://localhost:8080/AssiduousFlip/client/
```

### URL Construction Rules for AI
**IMPORTANT**: When providing URLs, ALWAYS use this format:
- **Production**: `https://assiduous-prod.web.app/[path-to-file]`
- **Local Dev**: `http://localhost:8080/AssiduousFlip/[path-to-file]`
- File paths are case-sensitive
- Most HTML files are in `/AssiduousFlip/` subdirectory

## Quick Reference

### Essential Commands
| Task | Command |
|------|---------|
| Start dev server | `python -m http.server 8080` |
| Access app | `open http://localhost:8080/AssiduousFlip/` |
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
curl https://assiduous-prod.web.app/AssiduousFlip/
```

#### Analytics & Monitoring
```bash
# View Firebase analytics in dev dashboard
open https://assiduous-prod.web.app/AssiduousFlip/admin/development/dashboard.html

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
open http://localhost:8080/AssiduousFlip/admin/development/dashboard.html
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

### DevelopmentMetricsService API
```javascript
// Available service methods:
const metricsService = new DevelopmentMetricsService();

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
- DevelopmentMetricsService (Firebase integration ready)

#### Needs Implementation ❌
- Enhanced git hooks for better commit metadata
- GitHub webhook integration for data processing
- Real-time GitHub-to-Firebase data synchronization
- Automatic GitHub commit analysis for time tracking

### Quick Setup Commands
```bash
# Populate historical session data
node AssiduousFlip/admin/development/populate_session_data.js

# Test Firebase connection
node -e "const service = new DevelopmentMetricsService(); service.initialize();"

# View live dashboard with Firebase metrics
python -m http.server 8080
open http://localhost:8080/AssiduousFlip/admin/development/dashboard.html

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
open https://assiduous-prod.web.app/AssiduousFlip/admin/development/costs.html

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
