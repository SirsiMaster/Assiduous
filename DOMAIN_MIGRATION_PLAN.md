# Domain Migration Plan

## 🎯 Objective
Restructure domains to establish clear staging/production separation:
- **Current Staging**: `assiduous-staging.web.app` → **REMOVE**
- **Current Production**: `assiduousflip.web.app` → **BECOMES STAGING**  
- **New Production**: `www.assiduousflip.com` → **PUBLIC PRODUCTION**

---

## Migration Timeline: 30 Minutes Total

### Phase 1: DNS Setup (10 minutes)
**When: Immediately**

1. **Verify Domain Ownership**
   ```bash
   # Check DNS records
   nslookup www.assiduousflip.com
   dig www.assiduousflip.com
   ```

2. **Add Domain to Firebase**
   ```bash
   # Add custom domain to production
   firebase hosting:sites:create www-assiduousflip-com --project assiduous-prod
   firebase hosting:channel:deploy www-assiduousflip-com --project assiduous-prod
   ```

3. **Configure DNS Records**
   ```
   Type: A
   Host: www
   Value: 151.101.1.195
   
   Type: A  
   Host: www
   Value: 151.101.65.195
   
   Type: TXT
   Host: _acme-challenge.www
   Value: [Firebase will provide this]
   ```

4. **Verify SSL Certificate**
   - Firebase automatically provisions SSL via Let's Encrypt
   - Takes 10-24 hours for full propagation

### Phase 2: Firebase Reconfiguration (10 minutes)

1. **Update Firebase Targets**
   ```bash
   cd firebase-migration-package
   
   # Remove old staging
   firebase target:clear hosting staging --project assiduous-staging
   
   # Reconfigure targets
   firebase target:apply hosting staging assiduousflip --project assiduous-prod
   firebase target:apply hosting production www-assiduousflip-com --project assiduous-prod
   ```

2. **Update `.firebaserc`**
   ```json
   {
     "projects": {
       "default": "assiduous-prod",
       "production": "assiduous-prod"
     },
     "targets": {
       "assiduous-prod": {
         "hosting": {
           "staging": ["assiduousflip"],
           "production": ["www-assiduousflip-com"]
         }
       }
     }
   }
   ```

3. **Update `firebase.json`**
   ```json
   {
     "hosting": [
       {
         "target": "staging",
         "site": "assiduousflip",
         "public": "assiduous-build"
       },
       {
         "target": "production",
         "site": "www-assiduousflip-com",
         "public": "assiduous-build"
       }
     ]
   }
   ```

### Phase 3: Workflow Updates (5 minutes)

1. **Update GitHub Actions**
   - `deploy-staging.yml`: Deploy to `assiduousflip.web.app`
   - `deploy-production.yml`: Deploy to `www.assiduousflip.com`

2. **Update Monitoring**
   - Site monitor checks `www.assiduousflip.com` for production
   - Site monitor checks `assiduousflip.web.app` for staging

### Phase 4: Testing & Cutover (5 minutes)

1. **Test New Configuration**
   ```bash
   # Deploy to new staging (old production URL)
   firebase deploy --only hosting:staging --project assiduous-prod
   
   # Deploy to new production (custom domain)
   firebase deploy --only hosting:production --project assiduous-prod
   ```

2. **Verify Both Sites**
   ```bash
   # Check staging
   curl -I https://assiduousflip.web.app
   
   # Check production  
   curl -I https://www.assiduousflip.com
   ```

3. **Update Documentation**
   - README.md
   - All workflow files
   - FEATURE_REGISTRY.md

---

## Post-Migration Checklist

### Immediate (First Hour)
- [ ] DNS propagation started
- [ ] SSL certificate requested
- [ ] Both sites accessible
- [ ] Monitoring updated
- [ ] Team notified

### First 24 Hours
- [ ] DNS fully propagated
- [ ] SSL certificate active
- [ ] Search engines notified
- [ ] Analytics updated
- [ ] Old staging site decommissioned

### First Week
- [ ] SEO redirects in place
- [ ] All external links updated
- [ ] Performance benchmarks met
- [ ] No user complaints

---

## Rollback Plan

If issues occur, revert within 5 minutes:

```bash
# Revert Firebase configuration
git checkout HEAD~1 firebase-migration-package/.firebaserc
git checkout HEAD~1 firebase-migration-package/firebase.json

# Redeploy to original URLs
firebase deploy --only hosting --project assiduous-prod
```

---

## Technical Details

### Current Architecture
```
assiduous-staging.web.app (Staging) → Firebase Project: assiduous-staging
assiduousflip.web.app (Production) → Firebase Project: assiduous-prod
```

### New Architecture  
```
assiduousflip.web.app (Staging) → Firebase Project: assiduous-prod (staging target)
www.assiduousflip.com (Production) → Firebase Project: assiduous-prod (production target)
```

### Benefits
1. **Cleaner URLs**: Production on custom domain
2. **Cost Savings**: One less Firebase project ($10-20/month saved)
3. **Simpler Management**: Everything in one project
4. **Professional Image**: Custom domain for customers
5. **Clear Separation**: Obvious staging vs production URLs

---

## Migration Script

Save as `scripts/migrate-domains.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting Domain Migration..."

# Step 1: Backup current config
cp firebase-migration-package/.firebaserc firebase-migration-package/.firebaserc.backup
cp firebase-migration-package/firebase.json firebase-migration-package/firebase.json.backup

# Step 2: Update Firebase configuration
cd firebase-migration-package

# Clear old targets
firebase target:clear hosting staging --project assiduous-staging 2>/dev/null || true

# Apply new targets  
firebase target:apply hosting staging assiduousflip --project assiduous-prod
firebase target:apply hosting production www-assiduousflip-com --project assiduous-prod

# Step 3: Deploy to new URLs
echo "📦 Deploying to new staging (assiduousflip.web.app)..."
firebase deploy --only hosting:staging --project assiduous-prod

echo "📦 Deploying to new production (www.assiduousflip.com)..."
firebase deploy --only hosting:production --project assiduous-prod

echo "✅ Domain migration complete!"
echo ""
echo "New URLs:"
echo "  Staging: https://assiduousflip.web.app"
echo "  Production: https://www.assiduousflip.com"
```

---

## Communication Plan

### Internal Team
```
Subject: Domain Migration - Action Required

Team,

We're migrating to our new domain structure:
- Staging: assiduousflip.web.app (formerly production)
- Production: www.assiduousflip.com (new custom domain)

Migration window: [DATE] at [TIME]
Expected downtime: None
Action required: Update your bookmarks

Questions? Reply to this email.
```

### External Stakeholders
```
Subject: Exciting News - New Website Address!

We're upgrading to www.assiduousflip.com!

Our platform will be available at our new custom domain starting [DATE].
The transition will be seamless with no service interruption.

Thank you for your continued support!
```

---

*Migration Plan Created: October 11, 2025*
*Target Migration Date: TBD*