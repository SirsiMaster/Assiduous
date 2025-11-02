# Firestore Data Seeding Script

## Quick Start

```bash
# Install dependencies
npm install --save-dev @faker-js/faker firebase-admin

# Dry run (safe - no writes)
node scripts/seed_firestore_production.js --dry-run

# Seed all collections
node scripts/seed_firestore_production.js

# Seed specific collection
node scripts/seed_firestore_production.js --collection=users
```

## Prerequisites

You need a Firebase service account JSON file. Get it from:
[Firebase Console > Project Settings > Service Accounts > Generate New Private Key](https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts/adminsdk)

Save as: `firebase-migration-package/firebase-service-account.json`

## What Gets Seeded

| Collection | Documents | Description |
|------------|-----------|-------------|
| users | 33 | 20 clients, 10 agents, 3 admins |
| properties | 100 | Various types, statuses, locations |
| transactions | 50 | Purchases, sales, micro-flips |
| messages | 150 | Inquiries, offers, updates |
| notifications | 100 | Property alerts, status changes |
| development_sessions | ~180 | Historical tracking data |
| git_commits | 200 | Development activity |
| **TOTAL** | **~813** | |

## Command Options

| Option | Description | Risk |
|--------|-------------|------|
| `--dry-run` | Preview data without writing | ✅ Safe |
| `--collection=X` | Only seed specific collection | ⚠️ Moderate |
| `--clear` | Delete existing data first | 🚨 HIGH RISK |
| (none) | Seed all collections | ⚠️ Moderate |

## Examples

```bash
# Preview users collection
node scripts/seed_firestore_production.js --dry-run --collection=users

# Seed only development data (safe to test)
node scripts/seed_firestore_production.js --collection=development_sessions
node scripts/seed_firestore_production.js --collection=git_commits

# Seed core real estate data
node scripts/seed_firestore_production.js --collection=properties
node scripts/seed_firestore_production.js --collection=transactions

# DANGER: Clear and re-seed everything
node scripts/seed_firestore_production.js --clear
```

## Verification

After seeding, check:

```bash
# Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/firestore

# Admin Dashboard
open https://assiduous-prod.web.app/admin/dashboard.html

# Dev Dashboard
open https://assiduous-prod.web.app/admin/development/dashboard.html
```

## Troubleshooting

**Service account not found**:
```bash
# Download from Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts/adminsdk
```

**Permission denied**:
- Ensure service account has Firestore Admin role
- Verify project ID is `assiduous-prod`

**Quota exceeded**:
- Wait for quota reset (daily limit)
- Seed collections individually with delays

## Safety

**Before seeding production**:
```bash
# Export backup (via Firebase Console or gcloud)
gcloud firestore export gs://assiduous-prod-backups/backup-$(date +%Y%m%d)
```

**Rollback if needed**:
```bash
# Delete collection via Firebase Console, or restore from backup
gcloud firestore import gs://assiduous-prod-backups/backup-20250111
```

## Full Documentation

See: `docs/ops/step18_seed_production_data.md`
