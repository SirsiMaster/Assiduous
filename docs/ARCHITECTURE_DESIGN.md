# ARCHITECTURE DESIGN
**Version:** 2.2.0-canonical
**Last Updated:** 2025-11-12
**Status:** Canonical Document (1 of 19)
**Consolidation Date:** November 2, 2025

**Recent Updates:**
- November 12, 2025: Added ID Generator System and QR Code Architecture
- November 4, 2025: Added Universal Component System (UCS) as architectural layer

---

## System Architecture and Design Patterns

---

## Firebase Configuration & Analytics (Canonical)

**Production Project:** `assiduous-prod`  
**Canonical Web App (GA4-enabled):**
- `appId`: `1:9355377564:web:cee09f952eea43976ee659`  
- `measurementId`: `G-DVBZP21459`  
- `messagingSenderId`: `9355377564`

**Authoritative Config Files:**
- `public/assets/js/firebase-init.js` — modular SDK (Auth, Firestore, Storage, Functions, Analytics) for index.html, portals, and services.
- `public/firebase-config.js` — compat SDK initializer used by legacy/admin/client pages and QR flows.

All frontend Firebase usage MUST flow through these shared modules:
- **Do not** inline `firebase.initializeApp(...)` configs in HTML.
- **Do not** use legacy appIds (e.g. `1:9355377564:web:84bd6fa0e7c8a2e7c3f56b` or `1:594472642287:web:adf723a456b123c4567890`).
- New work MUST import from `firebase-init.js` (modular) or rely on `firebase-config.js` + the `firebase-ready` event.

Authentication is owned by the **modal-based flow** on `index.html` via `AuthService` from `firebase-init.js`, with `public/components/auth-guard.js` as the canonical guard for protected admin/agent/client pages.  
The older SirsiAuth stack (`public/components/sirsi-auth.js`, `public/assets/js/services/auth.js`) is **deprecated/quarantined** and MUST NOT be used for new features.

---

## Development History & Metrics Architecture (Canonical)

The platform maintains a **server-driven** development history and metrics layer used by the admin/development dashboards.

### Data Stores
- **Firestore Collections**
  - `git_commits` – append-only log of ingested commits
  - `development_metrics` – daily aggregates (hours, cost, commits, etc.)
  - `development_sessions` – higher-level work sessions
  - `project_metadata` / `project_analytics` – project totals and analytics
  - `business_metrics` – business-level KPIs (users, properties, leads, transactions)

### Ingestion Pipeline
- **Source of truth:** GitHub repo `SirsiMaster/Assiduous` (`main` branch).
- **GitHub Webhook → Cloud Function:**
  - Webhook target: `githubWebhook` (HTTPS function in `functions/src/index.ts`).
  - Trigger: `push` events.
  - Responsibility:
    - Write `git_commits/{hash}` docs for each commit.
    - Increment `development_metrics/{YYYY-MM-DD}.commits` for the commit date.
- **Scheduled Recompute (optional safety net):**
  - Cloud Scheduler calls `recomputeDailyMetrics` (HTTPS function) on a fixed schedule.
  - Reads `git_commits` over a rolling window (e.g. last 90 days) and recomputes `development_metrics/{date}.commits`.

All ingestion is **server-side**. Developer machines do not run long-lived metrics daemons; their only role is pushing code to GitHub.

### Consumption
- **Admin Dev Dashboards** (`/admin/development/*.html`):
  - Read from Firestore via `DevelopmentMetricsService` and direct queries.
  - Provide historical lookups (by date, range, all time) using only Firestore data.

This architecture guarantees that when the owner visits `/admin/development/dashboard.html`, they see an accurate, canonical history of commits and daily activity, regardless of which device was used to develop the code.

---

## Deployment & CI/CD (Canonical Overview)

All production deployments follow this pipeline:

1. **Source of Truth:** Local changes committed to the `main` branch in the GitHub repo `SirsiMaster/Assiduous`.
2. **CI Trigger:** A push to `main` that touches `public/**` automatically triggers the `deploy-production.yml` GitHub Actions workflow.
3. **Hosting Deploy:** `deploy-production.yml` runs `firebase deploy --only hosting --project assiduous-prod` (using `FIREBASE_TOKEN`) from the `public/` directory.
4. **Verification:** The workflow performs an HTTP health check against `https://assiduous-prod.web.app` and logs success/failure.
5. **Metrics Pipeline:** A separate workflow (`deploy-metrics.yml`) runs on every push to `main`, updating Firebase metrics for the development dashboard.

For detailed steps and environment options (dev/staging), see `docs/DEPLOYMENT_GUIDE.md`.

---

# Universal ID Generator System
**Added:** October 12, 2025 (Commit: 6a434a0a)  
**Status:** Production-Ready - In Use Across All Collections
**Location:** `/public/assets/js/services/id-generator.js`

## Overview

The ID Generator Service provides a **universal, atomic, sequential ID system** for all objects in Assiduous.

## ID Format

**Pattern**: `TYPE-YEAR-SEQUENCE`  
**Example**: `ACCT-2024-001234`

### Components
- **TYPE**: 2-6 letter prefix identifying object type
- **YEAR**: 4-digit current year (resets annually)
- **SEQUENCE**: 6-digit zero-padded sequential number

## Supported Types

| Type | Prefix | Example | Description |
|------|--------|---------|-------------|
| Account | `ACCT` | `ACCT-2024-001234` | User accounts |
| Property | `PROP` | `PROP-2024-005678` | Real estate properties |
| Transaction | `TRAN` | `TRAN-2024-000912` | Financial transactions |
| Message | `MSG` | `MSG-2024-003456` | System messages |
| Notification | `NOTIF` | `NOTIF-2024-007890` | User notifications |

## Architecture

### Firestore Counter Collection

**Collection**: `_id_counters`  
**Document Format**: `{TYPE}_{YEAR}`  
**Example**: `PROP_2024`

```javascript
{
  type: "PROP",
  year: 2024,
  current: 5678,
  created: Timestamp,
  lastUpdated: Timestamp
}
```

### Atomic Increment

Uses **Firestore transactions** to ensure atomic increments:

```javascript
const sequence = await db.runTransaction(async transaction => {
  const doc = await transaction.get(counterDoc);
  const nextSequence = (doc.data()?.current || 0) + 1;
  transaction.update(counterDoc, { current: nextSequence });
  return nextSequence;
});
```

