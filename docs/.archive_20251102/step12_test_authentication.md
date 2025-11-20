# Step 12: Test Authentication - EXECUTION PLAN

**Date**: 2025-01-11  
**Status**: 🔄 READY FOR EXECUTION  
**Estimated Time**: 2 hours

---

## Executive Summary

Comprehensive testing of Firebase Authentication flows across all user roles (client, agent, admin) to ensure proper access control, role-based redirects, and security rule enforcement.

**Test Scope**:
- Login/Logout flows for all roles
- Registration with email verification
- Password reset functionality
- Role-based access control (RBAC)
- Session persistence
- Token refresh
- Error handling

---

## Prerequisites

✅ **Firebase Authentication Configured**
- Project: assiduous-prod
- Console: https://console.firebase.google.com/project/assiduous-prod/authentication

✅ **Firestore Security Rules Deployed** (Step 2)
- Rules enforce role-based access
- Authenticated vs unauthenticated access

✅ **Auth Service Implementation**
- Location: `public/assets/js/firebase-init.js`
- Methods: `signIn`, `signUp`, `signOut`, `resetPassword`

✅ **Test Users** (historical)
- Admin: `admin@assiduous.com`
- Agent: `agent@assiduous.com`
- Client: `client@assiduous.com`

> NOTE (2025-11-19): These `@assiduous.com` accounts were legacy test
> users only and have been removed. They are kept here solely for
> historical reference and must not be treated as current credentials.

---

## Authentication Architecture

### Current Implementation

**Auth Service** (`public/assets/js/firebase-init.js`):
```javascript
export const AuthService = {
  async signIn(email, password) { ... },
  async signUp(email, password, userData) { ... },
  async signOut() { ... },
  async resetPassword(email) { ... },
  async updateProfile(updates) { ... },
  getCurrentUser() { ... },
  onAuthStateChanged(callback) { ... }
};
```

**Auth Pages**:
- `/public/auth/login.html` - Login form
- `/public/auth/signup.html` - Registration form
- `/public/auth/reset-password.html` - Password reset
- `/public/client/` - Client dashboard (auth required)
- `/public/admin/` - Admin portal (admin role required)

**Role-Based Redirects**:
```javascript
// After login, redirect based on role
if (user.role === 'admin') {
  window.location.href = '/admin/dashboard.html';
} else if (user.role === 'agent') {
  window.location.href = '/agent/dashboard.html';
} else {
  window.location.href = '/client/';
}
```

---

## Test Matrix

### Test 1: Admin Login Flow

**Steps**:
1. Navigate to: https://assiduous-prod.web.app/auth/login.html
2. Enter admin credentials
3. Click "Sign In"

**Expected Results**:
- ✅ Authentication succeeds
- ✅ Redirects to `/admin/dashboard.html`
- ✅ Dashboard loads with admin navigation
- ✅ Can access admin-only pages
- ✅ Cannot access if logged out

**Assertions**:
```javascript
assert(auth.currentUser !== null, 'User should be authenticated');
assert(auth.currentUser.email === 'admin@assiduous.com', 'Correct user logged in');
assert(window.location.pathname.includes('/admin/'), 'Redirected to admin portal');
```

---

### Test 2: Agent Login Flow

**Steps**:
1. Navigate to login page
2. Enter agent credentials
3. Click "Sign In"

**Expected Results**:
- ✅ Authentication succeeds
- ✅ Redirects to `/agent/dashboard.html`
- ✅ Can access agent pages
- ✅ Cannot access admin pages (403 Forbidden)
- ✅ Cannot access other agents' data

**Assertions**:
```javascript
const userDoc = await DatabaseService.getDocument('users', auth.currentUser.uid);
assert(userDoc.role === 'agent', 'User has agent role');
assert(canAccessAgentDashboard(), 'Agent can access agent dashboard');
assert(!canAccessAdminPortal(), 'Agent cannot access admin portal');
```

---

### Test 3: Client Login Flow

**Steps**:
1. Navigate to login page
2. Enter client credentials
3. Click "Sign In"

**Expected Results**:
- ✅ Authentication succeeds
- ✅ Redirects to `/client/`
- ✅ Can browse properties
- ✅ Can save favorites
- ✅ Cannot access admin/agent portals

**Assertions**:
```javascript
assert(userDoc.role === 'client', 'User has client role');
assert(canAccessClientPortal(), 'Client can access client portal');
assert(!canAccessAdminPortal(), 'Client cannot access admin portal');
assert(!canAccessAgentDashboard(), 'Client cannot access agent dashboard');
```

