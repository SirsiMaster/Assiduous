# CI/CD Corrected Architecture

## ✅ VERIFIED MULTI-PROJECT SETUP

You have **THREE separate Firebase projects** for proper environment isolation.

## Actual Firebase Setup

### Firebase Projects

1. **Development Project**
   - **Project ID**: `assiduous-dev`
   - **Project Number**: 186714044941
   - **Default URL**: https://assiduous-dev.web.app
   - **Console**: https://console.firebase.google.com/project/assiduous-dev
   - **Purpose**: Continuous deployment from `main` branch

2. **Staging Project**
   - **Project ID**: `assiduous-staging`
   - **Project Number**: 853661742177
   - **Default URL**: https://assiduous-staging.web.app
   - **Console**: https://console.firebase.google.com/project/assiduous-staging
   - **Purpose**: Pre-production testing, requires manual approval

3. **Production Project**
   - **Project ID**: `assiduous-prod`
   - **Project Number**: 9355377564
   - **Default URL**: https://assiduousflip.web.app
   - **Console**: https://console.firebase.google.com/project/assiduous-prod
   - **Purpose**: Live production, requires version tags + manual approval

### Complete Environment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│ LOCAL DEVELOPMENT (Per WARP.md RULE 5)                       │
├────────────────────────────────────────────────────────────────┤
│ DEV      → localhost:8081  → environments/dev/             │
│ TEST     → localhost:8082  → environments/test/            │
│ STAGING  → localhost:8083  → environments/staging/         │
└────────────────────────────────────────────────────────────────┘
                                ↓
              git push origin main (CI/CD Automated)
                                ↓
┌────────────────────────────────────────────────────────────────┐
│ FIREBASE DEV (Auto-deploy)                                    │
├────────────────────────────────────────────────────────────────┤
│ Project: assiduous-dev                                         │
│ URL: https://assiduous-dev.web.app                            │
│ Trigger: Push to main branch                                  │
└────────────────────────────────────────────────────────────────┘
                                ↓
          Tag rc-* or manual trigger (Requires Approval)
                                ↓
┌────────────────────────────────────────────────────────────────┐
│ FIREBASE STAGING (Manual approval required)                   │
├────────────────────────────────────────────────────────────────┤
│ Project: assiduous-staging                                     │
│ URL: https://assiduous-staging.web.app                        │
│ Trigger: Release candidate tags (v*-rc*) or workflow_dispatch │
└────────────────────────────────────────────────────────────────┘
                                ↓
       Version tag v*.*.* (Requires Security + Manual Approval)
                                ↓
┌────────────────────────────────────────────────────────────────┐
│ FIREBASE PRODUCTION (Strict controls)                         │
├────────────────────────────────────────────────────────────────┤
│ Project: assiduous-prod                                        │
│ URL: https://assiduousflip.web.app                            │
│ Trigger: Semantic version tags (v1.0.0, v2.3.1, etc.)         │
│ Requirements: Security checks + Manual approval                │
└────────────────────────────────────────────────────────────────┘
```

## Correct CI/CD Pipeline

### What SHOULD Happen

1. **Local Development**
   ```bash
   # Work in DEV environment
   cd environments/dev/
   # Make changes
   
   # Start local servers
   ./scripts/dev-server.sh start
   
   # Test at localhost:8081 (DEV)
   # Promote to TEST, test at localhost:8082
   # Promote to STAGING, test at localhost:8083
   ```

2. **Promotion to Production**
   ```bash
   # Promote from STAGING to PROD (copies to firebase-migration-package/)
   ./scripts/promote.sh staging-to-prod
   
   # Commit to GitHub (source of truth)
   git add .
   git commit -m "feat: production-ready feature"
   git push origin main
   ```

3. **GitHub Actions Deployment**
   - GitHub Action detects push to main
   - Deploys from `firebase-migration-package/assiduous-build/`
   - Targets: `hosting:assiduousflip` (or `hosting:prod`)
   - Deploys to: https://assiduousflip.web.app

### What Should NOT Happen

❌ **NO** separate Firebase projects for DEV/STAGING  
❌ **NO** Firebase hosting for DEV/STAGING  
❌ **NO** GitHub Actions deployment to DEV/STAGING  
❌ **NO** URLs like `assiduous-dev.web.app` or `assiduous-staging.web.app`

## Required Changes

### 1. Simplify GitHub Workflows

Keep **ONE** production deployment workflow:
- Triggered by: Push to `main` branch OR version tags
- Deploys to: `assiduous-prod` project
- Target: `hosting:assiduousflip`
- URL: https://assiduousflip.web.app

### 2. Remove Incorrect Workflows

Delete or disable:
- `deploy-dev.yml` (DEV is local only)
- `deploy-staging.yml` (STAGING is local only)

### 3. Update `.firebaserc`

Should target the correct hosting site:
```json
{
  "projects": {
    "default": "assiduous-prod"
  },
  "targets": {
    "assiduous-prod": {
      "hosting": {
        "prod": ["assiduous-prod"],
        "assiduousflip": ["assiduousflip"]
      }
    }
  }
}
```

### 4. Update `firebase.json`

Ensure hosting configuration targets the correct site:
```json
{
  "hosting": [
    {
      "target": "assiduousflip",
      "public": "assiduous-build",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
    }
  ]
}
```

## Deployment Commands

### Manual Deployment (Recommended Initially)

```bash
cd firebase-migration-package/assiduous-build

# Deploy to assiduousflip site
firebase deploy --only hosting:assiduousflip --project assiduous-prod

# Or deploy to prod site
firebase deploy --only hosting:prod --project assiduous-prod

# Deploy everything (hosting + Firestore rules)
firebase deploy --project assiduous-prod
```

### Automated Deployment (GitHub Actions)

Should use:
```bash
firebase deploy \
  --only hosting:assiduousflip \
  --project assiduous-prod \
  --token "$FIREBASE_TOKEN" \
  --non-interactive
```

## Verification

After deployment, check:
- ✅ https://assiduousflip.web.app/ (should return 200)
- ✅ https://assiduousflip.web.app/admin/dashboard.html (should load)
- ✅ Browser console has no errors
- ✅ All pages accessible

## Rollback Strategy

If deployment fails:
1. Check Firebase Console deployment history
2. Roll back using Firebase hosting versions
3. Or redeploy previous Git commit

## Summary

**The ONLY environment that touches Firebase is PRODUCTION.**  
**DEV, TEST, and STAGING are all local-only environments.**  
**You have ONE Firebase project with TWO hosting sites.**  
**GitHub Actions should ONLY deploy to the production Firebase project.**
