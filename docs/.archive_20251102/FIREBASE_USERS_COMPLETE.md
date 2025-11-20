# Firebase Authentication Users - Complete List

**Last Updated**: 2025-01-11  
**Total Users**: 13  
**Source**: Firebase Auth export from assiduous-prod  

---

## ✅ User Status Summary

| Status | Count |
|--------|-------|
| **Email Verified** | 10 users |
| **Email NOT Verified** | 3 users |
| **Custom Claims Set** | 3 users (admin, agent, client @assiduous.com) |
| **Disabled** | 0 users |
| **Active** | 13 users |

---

> NOTE (2025-11-19): The `@assiduous.com` accounts described in this
> document were legacy test users and have been removed from the
> production Firebase project. They are kept here only for historical
> reference and must not be treated as current credentials.
>
## 🔐 Admin Users (4 total)

### 1. admin@assiduous.com ✅ RECOMMENDED FOR TESTING
- **UID**: `v6HByNFW7tNErYmbQIXC23rWKtE2`
- **Display Name**: Test Admin
- **Email Verified**: ✅ Yes
- **Custom Claims**: `{"role": "admin"}` ✅
- **Created**: 2025-11-07
- **Status**: Active
- **Password**: `Test123!@#` (known test password)
- **Login URL**: https://assiduous-prod.web.app/login.html
- **Dashboard**: https://assiduous-prod.web.app/admin/dashboard.html

### 2. admin@sirsimaster.com
- **UID**: `Axlo3H6ylvf3NbIfxFcmxsvlYvm2`
- **Display Name**: Test Admin
- **Email Verified**: ✅ Yes
- **Custom Claims**: None
- **Created**: 2024-12-09
- **Status**: Active
- **Password**: Unknown (set by user)

### 3. test_admin@assiduousflip.com
- **UID**: `duCR6HaEuabPms4GQIm1llsW14J3`
- **Display Name**: Test Admin
- **Email Verified**: ✅ Yes
- **Custom Claims**: None
- **Created**: 2024-12-13
- **Status**: Active
- **Password**: Unknown

### 4. admin@assiduousrealty.com
- **UID**: `nGx9qJJNytaSHh55q2WrTOptQED3`
- **Display Name**: (none)
- **Email Verified**: ❌ No
- **Custom Claims**: None
- **Created**: 2024-12-13
- **Last Sign In**: 2025-11-02
- **Status**: Active
- **Password**: Unknown

---

## 👔 Agent Users (4 total)

### 1. agent@assiduous.com ✅ RECOMMENDED FOR TESTING
- **UID**: `CmQZmjCpKKaLLeIkT7F4XYSccek2`
- **Display Name**: Test Agent
- **Email Verified**: ✅ Yes
- **Custom Claims**: `{"role": "agent"}` ✅
- **Created**: 2025-11-07
- **Status**: Active
- **Password**: `Test123!@#` (known test password)
- **Login URL**: https://assiduous-prod.web.app/login.html
- **Dashboard**: https://assiduous-prod.web.app/agent/dashboard.html

### 2. agent@sirsimaster.com
- **UID**: `ZJxYAOxk6YM0PreyOALdpzWRFTF2`
- **Display Name**: Test Agent
- **Email Verified**: ✅ Yes
- **Custom Claims**: None
- **Created**: 2024-12-09
- **Status**: Active
- **Password**: Unknown

### 3. test_agent@assiduousflip.com
- **UID**: `F81oyPsvRKYCZO0iZnpKLGbbxxt2`
- **Display Name**: Test Agent
- **Email Verified**: ✅ Yes
- **Custom Claims**: None
- **Created**: 2024-12-13
- **Status**: Active
- **Password**: Unknown

### 4. agent@assiduousrealty.com
- **UID**: `Z6hg8czNPIMvBHInG3ITzrOoTHB2`
- **Display Name**: (none)
- **Email Verified**: ❌ No
- **Custom Claims**: None
- **Created**: 2024-12-13
- **Last Sign In**: 2024-12-13
- **Status**: Active
- **Password**: Unknown

---

## 👥 Client Users (4 total)

### 1. client@assiduous.com ✅ RECOMMENDED FOR TESTING
- **UID**: `OgjMwAlwQ2TZcC7cM6PgCzsPAYx1`
- **Display Name**: Test Client
- **Email Verified**: ✅ Yes
- **Custom Claims**: `{"role": "client"}` ✅
- **Created**: 2025-11-07
- **Status**: Active
- **Password**: `Test123!@#` (known test password)
- **Login URL**: https://assiduous-prod.web.app/login.html
- **Dashboard**: https://assiduous-prod.web.app/client/dashboard.html

### 2. client@sirsimaster.com
- **UID**: `xCAaY3T73kRJR8O18fmA8Czq4QJ3`
- **Display Name**: Test Client
- **Email Verified**: ✅ Yes
- **Custom Claims**: None
- **Created**: 2024-12-09
- **Status**: Active
- **Password**: Unknown

### 3. test_client@assiduousflip.com
- **UID**: `Laxn9y5Lbrg1IP9c8iclwemIgYH3`
- **Display Name**: Test Client
- **Email Verified**: ✅ Yes
- **Custom Claims**: None
- **Created**: 2024-12-13
- **Status**: Active
- **Password**: Unknown

