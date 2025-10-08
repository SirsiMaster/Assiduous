# Firebase Multi-Environment Setup Guide

**Last Updated:** October 8, 2025  
**Author:** Assiduous Development Team  
**Status:** Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Firebase Projects](#firebase-projects)
4. [Initial Setup](#initial-setup)
5. [Development Workflow](#development-workflow)
6. [Deployment Process](#deployment-process)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Cost Analysis](#cost-analysis)
10. [Best Practices](#best-practices)

---

## Overview

Assiduous uses a **multi-project Firebase architecture** with three isolated Firebase projects to ensure safe, reliable deployments with complete backend isolation.

### Why Multi-Project Architecture?

✅ **Backend Isolation** - Each environment has its own Firestore, Auth, Functions, Storage  
✅ **Safe Testing** - Test destructive operations without affecting production  
✅ **Production Parity** - Test with real Firebase services, not emulators  
✅ **Cost Effective** - DEV on free tier, minimal staging costs  
✅ **Team Collaboration** - Shared environments for testing  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LOCAL DEVELOPMENT                                          │
│  └─ Directory: firebase-migration-package/assiduous-build/  │
│  └─ URL: http://localhost:8080                              │
│  └─ Testing: Frontend only, no backend                      │
│                                                              │
│           ↓ (Deploy with ./deploy.sh dev)                   │
│                                                              │
│  FIREBASE DEV (assiduous-dev)                               │
│  └─ URL: https://assiduous-dev.web.app                      │
│  └─ Plan: Spark (Free)                                      │
│  └─ Testing: Full stack with isolated backend               │
│  └─ Data: Test/synthetic data                               │
│                                                              │
│           ↓ (Deploy with ./deploy.sh staging)               │
│                                                              │
│  FIREBASE STAGING (assiduous-staging)                       │
│  └─ URL: https://assiduous-staging.web.app                  │
│  └─ Plan: Blaze (Pay-as-you-go)                             │
│  └─ Testing: Production-like validation                     │
│  └─ Data: Production-like dataset                           │
│                                                              │
│           ↓ (Commit to GitHub)                              │
│                                                              │
│  GITHUB MAIN BRANCH                                         │
│  └─ Source of Truth for Production                          │
│                                                              │
│           ↓ (Deploy with ./deploy.sh production)            │
│                                                              │
│  FIREBASE PRODUCTION (assiduous-prod)                       │
│  └─ URL: https://assiduousflip.web.app                      │
│  └─ Plan: Blaze (Pay-as-you-go)                             │
│  └─ Testing: Live production                                │
│  └─ Data: Real user data                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Firebase Projects

### 1. assiduous-dev (Development)
- **Project ID:** `assiduous-dev`
- **Project Number:** `186714044941`
- **Hosting URL:** https://assiduous-dev.web.app
- **Billing Plan:** Spark (Free)
- **Purpose:** Active feature development with real Firebase backend
- **Data:** Test/synthetic data, safe to reset
- **Who Uses:** Developers testing new features

### 2. assiduous-staging (Staging)
- **Project ID:** `assiduous-staging`
- **Project Number:** `853661742177`
- **Hosting URL:** https://assiduous-staging.web.app
- **Billing Plan:** Blaze (Pay-as-you-go, ~$5-10/month)
- **Purpose:** Pre-production validation with production-like config
- **Data:** Production-like dataset (anonymized if needed)
- **Who Uses:** QA, stakeholders, final testing before production

### 3. assiduous-prod (Production)
- **Project ID:** `assiduous-prod`
- **Project Number:** `9355377564`
- **Hosting URL:** https://assiduousflip.web.app
- **Billing Plan:** Blaze (Pay-as-you-go, varies with usage)
- **Purpose:** Live production with real users
- **Data:** Real user data
- **Who Uses:** End users, customers

---

## Initial Setup

### Prerequisites

1. **Firebase CLI Installed:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticated with Firebase:**
   ```bash
   firebase login
   ```

3. **Google Cloud SDK (optional but recommended):**
   ```bash
   brew install google-cloud-sdk  # macOS
   gcloud auth login
   ```

### Verify Projects

```bash
# List all Firebase projects
firebase projects:list

# Should show:
# - assiduous-dev
# - assiduous-staging
# - assiduous-prod
```

### Project Configuration

The `.firebaserc` file in `firebase-migration-package/` configures all three projects:

```json
{
  "projects": {
    "default": "assiduous-prod",
    "dev": "assiduous-dev",
    "staging": "assiduous-staging",
    "production": "assiduous-prod"
  }
}
```

---

## Development Workflow

### Step 1: Local Development

1. **Make changes** in `firebase-migration-package/assiduous-build/`

2. **Start local server:**
   ```bash
   cd firebase-migration-package/assiduous-build
   python -m http.server 8080
   ```

3. **Test at:** http://localhost:8080

4. **Run QA/QC:**
   - Open browser DevTools Console
   - Check for JavaScript errors
   - Test all user workflows
   - Verify mobile responsiveness

### Step 2: Deploy to DEV

1. **Navigate to deployment directory:**
   ```bash
   cd firebase-migration-package
   ```

2. **Deploy to DEV:**
   ```bash
   ./deploy.sh dev
   ```

3. **Test at:** https://assiduous-dev.web.app

4. **Validate Firebase backend:**
   - Test user authentication
   - Verify Firestore database operations
   - Check Cloud Functions responses
   - Test Cloud Storage operations

### Step 3: Deploy to STAGING

1. **Ensure DEV testing passed**

2. **Deploy to STAGING:**
   ```bash
   ./deploy.sh staging
   ```

3. **Test at:** https://assiduous-staging.web.app

4. **Final validation:**
   - Complete end-to-end user workflows
   - Performance testing
   - Production-like data testing
   - Take screenshots for documentation

### Step 4: Commit to GitHub

1. **Verify staging success**

2. **Commit changes:**
   ```bash
   cd ../..  # Back to project root
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

3. **Tag if major release:**
   ```bash
   git tag -a v1.0.0 -m "Release 1.0.0"
   git push --tags
   ```

### Step 5: Deploy to Production

1. **Ensure code is in GitHub**

2. **Deploy to production:**
   ```bash
   cd firebase-migration-package
   ./deploy.sh production
   ```

3. **Type confirmation:** `DEPLOY TO PRODUCTION`

4. **Verify at:** https://assiduousflip.web.app

5. **Post-deployment:**
   - Run smoke tests
   - Monitor Firebase Console logs
   - Check error rates
   - Verify analytics

---

## Deployment Process

### Using the deploy.sh Script

The `deploy.sh` script handles all deployments with built-in safety checks.

**Basic Usage:**
```bash
./deploy.sh <environment>
```

**Examples:**
```bash
# Deploy to development
./deploy.sh dev

# Deploy to staging (requires confirmation)
./deploy.sh staging

# Deploy to production (requires typing 'DEPLOY TO PRODUCTION')
./deploy.sh production
```

### Deployment Script Features

✅ **Pre-deployment checks:**
- Firebase CLI installed
- User authenticated
- Build directory exists
- Git status clean (for production)

✅ **Environment-specific validations:**
- DEV: High safety (no confirmation)
- STAGING: Medium safety (requires confirmation)
- PRODUCTION: Low safety (requires explicit confirmation text)

✅ **Post-deployment verification:**
- HTTP 200 response check
- Deployment success confirmation
- URL display for verification

### Manual Deployment (Not Recommended)

```bash
# Deploy manually to specific project
firebase deploy --project dev --only hosting
firebase deploy --project staging --only hosting
firebase deploy --project production --only hosting
```

---

## Environment Configuration

### Automatic Environment Detection

The `firebase-config.js` file automatically detects the environment based on hostname:

```javascript
// firebase-migration-package/assiduous-build/assets/js/config/firebase-config.js

function detectEnvironment() {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  // Development environment
  if (hostname.includes('assiduous-dev.web.app')) {
    return 'development';
  }
  
  // Staging environment
  if (hostname.includes('assiduous-staging.web.app')) {
    return 'staging';
  }
  
  // Production environment (default)
  return 'production';
}
```

### Using Environment-Specific Configs

```javascript
// Get the appropriate Firebase config for current environment
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Check environment
if (isProduction()) {
  // Production-specific code
  console.log('Running in PRODUCTION');
} else if (isStaging()) {
  // Staging-specific code
  console.log('Running in STAGING');
} else {
  // Development-specific code
  console.log('Running in DEVELOPMENT');
}
```

### Environment-Specific API Keys

**IMPORTANT:** Each environment uses its own Firebase API keys.

To get API keys for DEV and STAGING:

1. Go to Firebase Console
2. Select project (assiduous-dev or assiduous-staging)
3. Go to Project Settings → General
4. Under "Your apps" → Web app → Config
5. Copy the config values
6. Update `firebase-config.js` with the correct values

**Security Note:** API keys for Firebase web apps are safe to commit to GitHub. They are designed to be public and are protected by Firebase Security Rules.

---

## Troubleshooting

### Common Issues

#### 1. "Permission Denied" Error

**Problem:** Cannot deploy to Firebase project

**Solution:**
```bash
# Re-authenticate
firebase login --reauth

# Verify project access
firebase projects:list

# Check current project
firebase use
```

#### 2. "Build Directory Not Found"

**Problem:** `assiduous-build` directory missing

**Solution:**
```bash
# Verify directory exists
ls -la firebase-migration-package/assiduous-build

# If missing, ensure you're in correct directory
pwd  # Should show: .../assiduous/firebase-migration-package
```

#### 3. "Rate Limit Exceeded" (429 Error)

**Problem:** Too many Firebase API requests

**Solution:**
```bash
# Wait 60 seconds and retry
sleep 60
./deploy.sh dev
```

#### 4. Environment Detection Not Working

**Problem:** Wrong Firebase config being used

**Solution:**
1. Open browser DevTools Console
2. Check which environment is detected
3. Verify URL matches expected environment
4. Clear browser cache if needed

#### 5. Deployment Succeeds but Site Shows Old Version

**Problem:** Browser cache or CDN cache

**Solution:**
```bash
# Hard refresh browser
# Chrome/Firefox: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or clear Firebase hosting cache
firebase hosting:channel:deploy preview --expires 1h
```

---

## Cost Analysis

### Monthly Cost Breakdown

| Environment | Plan | Hosting | Firestore | Functions | Storage | Total |
|-------------|------|---------|-----------|-----------|---------|-------|
| **DEV** | Spark (Free) | Free (1GB) | Free | Free | Free (5GB) | **$0** |
| **STAGING** | Blaze (PAYG) | ~$0.50 | ~$2 | ~$1 | ~$1.50 | **~$5** |
| **PROD** | Blaze (PAYG) | Varies | Varies | Varies | Varies | **Varies** |

**Total Additional Cost for Multi-Environment:** ~$5/month

### Cost Optimization Tips

1. **Use DEV for most testing** (free tier)
2. **Limit STAGING usage** to final validation only
3. **Set up budget alerts** in Firebase Console
4. **Clean up old data** in DEV/STAGING regularly
5. **Use Firebase Local Emulator** for unit testing (completely free)

---

## Best Practices

### ✅ DO

- **Always test locally first** before deploying to Firebase
- **Deploy to DEV first** for backend testing
- **Test in STAGING** before production deployment
- **Commit to GitHub** before deploying to production
- **Use environment-specific configs** (never hardcode environment values)
- **Monitor Firebase Console** after production deploys
- **Document changes** in commit messages
- **Take screenshots** in staging for documentation
- **Run smoke tests** after production deploy
- **Keep DEV data realistic** but not sensitive

### ❌ DON'T

- **Don't skip environments** (LOCAL → PROD is forbidden)
- **Don't deploy to production with known bugs**
- **Don't use production API keys** in dev/staging code
- **Don't edit production Firestore** directly without backup
- **Don't bypass approval gates** for production
- **Don't deploy without testing** in at least STAGING
- **Don't use real user data** in DEV environment
- **Don't ignore Firebase Console errors** after deployment
- **Don't make emergency changes** without following hotfix process
- **Don't commit Firebase service account keys** to GitHub

---

## Quick Reference

### Deployment Commands

```bash
# Development
cd firebase-migration-package && ./deploy.sh dev

# Staging
cd firebase-migration-package && ./deploy.sh staging

# Production
cd firebase-migration-package && ./deploy.sh production
```

### Environment URLs

- **Local:** http://localhost:8080
- **DEV:** https://assiduous-dev.web.app
- **STAGING:** https://assiduous-staging.web.app
- **PRODUCTION:** https://assiduousflip.web.app

### Firebase Console Links

- **DEV:** https://console.firebase.google.com/project/assiduous-dev
- **STAGING:** https://console.firebase.google.com/project/assiduous-staging
- **PRODUCTION:** https://console.firebase.google.com/project/assiduous-prod

### Support

For issues or questions:
1. Check this documentation
2. Review WARP.md Rule 5
3. Check Firebase Console logs
4. Contact development team

---

**Document Version:** 1.0.0  
**Last Reviewed:** October 8, 2025  
**Next Review:** Monthly or as needed
