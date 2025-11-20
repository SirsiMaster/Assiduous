# Step 12: Authentication Testing - EXECUTION PLAN

**Date**: 2025-01-11  
**Status**: ⏳ READY TO EXECUTE  
**Time Estimate**: 2-3 hours  
**Dependencies**: Step 1 (secrets), Step 2 (rules) - ✅ COMPLETE

---

## 🎯 Objectives

Test all authentication flows end-to-end to ensure:
1. ✅ Login/logout works for all user roles (admin, agent, client)
2. ✅ Role-based access control (RBAC) enforces permissions correctly
3. ✅ Password reset flow functions properly
4. ✅ Custom claims are set correctly for each role
5. ✅ Session management works across page refreshes
6. ✅ Unauthorized access attempts are blocked

---

## 📋 Prerequisites

### ✅ Completed
- Step 1: Firebase secrets configured
- Step 2: Firestore security rules deployed
- Firebase Authentication enabled in production

### ⏳ Required for Execution
- Firebase service account JSON (same as Step 18 requirement)
- Location: `firebase-migration-package/firebase-service-account.json`

**If Missing**:
1. Go to [Firebase Console](https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts)
2. Click "Generate New Private Key"
3. Save as `firebase-service-account.json`
4. Place in `firebase-migration-package/` directory

---

> NOTE (2025-11-19): The test users listed in this plan use the
> `@assiduous.com` domain and are **legacy only**. They no longer exist
> in the production project and are kept for historical reference only.
>
## 🔧 Test User Creation

### Automated Script
Created: `scripts/test_authentication.js`

**Test Users**:
1. **Admin User**
   - Email: `admin@assiduous.com`
   - Password: `Test123!@#`
   - Role: `admin`
   - Custom Claims: `{ role: 'admin' }`
   - Permissions: All (read, write, delete, manage_users, etc.)

2. **Agent User**
   - Email: `agent@assiduous.com`
   - Password: `Test123!@#`
   - Role: `agent`
   - Custom Claims: `{ role: 'agent' }`
   - License: `LIC-TEST-001`

3. **Client User**
   - Email: `client@assiduous.com`
   - Password: `Test123!@#`
   - Role: `client`
   - Custom Claims: `{ role: 'client' }`
   - Preferences: House/Condo, $200K-$500K

### Usage
```bash
# List existing test users
node scripts/test_authentication.js

# Create test users
node scripts/test_authentication.js --create-users

# Delete test users (cleanup)
node scripts/test_authentication.js --delete-users
```

---

## 🧪 Test Scenarios

### Test 1: Admin Login Flow
**Objective**: Verify admin can login and access admin dashboard

**Steps**:
1. Open https://assiduous-prod.web.app/login.html
2. Enter credentials:
   - Email: `admin@assiduous.com`
   - Password: `Test123!@#`
3. Click "Login"
4. Verify redirect to `/admin/dashboard.html`
5. Check browser DevTools Console for errors
6. Verify admin dashboard loads correctly
7. Navigate to `/admin/properties.html` - should load
8. Navigate to `/admin/agents.html` - should load
9. Navigate to `/admin/clients.html` - should load
10. Navigate to `/admin/transactions.html` - should load
11. Click "Logout"
12. Verify redirect to `/login.html`

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to admin dashboard
- ✅ All admin pages accessible
- ✅ No console errors
- ✅ Logout successful

**Failure Scenarios**:
- ❌ Invalid credentials error message
- ❌ Redirect to wrong dashboard
- ❌ Console errors during login
- ❌ Session not persisted

---

### Test 2: Agent Login Flow
**Objective**: Verify agent can login and access agent dashboard

**Steps**:
1. Open https://assiduous-prod.web.app/login.html
2. Enter credentials:
   - Email: `agent@assiduous.com`
   - Password: `Test123!@#`
3. Click "Login"
4. Verify redirect to `/agent/dashboard.html`
5. Check browser DevTools Console for errors
6. Try accessing `/admin/dashboard.html`
7. Verify access DENIED with error message
8. Navigate to `/agent/properties.html` - should load
9. Click "Logout"
10. Verify redirect to `/login.html`

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to agent dashboard
- ✅ Admin pages BLOCKED
- ✅ Agent pages accessible
- ✅ No console errors
- ✅ Logout successful

**Failure Scenarios**:
- ❌ Can access admin pages (RBAC failure)
- ❌ Redirect to wrong dashboard
- ❌ No error message when accessing admin pages

