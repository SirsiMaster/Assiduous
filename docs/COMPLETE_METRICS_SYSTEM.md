# Complete Real-Time Metrics System

## Two Types of Metrics

### 1. **Development Metrics** (Code/Infrastructure)
Tracks your **development progress**:
- Git commits
- Files changed
- Hours worked
- Project velocity
- Feature completion

**Updated by**: GitHub Actions (on code push)

---

### 2. **Business Metrics** (Operations/Data)
Tracks your **business operations**:
- Users registered
- Agents added
- Properties listed
- Transactions completed
- Revenue generated

**Updated by**: Firebase Cloud Functions (on data changes)

---

## Architecture

```
CODE CHANGES                               DATA CHANGES
─────────────────────────────────────────────────────────────────
                                                                  
git push                                   New user signup       
    ↓                                          ↓                 
GitHub Actions                             Firestore onCreate    
    ↓                                          ↓                 
update-firebase-metrics.js                 Cloud Function        
    ↓                                          ↓                 
development_metrics ───┐                   business_metrics ─┐  
git_commits ───────────┤                   business_activity ─┤  
project_metadata ──────┤                                       │  
                       │                                        │  
                       └────────────────────────────────────────┤  
                                                                │  
                                    Firebase Firestore          │  
                                            ↓                   │  
                                  DevelopmentMetricsService     │  
                                    (Real-time listeners)       │  
                                            ↓                   │  
                                        Dashboard ←─────────────┘  
                                    (Updates instantly)            
```

---

## Firebase Collections

### Development Metrics Collections

#### `git_commits/{hash}`
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

#### `development_metrics/{YYYY-MM-DD}`
```javascript
{
  date: "2025-11-06",
  commits: 15,
  hours: 8.5,
  cost: 1275,
  deployments: 2
}
```

#### `project_metadata/current`
```javascript
{
  totalCommits: 850,
  totalFiles: 780,
  totalDays: 89,
  velocity: 9.5,
  actualStartDate: "2025-08-10"
}
```

---

### Business Metrics Collections

#### `business_metrics/current`
**Auto-updated by Cloud Functions**
```javascript
{
  users: {
    total: 1247,
    clients: 1158,
    agents: 89,
    admins: 10
  },
  properties: {
    total: 3542,
    active: 2890,
    pending: 450,
    sold: 202
  },
  transactions: {
    total: 342,
    pending: 34,
    completed: 308,
    totalValue: 48600000  // $48.6M
  },
  updatedAt: Timestamp
}
```

#### `business_activity` (Log of all changes)
```javascript
{
  type: "user_created" | "property_created" | "transaction_created",
  userId/propertyId/transactionId: "...",
  metadata: { ... },
  timestamp: Timestamp
}
```

---

## How It Works

### When Code Changes (Development Metrics)
```bash
1. You: git commit -m "feat: new feature"
2. You: git push origin main
3. GitHub Actions: Runs update-firebase-metrics.js
4. Script writes to: git_commits, development_metrics, project_metadata
5. Dashboard: Real-time listeners detect change
6. UI: Updates development stats instantly
```

### When Data Changes (Business Metrics)
```bash
1. User: Signs up via /auth/signup.html
2. Firestore: Creates document in 'users' collection
3. Cloud Function: onUserCreated trigger fires
4. Function: Recalculates business_metrics/current
5. Function: Logs to business_activity collection
6. Dashboard: Real-time listener detects change
7. UI: Updates user count instantly
```

---

## Dashboard Real-Time Updates

The `DevelopmentMetricsService` subscribes to ALL collections:

```javascript
// Dashboard initialization
const service = new DevelopmentMetricsService();
await service.initialize();

// Single subscription gets ALL metrics
service.subscribeToMetrics((metrics) => {
    // Development metrics
    console.log('Total commits:', metrics.project.totalCommits);
    console.log('Today commits:', metrics.today.commits);
    
    // Business metrics (NEW!)
    console.log('Total users:', metrics.business.users.total);
    console.log('Total properties:', metrics.business.properties.total);
    console.log('Total transactions:', metrics.business.transactions.total);
});
```

Updates are **instant** - no polling, no delays!

---

## Cloud Functions Deployment

### Initial Setup
```bash
cd functions
npm install
```

### Deploy Functions
```bash
firebase deploy --only functions
```

This deploys:
- ✅ `onUserCreated` - Triggers on new user
- ✅ `onPropertyCreated` - Triggers on new property
- ✅ `onPropertyUpdated` - Triggers on property status change
- ✅ `onTransactionCreated` - Triggers on new transaction
- ✅ `onTransactionUpdated` - Triggers on transaction status change
- ✅ `scheduledMetricsUpdate` - Runs hourly (backup)
- ✅ `refreshBusinessMetrics` - Manual refresh endpoint

### Test Functions Locally
```bash
firebase emulators:start
```

### View Function Logs
```bash
firebase functions:log
```

---

## Admin Dashboard Integration

Update your admin dashboard to show both metrics:

