# Automated Metrics Guide - Self-Service

This guide ensures your metrics and dashboard stay updated **automatically** without needing assistance.

## 🎯 What Happens Automatically

### After Every Git Commit:
1. ✅ **Metrics auto-update** via `.git/hooks/post-commit`
2. ✅ **Local metrics file updated** at `public/admin/development/metrics_cache.json`
3. ⚠️ **Firebase deployment** requires manual trigger (see below)

### What You See:
- **Local development**: Metrics update immediately
- **Deployed dashboard**: Requires deployment to Firebase

---

## 🚀 Quick Commands

### 1. Update Metrics Manually
```bash
# From project root
cd /Users/thekryptodragon/Development/assiduous
node scripts/update-metrics-enhanced.js
```

**When to use**: Before reviewing project status or generating reports

---

### 2. Deploy Metrics to Firebase
```bash
# Update metrics and deploy to Firebase in one command
cd /Users/thekryptodragon/Development/assiduous
./scripts/deploy-metrics-to-firebase.sh deploy
```

**When to use**: After significant development work to update live dashboard

**What it does**:
- ✅ Updates metrics from git
- ✅ Shows current metrics summary
- ✅ Deploys to Firebase hosting
- ✅ Provides URLs to verify

---

### 3. Check Current Metrics
```bash
# Just update and view metrics (no deployment)
./scripts/deploy-metrics-to-firebase.sh
```

---

### 4. Verify Deployment
```bash
# Check deployed metrics file
curl -s https://assiduous-prod.web.app/admin/development/metrics_cache.json | jq '.project | {commits: .totalCommits, totalDays, activeDays}'

# Check dashboard
open https://assiduous-prod.web.app/admin/development/dashboard.html
```

---

## 📋 Daily Workflow

### Option A: Regular Commits (Metrics Update Automatically)
```bash
# 1. Work on your project
# 2. Commit changes (metrics update automatically)
git add .
git commit -m "feat: add new feature"

# 3. Metrics are now updated locally
# 4. Deploy when ready to share
./scripts/deploy-metrics-to-firebase.sh deploy
```

### Option B: End of Day Deployment
```bash
# After all commits for the day
./scripts/deploy-metrics-to-firebase.sh deploy

# This updates the live dashboard with today's progress
```

### Option C: Automated Deployment (Recommended)
Add this to your `.zshrc` or `.bashrc`:

```bash
# Auto-deploy metrics after commits
function git() {
    command git "$@"
    if [[ "$1" == "push" ]]; then
        echo "📊 Deploying updated metrics to Firebase..."
        cd ~/Development/assiduous
        ./scripts/deploy-metrics-to-firebase.sh deploy >/dev/null 2>&1 &
    fi
}
```

Then reload: `source ~/.zshrc`

Now metrics auto-deploy whenever you push!

---

## 🔧 Troubleshooting

### Dashboard Shows Old Data

**Cause**: Browser cache or deployment needed

**Solution**:
```bash
# 1. Redeploy to Firebase
./scripts/deploy-metrics-to-firebase.sh deploy

# 2. Hard refresh browser
# Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
# Firefox: Cmd+Shift+R or Ctrl+F5
# Safari: Cmd+Option+R

# 3. Verify metrics file updated
curl -s https://assiduous-prod.web.app/admin/development/metrics_cache.json | jq '.lastUpdated'
```

---

### Metrics Not Updating After Commit

**Cause**: Git hook not running

**Solution**:
```bash
# 1. Check if hook exists
ls -la .git/hooks/post-commit

# 2. Verify it's executable
chmod +x .git/hooks/post-commit

# 3. Test manually
node scripts/update-metrics-enhanced.js

# 4. Check hook log
cat /tmp/assiduous-metrics.log
```

---

### Firebase Deployment Fails

**Cause**: Not logged in or wrong project

**Solution**:
```bash
# 1. Login to Firebase
firebase login

# 2. Verify correct project
firebase use assiduous-prod

# 3. Try deployment again
cd firebase-migration-package/assiduous-build
firebase deploy --only hosting
```

---

## 📊 Understanding Your Metrics

### Key Metrics Explained:

**Total Days vs Active Days**:
- `totalDays`: Calendar days since project start (e.g., 65)
- `activeDays`: Days you actually committed code (e.g., 23)
- Shows: "65 days (23 active)"

**Velocity**:
- Commits per **active day** (e.g., 23.4 commits/day)
- Not total days (which would artificially lower it)

**Development Cost**:
- Formula: `commits × 0.33 hours/commit × $150/hr`
- Current: 540 commits × 0.33 × $150 = $26,700

**Feature Completion**:
- Average of all 7 features (auth, admin, agent, client, micro, AI, payments)
- Updates as you progress each feature

---

## 🎯 When to Deploy

### Deploy After:
- ✅ End of day/week
- ✅ Before stakeholder meetings
- ✅ Major milestones
- ✅ Before generating reports
- ✅ When dashboard shows outdated data

### No Need to Deploy:
- ❌ After every single commit (unless auto-deploy enabled)
- ❌ During active development
- ❌ For local testing

---

## 🔄 Automated Deployment Options