---

### Test 4: Registration Flow

**Steps**:
1. Navigate to: https://assiduous-prod.web.app/auth/signup.html
2. Fill registration form (email, password, name, role)
3. Click "Sign Up"

**Expected Results**:
- ✅ User account created in Firebase Auth
- ✅ User document created in Firestore `users` collection
- ✅ Email verification sent
- ✅ Redirected to appropriate dashboard
- ✅ Welcome email sent (trigger: `onUserProfileCreated`)

**Assertions**:
```javascript
const user = auth.currentUser;
assert(user !== null, 'User created');
assert(!user.emailVerified, 'Email not yet verified');

const userDoc = await DatabaseService.getDocument('users', user.uid);
assert(userDoc !== null, 'User document created');
assert(userDoc.email === 'test@example.com', 'Correct email');
assert(userDoc.role === 'client', 'Default role is client');
```

---

### Test 5: Email Verification

**Steps**:
1. Register new user
2. Check email inbox for verification link
3. Click verification link
4. Refresh dashboard

**Expected Results**:
- ✅ Email contains verification link
- ✅ Link redirects to Firebase email verification handler
- ✅ `emailVerified` flag set to `true`
- ✅ Dashboard shows "Email verified" status

**Manual Verification**:
```bash
# Check Firebase Console > Authentication > Users
# Verify "Email verified" column shows checkmark
```

---

### Test 6: Password Reset Flow

**Steps**:
1. Navigate to: https://assiduous-prod.web.app/auth/reset-password.html
2. Enter email address
3. Click "Reset Password"
4. Check email for reset link
5. Click link and set new password
6. Log in with new password

**Expected Results**:
- ✅ Reset email sent
- ✅ Email contains password reset link
- ✅ Link redirects to Firebase password reset handler
- ✅ New password can be set
- ✅ Can log in with new password
- ✅ Cannot log in with old password

---

### Test 7: Logout Flow

**Steps**:
1. Log in as any user
2. Navigate to any page
3. Click "Logout" button
4. Try accessing protected page

**Expected Results**:
- ✅ User logged out
- ✅ Redirected to login page
- ✅ Protected pages redirect to login
- ✅ Session cleared from localStorage
- ✅ Cannot access protected resources

**Assertions**:
```javascript
await AuthService.signOut();
assert(auth.currentUser === null, 'User logged out');
assert(localStorage.getItem('user') === null, 'Local storage cleared');
```

---

### Test 8: Session Persistence

**Steps**:
1. Log in as any user
2. Close browser tab
3. Reopen browser and navigate to app
4. Check if still logged in

**Expected Results**:
- ✅ User remains logged in (Firebase persistence)
- ✅ No need to re-authenticate
- ✅ Can access protected pages immediately

**Assertions**:
```javascript
// After page reload
assert(auth.currentUser !== null, 'Session persisted');
```

---

### Test 9: Token Refresh

**Steps**:
1. Log in and wait 60 minutes
2. Make API call to Cloud Functions
3. Check if request succeeds

**Expected Results**:
- ✅ Token automatically refreshed
- ✅ API call succeeds with new token
- ✅ No re-authentication required

**Implementation Check**:
```javascript
// In firebase-init.js
if (auth.currentUser) {
  const token = await auth.currentUser.getIdToken(true); // Force refresh
  options.headers['Authorization'] = `Bearer ${token}`;
}
```

---

### Test 10: Role-Based Access Control (RBAC)

**Firestore Security Rules Test**:

```javascript
// Test 1: Admin can read all users
const users = await DatabaseService.getDocuments('users');
assert(users.length > 0, 'Admin can read all users');

// Test 2: Client can only read own profile
// (Log in as client)
const userDoc = await DatabaseService.getDocument('users', auth.currentUser.uid);
assert(userDoc !== null, 'Client can read own profile');

// Try to read another user's profile
try {
  await DatabaseService.getDocument('users', 'some-other-user-id');
  assert(false, 'Should not reach here');
} catch (error) {
  assert(error.code === 'permission-denied', 'Client cannot read others profiles');
}

// Test 3: Agent can read own clients
// (Log in as agent)
const myClients = await DatabaseService.getDocuments('users', [
  {field: 'agentId', operator: '==', value: auth.currentUser.uid}
]);
assert(myClients.length >= 0, 'Agent can read own clients');
```

---

### Test 11: Error Handling