## Usage

### Client-Side

```javascript
// Initialize (auto-initialized on firebase-ready event)
import { idGenerator } from './assets/js/services/id-generator.js';

// Generate IDs
const accountId = await idGenerator.generateAccountId();
// Returns: "ACCT-2024-001234"

const propertyId = await idGenerator.generatePropertyId();
// Returns: "PROP-2024-005678"

// Custom type
const customId = await idGenerator.generateId('CUSTOM');
// Returns: "CUSTOM-2024-000001"

// Parse ID
const parsed = idGenerator.parseId('PROP-2024-005678');
// Returns: { type: 'PROP', year: 2024, sequence: 5678, original: 'PROP-2024-005678' }

// Validate ID
const isValid = idGenerator.isValidId('PROP-2024-005678');
// Returns: true
```

### Server-Side (Cloud Functions)

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

function generateId(type) {
  const year = new Date().getFullYear();
  const counterKey = `${type}_${year}`;
  const counterRef = db.collection('_id_counters').doc(counterKey);
  
  return db.runTransaction(async transaction => {
    const doc = await transaction.get(counterRef);
    const nextSequence = (doc.data()?.current || 0) + 1;
    transaction.set(counterRef, { 
      type, year, current: nextSequence, 
      lastUpdated: admin.firestore.FieldValue.serverTimestamp() 
    }, { merge: true });
    return `${type}-${year}-${String(nextSequence).padStart(6, '0')}`;
  });
}
```

## Benefits

1. **Human-Readable**: Easy to communicate over phone/email
2. **Sequential**: Track creation order and volume
3. **Year-Based**: Automatic annual reset for reporting
4. **Type-Safe**: Prefix identifies object type instantly
5. **Atomic**: No duplicate IDs possible
6. **Searchable**: Easy to query by year or type
7. **Professional**: Better than random UUIDs for customer-facing systems

## Integration Points

### Existing Integrations
- ✅ Property creation (seeding scripts)
- ✅ Transaction generation
- ✅ Account management

### Future Integrations
- ⏳ QR code system (currently using random IDs)
- ⏳ Document management
- ⏳ Contract generation
- ⏳ Invoice numbering

---

# QR Code System Architecture
**Added:** November 12, 2025 (Commit: 7bd76bcf, b84ae6fd, dcc2f02d, 69f6542b)  
**Status:** Partially Validated – Profile QR live; property/referral QR pending full validation
**Location:** Cloud Functions v2 in `/functions/src/index.ts` (compiled to `/functions/lib/index.js`), legacy QR helpers in `/functions/index.js`, UI in `/public/components/property-qr-widget.html` and persona-specific pages

## Overview

Comprehensive QR code generation, sharing, and tracking system for properties and user profiles.

## Architecture Components

### 1. Cloud Functions (Backend)

#### `generatePropertyQR`
**Purpose**: Generate unique property QR codes  
**Trigger**: HTTPS Callable  
**Auth**: Required

```javascript
// Input
{ propertyId: string, regenerate?: boolean }

// Output
{
  success: true,
  assiduousId: "PROP-A3K9HZ2L", // Random 8-char ID
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?data=...",
  propertyUrl: "https://assiduous-prod.web.app/property-detail.html?id=abc123",
  regenerated: boolean
}
```

**Firestore Updates**:
```javascript
properties/{propertyId} {
  assiduousId: "PROP-A3K9HZ2L",
  qrCodeUrl: "https://...",
  propertyUrl: "https://...",
  qrGeneratedAt: Timestamp,
  qrGeneratedBy: userId
}
```

#### `sharePropertyQR`
**Purpose**: Share property via email/SMS with tracking  
**Trigger**: HTTPS Callable  
**Auth**: Required

```javascript
// Input
{
  propertyId: string,
  recipientEmail?: string,
  recipientPhone?: string,
  method: "email" | "sms",
  personalMessage?: string
}

// Creates tracking document
property_shares/{shareId} {
  propertyId: string,
  assiduousId: string,
  sharedBy: userId,
  sharerName: string,
  method: "email" | "sms",
  recipientEmail?: string,
  recipientPhone?: string,
  sharedAt: Timestamp,
  viewed: false,
  viewedAt: null,
  viewerId: null
}
```

#### `trackPropertyView`
**Purpose**: Record property views from shared links  
**Trigger**: HTTPS Callable  
**Auth**: Optional (works for anonymous viewers)

```javascript
// Input
{
  propertyId: string,
  sharedBy?: string // From URL parameter
}

// Updates share tracking
property_shares/{shareId} {
  viewed: true,
  viewedAt: Timestamp,
  viewerId: userId
}

// Creates view record
properties/{propertyId}/views/{viewId} {
  viewedAt: Timestamp,
  viewerId: userId,
  sharedBy: userId,
  attribution: "email" | "sms" | "direct"
}
```

#### `generateUserQR`
**Purpose**: Generate profile QR codes for users across personas (admin/agent/client)  
**Trigger**: HTTPS Callable (v2 `onCall` in `functions/src/index.ts`)  
**Auth**: Required

```javascript
// Input
{ regenerate?: boolean, userId?: string }

// Output
{
  success: true,
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?data=...",
  profileUrl: "https://assiduous-prod.web.app/{role}/profile.html?id=USER_ID",
  regenerated: boolean
}

// Updates user document
users/{userId} {
  profileQRCode: "https://...",
  profileUrl: "https://assiduous-prod.web.app/{role}/profile.html?id=USER_ID",
  profileQRGeneratedAt: Timestamp,
  updatedAt: Timestamp
}
```

> Current UI usage: `public/client/my-qr.html` calls this via `CloudFunctionsService.generateUserQR` from `firebase-init.js`. Admin/agent personas can reuse the same callable and URL pattern for their own profile QR pages.

### 2. Frontend Components

#### Property QR Widget (`property-qr-widget.html`)
**Usage**: Embedded in all property detail pages  
**Features**:
- Display Assiduous ID and QR code
- Download QR as PNG
- Copy property link
- Share via email/SMS modal
- Regenerate QR code
- Auto-scroll on #qr hash

**Integration**:
```html
<!-- Property Detail Page -->
<div id="propertyQRContainer"></div>

