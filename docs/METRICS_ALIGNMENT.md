# Metrics Alignment: metrics.json ↔ Firebase Collections

## Overview
This document maps the existing `metrics.json` structure to the new Firebase Firestore collections for real-time updates.

## Architecture

### Legacy System (File-Based)
- **Source**: `public/admin/development/metrics.json`
- **Update**: Git hook (`scripts/update-metrics-enhanced.js`)
- **Frequency**: On every commit
- **Access**: Static file fetch

### New System (Real-Time Firebase)
- **Source**: Firestore collections
- **Update**: Git hook + manual updates
- **Frequency**: Real-time via onSnapshot listeners
- **Access**: `DevelopmentMetricsService`

## Collection Mappings

### 1. `development_metrics` Collection
**Purpose**: Daily aggregated metrics

**Document ID**: `YYYY-MM-DD` (e.g., `2025-11-06`)

**Schema**:
```javascript
{
  date: "2025-11-06",           // ISO date string
  hours: 14.5,                  // Float
  cost: 2178,                   // Number
  commits: 44,                  // Integer
  deployments: 0,               // Integer
  updatedAt: Timestamp          // Firestore timestamp
}
```

**Maps to metrics.json**:
- `metrics.today` → Current day's document
- `metrics.thisWeek` → Aggregated from last 7 documents
- `metrics.thisMonth` → Aggregated from current month documents
- `metrics.project.totalHours` → Sum of all hours
- `metrics.project.totalCost` → Sum of all costs
- `metrics.project.totalCommits` → Sum of all commits

---

### 2. `git_commits` Collection
**Purpose**: Individual commit tracking

**Document ID**: Git commit hash (e.g., `e7530966ee660539...`)

**Schema**:
```javascript
{
  hash: "e7530966ee660539...",  // Full git hash
  message: "feat(dashboard)...", // Commit message
  author: "SirsiMaster",         // Committer name
  timestamp: Timestamp,          // Commit timestamp
  filesChanged: 6,               // Integer
  linesAdded: 3278,              // Integer
  linesDeleted: 56               // Integer
}
```

**Maps to metrics.json**:
- `metrics.recentActivity[]` → Last 10-20 documents (ordered by timestamp desc)
- `metrics.project.totalCommits` → Total document count

---

### 3. `feature_progress` Collection
**Purpose**: Feature completion tracking

**Document ID**: Feature name (e.g., `authentication`, `microFlipping`)

**Schema**:
```javascript
{
  status: "complete",            // "complete" | "in-progress" | "not-started"
  percentage: 100,               // Integer 0-100
  description: "Firebase Auth with role-based access",
  completedTasks: [              // Array of strings
    "Firebase setup",
    "Role system"
  ],
  remainingTasks: [],            // Array of strings
  updatedAt: Timestamp           // Firestore timestamp
}
```

**Maps to metrics.json**:
- `metrics.features.authentication` → Document `authentication`
- `metrics.features.adminPortal` → Document `adminPortal`
- `metrics.features.microFlipping` → Document `microFlipping`
- etc.

---

### 4. `development_sessions` Collection
**Purpose**: Individual work sessions

**Document ID**: Auto-generated or `YYYYMMDD_NNN`

**Schema**:
```javascript
{
  sessionId: "20251106_001",    // String
  date: "2025-11-06",           // ISO date string
  duration: 4.5,                // Hours (float)
  costTracking: {
    totalCost: 675,             // Number
    hourlyRate: 150             // Number
  },
  metrics: {
    commitsCreated: 12,         // Integer
    filesModified: 23           // Integer
  },
  createdAt: Timestamp,         // Firestore timestamp
  updatedAt: Timestamp          // Firestore timestamp
}
```

**Maps to metrics.json**:
- Used to calculate `metrics.today.hours`
- Used to calculate `metrics.project.totalHours`
- Not directly stored in metrics.json (calculated on-demand)

---

### 5. `project_metadata` Collection
**Purpose**: Overall project statistics

**Document ID**: `current` (single document)

**Schema**:
```javascript
{
  totalHours: 275,              // Float
  avgHoursPerDay: 8.9,          // Float
  totalCost: 43129,             // Number
  laborCost: 41250,             // Number
  toolsCost: 1879,              // Number
  totalCommits: 833,            // Integer
  totalFiles: 777,              // Integer
  activeDays: 31,               // Integer
  totalDays: 88,                // Integer
  velocity: 26.9,               // Float (commits/day)
  completionPercentage: 46,     // Integer 0-100
  actualStartDate: "2025-08-10", // ISO date string
  updatedAt: Timestamp          // Firestore timestamp
}
```