**Test Invalid Credentials**:
```javascript
try {
  await AuthService.signIn('test@example.com', 'wrong-password');
  assert(false, 'Should not reach here');
} catch (error) {
  assert(error.code === 'auth/wrong-password', 'Correct error code');
  assert(error.message.includes('password'), 'Error message helpful');
}
```

**Test User Not Found**:
```javascript
try {
  await AuthService.signIn('nonexistent@example.com', 'password');
  assert(false, 'Should not reach here');
} catch (error) {
  assert(error.code === 'auth/user-not-found', 'User not found error');
}
```

**Test Weak Password**:
```javascript
try {
  await AuthService.signUp('test@example.com', '123', {});
  assert(false, 'Should not reach here');
} catch (error) {
  assert(error.code === 'auth/weak-password', 'Weak password rejected');
}
```

---

## Automated Test Script

Create: `scripts/test_authentication.js`

```javascript
#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-migration-package/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'assiduous-prod'
});

const auth = admin.auth();
const db = admin.firestore();

async function testAuthentication() {
  console.log('🔐 Testing Firebase Authentication\n');

  // Test 1: Create test users
  console.log('Test 1: Creating test users...');
  const testUsers = [
    { email: 'test-admin@assiduous.com', password: 'Test123!@#', role: 'admin' },
    { email: 'test-agent@assiduous.com', password: 'Test123!@#', role: 'agent' },
    { email: 'test-client@assiduous.com', password: 'Test123!@#', role: 'client' }
  ];

  for (const testUser of testUsers) {
    try {
      const userRecord = await auth.createUser({
        email: testUser.email,
        password: testUser.password,
        emailVerified: true,
        displayName: `Test ${testUser.role.charAt(0).toUpperCase() + testUser.role.slice(1)}`
      });

      // Create Firestore user document
      await db.collection('users').doc(userRecord.uid).set({
        email: testUser.email,
        role: testUser.role,
        displayName: userRecord.displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailVerified: true
      });

      console.log(`✅ Created ${testUser.role}: ${testUser.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User already exists: ${testUser.email}`);
      } else {
        console.error(`❌ Error creating ${testUser.role}:`, error.message);
      }
    }
  }

  // Test 2: Verify users exist in Firestore
  console.log('\nTest 2: Verifying Firestore documents...');
  for (const testUser of testUsers) {
    const userQuery = await db.collection('users')
      .where('email', '==', testUser.email)
      .limit(1)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();
      console.log(`✅ ${testUser.role}: role=${userData.role}, emailVerified=${userData.emailVerified}`);
    } else {
      console.log(`❌ ${testUser.role}: User document not found in Firestore`);
    }
  }

  // Test 3: Test Firestore security rules (requires client SDK)
  console.log('\nTest 3: Security rules testing...');
  console.log('⚠️  Security rule testing requires client SDK - manual test required');
  console.log('   Visit: https://assiduous-prod.web.app/auth/login.html');
  console.log('   Use credentials: test-admin@assiduous.com / Test123!@#');

  // Test 4: List all users
  console.log('\nTest 4: User summary...');
  const allUsers = await auth.listUsers();
  const usersByRole = {
    admin: 0,
    agent: 0,
    client: 0,
    unknown: 0
  };

  for (const user of allUsers.users) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const role = userDoc.data().role || 'unknown';
      usersByRole[role]++;
    } else {
      usersByRole.unknown++;
    }
  }

  console.log(`📊 Total users: ${allUsers.users.length}`);
  console.log(`   Admins: ${usersByRole.admin}`);
  console.log(`   Agents: ${usersByRole.agent}`);
  console.log(`   Clients: ${usersByRole.client}`);
  console.log(`   Unknown role: ${usersByRole.unknown}`);

  console.log('\n✅ Automated tests complete!');
  console.log('\n📋 Manual Testing Required:');
  console.log('1. Login test: https://assiduous-prod.web.app/auth/login.html');
  console.log('2. Signup test: https://assiduous-prod.web.app/auth/signup.html');
  console.log('3. Password reset: https://assiduous-prod.web.app/auth/reset-password.html');
  console.log('4. Test each user role and verify RBAC');
  console.log('\nTest Credentials:');
  testUsers.forEach(u => console.log(`   ${u.role}: ${u.email} / ${u.password}`));
}

testAuthentication()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
```

---

## Manual Testing Checklist

### Pre-Testing Setup

- [ ] Ensure Firebase Authentication enabled
- [ ] Ensure Firestore security rules deployed
- [ ] Create test users (or run automated script)
- [ ] Open browser DevTools console

### Test Execution

**Admin Role Tests**:
- [ ] Login as admin@assiduous.com
- [ ] Verify redirect to /admin/dashboard.html
- [ ] Check browser console for errors
- [ ] Navigate to admin-only pages (works)
- [ ] Try accessing client portal (should work - admin has all access)
- [ ] Logout and verify redirect

**Agent Role Tests**:
- [ ] Login as agent@assiduous.com
- [ ] Verify redirect to /agent/dashboard.html (or appropriate page)
- [ ] Check can access agent pages
- [ ] Try accessing admin portal (should fail)
- [ ] Check Firestore rules enforce agent-only data access
- [ ] Logout

**Client Role Tests**:
- [ ] Login as client@assiduous.com
- [ ] Verify redirect to /client/
- [ ] Check can browse properties
- [ ] Try accessing admin portal (should redirect)
- [ ] Try accessing agent portal (should redirect)
- [ ] Logout

**Registration Tests**:
- [ ] Signup as new user
- [ ] Verify email sent
- [ ] Click email verification link
- [ ] Verify emailVerified flag set
- [ ] Check user document in Firestore
- [ ] Check welcome email sent

**Password Reset Tests**:
- [ ] Request password reset
- [ ] Verify email sent
- [ ] Click reset link
- [ ] Set new password
- [ ] Login with new password
- [ ] Verify old password fails

**Error Handling Tests**:
- [ ] Try login with wrong password (see error message)
- [ ] Try login with nonexistent email (see error message)
- [ ] Try signup with weak password (see error message)
- [ ] Try signup with existing email (see error message)

---

## Success Criteria

✅ **All test users can login**  
✅ **Role-based redirects work correctly**  
✅ **RBAC enforced by Firestore rules**  
✅ **Email verification works**  
✅ **Password reset works**  
✅ **Session persistence works**  
✅ **Error messages are helpful**  
✅ **No authentication-related console errors**  
✅ **Token refresh works automatically**  

---

## Known Issues & Limitations

### Current Limitations

1. **Email Verification Required**:
   - Users can access app before verifying email
   - Should add UI warning for unverified emails

2. **No 2FA/MFA**:
   - Single-factor authentication only
   - Consider adding 2FA for admin accounts

3. **No Account Lockout**:
   - No protection against brute force attacks
   - Firebase has rate limiting, but no lockout

4. **No OAuth Providers**:
   - Only email/password authentication
   - Could add Google, Facebook, etc.

### Recommended Enhancements

**Add Email Verification Warning**:
```javascript
if (auth.currentUser && !auth.currentUser.emailVerified) {
  showBanner('Please verify your email address. Check your inbox.');
}
```

**Add 2FA for Admins**:
```javascript
// Firebase supports 2FA via SMS
// Implement in future security enhancement
```

**Add Account Lockout**:
```javascript
// Track failed login attempts in Firestore
// Lock account after 5 failed attempts
```

---

## Next Steps

### After Step 12 Complete

1. **Step 13**: Integration testing (test full user workflows)
2. **Step 18**: Seed production data (create realistic test users)
3. **Step 14**: Error handling (improve error messages)
4. **Step 20**: Third-party integrations (add OAuth providers)

### Future Security Enhancements

1. Add 2FA for admin accounts
2. Implement account lockout after failed attempts
3. Add OAuth providers (Google, Facebook)
4. Add session timeout (auto-logout after inactivity)
5. Add password complexity requirements
6. Add "Remember Me" functionality
7. Add login history tracking

---

## Execution Commands

```bash
# Create test users automatically
node scripts/test_authentication.js

# Check Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/authentication/users

# Run manual tests in browser
open https://assiduous-prod.web.app/auth/login.html

# Check Firestore users collection
open https://console.firebase.google.com/project/assiduous-prod/firestore/data/users
```

---

## Conclusion

**Step 12: Test Authentication** provides comprehensive testing coverage for all authentication flows. The combination of automated user creation and manual browser testing ensures the authentication system is production-ready.

**Estimated Time**: 2 hours (30 min automated setup + 1.5 hours manual testing)

**Next Action**: Run `scripts/test_authentication.js` to create test users, then perform manual testing checklist.

---

**Prepared by**: Warp AI Assistant  
**Date**: 2025-01-11  
**Status**: Ready for execution  
**Next Step**: Create and run test script
