# Metrics Quick Reference

## 🚀 Most Common Commands

```bash
# Deploy updated metrics to Firebase (use this most often)
./scripts/deploy-metrics-to-firebase.sh deploy

# Check current metrics (no deployment)
./scripts/deploy-metrics-to-firebase.sh

# Update metrics manually
node scripts/update-metrics-enhanced.js

# View dashboard
open https://assiduous-prod.web.app/admin/development/dashboard.html
```

## 🔄 How It Works

**Automatic**: Metrics update after every commit (git hook)  
**Manual**: Run deploy script when you want to update live dashboard  
**Optional**: Set up auto-deploy (see guide)

## 📚 Full Documentation

- **Self-Service Guide**: `docs/AUTOMATED_METRICS_GUIDE.md`
- **Technical Details**: `docs/METRICS_PIPELINE.md`

## 🆘 Quick Fixes

**Dashboard shows old data?**
```bash
./scripts/deploy-metrics-to-firebase.sh deploy
# Then: Cmd+Shift+R in browser
```

**Metrics not updating?**
```bash
node scripts/update-metrics-enhanced.js
```

**Firebase error?**
```bash
firebase login
firebase use assiduous-prod
```

## 🎯 When to Deploy

✅ End of day/week  
✅ Before meetings  
✅ Major milestones  
✅ Dashboard outdated  

## 📊 Your Metrics

- **541 commits** across **65 days** (23 active)
- **178 hours** = **$26,700** invested
- **46% complete** overall

---

**That's it! You're self-sufficient. 🎉**
