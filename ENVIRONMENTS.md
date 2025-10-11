# Environment URLs - FINAL STRUCTURE

## 🧪 STAGING Environment
**URL**: https://assiduous-staging.web.app  
**Firebase Project**: assiduous-staging  
**Purpose**: Testing new features before production  
**Deploy Command**: `firebase deploy --only hosting --project assiduous-staging`  
**Branch**: staging  
**Auto-Deploy**: Yes (from staging branch)

## 🚀 PRODUCTION Environment  
**Primary URLs**:
- https://assiduous-prod.web.app (Firebase URL - main)
- https://assiduousflip.com (custom domain - when configured)
- https://www.assiduousflip.com (custom domain - when configured)

**Firebase Project**: assiduous-prod  
**Purpose**: Live production site for users  
**Deploy Command**: `firebase deploy --only hosting:production --project assiduous-prod`  
**Branch**: main (via tags only)  
**Auto-Deploy**: Only on version tags (v*.*.*)

---

## Workflow

```
1. Developer creates feature branch
2. Merge to staging branch
3. Auto-deploys to: assiduous-staging.web.app
4. Test for 24+ hours
5. Create release tag (v1.2.0)
6. Auto-deploys to: assiduousflip.com
```

---

## Quick Commands

### Deploy to Staging
```bash
git checkout staging
git merge feature/your-feature
git push origin staging
# Automatic deployment to assiduous-staging.web.app
```

### Deploy to Production
```bash
git checkout main
git merge staging
git tag -a v1.2.0 -m "Release: Feature Name"
git push origin main --tags
# Automatic deployment to assiduousflip.com
```

### Manual Emergency Deploy
```bash
# Staging
firebase deploy --only hosting --project assiduous-staging

# Production
firebase deploy --only hosting:production --project assiduous-prod
```

---

## URL Summary

| Environment | Firebase Project | URLs | Purpose |
|------------|-----------------|------|---------|
| **STAGING** | assiduous-staging | https://assiduous-staging.web.app | Testing |
| **PRODUCTION** | assiduous-prod | https://assiduous-prod.web.app<br>https://assiduousflip.com (future)<br>https://www.assiduousflip.com (future) | Live Site |

---

## Important Notes

1. **Staging stays on separate Firebase project** - Complete isolation for testing
2. **Production has multiple URLs** - All point to same site
3. **Custom domain is for production only** - Staging remains on Firebase subdomain
4. **Both environments stay active** - No changes to staging setup

---

## Cost Structure

- **Staging** (assiduous-staging): ~$10-20/month (Blaze plan)
- **Production** (assiduous-prod): ~$20-50/month (Blaze plan)
- **Custom Domain**: $12/year (GoDaddy)
- **Total**: ~$30-70/month + domain

---

## DNS Configuration (Production Only)

When ready to add custom domain to production:

1. Go to Firebase Console → assiduous-prod → Hosting
2. Add custom domain: assiduousflip.com
3. Update GoDaddy DNS with Firebase's records
4. Wait for propagation (15 mins - 2 hours)
5. SSL certificate auto-provisions (FREE)

The staging environment (assiduous-staging.web.app) requires NO changes.