---

### Test 3: Client Login Flow
**Objective**: Verify client can login and access client dashboard

**Steps**:
1. Open https://assiduous-prod.web.app/login.html
2. Enter credentials:
   - Email: `client@assiduous.com`
   - Password: `Test123!@#`
3. Click "Login"
4. Verify redirect to `/client/dashboard.html`
5. Check browser DevTools Console for errors
6. Try accessing `/admin/dashboard.html`
7. Verify access DENIED
8. Try accessing `/agent/dashboard.html`
9. Verify access DENIED
10. Navigate to `/client/properties.html` - should load
11. Click "Logout"
12. Verify redirect to `/login.html`

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to client dashboard
- ✅ Admin pages BLOCKED
- ✅ Agent pages BLOCKED
- ✅ Client pages accessible
- ✅ No console errors
- ✅ Logout successful

---

### Test 4: Password Reset Flow
**Objective**: Verify forgot password / password reset works

**Steps**:
1. Open https://assiduous-prod.web.app/login.html
2. Click "Forgot Password?"
3. Enter email: `admin@assiduous.com`
4. Click "Send Reset Email"
5. Check Firebase Console → Authentication → Users → admin@assiduous.com
6. Verify password reset email sent
7. Click reset link in email (if SendGrid configured)
8. Enter new password
9. Confirm password change successful
10. Login with new password
11. Verify login works

**Expected Results**:
- ✅ Reset email sent
- ✅ Reset link valid
- ✅ Password changed successfully
- ✅ Can login with new password

**Note**: If SendGrid not configured, password reset email won't send. Test SendGrid separately in Step 14.

---

### Test 5: Role-Based Access Control (RBAC)
**Objective**: Verify RBAC enforcement across all pages

**Test Matrix**:

| Page | Admin | Agent | Client | Anon |
|------|-------|-------|--------|------|
| `/admin/dashboard.html` | ✅ Allow | ❌ Deny | ❌ Deny | ❌ Deny |
| `/admin/properties.html` | ✅ Allow | ❌ Deny | ❌ Deny | ❌ Deny |
| `/admin/agents.html` | ✅ Allow | ❌ Deny | ❌ Deny | ❌ Deny |
| `/admin/clients.html` | ✅ Allow | ❌ Deny | ❌ Deny | ❌ Deny |
| `/admin/transactions.html` | ✅ Allow | ❌ Deny | ❌ Deny | ❌ Deny |
| `/agent/dashboard.html` | ✅ Allow | ✅ Allow | ❌ Deny | ❌ Deny |
| `/client/dashboard.html` | ✅ Allow | ✅ Allow | ✅ Allow | ❌ Deny |

**Test Steps**:
1. Login as each role (admin, agent, client)
2. Attempt to access each page
3. Verify access granted/denied correctly
4. Check error messages displayed
5. Verify redirects to appropriate pages

**Expected Results**:
- ✅ Access granted only per matrix
- ✅ Clear error messages for denied access
- ✅ Redirects to login if not authenticated
- ✅ Redirects to role dashboard if wrong role

---

### Test 6: Session Persistence
**Objective**: Verify authentication persists across page refreshes

**Steps**:
1. Login as admin@assiduous.com
2. Navigate to `/admin/properties.html`
3. Refresh the page (F5 or Cmd+R)
4. Verify still logged in
5. Close browser tab
6. Open new tab to https://assiduous-prod.web.app/admin/dashboard.html
7. Verify still logged in
8. Open browser DevTools → Application → Local Storage
9. Check for Firebase auth tokens
10. Close browser completely
11. Reopen browser to admin dashboard
12. Verify session restored

**Expected Results**:
- ✅ Session persists across refreshes
- ✅ Session persists in new tabs
- ✅ Session persists after browser close (if "Remember Me")
- ✅ Auth tokens stored in localStorage

---

### Test 7: Token Refresh
**Objective**: Verify Firebase ID tokens refresh automatically

**Steps**:
1. Login as admin@assiduous.com
2. Open browser DevTools Console
3. Run: `firebase.auth().currentUser.getIdToken(true)`
4. Note the token value
5. Wait 1 hour
6. Run: `firebase.auth().currentUser.getIdToken(true)` again
7. Verify token is different (refreshed)
8. Verify still logged in after token refresh

**Expected Results**:
- ✅ Token refreshes automatically before expiry
- ✅ No logout during token refresh
- ✅ No user interaction required