**Maps to metrics.json**:
- `metrics.project.*` → Direct 1:1 mapping

---

### 6. `automation_status` Collection
**Purpose**: Automation and git hook status

**Document ID**: `current` (single document)

**Schema**:
```javascript
{
  lastRun: Timestamp,           // When script last ran
  gitHookInstalled: true,       // Boolean
  scriptPath: "/Users/.../update-metrics-enhanced.js",
  updateFrequency: "On every commit (via git hook)",
  version: "2.0 - Enhanced",
  updatedAt: Timestamp
}
```

**Maps to metrics.json**:
- `metrics.automation.*` → Direct 1:1 mapping

---

### 7. `deployment_status` Collection
**Purpose**: Deployment tracking

**Document ID**: `current` (single document)

**Schema**:
```javascript
{
  lastDeployment: Timestamp,
  totalDeployments: 130,        // Integer
  deploymentFrequency: "Weekly",
  environments: {
    production: {
      url: "https://assiduous-prod.web.app",
      status: "Active",
      lastDeploy: Timestamp
    },
    staging: { ... }
  },
  cicd: {
    provider: "GitHub Actions",
    status: "Configured",
    lastRun: "Unknown",
    successRate: "TBD"
  },
  uptime: {
    last24h: 99.9,
    last7d: 99.9,
    last30d: 99.9
  },
  updatedAt: Timestamp
}
```

**Maps to metrics.json**:
- `metrics.deployment.*` → Direct 1:1 mapping

---

## Data Flow

### Current Flow (File-Based)
```
Git Commit → Git Hook → update-metrics-enhanced.js → metrics.json → Dashboard reads file
```

### New Flow (Hybrid)
```
Git Commit → Git Hook → update-metrics-enhanced.js → metrics.json (fallback)
                                                    ↓
                                            Firebase Firestore
                                                    ↓
                                    DevelopmentMetricsService (real-time)
                                                    ↓
                                            Dashboard updates
```

### Future Flow (Firebase-First)
```
Git Commit → Git Hook → update-metrics-enhanced.js → Firebase Firestore → Dashboard (real-time)
                                                            ↓
                                                      metrics.json (backup)
```

## Migration Process

### Step 1: Initial Migration
Run `migrate_metrics_to_firebase.js` to populate Firebase with existing metrics.json data:

```javascript
// In browser console on dashboard
await migrateMetricsToFirebase();
```

### Step 2: Dual Write Period
Update git hook to write to both:
1. `metrics.json` (existing)
2. Firebase Firestore (new)

### Step 3: Validation Period
- Monitor both sources
- Verify data consistency
- Fix any discrepancies

### Step 4: Firebase-First
- Switch to Firebase as primary
- Keep metrics.json as backup/fallback
- Dashboard uses real-time Firebase by default

## Alignment Verification

### Check Alignment
```javascript
// In browser console
const service = new DevelopmentMetricsService();
await service.initialize();
const firebaseMetrics = await service.getDashboardMetrics();

const metricsJson = await fetch('./metrics.json').then(r => r.json());

// Compare
console.log('Firebase today commits:', firebaseMetrics.today.commits);
console.log('JSON today commits:', metricsJson.today.commits);
```

### Expected Behavior
- **Immediate**: metrics.json has latest data (updated on commit)
- **Within 1s**: Firebase has same data (real-time sync)
- **Dashboard**: Shows Firebase data if available, falls back to JSON

## Benefits of Firebase Approach

1. **Real-Time Updates**: Dashboard updates instantly when data changes
2. **No Polling**: Efficient WebSocket connections vs. repeated file fetches
3. **Structured Queries**: Filter, sort, aggregate in database
4. **Scalability**: Firebase handles millions of reads/writes
5. **Offline Support**: Built-in offline persistence
6. **Multi-User**: Multiple dashboards see same real-time data

## Backwards Compatibility

The system maintains full backwards compatibility:

- ✅ `metrics.json` still generated on every commit
- ✅ Dashboard falls back to `metrics.json` if Firebase unavailable
- ✅ Existing scripts continue to work
- ✅ No breaking changes to metrics format

## Future Enhancements

### Planned Features
1. **Historical Trends**: Query metrics by date range
2. **Custom Aggregations**: Weekly/monthly rollups
3. **Alerting**: Real-time notifications on metric thresholds
4. **Multi-Project**: Support multiple project tracking
5. **Analytics**: Advanced queries and visualizations

### Collection Additions
- `deployment_logs` - Individual deployment records
- `performance_metrics` - Page load times, API response times
- `user_activity` - Dashboard usage tracking
- `alerts` - Threshold-based notifications
