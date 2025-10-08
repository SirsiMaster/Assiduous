

# CI/CD Pipeline Setup Guide

**Last Updated:** October 8, 2025  
**Status:** Ready to Implement

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

This CI/CD pipeline automates deployments to all three Firebase environments with proper security gates and approval workflows.

### Key Features

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
│     └─ Deploys to https://assiduousflip.web.app            │
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
5. Set **Environment URL:** `https://assiduousflip.web.app`
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
# 1. Detect changes to firebase-migration-package/
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
| **deploy-dev.yml** | Push to `main` with changes in `firebase-migration-package/` | ❌ No |
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