### 4. client@assiduousrealty.com
- **UID**: `ca1TyBnysrORrPBU7bnlHwCoFxj1`
- **Display Name**: (none)
- **Email Verified**: ❌ No
- **Custom Claims**: None
- **Created**: 2024-12-13
- **Last Sign In**: 2024-12-13
- **Status**: Active
- **Password**: Unknown

---

## 💰 Investor Users (1 total)

### 1. investor@assiduousrealty.com
- **UID**: `GcETD53IbycBsl797qlDMgunvM82`
- **Display Name**: (none)
- **Email Verified**: ❌ No
- **Custom Claims**: None
- **Created**: 2024-12-13
- **Last Sign In**: 2024-12-13
- **Status**: Active
- **Password**: Unknown

---

## 🎯 Recommended Test Users

For Step 12 authentication testing, use these accounts (custom claims are properly set):

### Admin Testing
```
Email: admin@assiduous.com
Password: Test123!@#
Expected Redirect: /admin/dashboard.html
Custom Claims: {"role": "admin"}
```

### Agent Testing
```
Email: agent@assiduous.com
Password: Test123!@#
Expected Redirect: /agent/dashboard.html
Custom Claims: {"role": "agent"}
```

### Client Testing
```
Email: client@assiduous.com
Password: Test123!@#
Expected Redirect: /client/dashboard.html
Custom Claims: {"role": "client"}
```

---

## 📊 User Distribution by Domain

| Domain | Count |
|--------|-------|
| @assiduous.com | 3 (with custom claims) |
| @sirsimaster.com | 3 |
| @assiduousflip.com | 3 |
| @assiduousrealty.com | 4 |

---

## ⚠️ Issues to Address

### 1. Unverified Emails (3 users)
These users cannot receive password reset emails:
- admin@assiduousrealty.com
- agent@assiduousrealty.com
- client@assiduousrealty.com
- investor@assiduousrealty.com

**Action**: Manually verify emails in Firebase Console or have users verify

### 2. Missing Custom Claims (10 users)
These users don't have role-based access control:
- All @sirsimaster.com users
- All @assiduousflip.com users
- All @assiduousrealty.com users

**Action**: Set custom claims using Cloud Function:
```bash
curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/createTestUsers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CREATE_TEST_USERS_2025" \
  -d '{"action": "create"}'
```

### 3. Unknown Passwords (10 users)
Only 3 users have known test passwords (Test123!@#)

**Action**: 
- Use Firebase Console to reset passwords
- Or use password reset flow to set new passwords

---

## 🔧 User Management Commands

### Export All Users
```bash
firebase auth:export users-backup.json --project assiduous-prod
```

### Import Users
```bash
firebase auth:import users-backup.json --project assiduous-prod
```

### Delete Test User
```bash
curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/createTestUsers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CREATE_TEST_USERS_2025" \
  -d '{"action": "delete"}'
```

### List Test Users
```bash
curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/createTestUsers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CREATE_TEST_USERS_2025" \
  -d '{"action": "list"}'
```

---

## 🔐 Security Notes

1. **Test passwords are documented here** - This file should NOT be committed to public repos
2. **Custom claims are critical** - Without them, RBAC won't work correctly
3. **Email verification required** - For password reset functionality
4. **@assiduous.com users** are the primary test accounts with proper configuration

---

## 📝 Firestore User Documents

To check if Firestore documents exist for these users:
```bash
# Via Firebase Console
https://console.firebase.google.com/project/assiduous-prod/firestore/data/users

# Via Cloud Function
curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/createTestUsers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CREATE_TEST_USERS_2025" \
  -d '{"action": "list"}'
```

Expected Firestore fields:
- `uid` - Firebase Auth UID
- `email` - User email
- `role` - admin | agent | client
- `profile` - User profile data
- `status` - active | inactive
- `emailVerified` - boolean
- `createdAt` - Timestamp
- `lastLogin` - Timestamp

---

## 🎯 Next Steps for Step 12 Testing

1. ✅ **Test Users Exist** - 3 users with proper config (@assiduous.com)
2. ⏳ **Manual Browser Testing** - Test login flows (Steps 12.3-12.7)
3. ⏳ **RBAC Testing** - Verify role-based access works
4. ⏳ **Password Reset** - Test forgot password flow
5. ⏳ **Session Persistence** - Test across page refreshes
6. ⏳ **Document Results** - Create step12_auth_testing_report.md

---

## 📌 Important Notes

- **NO USERS WERE DELETED** - All 13 existing users remain intact
- **Cloud Function UPDATED** - Only updated custom claims for 3 @assiduous.com users
- **Existing accounts preserved** - All @sirsimaster.com, @assiduousflip.com, @assiduousrealty.com accounts untouched
- **Passwords unknown** - For most users, passwords were set by original creators

---

**Last Export**: 2025-01-11  
**Export File**: `/tmp/all-users.json`  
**Firebase Project**: assiduous-prod  
**Total Users**: 13  
**Status**: All users active and preserved