<script>
  fetch('../components/property-qr-widget.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('propertyQRContainer').innerHTML = html;
    });
    
  // After property loads
  if (typeof initPropertyQR === 'function') {
    initPropertyQR(propertyId);
  }
</script>
```

#### User QR Page (`client/my-qr.html`)
**Purpose**: Dedicated page for personal QR codes  
**Features**:
- View personal QR code
- Download for business cards
- Share via social media
- Regenerate QR code
- Usage examples

**Navigation**: Added to client sidebar under "My Portal"

#### Quick Access Buttons
**Location**: Property list cards  
**Behavior**: Opens property detail page with #qr hash, auto-scrolls to QR section

```html
<button onclick="event.stopPropagation(); openPropertyQR('{propertyId}')">
  <!-- QR Icon SVG -->
</button>
```

## Data Flow

### Property Sharing Flow

```
1. Agent opens property detail page
   ↓
2. Clicks "Share" button in QR widget
   ↓
3. Enters client email/phone + personal message
   ↓
4. Cloud Function sharePropertyQR creates tracking doc
   ↓
5. SendGrid/Twilio sends email/SMS with tracked link
   ↓
6. Client clicks link with ?shared_by={agentId}
   ↓
7. Property detail page calls trackPropertyView
   ↓
8. View recorded, attribution saved
```

### Attribution Tracking

**URL Format**: `property-detail.html?id={propertyId}&shared_by={userId}`

**Tracked Data**:
- Who shared (agent/admin)
- How shared (email/SMS)
- When shared
- Who viewed
- When viewed
- Conversion funnel

## Database Schema

### Collections

```
properties/{propertyId}
  ├── assiduousId: string ("PROP-XXXXXXXX")
  ├── qrCodeUrl: string
  ├── propertyUrl: string
  ├── qrGeneratedAt: Timestamp
  ├── qrGeneratedBy: string (userId)
  └── /views/{viewId}
      ├── viewedAt: Timestamp
      ├── viewerId: string
      ├── sharedBy: string
      └── attribution: string

property_shares/{shareId}
  ├── propertyId: string
  ├── assiduousId: string
  ├── sharedBy: string (userId)
  ├── sharerName: string
  ├── method: "email" | "sms"
  ├── recipientEmail?: string
  ├── recipientPhone?: string
  ├── sharedAt: Timestamp
  ├── viewed: boolean
  ├── viewedAt?: Timestamp
  └── viewerId?: string

users/{userId}
  ├── profileQRCode: string
  ├── profileUrl: string
  └── profileQRGeneratedAt: Timestamp
```

### Security Rules

```javascript
// Property shares - users can read their own
match /property_shares/{shareId} {
  allow read: if request.auth != null && 
    (resource.data.sharedBy == request.auth.uid || 
     request.auth.token.role == 'admin');
  allow write: if false; // Server-only
}
```

## QR Code Generation

**Service**: api.qrserver.com  
**Format**: PNG  
**Size**: 
- Properties: 400x400px
- User Profiles: 300x300px

**URL Structure**:
```
https://api.qrserver.com/v1/create-qr-code/
  ?size=400x400
  &data={encoded_url}
```

## Future Enhancements

### Planned Integrations
1. **ID Generator Integration**: Replace random `PROP-XXXXXXXX` with sequential `PROP-2024-001234`
2. **Analytics Dashboard**: View/share metrics per property
3. **Custom QR Branding**: Add logo to center of QR codes
4. **Vanity URLs**: Short URLs like `assiduous.io/p/ABC123`
5. **Admin QR Management**: Bulk generate QR codes
6. **Agent QR Dashboard**: Track all shared properties

### Integration with ID Generator

**Current**: Random 8-char IDs (`PROP-A3K9HZ2L`)  
**Planned**: Sequential IDs (`PROP-2024-001234`)

**Migration Path**:
```javascript
// In generatePropertyQR function
// Replace:
const assiduousId = generatePropertyId(); // Random

// With:
const idGenerator = require('./id-generator');
const assiduousId = await idGenerator.generateId('PROP'); // Sequential
```

**Benefits**:
- Consistent ID format across system
- Better tracking and reporting
- Professional sequential numbering
- Year-based organization

---

**Document Type:** Architecture Design  
**Version:** 2.1.0  
**Last Updated:** November 4, 2025  
**Status:** Authoritative Architecture Document
**Consolidation Note:** Merged from CI_CD_CORRECTED_ARCHITECTURE.md and technical sections of WARP.md

**Recent Updates:**
- November 4, 2025: Added Universal Component System (UCS) as architectural layer
- October 9, 2025: Initial architecture documentation

---

# Universal Component System (UCS) Architecture Layer
**Added:** November 4, 2025  
**Status:** Phase 0 Complete - Infrastructure Operational

## Architectural Overview

UCS introduces a new **build-time processing layer** between source code and deployment:

```
┌─────────────────────────────────────────────────────────────────┐
│ DEVELOPER WRITES                                                │
├─────────────────────────────────────────────────────────────────┤
│ .template.html files with component directives                 │
│ <!-- @component:sidebar active="dashboard" -->                 │
│ <!-- @component:header title="My Page" -->                     │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ BUILD SYSTEM PROCESSES (npm run ucs:build)                     │
├─────────────────────────────────────────────────────────────────┤
│ scripts/build-pages.js                                          │
│ • Discovers .template.html files                                │
│ • Parses component directives                                   │
│ • Loads components from public/components/                      │
│ • Replaces tokens ({{BASE_PATH}}, {{ASSETS_PATH}})             │
│ • Validates against component registry                          │
│ • Injects components with proper wrappers                       │
│ • Generates output .html files                                  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER RECEIVES                                                │
├─────────────────────────────────────────────────────────────────┤
│ .html files with fully resolved paths                          │
│ <aside class="sidebar">...sidebar HTML...</aside>              │
│ <header>...header HTML...</header>                             │
│ All paths: ../assets/css/styles.css (calculated)              │
└─────────────────────────────────────────────────────────────────┘
```

## Build-Time vs Runtime Architecture

### Traditional Runtime Component Loading (Before UCS)
```
Browser loads HTML
    ↓
JavaScript executes
    ↓
Fetch component HTML
    ↓
Calculate paths dynamically
    ↓
Inject into DOM
    ↓
