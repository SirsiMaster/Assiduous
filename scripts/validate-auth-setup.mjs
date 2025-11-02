#!/usr/bin/env node
/**
 * Validate Authentication Setup
 * Checks that all users have proper RBAC configuration
 */

import admin from 'firebase-admin';

admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();

console.log('🔍 Validating Authentication Setup\n');
console.log('═'.repeat(70));

const expectedUsers = [
  { email: 'admin@sirsimaster.com', role: 'admin' },
  { email: 'agent@sirsimaster.com', role: 'agent' },
  { email: 'client@sirsimaster.com', role: 'client' },
  { email: 'admin@assiduousrealty.com', role: 'admin' },
  { email: 'agent@assiduousrealty.com', role: 'agent' },
  { email: 'client@assiduousrealty.com', role: 'client' },
  { email: 'investor@assiduousrealty.com', role: 'client' }
];

let passCount = 0;
let failCount = 0;

for (const expected of expectedUsers) {
  try {
    // Get user from Firebase Auth
    const user = await auth.getUserByEmail(expected.email);
    
    // Get custom claims
    const userRecord = await auth.getUser(user.uid);
    const claims = userRecord.customClaims || {};
    
    // Get Firestore document
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    // Validate
    const checks = {
      authExists: !!user,
      hasCustomClaims: !!claims.role,
      correctRole: claims.role === expected.role,
      firestoreExists: userDoc.exists,
      firestoreRoleMatch: userData?.role === expected.role
    };
    
    const allPass = Object.values(checks).every(v => v === true);
    
    if (allPass) {
      console.log(`✅ ${expected.email.padEnd(40)} [${expected.role}]`);
      passCount++;
    } else {
      console.log(`❌ ${expected.email.padEnd(40)} [${expected.role}]`);
      if (!checks.hasCustomClaims) console.log(`   ⚠️  Missing custom claims`);
      if (!checks.correctRole) console.log(`   ⚠️  Wrong role: ${claims.role}`);
      if (!checks.firestoreExists) console.log(`   ⚠️  No Firestore document`);
      if (!checks.firestoreRoleMatch) console.log(`   ⚠️  Firestore role mismatch: ${userData?.role}`);
      failCount++;
    }
    
  } catch (error) {
    console.log(`❌ ${expected.email.padEnd(40)} [${expected.role}]`);
    console.log(`   ⚠️  Error: ${error.message}`);
    failCount++;
  }
}

console.log('\n' + '═'.repeat(70));
console.log(`\n📊 Summary: ${passCount} passed, ${failCount} failed out of ${expectedUsers.length} users\n`);

if (failCount === 0) {
  console.log('✅ All users configured correctly for RBAC!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Test login at: https://assiduous-prod.web.app/login.html');
  console.log('   2. Use credentials from .env.test file');
  console.log('   3. Verify role-based redirects work correctly\n');
} else {
  console.log('⚠️  Some users need configuration. Run: node scripts/setup-rbac-secure.mjs\n');
}

process.exit(failCount > 0 ? 1 : 0);
