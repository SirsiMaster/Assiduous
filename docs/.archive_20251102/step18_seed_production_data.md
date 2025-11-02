# Step 18: Seed Production Data - EXECUTION GUIDE

**Date**: 2025-01-11  
**Status**: 🔄 READY FOR EXECUTION  
**Prerequisites**: Steps 1-5 ✅ COMPLETE

---

## Executive Summary

This step populates Firebase production with realistic test data across all collections to enable comprehensive testing of admin dashboards, analytics, and real-time features.

**Data to be seeded**:
- 33 users (20 clients, 10 agents, 3 admins)
- 100 properties (various types, statuses, locations)
- 50 transactions (purchases, sales, micro-flips)
- 150 messages (inquiries, offers, updates)
- 100 notifications (property alerts, status changes)
- ~180 development sessions (historical tracking data)
- 200 git commits (development activity)

**Total documents**: ~813

---

## Prerequisites

### 1. Firebase Service Account

You need a Firebase service account JSON file to seed data programmatically.

**Option A: Use existing service account**
```bash
# Check if service account exists
ls -la firebase-migration-package/firebase-service-account.json
```

**Option B: Download new service account**

1. Go to [Firebase Console](https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts/adminsdk)
2. Click **Generate New Private Key**
3. Download JSON file
4. Save as `firebase-migration-package/firebase-service-account.json`
5. **DO NOT commit to GitHub** (already in .gitignore)

**Option C: Use environment variables**

Set these environment variables instead of using service account file:
```bash
export FIREBASE_PROJECT_ID="assiduous-prod"
export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxx@assiduous-prod.iam.gserviceaccount.com"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----"
```

### 2. Install Dependencies

```bash
cd /Users/thekryptodragon/Development/assiduous
npm install --save-dev @faker-js/faker firebase-admin
```

✅ **Already installed** (completed 2025-01-11)

### 3. Verify Firebase Access

```bash
# Test Firebase connection (uses service account)
firebase projects:list
```

Should show `assiduous-prod` in the list.

---

## Seeding Script Usage

### Basic Commands

```bash
# Dry run (preview data without writing)
node scripts/seed_firestore_production.js --dry-run

# Dry run specific collection
node scripts/seed_firestore_production.js --dry-run --collection=users

# Seed all collections (LIVE)
node scripts/seed_firestore_production.js

# Seed specific collection (LIVE)
node scripts/seed_firestore_production.js --collection=properties

# Clear and re-seed (DANGEROUS - deletes existing data)
node scripts/seed_firestore_production.js --clear
```

### Command Options

| Option | Description | Risk Level |
|--------|-------------|-----------|
| `--dry-run` | Preview generated data without writing | ✅ Safe |
| `--collection=X` | Only seed specific collection | ⚠️ Moderate |
| `--clear` | Delete existing data before seeding | 🚨 HIGH RISK |
| (no options) | Seed all collections | ⚠️ Moderate |

---

## Execution Plan

### Phase 1: Dry Run Validation (5 minutes)

**Verify script generates correct data format**:

```bash
# Test users collection
node scripts/seed_firestore_production.js --dry-run --collection=users

# Test properties collection  
node scripts/seed_firestore_production.js --dry-run --collection=properties

# Test all collections
node scripts/seed_firestore_production.js --dry-run
```

**Expected output**:
```
🚀 Firestore Production Data Seeding
====================================

Project: assiduous-prod
Mode: DRY RUN
Clear existing: NO
Collections: users

🌱 Seeding users...
📊 Generated 33 documents
🔍 DRY RUN - Sample document:
{
  "uid": "user_1736632800_abc123",
  "email": "john.doe@example.com",
  "role": "client",
  ...
}
```

### Phase 2: Seed Development Collections (10 minutes)

**Start with non-critical development tracking data**:

```bash
# Seed development sessions (historical tracking data)
node scripts/seed_firestore_production.js --collection=development_sessions

# Seed git commits (development activity)
node scripts/seed_firestore_production.js --collection=git_commits
```

**Validation**:
```bash
# Verify data in Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/firestore/data/development_sessions

# Check dev dashboard reflects new data
open https://assiduous-prod.web.app/admin/development/dashboard.html
```

### Phase 3: Seed Core Collections (15 minutes)

**Seed real estate business data**:

```bash
# Seed users (clients, agents, admins)
node scripts/seed_firestore_production.js --collection=users

# Seed properties
node scripts/seed_firestore_production.js --collection=properties

# Seed transactions
node scripts/seed_firestore_production.js --collection=transactions
```