### Option 1: GitHub Actions (Recommended for Teams)

Create `.github/workflows/deploy-metrics.yml`:

```yaml
name: Deploy Metrics to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g firebase-tools
      - run: node scripts/update-metrics-enhanced.js
      - run: firebase deploy --only hosting --token ${{ secrets.FIREBASE_TOKEN }}
```

Then deploy happens automatically on every push to main!

---

### Option 2: Cron Job (Daily Auto-Deploy)

Add to crontab (`crontab -e`):

```bash
# Deploy metrics every day at 6 PM
0 18 * * * cd ~/Development/assiduous && ./scripts/deploy-metrics-to-firebase.sh deploy >> ~/metrics-deploy.log 2>&1
```

---

### Option 3: Git Push Hook (Deploy on Push)

Create `.git/hooks/post-push`:

```bash
#!/bin/sh
echo "📊 Deploying metrics to Firebase..."
cd "$(git rev-parse --show-toplevel)"
./scripts/deploy-metrics-to-firebase.sh deploy &
```

Make it executable:
```bash
chmod +x .git/hooks/post-push
```

---

## 📚 Files to Know

### Important Files:
- **Metrics Script**: `scripts/update-metrics-enhanced.js` (generates metrics)
- **Deploy Script**: `scripts/deploy-metrics-to-firebase.sh` (deploys to Firebase)
- **Git Hook**: `.git/hooks/post-commit` (auto-updates after commits)
- **Metrics Output**: `public/admin/development/metrics_cache.json`
- **Dashboard**: `public/admin/development/dashboard.html`

### Don't Edit:
- ❌ `metrics_cache.json` (auto-generated)
- ❌ `metrics_realtime.json` (auto-generated)
- ❌ `.git/hooks/post-commit` (unless intentional)

### Safe to Edit:
- ✅ `scripts/update-metrics-enhanced.js` (customize feature percentages)
- ✅ `scripts/deploy-metrics-to-firebase.sh` (customize deployment)
- ✅ `dashboard.html` (customize dashboard UI)

---

## 🎓 Common Scenarios

### Scenario 1: "I worked all day, want to see my progress"

```bash
# Quick check
./scripts/deploy-metrics-to-firebase.sh

# Deploy to share
./scripts/deploy-metrics-to-firebase.sh deploy
```

---

### Scenario 2: "Dashboard shows old data from last week"

```bash
# Update and deploy
./scripts/deploy-metrics-to-firebase.sh deploy

# Hard refresh browser
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

### Scenario 3: "I want automated daily deployments"

```bash
# Option 1: Add to crontab
crontab -e
# Add: 0 18 * * * cd ~/Development/assiduous && ./scripts/deploy-metrics-to-firebase.sh deploy

# Option 2: Use GitHub Actions (see automated deployment options above)
```

---

### Scenario 4: "I want to customize feature percentages"

Edit `scripts/update-metrics-enhanced.js` around line 36:

```javascript
function calculateFeatures() {
    return {
        authentication: { percentage: 100 },  // Change these
        adminPortal: { percentage: 90 },
        // ... etc
    };
}
```

Then deploy:
```bash
./scripts/deploy-metrics-to-firebase.sh deploy
```

---

## ✅ Checklist: Everything Working?

Run these commands to verify:

```bash
# 1. Metrics update locally
node scripts/update-metrics-enhanced.js
# Should output: "✅ Enhanced metrics update complete!"

# 2. Git hook works
git commit --allow-empty -m "test: verify metrics hook"
cat /tmp/assiduous-metrics.log
# Should see: "✅ Enhanced metrics updated"

# 3. Deployment works
./scripts/deploy-metrics-to-firebase.sh deploy
# Should see: "✅ Deployment complete!"

# 4. Dashboard loads
open https://assiduous-prod.web.app/admin/development/dashboard.html
# Should show current metrics

# 5. Metrics API accessible
curl -s https://assiduous-prod.web.app/admin/development/metrics_cache.json | jq '.project.totalCommits'
# Should show current commit count
```

If all pass: **✅ Everything is working!**

---

## 🆘 Need Help?

### Quick Fixes:

1. **Metrics not updating**: Run manually
   ```bash
   node scripts/update-metrics-enhanced.js
   ```

2. **Dashboard outdated**: Redeploy
   ```bash
   ./scripts/deploy-metrics-to-firebase.sh deploy
   ```

3. **Firebase error**: Re-login
   ```bash
   firebase login
   firebase use assiduous-prod
   ```

4. **Browser cache**: Hard refresh
   - `Cmd+Shift+R` or open incognito

### Check Logs:
```bash
# Git hook log
cat /tmp/assiduous-metrics.log

# Firebase deployment log
cat ~/metrics-deploy.log  # If using cron job
```

---

## 🎉 You're All Set!

Your metrics now update automatically and you can deploy whenever needed. No assistance required!

**Quick reference**:
- Update: `node scripts/update-metrics-enhanced.js`
- Deploy: `./scripts/deploy-metrics-to-firebase.sh deploy`
- Dashboard: https://assiduous-prod.web.app/admin/development/dashboard.html

---

**Last Updated**: October 13, 2025  
**Status**: ✅ Fully Automated
