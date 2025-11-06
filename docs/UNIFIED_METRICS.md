# Unified Real-Time Metrics System

## Simple Architecture

```
Git Commit → Firebase → Dashboard (Real-Time)
```

**Single Source of Truth**: Firebase Firestore

## How It Works

### 1. You Make a Commit
```bash
git commit -m "feat: add new feature"
```

### 2. Git Hook Runs Automatically
Post-commit hook calls `/scripts/update-firebase-metrics.js`

### 3. Script Updates Firebase
Writes to 3 Firestore collections:
- `git_commits` - This commit's details
- `development_metrics` - Today's aggregated stats
- `project_metadata` - Overall project totals

### 4. Dashboard Updates Instantly
Real-time listeners detect changes and update UI automatically

## Setup (One-Time)

### 1. Get Firebase Admin Key
```bash
# Visit Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts/adminsdk

# Click "Generate new private key"
# Save as: firebase-admin-key.json
# Move to project root
```

### 2. Install Dependencies
```bash
npm install firebase-admin
```

### 3. Test the Script
```bash
node scripts/update-firebase-metrics.js
```

You should see:
```
🚀 Updating Firebase metrics...
📝 Adding commit to Firebase...
📊 Updating daily metrics...
📋 Updating project metadata...
✅ Firebase metrics updated successfully!
```

### 4. Verify Dashboard
Open: https://assiduous-prod.web.app/admin/development/dashboard.html

Should show "Live Data" indicator and real-time updates.

## Collections Schema

### `git_commits/{hash}`
```javascript
{
  hash: "abc123...",
  message: "feat: add feature",
  author: "SirsiMaster",
  timestamp: Timestamp,
  filesChanged: 5,
  linesAdded: 234,
  linesDeleted: 12
}
```

### `development_metrics/{YYYY-MM-DD}`
```javascript
{
  date: "2025-11-06",
  commits: 15,
  hours: 8.5,
  cost: 1275,
  deployments: 2,
  updatedAt: Timestamp
}
```

### `project_metadata/current`
```javascript
{
  totalCommits: 850,
  totalFiles: 780,
  totalDays: 89,
  velocity: 9.5,
  actualStartDate: "2025-08-10",
  updatedAt: Timestamp
}
```

## Dashboard Features

### Real-Time Updates
- New commits appear instantly
- Metrics update without refresh
- Live activity feed
- Auto-updating charts

### Metrics Displayed
- **Project Totals**: All-time stats
- **Today's Activity**: Current session
- **This Week**: Last 7 days
- **Recent Commits**: Last 20 commits
- **Development Progress**: Feature completion

## Troubleshooting

### "Firebase service account key not found"
```bash
# Download key from Firebase Console
# Save to project root as firebase-admin-key.json
```

### "Error updating Firebase"
```bash
# Check Firebase permissions
# Verify network connection
# Check script logs: cat /tmp/assiduous-metrics.log
```

### Dashboard not updating
```bash
# Open browser console
# Should see: "✅ Firebase metrics service initialized"
# Should see: "🔥 Real-time update from Firebase"
```

## What Changed From Old System

### Before (Complex)
```
Git Commit → Enhanced Script → metrics.json → Dashboard polls file
```
- Dual writes to file + Firebase
- Fallback logic complexity
- Polling every 60 seconds
- No real-time updates

### Now (Simple)
```
Git Commit → Firebase Script → Firestore → Dashboard real-time
```
- Single write to Firebase
- No fallback needed
- WebSocket connections
- Instant updates

## Benefits

✅ **Simpler**: One script, one data source  
✅ **Faster**: Real-time updates via WebSocket  
✅ **Reliable**: Firebase handles distribution  
✅ **Scalable**: Works with multiple dashboards  
✅ **Maintainable**: Single source of truth  

## Migration from Old System

If you have existing `metrics.json` data:

```bash
# Open dashboard
open https://assiduous-prod.web.app/admin/development/dashboard.html

# Open browser console
# Run migration script
migrateMetricsToFirebase()
```

This one-time migration populates Firebase with historical data.

## That's It!

No complex configurations. No dual writes. No fallbacks.

Just: **Commit → Firebase → Real-Time Dashboard** ✨