Render (slower, FOUC possible)
```

### Build-Time Component System (After UCS)
```
Developer runs npm run ucs:build
    ↓
Build system generates static HTML
    ↓
Browser loads complete HTML
    ↓
Render immediately (fast, no FOUC)
```

## Component Dependency Graph

```
public/assiduous.config.js
    ↓ (configuration)
public/components/registry.json
    ↓ (schema validation)
public/components/*.html
    ↓ (component templates)
scripts/build-pages.js
    ↓ (build processor)
public/**/*.template.html
    ↓ (source templates)
public/**/*.html
    ↓ (generated output)
Firebase Hosting
```

## Integration Points

### 1. Development Workflow Integration
- Developers create `.template.html` files
- Run `npm run ucs:build` before testing
- Local server serves generated `.html` files
- Changes to components require rebuild

### 2. CI/CD Pipeline Integration
- GitHub Actions runs `npm run ucs:build:prod` before deployment
- Only generated `.html` files deployed to Firebase
- `.template.html` files excluded from deployment
- Build artifacts tracked in build-report.json

### 3. Firebase Hosting Integration
- Firebase serves static `.html` files
- All paths pre-resolved during build
- No client-side path calculation needed
- CDN caches generated files efficiently

## Architectural Benefits

### Performance
- **Zero runtime overhead** - No JavaScript needed for components
- **Faster page load** - All HTML in initial payload
- **Better caching** - Static files cached longer
- **No FOUC** - Components present in HTML source

### Maintainability
- **Single source of truth** - All config in assiduous.config.js
- **Component reuse** - Write once, use everywhere
- **Automatic consistency** - Components always identical
- **Easy updates** - Change component once, rebuild all

### Developer Experience
- **Simple syntax** - Comment-based directives
- **Build-time validation** - Errors caught before deployment
- **Path automation** - Never calculate paths manually
- **Environment-aware** - Different builds for dev/staging/prod

## Protected Zones

### Admin Pages (Excluded from UCS)
- `public/admin/**` explicitly excluded
- Admin pages remain gold standard
- No UCS migration until system proven
- Preserves existing working functionality

### Component Files
- `public/components/*.html` are templates
- Contain `{{TOKEN}}` placeholders
- Never served directly to browser
- Processed during build only

## Rollback Strategy

If UCS causes issues:

1. **Keep existing .html files** - Templates don't replace originals
2. **Stop running builds** - Disable npm run ucs:build
3. **Deploy without UCS** - Existing pages still work
4. **No breaking changes** - UCS is additive, not destructive

---

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
   - **Default URL**: https://assiduous-prod.web.app
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
│ URL: https://assiduous-prod.web.app                            │
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
   - Deploys from `public/`
   - Targets: `hosting:assiduousflip` (or `hosting:prod`)
   - Deploys to: https://assiduous-prod.web.app

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
- URL: https://assiduous-prod.web.app

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
- ✅ https://assiduous-prod.web.app/ (should return 200)
- ✅ https://assiduous-prod.web.app/admin/dashboard.html (should load)
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


---
# Firebase Multi-Environment Architecture
---

# Firebase Multi-Environment Setup Guide

**Last Updated:** October 8, 2025  
**Author:** Assiduous Development Team  
**Status:** Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Firebase Projects](#firebase-projects)
4. [Initial Setup](#initial-setup)
5. [Development Workflow](#development-workflow)
6. [Deployment Process](#deployment-process)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Cost Analysis](#cost-analysis)
10. [Best Practices](#best-practices)

---

## Overview

Assiduous uses a **multi-project Firebase architecture** with three isolated Firebase projects to ensure safe, reliable deployments with complete backend isolation.

### Why Multi-Project Architecture?

✅ **Backend Isolation** - Each environment has its own Firestore, Auth, Functions, Storage  
✅ **Safe Testing** - Test destructive operations without affecting production  
✅ **Production Parity** - Test with real Firebase services, not emulators  
✅ **Cost Effective** - DEV on free tier, minimal staging costs  
✅ **Team Collaboration** - Shared environments for testing  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LOCAL DEVELOPMENT                                          │
│  └─ Directory: public/  │
│  └─ URL: http://localhost:8080                              │
│  └─ Testing: Frontend only, no backend                      │
│                                                              │
│           ↓ (Deploy with ./deploy.sh dev)                   │
│                                                              │
│  FIREBASE DEV (assiduous-dev)                               │
│  └─ URL: https://assiduous-dev.web.app                      │
│  └─ Plan: Spark (Free)                                      │
│  └─ Testing: Full stack with isolated backend               │
│  └─ Data: Test/synthetic data                               │
│                                                              │
│           ↓ (Deploy with ./deploy.sh staging)               │
│                                                              │
│  FIREBASE STAGING (assiduous-staging)                       │
│  └─ URL: https://assiduous-staging.web.app                  │
│  └─ Plan: Blaze (Pay-as-you-go)                             │
│  └─ Testing: Production-like validation                     │
│  └─ Data: Production-like dataset                           │
│                                                              │
│           ↓ (Commit to GitHub)                              │
│                                                              │
│  GITHUB MAIN BRANCH                                         │
│  └─ Source of Truth for Production                          │
│                                                              │
│           ↓ (Deploy with ./deploy.sh production)            │
│                                                              │
│  FIREBASE PRODUCTION (assiduous-prod)                       │
│  └─ URL: https://assiduous-prod.web.app                      │
│  └─ Plan: Blaze (Pay-as-you-go)                             │
│  └─ Testing: Live production                                │
│  └─ Data: Real user data                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Firebase Projects

### 1. assiduous-dev (Development)
- **Project ID:** `assiduous-dev`
- **Project Number:** `186714044941`
- **Hosting URL:** https://assiduous-dev.web.app
- **Billing Plan:** Spark (Free)
- **Purpose:** Active feature development with real Firebase backend
- **Data:** Test/synthetic data, safe to reset
- **Who Uses:** Developers testing new features

### 2. assiduous-staging (Staging)
- **Project ID:** `assiduous-staging`
- **Project Number:** `853661742177`
- **Hosting URL:** https://assiduous-staging.web.app
- **Billing Plan:** Blaze (Pay-as-you-go, ~$5-10/month)
- **Purpose:** Pre-production validation with production-like config
- **Data:** Production-like dataset (anonymized if needed)
- **Who Uses:** QA, stakeholders, final testing before production

### 3. assiduous-prod (Production)
- **Project ID:** `assiduous-prod`
- **Project Number:** `9355377564`
- **Hosting URL:** https://assiduous-prod.web.app
- **Billing Plan:** Blaze (Pay-as-you-go, varies with usage)
- **Purpose:** Live production with real users
- **Data:** Real user data
- **Who Uses:** End users, customers

---

## Initial Setup

### Prerequisites

1. **Firebase CLI Installed:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticated with Firebase:**
   ```bash
   firebase login
   ```

3. **Google Cloud SDK (optional but recommended):**
   ```bash
   brew install google-cloud-sdk  # macOS
   gcloud auth login
   ```

### Verify Projects

```bash
# List all Firebase projects
firebase projects:list

# Should show:
# - assiduous-dev
# - assiduous-staging
# - assiduous-prod
```

### Project Configuration

The `.firebaserc` file in `firebase-migration-package/` configures all three projects:

```json
{
  "projects": {
    "default": "assiduous-prod",
    "dev": "assiduous-dev",
    "staging": "assiduous-staging",
    "production": "assiduous-prod"
  }
}
```

---

## Development Workflow

### Step 1: Local Development

1. **Make changes** in `public/`

2. **Start local server:**
   ```bash
   cd firebase-migration-package/assiduous-build
   python -m http.server 8080
   ```

3. **Test at:** http://localhost:8080

4. **Run QA/QC:**
   - Open browser DevTools Console
   - Check for JavaScript errors
   - Test all user workflows
   - Verify mobile responsiveness

### Step 2: Deploy to DEV

1. **Navigate to deployment directory:**
   ```bash
   cd firebase-migration-package
   ```

2. **Deploy to DEV:**
   ```bash
   ./deploy.sh dev
   ```

3. **Test at:** https://assiduous-dev.web.app

4. **Validate Firebase backend:**
   - Test user authentication
   - Verify Firestore database operations
   - Check Cloud Functions responses
   - Test Cloud Storage operations

### Step 3: Deploy to STAGING

1. **Ensure DEV testing passed**

2. **Deploy to STAGING:**
   ```bash
   ./deploy.sh staging
   ```

3. **Test at:** https://assiduous-staging.web.app

4. **Final validation:**
   - Complete end-to-end user workflows
   - Performance testing
   - Production-like data testing
   - Take screenshots for documentation

### Step 4: Commit to GitHub

1. **Verify staging success**

2. **Commit changes:**
   ```bash
   cd ../..  # Back to project root
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

3. **Tag if major release:**
   ```bash
   git tag -a v1.0.0 -m "Release 1.0.0"
   git push --tags
   ```

### Step 5: Deploy to Production

1. **Ensure code is in GitHub**

2. **Deploy to production:**
   ```bash
   cd firebase-migration-package
   ./deploy.sh production
   ```

3. **Type confirmation:** `DEPLOY TO PRODUCTION`

4. **Verify at:** https://assiduous-prod.web.app

5. **Post-deployment:**
   - Run smoke tests
   - Monitor Firebase Console logs
   - Check error rates
   - Verify analytics

---

## Deployment Process

### Using the deploy.sh Script

The `deploy.sh` script handles all deployments with built-in safety checks.

**Basic Usage:**
```bash
./deploy.sh <environment>
```

**Examples:**
```bash
# Deploy to development
./deploy.sh dev

# Deploy to staging (requires confirmation)
./deploy.sh staging

# Deploy to production (requires typing 'DEPLOY TO PRODUCTION')
./deploy.sh production
```

### Deployment Script Features

✅ **Pre-deployment checks:**
- Firebase CLI installed
- User authenticated
- Build directory exists
- Git status clean (for production)

✅ **Environment-specific validations:**
- DEV: High safety (no confirmation)
- STAGING: Medium safety (requires confirmation)
- PRODUCTION: Low safety (requires explicit confirmation text)

✅ **Post-deployment verification:**
- HTTP 200 response check
- Deployment success confirmation
- URL display for verification

### Manual Deployment (Not Recommended)

```bash
# Deploy manually to specific project
firebase deploy --project dev --only hosting
firebase deploy --project staging --only hosting
firebase deploy --project production --only hosting
```

---

## Environment Configuration

### Automatic Environment Detection

The `firebase-config.js` file automatically detects the environment based on hostname:

```javascript
// public/assets/js/config/firebase-config.js

function detectEnvironment() {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  // Development environment
  if (hostname.includes('assiduous-dev.web.app')) {
    return 'development';
  }
  
  // Staging environment
  if (hostname.includes('assiduous-staging.web.app')) {
    return 'staging';
  }
  
  // Production environment (default)
  return 'production';
}
```

### Using Environment-Specific Configs

```javascript
// Get the appropriate Firebase config for current environment
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Check environment
if (isProduction()) {
  // Production-specific code
  console.log('Running in PRODUCTION');
} else if (isStaging()) {
  // Staging-specific code
  console.log('Running in STAGING');
} else {
  // Development-specific code
  console.log('Running in DEVELOPMENT');
}
```

### Environment-Specific API Keys

**IMPORTANT:** Each environment uses its own Firebase API keys.

To get API keys for DEV and STAGING:

1. Go to Firebase Console
2. Select project (assiduous-dev or assiduous-staging)
3. Go to Project Settings → General
4. Under "Your apps" → Web app → Config
5. Copy the config values
6. Update `firebase-config.js` with the correct values

**Security Note:** API keys for Firebase web apps are safe to commit to GitHub. They are designed to be public and are protected by Firebase Security Rules.

---

## Troubleshooting

### Common Issues

#### 1. "Permission Denied" Error

**Problem:** Cannot deploy to Firebase project

**Solution:**
```bash
# Re-authenticate
firebase login --reauth

# Verify project access
firebase projects:list

# Check current project
firebase use
```

#### 2. "Build Directory Not Found"

**Problem:** `assiduous-build` directory missing

**Solution:**
```bash
# Verify directory exists
ls -la firebase-migration-package/assiduous-build

# If missing, ensure you're in correct directory
pwd  # Should show: .../assiduous/firebase-migration-package
```

#### 3. "Rate Limit Exceeded" (429 Error)

**Problem:** Too many Firebase API requests

**Solution:**
```bash
# Wait 60 seconds and retry
sleep 60
./deploy.sh dev
```

#### 4. Environment Detection Not Working

**Problem:** Wrong Firebase config being used

**Solution:**
1. Open browser DevTools Console
2. Check which environment is detected
3. Verify URL matches expected environment
4. Clear browser cache if needed

#### 5. Deployment Succeeds but Site Shows Old Version

**Problem:** Browser cache or CDN cache

**Solution:**
```bash
# Hard refresh browser
# Chrome/Firefox: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or clear Firebase hosting cache
firebase hosting:channel:deploy preview --expires 1h
```

---

## Cost Analysis

### Monthly Cost Breakdown

| Environment | Plan | Hosting | Firestore | Functions | Storage | Total |
|-------------|------|---------|-----------|-----------|---------|-------|
| **DEV** | Spark (Free) | Free (1GB) | Free | Free | Free (5GB) | **$0** |
| **STAGING** | Blaze (PAYG) | ~$0.50 | ~$2 | ~$1 | ~$1.50 | **~$5** |
| **PROD** | Blaze (PAYG) | Varies | Varies | Varies | Varies | **Varies** |

**Total Additional Cost for Multi-Environment:** ~$5/month

### Cost Optimization Tips

1. **Use DEV for most testing** (free tier)
2. **Limit STAGING usage** to final validation only
3. **Set up budget alerts** in Firebase Console
4. **Clean up old data** in DEV/STAGING regularly
5. **Use Firebase Local Emulator** for unit testing (completely free)

---

## Best Practices

### ✅ DO

- **Always test locally first** before deploying to Firebase
- **Deploy to DEV first** for backend testing
- **Test in STAGING** before production deployment
- **Commit to GitHub** before deploying to production
- **Use environment-specific configs** (never hardcode environment values)
- **Monitor Firebase Console** after production deploys
- **Document changes** in commit messages
- **Take screenshots** in staging for documentation
- **Run smoke tests** after production deploy
- **Keep DEV data realistic** but not sensitive

### ❌ DON'T

- **Don't skip environments** (LOCAL → PROD is forbidden)
- **Don't deploy to production with known bugs**
- **Don't use production API keys** in dev/staging code
- **Don't edit production Firestore** directly without backup
- **Don't bypass approval gates** for production
- **Don't deploy without testing** in at least STAGING
- **Don't use real user data** in DEV environment
- **Don't ignore Firebase Console errors** after deployment
- **Don't make emergency changes** without following hotfix process
- **Don't commit Firebase service account keys** to GitHub

---

## Quick Reference

### Deployment Commands

```bash
# Development
cd firebase-migration-package && ./deploy.sh dev

# Staging
cd firebase-migration-package && ./deploy.sh staging

# Production
cd firebase-migration-package && ./deploy.sh production
```

### Environment URLs

- **Local:** http://localhost:8080
- **DEV:** https://assiduous-dev.web.app
- **STAGING:** https://assiduous-staging.web.app
- **PRODUCTION:** https://assiduous-prod.web.app

### Firebase Console Links

- **DEV:** https://console.firebase.google.com/project/assiduous-dev
- **STAGING:** https://console.firebase.google.com/project/assiduous-staging
- **PRODUCTION:** https://console.firebase.google.com/project/assiduous-prod

### Support

For issues or questions:
1. Check this documentation
2. Review WARP.md Rule 5
3. Check Firebase Console logs
4. Contact development team

---

## Development Portal Architecture
**Added:** November 6, 2025
**Status:** Operational
**Live URL:** https://assiduous-prod.web.app/admin/development/

### Overview

The Development Portal is an internal monitoring and analytics system providing real-time visibility into project metrics, costs, and development progress. It operates as part of the Admin Portal but with specialized functionality for development team use.

### Portal Structure

```
public/admin/development/
├── dashboard.html          # Main metrics dashboard
├── analytics.html          # Comprehensive analytics with charts
├── costs.html             # Cost tracking and forecasting
├── reports.html           # Generated reports and exports
├── docs.html              # Technical documentation hub
└── metrics.json           # Real-time metrics data
```

### Component Architecture

#### 1. Metrics Collection Layer
```
Git Hooks (pre-commit, post-commit)
    ↓
Local Metrics Calculation
    ↓
metrics.json Update
    ↓
Firebase Sync (optional)
```

#### 2. Data Sources
- **Git Metadata:** Commits, authors, file changes
- **File System:** File counts, sizes, types
- **Firebase:** Service usage, quotas, performance
- **GitHub API:** Repository statistics
- **Manual Config:** Cost rates, project metadata

#### 3. Visualization Layer
- **Chart.js v4.4.0:** Line charts, doughnut charts
- **CSS Grid:** Responsive multi-column layouts
- **Progress Bars:** Visual progress indicators
- **Stat Cards:** Fixed-width metric displays

### Key Features

#### Real-Time Metrics Dashboard
- Project totals (hours, cost, commits, files)
- Live activity feed (recent commits, deployments)
- Progress tracking (75% overall development)
- Cost breakdown by category
- GitHub integration
- Firebase resource usage

#### Comprehensive Analytics
- **8 Major Sections:**
  1. System Performance Overview (4 KPIs)
  2. Development Velocity Chart (30-day trend)
  3. Code Quality Score (doughnut gauge)
  4. Repository Statistics (5 metrics)
  5. Code Quality & Testing (detailed breakdowns)
  6. Deployment Analytics (success rates, frequency)
  7. Performance Benchmarks (Lighthouse, Web Vitals)
  8. Firebase Resource Usage (4 donut charts)
  9. Error Tracking & Monitoring (4 metrics)

#### Exhaustive Cost Tracking
- **7 Major Sections:**
  1. Project Cost Overview (4 KPIs)
  2. Time & Velocity Metrics (5-column grid)
  3. Billing Rate Configuration (4 roles)
  4. Cost Breakdown by Category (4 categories)
  5. Detailed Tool Costs (5 services)
  6. Spending Trends (3 timeframes)
  7. Recent Activity Timeline

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│ DEVELOPMENT ACTIVITY                                    │
├─────────────────────────────────────────────────────────┤
│ • Code changes committed                                │
│ • Files created/modified                                │
│ • Development time tracked                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ GIT HOOKS TRIGGER                                       │
├─────────────────────────────────────────────────────────┤
│ • Pre-commit: Validates commit message                  │
│ • Post-commit: Updates metrics                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ METRICS CALCULATION                                     │
├─────────────────────────────────────────────────────────┤
│ • Count commits, files, lines changed                   │
│ • Calculate costs (hours × rates)                       │
│ • Aggregate statistics                                  │
│ • Generate timestamps                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ METRICS STORAGE                                         │
├─────────────────────────────────────────────────────────┤
│ • Update metrics.json (local)                           │
│ • Commit to GitHub (source of truth)                    │
│ • Deploy to Firebase Hosting                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ DASHBOARD DISPLAY                                       │
├─────────────────────────────────────────────────────────┤
│ • Fetch metrics.json via HTTP                           │
│ • Render charts with Chart.js                           │
│ • Display stat cards                                    │
│ • Update progress bars                                  │
└─────────────────────────────────────────────────────────┘
```

### Chart Implementation

#### Line Charts (Development Velocity)
```javascript
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Nov 1', 'Nov 2', ...],
        datasets: [{
            data: [5, 12, 8, ...],
            borderColor: '#60A3D9',
            backgroundColor: 'rgba(96, 163, 217, 0.1)'
        }]
    }
});
```

#### Doughnut Charts (Resource Usage)
```javascript
new Chart(ctx, {
    type: 'doughnut',
    data: {
        datasets: [{
            data: [2.4, 97.6],  // Used vs Available
            backgroundColor: ['#60A3D9', '#E5E7EB']
        }]
    },
    options: {
        cutout: '75%'  // Donut hole size
    }
});
```

### Design System

#### Color Palette
- **Blue (#60A3D9):** Hosting, primary metrics
- **Green (#059669):** Firestore, success states
- **Yellow (#F59E0B):** Storage, warnings
- **Purple (#8B5CF6):** Functions, special features
- **Red (#DC2626):** Errors, critical issues

#### Layout Patterns
- **Stats Grid:** 4-column responsive (200-280px per card)
- **Content Grid:** 2-column (2fr 1fr ratio)
- **Compact Cards:** Reduced padding for dense info
- **Section Headers:** Clear hierarchy with descriptions

### Integration Points

#### 1. Git Hooks
```bash
# .git/hooks/post-commit
#!/bin/bash
node scripts/update_metrics.js
```

#### 2. Firebase Hosting
- Static metrics.json served via CDN
- Fast global distribution
- Automatic cache invalidation on deploy

#### 3. GitHub Actions (Future)
- Automated metrics calculation
- Scheduled report generation
- Alert notifications

### Performance Characteristics

#### Load Times
- **First Contentful Paint:** < 1s
- **Time to Interactive:** < 2s
- **Chart Rendering:** < 500ms
- **Total Page Size:** < 200KB

#### Optimization Techniques
- Chart.js loaded from CDN (cached)
- Metrics.json is ~10KB (minimal)
- CSS/JS minified in production
- Images lazy-loaded

### Security Considerations

#### Access Control
- Portal requires Firebase Auth
- Admin + Developer roles only
- No sensitive data exposed (API keys, credentials)

#### Data Privacy
- Only aggregated metrics stored
- No personally identifiable information
- Cost data is estimated, not actual billing

### Future Enhancements

#### Planned Features (Q1 2026)
1. **Real-Time GitHub Webhooks**
   - Instant commit notifications
   - PR status updates
   - Automated deployment triggers

2. **Firebase Firestore Integration**
   - Store historical metrics
   - Query trends over time
   - Generate comparative reports

3. **ML-Based Forecasting**
   - Predict project completion dates
   - Estimate future costs
   - Identify velocity trends

4. **Automated Reporting**
   - Weekly email summaries
   - Monthly performance reports
   - Stakeholder dashboards

### Related Documentation
- [DEVELOPMENT_PORTAL_STATUS.md](DEVELOPMENT_PORTAL_STATUS.md) - Detailed portal documentation
- [METRICS_WORKFLOW.md](METRICS_WORKFLOW.md) - Metrics automation workflow
- [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) - Project tracking methodologies

---

**Document Version:** 2.1.0  
**Last Reviewed:** November 6, 2025  
**Next Review:** December 6, 2025 or as needed

---

# Real-Time Metrics & Business Operations Architecture
**Added:** November 6, 2025  
**Status:** Production - Fully Deployed

## Unified Metrics System

### Two-Track Architecture

```
CODE CHANGES                              DATA CHANGES
────────────────────────────────────────────────────────────────────
                                                                     
git push                                  User Signup / Property Add
    ↓                                            ↓                  
GitHub Actions                            Firestore onCreate/Update  
    ↓                                            ↓                  
update-firebase-metrics.js                Cloud Functions           
    ↓                                            ↓                  
Firestore Collections:                    Firestore Collections:    
- git_commits                             - business_metrics        
- development_metrics                     - business_activity       
- project_metadata                                                  
    ↓                                            ↓                  
    └────────────────┬───────────────────────────┘                  
                     ↓                                              
            DevelopmentMetricsService                               
              (Real-time listeners)                                 
                     ↓                                              
              Dashboard Updates                                     
              (Instant, < 1s)                                       
```

### Development Metrics (Code)

**Trigger**: Code push to GitHub  
**Handler**: GitHub Actions workflow  
**Script**: `scripts/update-firebase-metrics.js`

**Collections Written**:
1. **`git_commits/{hash}`**
   - Individual commit tracking
   - Hash, message, author, timestamp
   - Files changed, lines added/deleted

2. **`development_metrics/{YYYY-MM-DD}`**
   - Daily aggregated stats
   - Commits, hours, cost, deployments
   - Updated on each commit

3. **`project_metadata/current`**
   - Overall project statistics
   - Total commits, files, velocity
   - Start date, active days

### Business Metrics (Data)

**Trigger**: Firestore data changes  
**Handler**: Cloud Functions (Firestore triggers)  
**Script**: `functions/index.js`

**Cloud Functions Deployed**:
- `onUserCreated` - New user registration
- `onPropertyCreated` - New property listing
- `onPropertyUpdated` - Property status changes
- `onTransactionCreated` - New transaction
- `onTransactionUpdated` - Transaction status changes
- `scheduledMetricsUpdate` - Hourly backup aggregation

**Collections Written**:
1. **`business_metrics/current`**
   - Users: total, clients, agents, admins
   - Properties: total, active, pending, sold
   - Transactions: total, pending, completed, totalValue
   - Auto-updated on any data change

2. **`business_activity`**
   - Activity log of all business events
   - Type, entityId, metadata, timestamp
   - Used for audit trail and analytics

### Real-Time Dashboard Integration

**Service**: `DevelopmentMetricsService`  
**Location**: `public/assets/js/services/developmentmetricsservice.js`

**Features**:
- Single subscription for all metrics
- WebSocket-based real-time updates
- Automatic reconnection
- Efficient batching

**Usage**:
```javascript
const service = new DevelopmentMetricsService();
await service.initialize();

service.subscribeToMetrics((metrics) => {
    // Development metrics
    console.log(metrics.project.totalCommits);
    console.log(metrics.today.commits);
    
    // Business metrics
    console.log(metrics.business.users.total);
    console.log(metrics.business.properties.total);
    console.log(metrics.business.transactions.totalValue);
});
```

---

## Agent Property Management API

**Added:** November 6, 2025  
**Status:** Production - Fully Deployed

### Architecture Overview

```
AGENT PORTAL              CLOUD FUNCTIONS           FIRESTORE
──────────────────────────────────────────────────────────────
                                                              
Agent Form/UI             createProperty()        properties/
     ↓                          ↓                      ↓    
AgentPropertyService      - Authentication        {agentId}  
     ↓                    - Role verification         ↓    
Firebase Callable         - Ownership check      onCreate   
     ↓                    - Save to DB           Trigger    
Cloud Function                  ↓                      ↓    
     ↓                    Return success         business_  
Result                                            metrics++ 
```

### Cloud Functions API

**Service**: `AgentPropertyService`  
**Location**: `public/assets/js/services/agent-property-service.js`

**Endpoints Deployed**:

1. **`createProperty(propertyData)`**
   - Agents create new listings
   - Auto-assigns agentId and agentName
   - Validates authentication and role
   - Triggers business metrics update
   - Returns: `{success, propertyId}`

2. **`updateProperty(propertyId, updates)`**
   - Agents update their properties
   - Verifies ownership (agent can only update own)
   - Admin override allowed
   - Triggers metrics update if status changed
   - Returns: `{success}`

3. **`deleteProperty(propertyId)`**
   - Agents delete their listings
   - Verifies ownership
   - Decrements business metrics
   - Returns: `{success}`

4. **`getAgentProperties({status, limit})`**
   - Fetch agent's property list
   - Supports filtering by status
   - Supports pagination
   - Returns: `{success, properties[]}`

### Security Model

**Multi-Layer Security**:
1. **Firebase Authentication** - Must be logged in
2. **Role Verification** - Must have 'agent' role
3. **Ownership Validation** - Can only modify own properties
4. **Admin Override** - Admins can manage any property
5. **Server-Side Enforcement** - Client cannot fake agentId

**Automatic Fields**:
```javascript
// Server automatically adds:
propertyData.agentId = currentUser.uid;
propertyData.agentName = currentUser.displayName;
propertyData.createdAt = serverTimestamp();
propertyData.updatedAt = serverTimestamp();
```

### Integration Points

**Agent Portal Pages**:
- `/agent/listings.html` - Property management UI
- Uses AgentPropertyService for all CRUD operations
- Real-time updates via Firestore listeners
- File upload via Firebase Storage

**Admin Panel**:
- Full access to all properties
- Can override agent restrictions
- Same API endpoints with admin privileges

**Business Metrics**:
- Automatic tracking on create/update/delete
- No manual metric updates needed
- Real-time dashboard reflection

### Real-Time Capabilities

**Firestore Listeners**:
```javascript
// Subscribe to agent's properties
const unsubscribe = propertyService.subscribeToMyProperties((properties) => {
    // UI updates automatically
    displayProperties(properties);
});
```

**Benefits**:
- Changes appear instantly across devices
- No polling required
- Efficient WebSocket connections
- Automatic reconnection

---

## Firebase Project Configuration

**Current Environment**: Production  
**Project ID**: `assiduous-prod`  
**Project Number**: 9355377564

**Services Active**:
- ✅ Firestore Database - Primary data store
- ✅ Firebase Authentication - User management
- ✅ Cloud Functions (2nd Gen) - 19 functions deployed
- ✅ Firebase Hosting - Static site hosting
- ✅ Cloud Storage - File uploads
- ✅ Real-time Database - Legacy support

**Cloud Functions Count**: 19
- 10 Application functions (API, auth, Stripe)
- 9 Metrics/trigger functions (added Nov 6, 2025)

---

## Deployment Architecture

**Current Flow**:
```
Local Development
    ↓
git commit & push
    ↓
GitHub Actions
    ├─ update-firebase-metrics.js (development metrics)
    └─ (optional) firebase deploy
         ↓
Firebase Cloud Functions
    ├─ Firestore Triggers (business metrics)
    └─ Agent API Endpoints (property management)
         ↓
Firebase Hosting
    └─ Static files + Real-time updates
```

**GitHub Actions Workflows**:
- `deploy-metrics.yml` - Updates Firebase metrics on push
- `deploy-production.yml` - Full deployment workflow
- All workflows use `FIREBASE_SERVICE_ACCOUNT` secret

**No Local Setup Required**:
- No firebase-admin-key.json needed locally
- GitHub Actions handles all Firebase writes
- Agents use browser-based Firebase SDK
- Secure, automated, zero-config

---

## Documentation References

**Canonical Documents**:
- `COMPLETE_METRICS_SYSTEM.md` - Full metrics architecture
- `AGENT_PROPERTY_API.md` - Agent API documentation
- `UNIFIED_METRICS.md` - Simplified metrics guide
- `ARCHITECTURE_DESIGN.md` - This document

**Code Locations**:
- `functions/index.js` - All Cloud Functions
- `scripts/update-firebase-metrics.js` - Development metrics
- `public/assets/js/services/developmentmetricsservice.js` - Client service
- `public/assets/js/services/agent-property-service.js` - Agent API client
- `.github/workflows/deploy-metrics.yml` - GitHub Actions workflow

---

**Version:** 2.2.0  
**Last Updated:** November 6, 2025  
**Status:** Production - All Systems Operational
