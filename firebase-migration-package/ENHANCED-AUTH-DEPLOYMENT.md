# Enhanced Authentication System - Deployment Guide

## 🎯 Overview

This guide covers the deployment of the enhanced authentication system that supports:
- ✅ **Email authentication** (required)
- ✅ **Username authentication** (optional)
- ✅ **Account ID authentication** (auto-generated: `ACCT-YYYY-NNNNNN`)

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [File Structure](#file-structure)
3. [Deployment Steps](#deployment-steps)
4. [Testing](#testing)
5. [Security Rules](#security-rules)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Logged into Firebase: `firebase login`
- Firebase project initialized: `firebase init`

---

## File Structure

```
firebase-migration-package/
├── assiduous-build/
│   ├── index.html                          # Updated with username field & flexible login
│   ├── test-enhanced-auth.html             # Comprehensive testing interface
│   └── assets/js/services/
│       ├── id-generator.js                 # Account ID generator
│       └── enhanced-auth.js                # Enhanced auth service
├── firestore-enhanced-auth.rules           # Firestore security rules
└── ENHANCED-AUTH-DEPLOYMENT.md             # This file
```

---

## Deployment Steps

### Step 1: Deploy Firestore Security Rules

```bash
# Navigate to Firebase package directory
cd /Users/thekryptodragon/Development/assiduous/firebase-migration-package

# Deploy security rules
firebase deploy --only firestore:rules
```

**Verify deployment:**
```bash
# Check Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/firestore/rules
```

### Step 2: Deploy Website Files

```bash
# Deploy all hosting files
cd assiduous-build
firebase deploy --only hosting
```

**Verify deployment:**
- Main site: https://assiduous-prod.web.app/
- Test page: https://assiduous-prod.web.app/test-enhanced-auth.html

### Step 3: Verify Dependencies

Ensure these files are deployed:
- ✅ `/assets/js/services/id-generator.js`
- ✅ `/assets/js/services/enhanced-auth.js`
- ✅ `/firebase-config.js`

---

## Testing

### Option 1: Local Testing

```bash
# Start local server
cd /Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build
python -m http.server 8080

# Open test page
open http://localhost:8080/test-enhanced-auth.html
```

### Option 2: Production Testing

```bash
# Deploy and test
firebase deploy --only hosting
open https://assiduous-prod.web.app/test-enhanced-auth.html
```

### Test Scenarios

#### 1. Registration with Email Only
```
Email: john@example.com
Username: (leave blank)
Password: password123
Expected: Account created with accountId only
```

#### 2. Registration with Username
```
Email: jane@example.com
Username: jane_doe
Password: password123
Expected: Account created with both username and accountId
```

#### 3. Login with Email
```
Identifier: john@example.com
Password: password123
Expected: Successful login
```

#### 4. Login with Username
```
Identifier: jane_doe
Password: password123
Expected: Successful login
```

#### 5. Login with Account ID
```
Identifier: ACCT-2025-000001
Password: password123
Expected: Successful login
```

---

## Security Rules

### Firestore Collections

The enhanced auth system uses these collections:

#### 1. **`users/{uid}`** - User Profiles
- Stores: uid, email, username, accountId, firstName, lastName, role
- Read: Owner or Admin
- Write: Owner (limited fields) or Admin

#### 2. **`usernames/{username}`** - Username Lookup
- Stores: username, uid, accountId
- Read: Public (for login lookup)
- Write: Create during signup, Admin only for updates/deletes

#### 3. **`accountIds/{accountId}`** - Account ID Lookup
- Stores: accountId, uid, email
- Read: Public (for login lookup)
- Write: Create during signup, Admin only for deletes

### Key Security Features

- ✅ Email validation (regex)
- ✅ Username validation (3-30 chars, alphanumeric + `_` + `-`)
- ✅ Account ID validation (`ACCT-YYYY-NNNNNN` format)
- ✅ Role validation (`client`, `agent`, `investor`, `admin`)
- ✅ Critical fields immutable (uid, email, accountId)
- ✅ Username can only be set once
- ✅ Lookup collections publicly readable (safe, no sensitive data)

---

## Integration with Existing Pages

### Updated Files

#### `index.html`
- ✅ Added username field to signup form (optional)
- ✅ Updated login field to accept email/username/accountId
- ✅ Integrated enhanced-auth.js service
- ✅ Updated form handlers

### Usage in Other Pages

To use enhanced auth in other pages:

```html
<!-- Add dependencies -->
<script src="/firebase-config.js"></script>
<script src="/assets/js/services/id-generator.js"></script>
<script src="/assets/js/services/enhanced-auth.js"></script>

<script>
// Register user
const result = await enhancedAuth.register({
    email: 'user@example.com',
    password: 'password123',
    username: 'cool_user',        // Optional
    firstName: 'John',
    lastName: 'Doe',
    role: 'client'
});

console.log('Account ID:', result.accountId);  // ACCT-2025-000001
console.log('Username:', result.username);     // cool_user

// Login with any identifier
const userCred = await enhancedAuth.login('cool_user', 'password123');
// OR
const userCred = await enhancedAuth.login('user@example.com', 'password123');
// OR
const userCred = await enhancedAuth.login('ACCT-2025-000001', 'password123');

// Get profile
const profile = await enhancedAuth.getUserProfile(userCred.user.uid);
</script>
```

---

## Firestore Data Structure

### Example User Document

```json
// Collection: users/{uid}
{
  "uid": "abc123xyz",
  "accountId": "ACCT-2025-000001",
  "email": "john@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "role": "client",
  "createdAt": Timestamp,
  "lastLogin": Timestamp,
  "emailVerified": false,
  "accountStatus": "active",
  "preferences": {
    "notifications": true,
    "emailNotifications": true
  }
}
```

### Example Username Document

```json
// Collection: usernames/{username}
{
  "username": "johndoe",
  "originalUsername": "JohnDoe",
  "uid": "abc123xyz",
  "accountId": "ACCT-2025-000001",
  "createdAt": Timestamp
}
```

### Example Account ID Document

```json
// Collection: accountIds/{accountId}
{
  "accountId": "ACCT-2025-000001",
  "uid": "abc123xyz",
  "email": "john@example.com",
  "createdAt": Timestamp
}
```

---

## Troubleshooting

### Issue: "Username already taken"
**Solution:** Username is case-insensitive and stored in lowercase. Check if similar username exists.

### Issue: "Invalid username or account ID"
**Solution:** 
- Username: 3-30 chars, alphanumeric + `_` + `-` only
- Account ID: Must match `ACCT-YYYY-NNNNNN` format

### Issue: "Enhanced authentication service not loaded"
**Solution:** Verify script load order in HTML:
1. Firebase SDK
2. firebase-config.js
3. id-generator.js
4. enhanced-auth.js

### Issue: Firestore permission denied
**Solution:** 
```bash
# Redeploy security rules
firebase deploy --only firestore:rules

# Verify in console
open https://console.firebase.google.com/project/assiduous-prod/firestore/rules
```

### Issue: Account ID collision
**Solution:** ID generator uses `YYYY` + 6-digit counter. Very unlikely to collide. If it happens, the generator will retry with next sequential number.

---

## API Reference

### EnhancedAuth Methods

#### `register(userData)`
Create new user account with optional username.

**Parameters:**
```javascript
{
  email: string,           // Required
  password: string,        // Required
  username: string | null, // Optional
  firstName: string,       // Optional
  lastName: string,        // Optional
  phone: string,           // Optional
  role: string            // Default: 'client'
}
```

**Returns:**
```javascript
{
  uid: string,
  accountId: string,
  email: string,
  username: string | null
}
```

#### `login(identifier, password)`
Sign in with email, username, or account ID.

**Parameters:**
- `identifier`: Email, username, or account ID
- `password`: User password

**Returns:** Firebase UserCredential

#### `getUserProfile(uid)`
Get user profile by Firebase UID.

**Returns:** User profile object

#### `getUserByAccountId(accountId)`
Get user profile by account ID.

**Returns:** User profile object

#### `getUserByUsername(username)`
Get user profile by username.

**Returns:** User profile object

#### `logout()`
Sign out current user.

**Returns:** Promise<void>

#### `getCurrentUser()`
Get currently authenticated user.

**Returns:** Firebase User or null

---

## Deployment Checklist

- [ ] Security rules deployed: `firebase deploy --only firestore:rules`
- [ ] Website files deployed: `firebase deploy --only hosting`
- [ ] Test page accessible: https://assiduous-prod.web.app/test-enhanced-auth.html
- [ ] Registration with email works
- [ ] Registration with username works
- [ ] Login with email works
- [ ] Login with username works
- [ ] Login with account ID works
- [ ] Firestore collections created (users, usernames, accountIds)
- [ ] Security rules validated in Firebase Console
- [ ] Browser DevTools console shows no errors

---

## Support & Maintenance

### Monitoring

Check Firestore usage:
```bash
open https://console.firebase.google.com/project/assiduous-prod/usage
```

View security rule logs:
```bash
open https://console.firebase.google.com/project/assiduous-prod/firestore/rules
```

### Backup

Always keep backups of:
- Security rules: `firestore-enhanced-auth.rules`
- Service files: `enhanced-auth.js`, `id-generator.js`
- Test page: `test-enhanced-auth.html`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-12 | Initial enhanced auth system |

---

**Questions?** Contact: support@assiduous.com