```javascript
// In dashboard.html
function updateDashboardMetrics(metrics) {
    // Development Metrics
    document.getElementById('totalCommits').textContent = metrics.project.totalCommits;
    document.getElementById('todayCommits').textContent = metrics.today.commits;
    
    // Business Metrics (NEW!)
    document.getElementById('totalUsers').textContent = metrics.business.users.total;
    document.getElementById('totalAgents').textContent = metrics.business.users.agents;
    document.getElementById('totalProperties').textContent = metrics.business.properties.total;
    document.getElementById('activeProperties').textContent = metrics.business.properties.active;
    document.getElementById('totalTransactions').textContent = metrics.business.transactions.total;
    document.getElementById('transactionValue').textContent = 
        '$' + (metrics.business.transactions.totalValue / 1000000).toFixed(1) + 'M';
}
```

---

## Benefits

### Development Metrics
✅ Tracks your **coding productivity**  
✅ Shows **development velocity**  
✅ Monitors **project progress**  

### Business Metrics
✅ Tracks **platform growth**  
✅ Shows **revenue generation**  
✅ Monitors **user engagement**  

### Combined
✅ **Complete picture** of project and business  
✅ **Real-time updates** for both types  
✅ **Automatic tracking** - zero manual work  
✅ **Historical data** preserved  
✅ **Scalable** - handles millions of updates  

---

## Testing

### Test Development Metrics
```bash
git commit --allow-empty -m "test: development metrics"
git push origin main
# Watch GitHub Actions run
# Check dashboard updates
```

### Test Business Metrics
```bash
# Option 1: Manual function call
firebase functions:shell
> refreshBusinessMetrics()

# Option 2: Create test data
# Sign up a new user at /auth/signup.html
# Check dashboard updates instantly
```

---

## Cost

**Development Metrics**: Free (GitHub Actions)  
**Business Metrics**: ~$0.40 per million function invocations  

With typical usage:
- 100 users/day = 100 function calls = $0.00004
- 50 properties/day = 50 function calls = $0.00002
- **Total monthly cost**: < $1

---

## What's Next

1. **Deploy Cloud Functions**: `firebase deploy --only functions`
2. **Verify Triggers**: Create a test user, watch logs
3. **Update Dashboard**: Add business metrics display
4. **Monitor**: Check Firebase Console → Functions

Now you have **complete real-time metrics** for both development AND business! 🎉

---

## Server-Side Dev History & Metrics Pipeline (Canonical)

This section defines how development history and metrics are kept up to date **without any local scripts**.

### 1. GitHub → Cloud Functions → Firestore

**Functions:**
- `functions/src/index.ts:githubWebhook`
  - Type: HTTPS (v2 `onRequest`)
  - Purpose: Ingest GitHub `push` events and write:
    - `git_commits/{hash}` docs
    - `development_metrics/{YYYY-MM-DD}.commits` increments
- `functions/src/index.ts:recomputeDailyMetrics`
  - Type: HTTPS (v2 `onRequest`)
  - Purpose: Recompute `development_metrics/{date}.commits` from `git_commits` for a rolling window (e.g. last 90 days).

**Collections used:**
- `git_commits`
- `development_metrics`
- `development_sessions`
- `project_metadata` / `project_analytics`

### 2. Configure GitHub Webhook (once per repo)

1. Go to the GitHub repo settings: **Settings → Webhooks**.
2. Click **Add webhook**:
   - **Payload URL:**
     - `https://us-central1-assiduous-prod.cloudfunctions.net/githubWebhook`
     - (replace `assiduous-prod` with the correct project if needed)
   - **Content type:** `application/json`
   - **Secret:** _(optional, can be added later)_
   - **SSL verification:** enabled
   - **Events:** Select "Just the push event".
3. Click **Add webhook**.

After this, every push to `main` will POST to `githubWebhook`, and commits will appear in `git_commits` plus `development_metrics`.

### 3. Configure Cloud Scheduler for Recompute (recommended)

Use **Cloud Scheduler** to call `recomputeDailyMetrics` once per day as a safety net.

- **Target URL:**
  - `https://us-central1-assiduous-prod.cloudfunctions.net/recomputeDailyMetrics`
- **Schedule:**
  - Example: `0 5 * * *` (05:00 UTC daily)
- **HTTP method:** `GET` or `POST` (function ignores body)
- **Auth:**
  - For simplicity, you can allow unauthenticated access on this function, or
  - Configure it to use an appropriate service account and set Scheduler to use OIDC.

### 4. Verification Procedure

To verify the pipeline end-to-end:

1. **Make a test commit** to `main`.
2. In Firestore:
   - Confirm a new doc exists in `git_commits` with the commit hash.
   - Confirm `development_metrics/{today}` has `commits` incremented.
3. Open `/admin/development/dashboard.html`:
   - The **Today’s Commits** card should reflect the new count.
   - The **History Explorer** should list today with updated commits.
   - The **Consistency** pill should show **"In sync"** if counts match.

If consistency shows a mismatch, wait for `recomputeDailyMetrics` to run or trigger it manually, then refresh the dashboard.

---
