# Firebase Setup for Real-Time Metrics

## One-Time Setup (5 minutes)

### Step 1: Generate Firebase Admin Key

```bash
# Open Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts/adminsdk
```

1. Click **"Generate new private key"**
2. Download the JSON file
3. Rename it to `firebase-admin-key.json`
4. Move it to the project root:

```bash
mv ~/Downloads/assiduous-prod-*.json firebase-admin-key.json
```

### Step 2: Install Dependencies

```bash
npm install firebase-admin
```

### Step 3: Test It

```bash
# Make a test commit
git commit --allow-empty -m "test: verify Firebase metrics"
```

You should see:
```
📊 Updating Firebase metrics...
🚀 Updating Firebase metrics...
📝 Adding commit to Firebase...
📊 Updating daily metrics...
📋 Updating project metadata...
✅ Firebase metrics updated successfully!
```

### Step 4: Verify Dashboard

```bash
open https://assiduous-prod.web.app/admin/development/dashboard.html
```

Open browser console - should see:
```
✅ Firebase metrics service initialized
🔥 Real-time update from Firebase
```

## That's It!

From now on, every commit automatically:
1. Updates Firebase Firestore
2. Dashboard updates in real-time
3. No manual steps needed

## Security Note

**IMPORTANT**: `firebase-admin-key.json` is in `.gitignore`

Never commit this file to Git! It contains sensitive credentials.

## Troubleshooting

### "Firebase service account key not found"
```bash
# Check file exists
ls firebase-admin-key.json

# Check file location (must be project root)
pwd
# Should show: /Users/thekryptodragon/Development/assiduous
```

### "Permission denied"
```bash
# Check Firebase IAM permissions
# Your service account needs Firestore write access
```

### Dashboard not updating
```bash
# Check browser console for errors
# Verify Firebase connection in Network tab
# Clear browser cache and reload
```

## What Happens Behind the Scenes

```
1. You: git commit -m "message"
2. Git Hook: runs post-commit
3. Script: node scripts/update-firebase-metrics.js
4. Firebase: Updates 3 collections
5. Dashboard: Real-time listener detects change
6. UI: Updates instantly without refresh
```

Simple! ✨
