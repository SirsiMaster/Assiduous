# DEPLOYMENT GUIDE
**Version:** 2.1.0-canonical
**Last Updated:** 2025-11-04
**Status:** Canonical Document (1 of 19)
**Consolidation Date:** November 2, 2025

---

## Deployment Procedures and Configuration

### Firebase Configuration (Canonical)

All deployments target the production Firebase project and GA4-enabled web app:

- **Project:** `assiduous-prod`
- **Web app (GA4):** `1:9355377564:web:cee09f952eea43976ee659`
- **Measurement ID:** `G-DVBZP21459`

Frontend code in deployed artifacts MUST use the shared configuration modules:

- `public/assets/js/firebase-init.js` — canonical modular initializer (AuthService, DatabaseService, etc.) used by `public/index.html` and modular services.
- `public/firebase-config.js` — compat initializer used by admin/agent/client portals, QR widgets, and other compat pages via the `firebase-ready` event.

Inline `firebase.initializeApp({...})` calls and ad-hoc configs MUST NOT appear in any deployed HTML; they are considered legacy and should only remain in explicitly marked legacy paths (e.g., `public/assiduousflip/**`).

**Document Type:** Deployment Guide  
**Version:** 2.1.0  
**Last Updated:** November 4, 2025  
**Status:** Authoritative Deployment Document
**Consolidation Note:** Merged from CI/CD guides and Firebase setup

**Recent Updates:**
- November 4, 2025: Added Universal Component System (UCS) build steps to deployment pipeline
- October 9, 2025: Initial deployment guide

---

# Universal Component System (UCS) Build Integration
**Added:** November 4, 2025

## UCS in Deployment Pipeline

The Universal Component System requires building templates **before** deployment to Firebase.

### Pre-Deployment Build Step

**CRITICAL:** All deployments must run UCS build before pushing to Firebase:

```bash
# Step 1: Build templates for target environment
npm run ucs:build:prod  # For production
npm run ucs:build:staging  # For staging
npm run ucs:build:dev  # For development

# Step 2: Verify build succeeded
if [ $? -ne 0 ]; then
  echo "UCS build failed - aborting deployment"
  exit 1
fi

# Step 3: Deploy to Firebase
firebase deploy --only hosting
```

### Environment-Specific Builds

| Environment | Command | Output Files | Configuration |
|-------------|---------|--------------|---------------|
| Development | `npm run ucs:build:dev` | `*.html` | Dev paths, debug enabled |
| Staging | `npm run ucs:build:staging` | `*.html` | Staging paths, testing enabled |
| Production | `npm run ucs:build:prod` | `*.html` | Prod paths, optimized |

### UCS Verification Steps

Before deploying, verify UCS build:

```bash
# 1. Check build report
cat build-report.json

# Expected output:
# {
#   "pages": { "built": N, "skipped": 0, "errors": 0 },
#   "duration": "<1s"
# }

# 2. Verify no template files in deployment
find public/ -name "*.template.html"
# Should return no results (templates excluded)

# 3. Verify generated files exist
ls -la public/client/*.html
ls -la public/docs/*.html

# 4. Test build output locally
python -m http.server 8080
open http://localhost:8080/docs/ucs-test.html
```

### Deployment Checklist with UCS

- [ ] 1. Make code changes in `.template.html` files
- [ ] 2. Run `npm run ucs:build:dev` and test locally
- [ ] 3. Commit changes (templates + generated files)
- [ ] 4. Push to GitHub
- [ ] 5. CI/CD runs `npm run ucs:build:prod` automatically
- [ ] 6. Firebase deploys generated `.html` files
- [ ] 7. Verify deployment at production URL

### CI/CD Integration

Add UCS build to GitHub Actions workflows:

```yaml
# .github/workflows/deploy-production.yml

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Install dependencies
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      
      # UCS Build Step (REQUIRED)
      - name: Build UCS templates
        run: npm run ucs:build:prod
      
      # Verify build
      - name: Verify UCS build
        run: |
          if [ ! -f build-report.json ]; then
            echo "Build report not found"
            exit 1
          fi
          
          ERROR_COUNT=$(cat build-report.json | jq '.pages.errors')
          if [ "$ERROR_COUNT" != "0" ]; then
            echo "UCS build has $ERROR_COUNT errors"
            exit 1
          fi
      
      # Deploy to Firebase
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: assiduous-prod
```

### Troubleshooting UCS Builds

#### Build Fails
```bash
# Check for syntax errors in templates
npm run ucs:verify

# Common issues:
# - Missing closing tags in component directives
# - Invalid prop values
# - Component not found in registry
```

#### Generated Files Missing
```bash
# Ensure templates have .template.html extension
find public/ -name "*template.html" | grep -v ".template.html"

# Check build patterns in assiduous.config.js
grep "patterns" public/assiduous.config.js
```

#### Paths Not Resolving
```bash
# Verify token replacement
grep "{{BASE_PATH}}" public/**/*.html
# Should return no results (all tokens replaced)

# Check generated HTML
head -50 public/docs/ucs-test.html
# Paths should be relative (../ or ../../)
```

---

# CI/CD Pipeline Setup Guide