**Note**: Firebase tokens expire after 1 hour. SDK handles refresh automatically.

---

### Test 8: Error Handling
**Objective**: Verify proper error messages for auth failures

**Test Cases**:

**8.1: Wrong Password**
- Email: `admin@assiduous.com`
- Password: `WrongPassword123`
- Expected: "Invalid email or password" error message

**8.2: Non-Existent User**
- Email: `nonexistent@assiduous.com`
- Password: `Test123!@#`
- Expected: "Invalid email or password" error message (don't reveal user existence)

**8.3: Empty Fields**
- Email: (empty)
- Password: (empty)
- Expected: "Please enter email and password" error

**8.4: Invalid Email Format**
- Email: `notanemail`
- Password: `Test123!@#`
- Expected: "Invalid email format" error

**8.5: Network Failure**
- Disconnect internet
- Attempt login
- Expected: "Network error. Please check your connection" error

---

## 🔍 Verification Checklist

### Firebase Authentication Console
- [ ] Open https://console.firebase.google.com/project/assiduous-prod/authentication/users
- [ ] Verify 3 test users exist
- [ ] Check custom claims set correctly for each user
- [ ] Verify email verified = true

### Firestore Console
- [ ] Open https://console.firebase.google.com/project/assiduous-prod/firestore/data
- [ ] Navigate to `users` collection
- [ ] Verify 3 test user documents exist
- [ ] Check `role` field matches custom claims
- [ ] Verify `profile` object populated

### Browser Testing
- [ ] Zero JavaScript errors in console
- [ ] Network tab shows successful auth requests
- [ ] localStorage contains Firebase auth tokens
- [ ] Session persists across refreshes
- [ ] Logout clears auth tokens

---

## 📊 Test Results Template

```markdown
## Test Results - Step 12: Authentication

**Date**: [Date]
**Tester**: [Name]
**Environment**: Production (assiduous-prod.web.app)

### Test 1: Admin Login Flow
- Status: ✅ PASS / ❌ FAIL
- Notes: 

### Test 2: Agent Login Flow
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 3: Client Login Flow
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 4: Password Reset Flow
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 5: RBAC Enforcement
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 6: Session Persistence
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 7: Token Refresh
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Test 8: Error Handling
- Status: ✅ PASS / ❌ FAIL
- Notes:

### Summary
- Total Tests: 8
- Passed: X
- Failed: X
- Pass Rate: XX%

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## 🚨 Known Issues & Limitations

### Issue 1: SendGrid Not Configured
**Impact**: Password reset emails won't send  
**Workaround**: Test SendGrid separately in Step 14  
**Status**: Expected - not a blocker for Step 12

### Issue 2: Empty Firestore Collections
**Impact**: Dashboards show "Loading..." after login  
**Workaround**: Execute Step 18 seeding first  
**Status**: Not a blocker for auth testing

### Issue 3: Agent/Client Dashboards May Not Exist
**Impact**: Agent/client redirects may 404  
**Workaround**: Test admin dashboard only, or create placeholder pages  
**Status**: Check if pages exist before testing

---

## 🔄 Cleanup After Testing

```bash
# Delete test users
node scripts/test_authentication.js --delete-users

# Verify deletion
node scripts/test_authentication.js

# Expected output: "❌ Not found in Firebase Auth" for all users
```

**Important**: Delete test users before production launch to avoid security issues.

---

## 📁 Files Created

```
scripts/
└── test_authentication.js  (284 lines)

docs/ops/
└── step12_auth_testing_plan.md  (this file)
```

---

## 🎯 Success Criteria

Step 12 is COMPLETE when:
- ✅ All 8 test scenarios pass
- ✅ RBAC enforced correctly
- ✅ Zero console errors during auth flows
- ✅ Session persistence works
- ✅ Error handling displays appropriate messages
- ✅ Test results documented

---

## 🚀 Next Steps After Step 12

1. **Step 14**: SendGrid Integration (test password reset emails)
2. **Step 13**: Implement frontend RBAC UI (show/hide based on role)
3. **Step 18**: Seed Firestore (populate dashboards)
4. **Step 20**: Full Integration Testing

---

**Prepared by**: Warp AI Assistant (Autonomous Mode)  
**Date**: 2025-01-11  
**Status**: Ready to Execute (pending service account)  
**Next Action**: Run `node scripts/test_authentication.js --create-users`
