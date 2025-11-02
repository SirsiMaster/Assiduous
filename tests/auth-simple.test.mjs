#!/usr/bin/env node
/**
 * Simple Authentication Tests
 * Tests Firebase Auth directly without browser complexity
 */

import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load test credentials
config({ path: '.env.test' });

// Initialize Firebase Admin
admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

const CREDENTIALS = {
  admin: {
    email: 'admin@assiduousrealty.com',
    password: process.env.ADMIN_REALTY_PASSWORD,
    expectedRole: 'admin'
  },
  agent: {
    email: 'agent@assiduousrealty.com',
    password: process.env.AGENT_REALTY_PASSWORD,
    expectedRole: 'agent'
  },
  client: {
    email: 'client@assiduousrealty.com',
    password: process.env.CLIENT_REALTY_PASSWORD,
    expectedRole: 'client'
  }
};

let passCount = 0;
let failCount = 0;

console.log('\n🧪 Running Authentication Tests\n');
console.log('═'.repeat(70));

// Test 1: User exists and has correct role
async function testUserSetup(role, creds) {
  try {
    const user = await auth.getUserByEmail(creds.email);
    const claims = user.customClaims || {};
    
    if (claims.role === creds.expectedRole) {
      console.log(`✅ ${role} user: Exists with correct role (${claims.role})`);
      passCount++;
      return true;
    } else {
      console.log(`❌ ${role} user: Wrong role (expected ${creds.expectedRole}, got ${claims.role})`);
      failCount++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${role} user: ${error.message}`);
    failCount++;
    return false;
  }
}

// Test 2: Firestore document exists
async function testFirestoreDoc(role, creds) {
  try {
    const user = await auth.getUserByEmail(creds.email);
    const doc = await db.collection('users').doc(user.uid).get();
    
    if (doc.exists && doc.data().role === creds.expectedRole) {
      console.log(`✅ ${role} Firestore: Document exists with correct role`);
      passCount++;
      return true;
    } else {
      console.log(`❌ ${role} Firestore: Missing or incorrect role`);
      failCount++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${role} Firestore: ${error.message}`);
    failCount++;
    return false;
  }
}

// Test 3: Password is set (we can't test sign-in with Admin SDK, but we can verify it exists)
async function testPasswordSet(role, creds) {
  try {
    const user = await auth.getUserByEmail(creds.email);
    
    // Check if password is set by looking at provider data
    const hasPassword = user.providerData.some(p => p.providerId === 'password');
    
    if (hasPassword) {
      console.log(`✅ ${role} password: Provider configured`);
      passCount++;
      return true;
    } else {
      console.log(`❌ ${role} password: No password provider`);
      failCount++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${role} password: ${error.message}`);
    failCount++;
    return false;
  }
}

// Run all tests
async function runTests() {
  for (const [role, creds] of Object.entries(CREDENTIALS)) {
    console.log(`\n📋 Testing ${role.toUpperCase()}: ${creds.email}`);
    await testUserSetup(role, creds);
    await testFirestoreDoc(role, creds);
    await testPasswordSet(role, creds);
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);
  
  if (failCount === 0) {
    console.log('✅ All backend authentication tests passed!');
    console.log('\n📝 Manual browser test required:');
    console.log('   1. Open https://assiduous-prod.web.app/#login');
    console.log('   2. Test each role login with credentials from .env.test');
    console.log('   3. Verify redirects work correctly');
    console.log('   4. Verify RBAC blocks unauthorized access\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Fix backend issues before browser testing.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