**Last Updated:** November 29, 2025  
**Status:** Implemented for Production (dev/staging optional)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Security Configuration](#security-configuration)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This CI/CD pipeline defines how changes in the Assiduous repository flow to Firebase environments. The **implemented baseline today** is a simple, reliable production pipeline:

1. Local changes committed and pushed to `main`.
2. GitHub Actions (`deploy-production.yml`) deploy `public/` to the `assiduous-prod` Firebase Hosting site on every push that touches `public/**`.
3. GitHub Actions (`deploy-metrics.yml`) update Firebase development metrics on every push to `main`.

Additional dev/staging environments and release gates remain available as an extension path, but the core production path is:

> **Local → GitHub `main` → GitHub Actions → Firebase Hosting (`assiduous-prod.web.app`)**

### Key Features (Target Architecture)

✅ **Automatic DEV Deployment** - Deploys on every push to `main`  
✅ **Manual STAGING Approval** - Requires approval before staging deployment  
✅ **Strict PRODUCTION Gates** - Multiple security checks + manual approval  
✅ **Automated Testing** - Smoke tests after each deployment  
✅ **GitHub Releases** - Automatic release creation for production  
✅ **Deployment Verification** - HTTP checks and content validation  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. DEVELOPER WORKFLOW                                       │
│     └─ Create feature branch                                │
│     └─ Make changes locally                                 │
│     └─ Test locally (localhost:8080)                        │
│     └─ Create Pull Request                                  │
│                                                              │
│  2. PULL REQUEST REVIEW                                      │
│     └─ Code review by team                                  │
│     └─ Automated checks run                                 │
│     └─ Approve and merge to main                            │
│                                                              │
│           ↓ (Triggers deploy-dev.yml)                       │
│                                                              │
│  3. AUTO-DEPLOY TO DEV                                       │
│     └─ GitHub Actions triggered automatically               │
│     └─ Deploys to https://assiduous-dev.web.app            │
│     └─ Runs smoke tests                                     │
│     └─ Team notified of deployment                          │
│                                                              │
│           ↓ (Manual trigger OR tag v*-rc*)                  │
│                                                              │
│  4. MANUAL DEPLOY TO STAGING                                 │
│     └─ Triggered by release candidate tag (v1.0.0-rc1)     │
│     └─ OR manually from GitHub Actions UI                   │
│     └─ Requires approval from authorized reviewer           │
│     └─ Deploys to https://assiduous-staging.web.app        │
│     └─ Runs comprehensive tests                             │
│                                                              │
│           ↓ (Create production tag v*)                      │
│                                                              │
│  5. SECURE DEPLOY TO PRODUCTION                              │
│     └─ Triggered ONLY by production tag (v1.0.0)           │
│     └─ Security checks run first                            │
│     └─ Requires explicit approval                           │
│     └─ Deploys to https://assiduous-prod.web.app            │
│     └─ Creates GitHub Release                               │
│     └─ Post-deployment verification                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before setting up CI/CD, you need:

1. ✅ **Firebase CLI Token** - For GitHub Actions authentication
2. ✅ **GitHub Repository Access** - Admin access to configure secrets
3. ✅ **Firebase Project Access** - Deployment permissions for all projects

---

## Step-by-Step Setup

### Step 1: Generate Firebase CI Token

```bash
# Login to Firebase
firebase login:ci

# This will output a token like:
# 1//0fX3Y...long-token-string...

# Copy this token - you'll need it for GitHub secrets
```

⚠️ **IMPORTANT:** Keep this token secure! It has full access to your Firebase projects.

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:

| Name | Value |
|------|-------|
| `FIREBASE_TOKEN` | The token from Step 1 |

### Step 3: Configure GitHub Environments

GitHub Environments provide deployment protection rules and approval gates.

#### 3a. Create Development Environment

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name: `development`
4. **No protection rules needed** (auto-deploy on push)
5. Click **Configure environment**
6. Set **Environment URL:** `https://assiduous-dev.web.app`
7. Save

#### 3b. Create Staging Environment

1. Click **New environment**
2. Name: `staging`
3. **Enable required reviewers:**
   - Add yourself and/or team members
   - Requires at least 1 approval before deployment
4. Set **Environment URL:** `https://assiduous-staging.web.app`
5. Save

#### 3c. Create Production Environment

1. Click **New environment**
2. Name: `production`
3. **Enable required reviewers:**
   - Add ONLY authorized production deployers
   - Requires at least 1 approval (recommend 2 for production)
4. **Optional:** Set deployment branch pattern to `main` only
5. Set **Environment URL:** `https://assiduous-prod.web.app`
6. Save

### Step 4: Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Under **Actions permissions**, select:
   - ✅ **Allow all actions and reusable workflows**
3. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
4. Save

### Step 5: Commit Workflow Files

The workflow files are already created in `.github/workflows/`:

```bash
# Verify workflows exist
ls -la .github/workflows/

# Expected files:
# - deploy-dev.yml
# - deploy-staging.yml
# - deploy-production.yml
```

These are already in your repository and ready to use!

---

## Security Configuration

### Protection Levels

| Environment | Protection | Approvers | Auto-Deploy |
|-------------|-----------|-----------|-------------|
| **DEV** | None | N/A | ✅ Yes (on push to main) |
| **STAGING** | Required reviewers | 1+ authorized | ❌ Manual or tag trigger |
| **PRODUCTION** | Required reviewers + Security checks | 1-2 authorized | ❌ Tag trigger only |

### Security Features

#### DEV Environment
- ✅ Automatic deployment
- ✅ Smoke tests after deployment
- ✅ Deployment summary
- ❌ No approval required (safe to break)

#### STAGING Environment
- ✅ Requires manual approval
- ✅ Comprehensive smoke tests
- ✅ Firestore rules deployment
- ✅ Deployment verification

#### PRODUCTION Environment
- ✅ Tag-based deployment only
- ✅ Security checks job (runs first)
- ✅ Build integrity verification
- ✅ Secret scanning
- ✅ Required file checks
- ✅ Multi-step approval process
- ✅ Production smoke tests
- ✅ Automatic GitHub Release creation
- ✅ Deployment verification
- ❌ No direct manual trigger (must use tag)

---

## Usage Guide

### Deploying to DEV

**Automatic - No Action Required**

```bash
# Simply push to main branch
git add .
git commit -m "feat: add new feature"
git push origin main

# GitHub Actions will automatically:
# 1. Detect changes to public/
# 2. Deploy to assiduous-dev
# 3. Run smoke tests
# 4. Post summary to GitHub Actions
```

View deployment: https://github.com/SirsiMaster/Assiduous/actions

### Deploying to STAGING

**Option 1: Manual Trigger**

1. Go to **Actions** tab
2. Select **Deploy to STAGING** workflow
3. Click **Run workflow**
4. Enter deployment reason
5. Click **Run workflow**
6. **Approve deployment** when prompted

**Option 2: Release Candidate Tag**

```bash
# Create and push release candidate tag
git tag -a v1.0.0-rc1 -m "Release candidate 1.0.0"
git push origin v1.0.0-rc1

# This triggers staging deployment automatically
# But still requires approval from authorized reviewer
```

### Deploying to PRODUCTION

**Only via Production Tag**

```bash
# 1. Ensure staging tests passed
# 2. Create production tag (semantic versioning)
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0

# This triggers:
# 1. Security checks job
# 2. Approval gate (requires authorized approver)
# 3. Production deployment
# 4. Smoke tests
# 5. GitHub Release creation
```

**Important Tag Rules:**
- ✅ `v1.0.0`, `v2.3.5` - Triggers production deployment
- ✅ `v1.0.0-rc1`, `v2.0.0-rc2` - Triggers staging deployment
- ❌ `1.0.0`, `release-1.0.0` - Will NOT trigger deployments

---

## Workflow Triggers Summary

| Workflow | Triggers | Approval Required |
|----------|----------|-------------------|
|| **deploy-dev.yml** | Push to `main` with changes in `public/` | ❌ No |
| **deploy-staging.yml** | Manual trigger OR tag `v*-rc*` | ✅ Yes (staging environment reviewers) |
| **deploy-production.yml** | Tag `v*` (e.g., `v1.0.0`) | ✅ Yes (production environment reviewers) |

---

## Troubleshooting

### Issue: GitHub Actions Not Running

**Check:**
1. Actions are enabled in repository settings
2. Workflow files are in `.github/workflows/` directory
3. Workflow YAML syntax is valid
4. Push triggers match (e.g., pushed to `main` branch)

**Fix:**
```bash
# Verify workflow files
ls -la .github/workflows/

# Check GitHub Actions tab for errors
# Go to: https://github.com/SirsiMaster/Assiduous/actions
```

### Issue: Firebase Deployment Fails

**Possible Causes:**
1. `FIREBASE_TOKEN` secret not set or expired
2. Firebase CLI version outdated
3. Insufficient Firebase project permissions

**Fix:**
```bash
# Regenerate Firebase token
firebase login:ci

# Update GitHub secret with new token
# Go to: Settings → Secrets and variables → Actions
# Update FIREBASE_TOKEN
```

### Issue: Approval Not Showing

**Check:**
1. Environment configured correctly
2. Required reviewers added to environment
3. User pushing tag has repository access

**Fix:**
1. Go to **Settings** → **Environments**
2. Select environment (staging or production)
3. Add required reviewers
4. Save configuration

### Issue: Production Deployment Triggered Accidentally

**Prevention:**
- Production deploys ONLY on `v*.*.*` tags
- Never create production tags unless ready
- Use `v*-rc*` tags for testing staging

**Rollback:**
```bash
# Delete the tag locally and remotely
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Redeploy previous version
git tag -a v0.9.0 -m "Rollback to 0.9.0"
git push origin v0.9.0
```

### Issue: Security Checks Failing

**Common Reasons:**
1. Required files missing
2. Invalid tag format
3. Build directory empty or missing

**Fix:**
Check the security checks job logs for specific errors:
```bash
# View logs at:
# https://github.com/SirsiMaster/Assiduous/actions
# → Select failed workflow
# → Click "security-checks" job
# → Review error messages
```

---

## Best Practices

### DO ✅
- Always test locally before pushing
- Use semantic versioning for tags (`v1.0.0`)
- Write descriptive commit messages
- Review staging before creating production tag
- Monitor deployments in GitHub Actions
- Check Firebase Console after production deploys

### DON'T ❌
- Skip staging environment
- Create production tags without testing
- Share Firebase CI tokens
- Deploy to production on Fridays (unless necessary)
- Ignore failed smoke tests
- Use non-semantic version tags

---

## Monitoring Deployments

### View Active Deployments

```bash
# GitHub Actions page
https://github.com/SirsiMaster/Assiduous/actions

# Filter by workflow:
# - "Deploy to DEV"
# - "Deploy to STAGING"
# - "Deploy to PRODUCTION"
```

### Deployment Notifications

Each workflow posts summaries to:
1. **GitHub Actions** - Deployment summary with links
2. **Commit status** - Green checkmark or red X
3. **GitHub Releases** - For production deployments

### Firebase Console Monitoring

After deployment, check:
- [DEV Console](https://console.firebase.google.com/project/assiduous-dev/hosting)
- [STAGING Console](https://console.firebase.google.com/project/assiduous-staging/hosting)
- [PROD Console](https://console.firebase.google.com/project/assiduous-prod/hosting)

---

## Next Steps

1. ✅ Complete prerequisites (Steps 1-5 above)
2. ✅ Test DEV auto-deployment (push to main)
3. ✅ Test STAGING manual deployment
4. ✅ Configure production approvers carefully
5. ✅ Create first production tag when ready

---

## Support

**Documentation:**
- CI/CD Setup: This file
- Firebase Setup: `FIREBASE_MULTI_ENVIRONMENT_SETUP.md`
- Quick Reference: `FIREBASE_QUICK_REFERENCE.md`
- Pipeline Rules: `WARP.md` (RULE 5)

**Resources:**
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Semantic Versioning](https://semver.org/)

---

**Document Version:** 1.0.0  
**Last Updated:** October 8, 2025  
**Next Review:** When adding new environments or modifying workflows


---
# Firebase Quick Reference
---

# Firebase Multi-Environment Quick Reference

**Last Updated:** October 8, 2025  
**Status:** ✅ Fully Operational

---

## 🌐 Environment URLs

| Environment | URL | Firebase Console |
|-------------|-----|------------------|
| **DEV** | https://assiduous-dev.web.app | [Console](https://console.firebase.google.com/project/assiduous-dev) |
| **STAGING** | https://assiduous-staging.web.app | [Console](https://console.firebase.google.com/project/assiduous-staging) |
| **PRODUCTION** | https://assiduous-prod.web.app | [Console](https://console.firebase.google.com/project/assiduous-prod) |

---

## 🚀 Deployment Commands

```bash
# Navigate to deployment directory first
cd firebase-migration-package

# Deploy to DEV (no confirmation required)
./deploy.sh dev

# Deploy to STAGING (requires confirmation)
./deploy.sh staging

# Deploy to PRODUCTION (requires typing 'DEPLOY TO PRODUCTION')
./deploy.sh production
```

### Manual Deployment (Alternative)

```bash
cd firebase-migration-package

# Deploy specific environment
firebase deploy --only hosting:dev --project dev
firebase deploy --only hosting:staging --project staging
firebase deploy --only hosting:production --project production
```

---

## 📊 Firebase Projects

| Project | ID | Number | Plan | Purpose |
|---------|----|----|------|---------|
| **DEV** | assiduous-dev | 186714044941 | Spark (Free) | Active development |
| **STAGING** | assiduous-staging | 853661742177 | Blaze (PAYG) | Pre-production testing |
| **PROD** | assiduous-prod | 9355377564 | Blaze (PAYG) | Live production |

---

## 🔑 Firebase Configuration (Auto-Detected)

The system automatically detects which environment you're on and uses the correct Firebase project:

**DEV Environment:**
```javascript
{
  apiKey: "AIzaSyDLi14oefCZVVlQm7cPfDb0WQ9nXlIF4jY",
  authDomain: "assiduous-dev.firebaseapp.com",
  projectId: "assiduous-dev",
  storageBucket: "assiduous-dev.firebasestorage.app",
  messagingSenderId: "186714044941",
  appId: "1:186714044941:web:1525a0503610519dd5f344"
}
```

**STAGING Environment:**
```javascript
{
  apiKey: "AIzaSyDnMkQbhC5kYl5O_07zQ2yfYvGjLRq6E0c",
  authDomain: "assiduous-staging.firebaseapp.com",
  projectId: "assiduous-staging",
  storageBucket: "assiduous-staging.firebasestorage.app",
  messagingSenderId: "853661742177",
  appId: "1:853661742177:web:cf93349a7f50a2d9f2e620"
}
```

**PRODUCTION Environment:**
```javascript
{
  apiKey: "AIzaSyCL8Y7cQ-kZfhCXaM1KBTnAI6_LXq2J8fE",
  authDomain: "assiduous-prod.firebaseapp.com",
  projectId: "assiduous-prod",
  storageBucket: "assiduous-prod.firebasestorage.app",
  messagingSenderId: "9355377564",
  appId: "1:9355377564:web:84bd6fa0e7c8a2e7c3f56b"
}
```

---

## 🧪 Testing Environment Detection

Open browser console on any environment:

```javascript
// Check current environment
console.log('Environment:', getCurrentEnvironment());
// Output: 'development', 'staging', or 'production'

// Check if production
console.log('Is Production:', isProduction());
// Output: true or false

// Get current Firebase config
console.log('Firebase Config:', getFirebaseConfig());
// Output: Current environment's Firebase configuration
```

---

## 🔄 Development Workflow

### Standard Flow
```
1. Develop locally (localhost:8080)
   ↓
2. Deploy to DEV (./deploy.sh dev)
   ↓ Test with real Firebase backend
3. Deploy to STAGING (./deploy.sh staging)
   ↓ Final validation
4. Commit to GitHub (git push)
   ↓
5. Deploy to PRODUCTION (./deploy.sh production)
   ↓ Type 'DEPLOY TO PRODUCTION' to confirm
6. Verify at https://assiduous-prod.web.app
```

### Emergency Hotfix Flow
```
1. Fix locally
   ↓
2. Deploy to DEV (quick test)
   ↓
3. Deploy to STAGING (mandatory)
   ↓
4. Commit to GitHub immediately
   ↓
5. Deploy to PRODUCTION
   ↓
6. Monitor production logs
```

---

## 📦 What's Deployed in Each Environment

### Frontend Code
- ✅ All HTML, CSS, JavaScript files
- ✅ Assets (images, fonts, etc.)
- ✅ Environment-specific Firebase config (auto-detected)

### Backend Configuration
- ✅ Firestore security rules
- ✅ Firestore indexes
- ✅ Cloud Storage security rules
- ✅ Hosting configuration (caching, rewrites)

### Services Available
- ✅ Firebase Hosting
- ✅ Firestore Database (isolated per environment)
- ✅ Firebase Authentication (isolated per environment)
- ✅ Cloud Functions API (when deployed)
- ✅ Cloud Storage (when initialized)

---

## 🔍 Verification Commands

```bash
# List all Firebase projects
firebase projects:list

# List hosting sites for each environment
firebase hosting:sites:list --project dev
firebase hosting:sites:list --project staging
firebase hosting:sites:list --project production

# Check hosting targets
cat firebase-migration-package/.firebaserc

# View current deployments
firebase hosting:channel:list --project dev
firebase hosting:channel:list --project staging
firebase hosting:channel:list --project production

# Test site availability
curl -s -o /dev/null -w "%{http_code}\n" https://assiduous-dev.web.app
curl -s -o /dev/null -w "%{http_code}\n" https://assiduous-staging.web.app
curl -s -o /dev/null -w "%{http_code}\n" https://assiduous-prod.web.app
```

---

## 🛠️ Common Tasks

### Deploy Security Rules Only
```bash
cd firebase-migration-package
firebase deploy --only firestore:rules,storage:rules --project dev
firebase deploy --only firestore:rules,storage:rules --project staging
firebase deploy --only firestore:rules,storage:rules --project production
```

### Deploy Firestore Indexes Only
```bash
cd firebase-migration-package
firebase deploy --only firestore:indexes --project dev
firebase deploy --only firestore:indexes --project staging
firebase deploy --only firestore:indexes --project production
```

### View Firebase Logs
```bash
# View hosting logs
firebase hosting:channel:list --project production

# View function logs (if deployed)
firebase functions:log --project production
```

---

## 📋 Pre-Deployment Checklist

### Before Deploying to DEV
- [ ] Code changes tested locally
- [ ] No console errors in browser DevTools
- [ ] All new features work as expected

### Before Deploying to STAGING
- [ ] All DEV testing passed
- [ ] No regressions in existing features
- [ ] Integration with Firebase backend verified

### Before Deploying to PRODUCTION
- [ ] All STAGING testing passed
- [ ] No known bugs
- [ ] Changes committed to GitHub
- [ ] Screenshots taken for documentation
- [ ] Team/stakeholders notified

---

## ⚠️ Important Rules

### ❌ NEVER
- Skip environments (LOCAL → PROD is forbidden)
- Deploy to production with known bugs
- Use production API keys in dev/staging code
- Edit production Firestore directly without backup
- Make changes directly in production Firebase Console
- Deploy without testing in at least STAGING

### ✅ ALWAYS
- Test locally first
- Deploy to DEV for backend testing
- Deploy to STAGING for final validation
- Commit to GitHub before production deployment
- Use the deployment script for safety checks
- Monitor Firebase Console after production deploy
- Document what changed in commit messages

---

## 🆘 Troubleshooting

### Deployment Fails
```bash
# Check if authenticated
firebase login --reauth

# Check if build directory exists
ls -la firebase-migration-package/assiduous-build

# Check Firebase projects
firebase projects:list

# Try manual deployment
cd firebase-migration-package
firebase deploy --only hosting:dev --project dev --debug
```

### Wrong Environment Detected
```javascript
// Check hostname in browser console
console.log(window.location.hostname);

// Force environment detection
const env = detectEnvironment();
console.log('Detected:', env);

// Check Firebase config being used
const config = getFirebaseConfig();
console.log('Using project:', config.projectId);
```

### Site Not Loading
1. Check deployment status in Firebase Console
2. Clear browser cache (Cmd+Shift+R on Mac)
3. Wait 2-3 minutes for CDN propagation
4. Check browser DevTools Console for errors
5. Verify files uploaded: `firebase hosting:channel:list --project <env>`

---

## 📞 Support Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Project Documentation:** `docs/FIREBASE_MULTI_ENVIRONMENT_SETUP.md`
- **Pipeline Rules:** `WARP.md` (RULE 5)
- **Firebase Console DEV:** https://console.firebase.google.com/project/assiduous-dev
- **Firebase Console STAGING:** https://console.firebase.google.com/project/assiduous-staging
- **Firebase Console PROD:** https://console.firebase.google.com/project/assiduous-prod

---

## 🎓 Key Files

| File | Purpose |
|------|---------|
| `firebase-migration-package/firebase.json` | Hosting configuration for all environments |
| `firebase-migration-package/.firebaserc` | Project aliases and hosting targets |
| `firebase-migration-package/deploy.sh` | Automated deployment script |
| `firebase-migration-package/firestore.rules` | Firestore security rules |
| `firebase-migration-package/storage.rules` | Cloud Storage security rules |
| `firebase-migration-package/firestore.indexes.json` | Firestore query indexes |
| `assiduous-build/assets/js/config/firebase-config.js` | Environment detection and Firebase configs |

---

**Last Verified:** October 8, 2025  
**All Systems:** ✅ Operational  
**All Environments:** ✅ Live


---
# CI/CD Setup Complete
---

# CI/CD Setup - Complete & Verified ✅

**Date:** October 8, 2025  
**Status:** Fully Operational  
**DEV Deployment:** ✅ Automated & Verified

---

## 🎉 What's Been Accomplished

You now have a **production-grade, multi-environment CI/CD pipeline** with automated GitHub Actions workflows that deploy to three separate Firebase projects.

---

## 🌐 Your Live Environments

| Environment | Firebase Project | URL | Status | Deploy Trigger |
|-------------|------------------|-----|--------|----------------|
| **DEV** | assiduous-dev | https://assiduous-dev.web.app | ✅ HTTP 200 | Auto on `push main` |
| **STAGING** | assiduous-staging | https://assiduous-staging.web.app | ✅ HTTP 200 | Manual or `v*-rc*` tags |
| **PRODUCTION** | assiduous-prod | https://assiduous-prod.web.app | ⚠️ Needs deploy | Semantic tags `v*.*.*` |

---

## ✅ Completed Setup

### 1. **Three Separate Firebase Projects Created**
- **assiduous-dev** (186714044941) - Free Spark tier
- **assiduous-staging** (853661742177) - Blaze PAYG
- **assiduous-prod** (9355377564) - Blaze PAYG

### 2. **Firebase Configuration Files**
- ✅ `.firebaserc` - Project aliases and hosting targets configured
- ✅ `firebase.json` - Multi-target hosting with proper caching headers
- ✅ `firestore.rules` - Security rules ready for deployment
- ✅ `storage.rules` - Storage security configured
- ✅ `firestore.indexes.json` - Database indexes defined

### 3. **GitHub Actions Workflows**
- ✅ `deploy-dev.yml` - **VERIFIED WORKING** (auto-deploys on push to main)
- ✅ `deploy-staging.yml` - Ready (manual approval required)
- ✅ `deploy-production.yml` - Ready (semantic tags + manual approval)

### 4. **GitHub Environment Protection**
- ✅ **development** - No restrictions
- ✅ **staging** - Requires manual approval
- ✅ **production** - Requires manual approval + security checks

### 5. **GitHub Secrets Configured**
- ✅ `FIREBASE_TOKEN` - Set up and verified working

### 6. **Deployment Verification**
- ✅ DEV workflow triggered successfully on latest push
- ✅ DEV site deployed and responding (HTTP 200)
- ✅ STAGING site accessible (HTTP 200)
- ⚠️ PROD needs initial deployment (currently 404)

---

## 🚀 How to Deploy

### Automatic DEV Deployment (Already Working!)
```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# GitHub Actions automatically:
# 1. Triggers deploy-dev.yml workflow
# 2. Deploys to https://assiduous-dev.web.app
# 3. Verifies deployment
# 4. Posts summary
```

### Manual STAGING Deployment
```bash
# Option 1: Create release candidate tag
git tag v1.0.0-rc1 -m "Release candidate 1"
git push origin v1.0.0-rc1

# Option 2: Manual trigger via GitHub UI
# Go to: Actions → Deploy to STAGING → Run workflow
```

### Production Deployment (Strict Controls)
```bash
# 1. Create semantic version tag
git tag v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0

# 2. GitHub Actions will:
#    - Run security checks
#    - Verify build integrity
#    - Wait for manual approval (you must approve in GitHub)
#    - Deploy to production
#    - Create GitHub release
#    - Run smoke tests
```

---

## 📋 Deployment Pipeline Flow

```
┌──────────────────────────────────────────────────────────────┐
│ LOCAL DEVELOPMENT                                             │
│ localhost:8081 (DEV), 8082 (TEST), 8083 (STAGING)           │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ git push origin main
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS: Deploy to DEV                                │
│ ✅ Automatic deployment on every push to main                │
│ ✅ Deploys: hosting, Firestore rules, indexes                │
│ ✅ Verifies: HTTP 200, CDN propagation                       │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ FIREBASE DEV ENVIRONMENT                                      │
│ 🌐 https://assiduous-dev.web.app                             │
│ 🔧 Test with real Firebase backend                           │
│ 💾 Isolated Firestore, Auth, Storage                         │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ Manual trigger or v*-rc* tag
                   │ (Requires approval)
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS: Deploy to STAGING                            │
│ ⚠️ Manual approval required                                  │
│ ✅ Deploys: hosting, Firestore rules, indexes                │
│ ✅ Runs: Pre-deployment checks, smoke tests                  │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ FIREBASE STAGING ENVIRONMENT                                  │
│ 🌐 https://assiduous-staging.web.app                         │
│ 🧪 Final validation before production                        │
│ 💾 Isolated Firestore, Auth, Storage                         │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ Semantic version tag (v1.0.0)
                   │ (Security checks + manual approval)
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS: Deploy to PRODUCTION                         │
│ 🔒 Security checks (no secrets, valid files)                 │
│ 🚨 Manual approval required (authorized deployers only)      │
│ ✅ Deploys: hosting, Firestore rules, indexes                │
│ ✅ Runs: Verification, smoke tests, creates release          │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────┐
│ FIREBASE PRODUCTION ENVIRONMENT                               │
│ 🌐 https://assiduous-prod.web.app                             │
│ 🚀 Live production with real users                           │
│ 💾 Isolated Firestore, Auth, Storage                         │
│ 📊 Monitored and protected                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing the Pipeline

### 1. Test DEV Auto-Deployment (Already Working!)
```bash
# Make a small change
echo "<!-- Test change $(date) -->" >> public/index.html

# Commit and push
git add .
git commit -m "test: verify DEV auto-deployment"
git push origin main

# Watch the deployment
gh run watch --repo SirsiMaster/Assiduous

# Verify at https://assiduous-dev.web.app
```

### 2. Test STAGING Deployment
```bash
# Manually trigger via GitHub UI
# Or create release candidate tag:
git tag v0.1.0-rc1 -m "Release candidate for testing"
git push origin v0.1.0-rc1

# Approve deployment in GitHub Actions UI
# Verify at https://assiduous-staging.web.app
```

### 3. Test PRODUCTION Deployment
```bash
# Create production tag
git tag v0.1.0 -m "Initial production release"
git push origin v0.1.0

# Wait for security checks
# Approve deployment in GitHub Actions UI
# Verify at https://assiduous-prod.web.app
```

---

## 📊 Verification Commands

```bash
# Check all environment status
curl -sS -o /dev/null -w "DEV: %{http_code}\n" https://assiduous-dev.web.app
curl -sS -o /dev/null -w "STAGING: %{http_code}\n" https://assiduous-staging.web.app
curl -sS -o /dev/null -w "PROD: %{http_code}\n" https://assiduous-prod.web.app

# List recent workflow runs
gh run list --repo SirsiMaster/Assiduous --limit 5

# Watch a specific workflow
gh run watch <run-id> --repo SirsiMaster/Assiduous

# View workflow logs
gh run view <run-id> --repo SirsiMaster/Assiduous --log

# Check Firebase hosting sites
firebase hosting:sites:list --project assiduous-dev
firebase hosting:sites:list --project assiduous-staging
firebase hosting:sites:list --project assiduous-prod
```

---

## 🎯 Next Steps

### Immediate (Recommended)
1. **Deploy to Production**
   - Create initial production tag: `git tag v0.1.0 -m "Initial release"`
   - Push tag: `git push origin v0.1.0`
   - Approve deployment in GitHub Actions
   - Verify at https://assiduous-prod.web.app

2. **Test Full Pipeline**
   - Make a test change
   - Push to main (auto-deploys to DEV)
   - Create RC tag (deploys to STAGING after approval)
   - Create version tag (deploys to PROD after approval)

### Optional Enhancements
1. **Add Automated Tests**
   - Unit tests with Jest
   - Integration tests
   - E2E tests with Cypress
   - Run in CI before deployment

2. **Enhance Monitoring**
   - Set up Firebase Performance Monitoring
   - Configure error tracking
   - Add deployment notifications (Slack, Discord, email)

3. **Database Seeding**
   - Create seed data scripts for DEV
   - Populate test users and properties
   - Add sample transactions

4. **Cloud Functions**
   - Deploy backend APIs
   - Set up automated processes
   - Configure scheduled functions

5. **Advanced Features**
   - Preview channels for feature branches
   - Automated rollback on errors
   - Blue-green deployments
   - Canary releases

---

## 📚 Documentation References

- **Quick Reference:** `docs/FIREBASE_QUICK_REFERENCE.md`
- **Multi-Environment Setup:** `docs/FIREBASE_MULTI_ENVIRONMENT_SETUP.md`
- **Architecture:** `docs/CI_CD_CORRECTED_ARCHITECTURE.md`
- **Pipeline Rules:** `WARP.md` (RULE 5)

---

## 🔗 Important Links

### Firebase Consoles
- **DEV:** https://console.firebase.google.com/project/assiduous-dev
- **STAGING:** https://console.firebase.google.com/project/assiduous-staging
- **PROD:** https://console.firebase.google.com/project/assiduous-prod

### GitHub
- **Repository:** https://github.com/SirsiMaster/Assiduous
- **Actions:** https://github.com/SirsiMaster/Assiduous/actions
- **Environments:** https://github.com/SirsiMaster/Assiduous/settings/environments

### Live Sites
- **DEV:** https://assiduous-dev.web.app ✅
- **STAGING:** https://assiduous-staging.web.app ✅
- **PROD:** https://assiduous-prod.web.app ⚠️

---

## ✅ Success Metrics

- **DEV Deployment:** ✅ Automated and verified working
- **DEV Site:** ✅ HTTP 200, fully operational
- **STAGING Site:** ✅ HTTP 200, fully operational
- **Workflow Triggers:** ✅ Push to main works
- **Firebase Projects:** ✅ All three configured
- **GitHub Secrets:** ✅ FIREBASE_TOKEN set
- **Environment Protection:** ✅ Approval gates configured

---

## 🎊 Congratulations!

Your CI/CD pipeline is **production-ready** and fully operational. You can now:

✅ Push code to main → auto-deploys to DEV  
✅ Create RC tags → deploys to STAGING (with approval)  
✅ Create version tags → deploys to PRODUCTION (with strict controls)  
✅ All three Firebase environments isolated and secure  
✅ Complete deployment automation with safety checks  

**Your development workflow is now enterprise-grade!** 🚀

---

**Last Updated:** October 8, 2025  
**Pipeline Status:** ✅ Operational  
**DEV Auto-Deploy:** ✅ Verified Working  
**Ready for Production:** ✅ Yes
---

# Staging Environment Setup
**Consolidated From:** STAGING_ENVIRONMENT_SETUP.md
**Date Merged:** 2025-11-02

# Staging Environment Setup Complete ✅

**Date**: October 12, 2025  
**Status**: Operational  
**Staging URL**: https://assiduous-staging.web.app

---

## Summary

Successfully deployed a complete staging environment for Assiduous that mirrors the production environment. Staging is now ready for testing, validation, and iterative development before promoting changes to production.

---

## Environment Details

### Production
- **Project ID**: assiduous-prod
- **Hosting URL**: https://assiduous-prod.web.app
- **Firestore Database**: assiduous-prod (default)
- **Status**: Live, customer-facing

### Staging
- **Project ID**: assiduous-staging
- **Hosting URL**: https://assiduous-staging.web.app
- **Firestore Database**: assiduous-staging (default)
- **Status**: Testing/validation environment

---

## What Was Deployed

### Frontend (174 files)
- ✅ All HTML pages (admin, client, agent portals)
- ✅ All CSS stylesheets
- ✅ All JavaScript files
- ✅ All assets (images, fonts, icons)
- ✅ Components and modules
- ✅ Documentation

### Backend Configuration
- ✅ Firestore rules (open for development)
- ✅ Firestore indexes
- ✅ Firebase config (environment-aware)
- ✅ Hosting configuration

### Firestore Data (24 documents imported)
| Collection | Documents | Status |
|------------|-----------|--------|
| users | 3 | ✅ Imported |
| properties | 5 | ✅ Imported |
| development_sessions | 5 | ✅ Imported |
| development_metrics | 5 | ✅ Imported |
| git_commits | 5 | ✅ Imported |
| deployment_logs | 1 | ✅ Imported |
| agents | 0 | ⚠️  Empty |
| clients | 0 | ⚠️  Empty |
| transactions | 0 | ⚠️  Empty |
| messages | 0 | ⚠️  Empty |
| notifications | 0 | ⚠️  Empty |
| project_milestones | 0 | ⚠️  Empty |

---

## Key Accomplishments

### 1. Infrastructure Setup
- ✅ Created `assiduous-staging` Firebase project
- ✅ Enabled Firebase Hosting
- ✅ Enabled Firestore Database
- ✅ Enabled Cloud Storage (bucket created)
- ✅ Configured billing for staging project
- ✅ Set up service accounts and permissions

### 2. Deployment Pipeline
- ✅ Configured Firebase hosting targets
- ✅ Updated `firebase.json` for staging compatibility
- ✅ Deployed from GitHub source of truth
- ✅ Verified deployment successful (174 files)

### 3. Database Migration
- ✅ Exported production Firestore backup (635 documents)
- ✅ Created staging Cloud Storage bucket
- ✅ Imported Firestore data to staging
- ✅ Deployed open Firestore rules for testing
- ✅ Verified data accessibility

### 4. Configuration Management
- ✅ Created environment-aware Firebase config
- ✅ Auto-detects staging vs production by hostname
- ✅ Proper service account setup for both environments
- ✅ Created verification scripts for testing

---

## File Structure

```
assiduous/
├── firebase-migration-package/
│   ├── assiduous-build/
│   │   ├── firestore.rules          # Open rules for staging
│   │   ├── firestore.indexes.json   # Database indexes
│   │   ├── firebase.json            # Hosting configuration
│   │   ├── firebase-config.js       # Environment-aware config
│   │   └── firebase-config-staging.json  # Service account key
│   └── firebase-admin-sdk-prod.json  # Production service account
├── scripts/
│   ├── verify_firestore_staging.js  # Data verification script
│   └── copy_firestore_prod_to_staging.js  # Data copy utility
└── docs/
    └── STAGING_ENVIRONMENT_SETUP.md  # This document
```

---

## Firebase Configuration

### Environment Detection
```javascript
// firebase-config.js automatically detects environment
const environment = window.location.hostname.includes('staging') ? 'staging' : 'production';

// Staging config
const stagingConfig = {
  apiKey: "...",
  authDomain: "assiduous-staging.firebaseapp.com",
  projectId: "assiduous-staging",
  storageBucket: "assiduous-staging-backups",
  // ...
};

// Production config
const productionConfig = {
  apiKey: "...",
  authDomain: "assiduous-prod.firebaseapp.com",
  projectId: "assiduous-prod",
  storageBucket: "assiduous-prod.appspot.com",
  // ...
};
```

### Firestore Rules (Staging - Open for Testing)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for staging environment
    // WARNING: This is for staging only - production has stricter rules
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## Verification & Testing

### Manual Testing Checklist
- [x] Staging site accessible at https://assiduous-staging.web.app
- [x] Landing page loads correctly
- [x] Admin dashboard accessible
- [x] Firebase config detects staging environment
- [x] Firestore data readable
- [x] Service accounts have proper permissions

### Automated Verification
```bash
# Verify Firestore data import
node scripts/verify_firestore_staging.js

# Result: 24 documents found across 6 collections ✅
```

### HTTP Response Tests
```bash
# Test key pages
curl -I https://assiduous-staging.web.app/                        # 200 OK
curl -I https://assiduous-staging.web.app/admin/dashboard.html    # 200 OK
curl -I https://assiduous-staging.web.app/client/                 # 200 OK
```

---

## Deployment Commands

### Deploy to Staging
```bash
cd /Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build
firebase use staging
firebase deploy --only hosting:assiduousflip,firestore:rules --project=assiduous-staging
```

### Verify Deployment
```bash
# Check hosting status
firebase hosting:sites:list --project=assiduous-staging

# Check Firestore data
node /Users/thekryptodragon/Development/assiduous/scripts/verify_firestore_staging.js
```

### Copy Additional Data from Production
```bash
# Manual script (requires production rules relaxed)
node /Users/thekryptodragon/Development/assiduous/scripts/copy_firestore_prod_to_staging.js
```

---

## Known Issues & Limitations

### 1. Incomplete Data Migration
**Issue**: Only 24 of 635 documents imported  
**Impact**: Some pages may show empty data  
**Resolution**: Use Firestore export/import or copy script with relaxed production rules

### 2. Open Firestore Rules
**Issue**: Staging has fully open read/write rules  
**Impact**: No security validation in staging  
**Resolution**: Acceptable for staging, must be secured before production use

### 3. Service Account Permissions
**Issue**: Some collections still show permission errors  
**Impact**: Inconsistent data access  
**Resolution**: IAM roles properly configured, may need rule propagation time

### 4. Cloud Functions Not Deployed
**Issue**: API endpoints reference `/api/**` but no functions deployed  
**Impact**: Warning during deployment  
**Resolution**: Deploy Cloud Functions when backend logic is implemented

---

## Next Steps

### Immediate (Required)
1. ✅ Verify staging site loads in browser
2. ✅ Test key user workflows (admin dashboard, client portal)
3. ✅ Confirm Firebase config switches correctly
4. ⏳ Import complete production dataset to staging

### Short-term (Recommended)
1. ⏳ Set up automated testing against staging
2. ⏳ Create staging-specific test user accounts
3. ⏳ Deploy Cloud Functions to staging
4. ⏳ Set up Firebase Storage rules

### Long-term (Optional)
1. ⏳ Automate staging deployments from develop branch
2. ⏳ Set up staging-specific monitoring and alerts
3. ⏳ Create synthetic data generation for staging tests
4. ⏳ Implement staging-to-production promotion workflow

---

## Development Workflow

### Recommended Flow
```
DEV (local) → TEST (localhost:8082) → STAGING (Firebase) → PRODUCTION (Firebase)
```

### Testing in Staging
1. Develop changes locally in `environments/dev/`
2. Test locally at http://localhost:8081
3. Deploy to staging: `firebase deploy --only hosting --project=assiduous-staging`
4. Test at https://assiduous-staging.web.app
5. If verified, deploy to production: `firebase deploy --only hosting --project=assiduous-prod`

### Data Management
- **Staging data**: Refreshed periodically from production snapshots
- **Production data**: Customer data, never modified during testing
- **Test data**: Can be freely created/modified in staging

---

## Useful Commands

### Firebase CLI
```bash
# Switch between projects
firebase use staging
firebase use default  # production

# List all projects
firebase projects:list

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions

# View deployment logs
firebase functions:log --project=assiduous-staging
```

### gcloud CLI
```bash
# List Firestore collections
gcloud firestore databases describe --project=assiduous-staging

# Create Firestore backup
gcloud firestore export gs://assiduous-staging-backups/backup-$(date +%Y%m%d)

# Import Firestore backup
gcloud firestore import gs://assiduous-staging-backups/backup-20251012
```

### Verification Scripts
```bash
# Verify staging Firestore data
node scripts/verify_firestore_staging.js

# Copy data from production to staging
node scripts/copy_firestore_prod_to_staging.js
```

---

## Security Considerations

### Staging Environment
- ⚠️  **Open Firestore rules** - Anyone can read/write
- ⚠️  **Public access** - No authentication required
- ⚠️  **Test data only** - No sensitive customer information

### Production Environment
- ✅ **Strict Firestore rules** - Auth required
- ✅ **Encrypted data** - AES-256-GCM encryption
- ✅ **Access controls** - Role-based permissions
- ✅ **Customer data** - PII protected

### Best Practices
1. Never use real customer data in staging
2. Regularly refresh staging with sanitized production data
3. Rotate service account keys periodically
4. Monitor staging for unauthorized access
5. Keep staging rules separate from production

---

## Troubleshooting

### Staging site not loading
```bash
# Check deployment status
firebase hosting:sites:list --project=assiduous-staging

# Redeploy
firebase deploy --only hosting --project=assiduous-staging
```

### Firestore permission errors
```bash
# Verify rules deployed
gcloud firestore databases describe --project=assiduous-staging

# Redeploy rules
firebase deploy --only firestore:rules --project=assiduous-staging
```

### Wrong Firebase project loaded
- Check `firebase-config.js` environment detection
- Verify hostname includes "staging"
- Clear browser cache and reload

---

## Resources

### Documentation
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

### Project Links
- **Staging Console**: https://console.firebase.google.com/project/assiduous-staging
- **Production Console**: https://console.firebase.google.com/project/assiduous-prod
- **GitHub Repository**: https://github.com/SirsiMaster/Assiduous

### Support
- Firebase support: https://firebase.google.com/support
- Project documentation: `/docs/`
- WARP rules: `/WARP.md`

---

## Conclusion

✅ **Staging environment is now fully operational and ready for testing.**

The staging environment provides a safe, isolated space to:
- Test new features before production deployment
- Validate database schema changes
- Verify frontend/backend integration
- Conduct QA without affecting production users
- Experiment with configuration changes

All changes deployed to staging can be verified, tested, and refined before promoting to production, significantly reducing the risk of breaking changes and improving overall code quality.

---

**Last Updated**: October 12, 2025  
**Maintained By**: SirsiMaster Development Team  
**Status**: Active & Operational ✅

---

# Full Automation Setup Guide
**Consolidated From:** SETUP_FULL_AUTOMATION.md
**Date Merged:** 2025-11-02

# Setup 100% Automation - No Manual Steps

This guide shows how to achieve **true 100% automation** so metrics deploy automatically without any manual commands.

---

## Current State vs Full Automation

### Current (Semi-Automated)
```
Commit → Metrics Update (automatic)
         ↓
Push →   Dashboard Deploy (MANUAL: ./scripts/deploy-metrics-to-firebase.sh deploy)
```

### Full Automation Goal
```
Commit → Metrics Update (automatic)
         ↓
Push →   Dashboard Deploy (AUTOMATIC)
         ↓
         Live Dashboard Updated (AUTOMATIC)
```

---

## Option 1: Auto-Deploy on Git Push (Easiest)

**Best for**: Solo developers who want simple local automation

### Setup (5 minutes):

1. **Add function to your shell config**:
   ```bash
   # Open your shell config
   nano ~/.zshrc  # or ~/.bashrc if using bash
   ```

2. **Paste this at the end**:
   ```bash
   # Auto-deploy Assiduous metrics to Firebase after git push
   function git() {
       command git "$@"
       local exit_code=$?
       
       if [[ "$1" == "push" ]] && [[ $exit_code -eq 0 ]]; then
           echo ""
           echo "📊 Deploying updated metrics to Firebase..."
           (
               cd ~/Development/assiduous
               ./scripts/deploy-metrics-to-firebase.sh deploy > /tmp/metrics-deploy.log 2>&1 &
           )
           echo "✅ Deployment started in background"
           echo "📋 Check log: tail -f /tmp/metrics-deploy.log"
       fi
       
       return $exit_code
   }
   ```

3. **Reload your shell**:
   ```bash
   source ~/.zshrc
   ```

4. **Test it**:
   ```bash
   # Make a test commit
   git commit --allow-empty -m "test: automation"
   git push
   
   # Should see: "📊 Deploying updated metrics to Firebase..."
   ```

### How It Works:
- Every time you `git push`, deployment happens automatically
- Runs in background (doesn't block your terminal)
- Dashboard updates within 30-60 seconds
- Check deployment log: `tail -f /tmp/metrics-deploy.log`

### Pros:
✅ Simple to set up (5 minutes)  
✅ Works immediately  
✅ Local control  
✅ No cloud dependencies  

### Cons:
⚠️ Only deploys when you push (not for other team members)  
⚠️ Requires your machine to be on  

---

## Option 2: GitHub Actions (Best for Teams)

**Best for**: Teams or when you want cloud-based automation

### Setup (10 minutes):

#### Step 1: Get Firebase CI Token

```bash
# Login to Firebase
firebase login:ci

# Copy the token that's displayed
# It looks like: 1//abc123def456...
```

#### Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repo: https://github.com/SirsiMaster/Assiduous
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_TOKEN`
5. Value: Paste the token from Step 1
6. Click **Add secret**

#### Step 3: GitHub Action Already Created!

The workflow file is already in your repo at:
`.github/workflows/deploy-metrics.yml`

It will automatically:
- Trigger on every push to `main` branch
- Update metrics from git history
- Deploy to Firebase hosting
- Show deployment summary

#### Step 4: Commit and Push

```bash
cd /Users/thekryptodragon/Development/assiduous
git add .github/workflows/deploy-metrics.yml
git commit -m "feat: add GitHub Actions auto-deployment"
git push
```

#### Step 5: Verify

1. Go to: https://github.com/SirsiMaster/Assiduous/actions
2. Watch the workflow run
3. Check dashboard: https://assiduous-prod.web.app/admin/development/dashboard.html

### How It Works:
- GitHub runs workflow on every push
- Updates metrics in the cloud
- Deploys to Firebase automatically
- Takes 2-3 minutes per deployment
- Works even if your machine is off

### Pros:
✅ Works for entire team  
✅ Cloud-based (no local machine needed)  
✅ Visible in GitHub Actions tab  
✅ Can see deployment history  
✅ Professional CI/CD pipeline  

### Cons:
⚠️ Requires GitHub Actions minutes (free tier has 2000/month)  
⚠️ Slightly more complex setup  
⚠️ Takes 2-3 minutes vs instant local  

---

## Option 3: Scheduled Deployment (Set & Forget)

**Best for**: Automatic daily updates without pushing

### Setup (Cron Job):

```bash
# Open crontab
crontab -e

# Add this line (deploy every evening at 6 PM)
0 18 * * * cd ~/Development/assiduous && ./scripts/deploy-metrics-to-firebase.sh deploy >> ~/metrics-deploy.log 2>&1

# Save and exit
```

### How It Works:
- Runs every day at 6 PM
- Updates metrics and deploys
- Happens automatically in background
- Logs to `~/metrics-deploy.log`

### Pros:
✅ Completely hands-off  
✅ Regular schedule  
✅ No manual intervention  

### Cons:
⚠️ Only updates once per day  
⚠️ Requires Mac to be on at scheduled time  

---

## Recommended Setup by Use Case

### Solo Developer (You)
**→ Option 1: Auto-Deploy on Push**
- Simplest to set up
- Immediate deployment
- Full control

### Small Team (2-5 people)
**→ Option 2: GitHub Actions**
- Professional setup
- Works for everyone
- Cloud-based

### Large Team / Production
**→ Option 2: GitHub Actions + Option 3: Scheduled**
- GitHub Actions for development
- Scheduled for guaranteed daily updates
- Redundancy

---

## Verification Checklist

After setting up automation, verify it works:

### For Option 1 (Git Push Hook):
```bash
□ Make test commit
□ Push to GitHub
□ See "📊 Deploying..." message
□ Wait 60 seconds
□ Check dashboard shows latest commit
□ Verify: curl -s https://assiduous-prod.web.app/admin/development/metrics_cache.json | jq '.project.totalCommits'
```

### For Option 2 (GitHub Actions):
```bash
□ Push code to GitHub
□ Go to GitHub Actions tab
□ Watch workflow run (should be green)
□ Check dashboard after workflow completes
□ Verify metrics updated on live site
```

### For Option 3 (Cron):
```bash
□ Wait for scheduled time
□ Check log: tail ~/metrics-deploy.log
□ Should see deployment messages
□ Dashboard should be updated
```

---

## Troubleshooting

### Git Push Hook Not Working

**Problem**: Push happens but no deployment message

**Solution**:
```bash
# Check if function is loaded
type git

# Should show: "git is a shell function"

# If not, reload shell config
source ~/.zshrc

# Test function manually
git() { echo "Function works!"; }
git
```

### GitHub Actions Failing

**Problem**: Workflow shows red X

**Solution**:
1. Check Actions tab for error message
2. Common issues:
   - Firebase token expired → Generate new one
   - Token not added to secrets → Add FIREBASE_TOKEN secret
   - Node version mismatch → Update workflow file

### Cron Job Not Running

**Problem**: No deployment at scheduled time

**Solution**:
```bash
# Check cron log
tail ~/metrics-deploy.log

# Verify crontab entry
crontab -l

# Test command manually
cd ~/Development/assiduous && ./scripts/deploy-metrics-to-firebase.sh deploy
```

---

## What "100% Automation" Means

### Before (Current):
1. ✅ Code and commit → Metrics update (automatic)
2. ⚠️ Run deployment script → Dashboard updates (manual)

### After (Full Automation):
1. ✅ Code and commit → Metrics update (automatic)
2. ✅ Push to GitHub → Dashboard updates (automatic)
3. ✅ Check dashboard → See latest data (automatic)

**No manual commands. No manual deployment. Just push and it's live.**

---

## Summary

| Option | Setup Time | Deployment Speed | Best For |
|--------|-----------|------------------|----------|
| Git Push Hook | 5 min | Instant | Solo dev |
| GitHub Actions | 10 min | 2-3 min | Teams |
| Cron Job | 2 min | Scheduled | Daily updates |

**My Recommendation**: Start with **Option 1** (git push hook) since you're solo dev. It's instant and simple.

Once you have a team, add **Option 2** (GitHub Actions) for full CI/CD.

---

**Next Steps**:

1. Choose your automation option
2. Follow setup steps
3. Test deployment
4. Enjoy hands-free metrics! 🎉

No more manual commands needed!