**Validation**:
```bash
# Verify admin dashboard shows data
open https://assiduous-prod.web.app/admin/dashboard.html

# Check properties page
open https://assiduous-prod.web.app/admin/properties.html

# Check transactions page
open https://assiduous-prod.web.app/admin/transactions.html
```

### Phase 4: Seed Communication Collections (5 minutes)

**Seed messages and notifications**:

```bash
# Seed messages
node scripts/seed_firestore_production.js --collection=messages

# Seed notifications
node scripts/seed_firestore_production.js --collection=notifications
```

**Validation**:
```bash
# Verify messages in Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/firestore/data/messages

# Check notifications
open https://console.firebase.google.com/project/assiduous-prod/firestore/data/notifications
```

### Phase 5: Full System Validation (10 minutes)

**Test all pages with seeded data**:

```bash
# Admin dashboard (should show realistic metrics)
open https://assiduous-prod.web.app/admin/dashboard.html

# Analytics page (should show charts with real data)
open https://assiduous-prod.web.app/admin/analytics.html

# Dev dashboard (should show session history)
open https://assiduous-prod.web.app/admin/development/dashboard.html

# Properties list (should show 100 properties)
open https://assiduous-prod.web.app/admin/properties.html

# Agents list (should show 10 agents)
open https://assiduous-prod.web.app/admin/agents.html

# Clients list (should show 20 clients)
open https://assiduous-prod.web.app/admin/clients.html

# Transactions list (should show 50 transactions)
open https://assiduous-prod.web.app/admin/transactions.html
```

---

## Data Schema & Examples

### Users Collection

**Client User**:
```json
{
  "uid": "user_1736632800_abc123",
  "email": "jane.smith@example.com",
  "role": "client",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1 (555) 123-4567",
    "avatar": "https://example.com/avatar.jpg",
    "preferences": {
      "propertyTypes": ["house", "condo"],
      "priceRange": { "min": 200000, "max": 600000 },
      "bedrooms": { "min": 2, "max": 4 }
    }
  },
  "status": "active",
  "emailVerified": true,
  "createdAt": "2024-03-15T10:30:00Z"
}
```

**Agent User**:
```json
{
  "uid": "agent_1736632800_def456",
  "email": "john.agent@assiduous.com",
  "role": "agent",
  "profile": {
    "firstName": "John",
    "lastName": "Agent",
    "licenseNumber": "LIC-123456",
    "specializations": ["residential", "buyer"],
    "yearsExperience": 10
  },
  "stats": {
    "totalSales": 85,
    "totalVolume": 25000000,
    "avgRating": 4.8
  },
  "status": "active"
}
```

### Properties Collection

```json
{
  "propertyId": "prop_1736632800_ghi789",
  "title": "3 Bed 2 Bath House in San Francisco",
  "type": "house",
  "status": "available",
  "price": {
    "amount": 850000,
    "currency": "USD",
    "pricePerSqft": 500
  },
  "address": {
    "street": "123 Market St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  },
  "details": {
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1700,
    "yearBuilt": 2010
  },
  "microFlipScore": {
    "profitPotential": 85,
    "roi": 15.5,
    "riskLevel": "medium",
    "estimatedProfit": 50000
  }
}
```

### Transactions Collection

```json
{
  "transactionId": "txn_1736632800_jkl012",
  "type": "micro-flip",
  "status": "in-progress",
  "financial": {
    "purchasePrice": 650000,
    "rehabCost": 30000,
    "estimatedARV": 750000,
    "projectedProfit": 45000
  },
  "timeline": {
    "created": "2025-01-01T10:00:00Z",
    "offerAccepted": "2025-01-08T14:30:00Z",
    "inspection": "2025-01-15T09:00:00Z",
    "closing": "2025-02-15T10:00:00Z"
  }
}
```

---

## Safety & Rollback

### Backup Before Seeding

**Export existing data** (if any):

```bash
# Export all collections
gcloud firestore export gs://assiduous-prod-backups/pre-seed-backup-$(date +%Y%m%d)

# Or use Firebase Console > Firestore Database > Import/Export
```

### Rollback Procedure

If seeding goes wrong:

**Option 1: Delete seeded collections**:
```bash
# Delete specific collection via Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/firestore

# Or use gcloud CLI
gcloud firestore indexes collection-groups delete users --project=assiduous-prod
```

**Option 2: Restore from backup**:
```bash
# Restore from export
gcloud firestore import gs://assiduous-prod-backups/pre-seed-backup-20250111
```

**Option 3: Clear and re-seed**:
```bash
# Clear bad data and re-seed
node scripts/seed_firestore_production.js --clear
```

---

## Troubleshooting

### Issue: Service Account Not Found

**Error**:
```
❌ Firebase service account not found
```

**Solution**:
```bash
# Download service account from Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts/adminsdk

# Save as firebase-migration-package/firebase-service-account.json
```

### Issue: Permission Denied

**Error**:
```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Solution**:
- Ensure service account has **Firestore Admin** role
- Check Firebase IAM settings
- Verify project ID is correct

### Issue: Quota Exceeded

**Error**:
```
Resource exhausted: Quota exceeded for quota metric 'Write requests'
```

**Solution**:
- Wait for quota reset (daily limit)
- Upgrade Firebase plan if needed
- Seed collections in smaller batches

### Issue: Duplicate Documents

**Error**:
```
Document already exists
```

**Solution**:
```bash
# Use --clear flag to delete existing data first (CAUTION!)
node scripts/seed_firestore_production.js --clear --collection=users
```

---

## Validation Checklist

After seeding, verify:

- [ ] ✅ All 7 collections exist in Firestore
- [ ] ✅ Admin dashboard shows realistic metrics (not zero)
- [ ] ✅ Properties page loads 100 properties
- [ ] ✅ Agents page shows 10 agents with stats
- [ ] ✅ Clients page shows 20 clients
- [ ] ✅ Transactions page shows 50 transactions
- [ ] ✅ Dev dashboard shows session history and charts
- [ ] ✅ Analytics page renders charts with real data
- [ ] ✅ No console errors in browser DevTools
- [ ] ✅ Firebase Console shows expected document counts

---

## Post-Seeding Tasks

### 1. Update Admin Page Data Loaders

Replace mock data with Firestore queries (Step 7):

```javascript
// OLD (mock data)
const properties = mockData.properties;

// NEW (Firestore)
const properties = await firebaseservice.getProperties();
```

### 2. Test Real-Time Features

Verify live updates work:
- Add new property → Check it appears on properties list
- Update transaction status → Check dashboard updates
- Send message → Check notification appears

### 3. Performance Testing

Test with realistic data volume:
- Page load times < 3 seconds
- Query performance acceptable
- No pagination issues

---

## Success Criteria

**Step 18 is COMPLETE when**:

- ✅ All 7 collections seeded successfully
- ✅ Total ~813 documents in Firestore
- ✅ Admin dashboard displays realistic data
- ✅ All admin pages load without errors
- ✅ Data queries return results correctly
- ✅ Firebase Console shows expected document counts
- ✅ No permission or quota issues
- ✅ Rollback procedure documented and tested

---

## Estimated Time

| Phase | Duration |
|-------|----------|
| Dry run validation | 5 minutes |
| Seed development collections | 10 minutes |
| Seed core collections | 15 minutes |
| Seed communication collections | 5 minutes |
| Full system validation | 10 minutes |
| **Total** | **45 minutes** |

---

## Next Steps

After completing Step 18:

1. **Step 7: Replace Mock Data** - Update all admin pages to use Firestore
2. **Step 12: Test Authentication** - Verify user login works with seeded users
3. **Step 13: Integration Testing** - Test all features with real data
4. **Step 19: Production Deployment** - Deploy final verified version

---

## Notes

- Seeding script uses `@faker-js/faker` for realistic data generation
- All timestamps use Firebase server timestamp for consistency
- Generated IDs use `{prefix}_{timestamp}_{random}` format
- Data is production-safe (no real PII or sensitive information)
- Script supports incremental seeding (can seed one collection at a time)

---

## References

- **Seeding Script**: `scripts/seed_firestore_production.js`
- **Firebase Console**: https://console.firebase.google.com/project/assiduous-prod/firestore
- **Step 3 Report**: docs/ops/step3_mock_data_replacement_report.md (data integration strategy)
- **Firestore Rules**: firestore.rules (deployed in Step 2)

---

**Status**: 🔄 READY FOR EXECUTION  
**Next Action**: Run dry-run validation, then execute seeding plan  
**Risk Level**: ⚠️ MODERATE (writes to production Firestore)  
**Rollback**: Available via Firebase export/import
