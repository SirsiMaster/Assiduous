#!/usr/bin/env node

/**
 * Authentication Testing Script
 * 
 * Creates test users in Firebase Authentication and Firestore for testing auth flows.
 * 
 * Usage:
 *   node scripts/test_authentication.js [--create-users] [--delete-users]
 * 
 * Test Users Created:
 *   - admin@assiduous.com (role: admin)
 *   - agent@assiduous.com (role: agent)
 *   - client@assiduous.com (role: client)
 */

const admin = require('firebase-admin');

// Parse command line args
const args = process.argv.slice(2);
const shouldCreateUsers = args.includes('--create-users');
const shouldDeleteUsers = args.includes('--delete-users');

// HARD DEPRECATION GUARD
// ----------------------
// This script creates `@assiduous.com` test users which are now
// considered legacy-only and must not be recreated in production.
//
// To prevent accidental recreation of the old accounts, the script now
// exits immediately.
console.error('[DEPRECATED] scripts/test_authentication.js uses legacy @assiduous.com test users and is disabled.');
process.exit(1);

// Initialize Firebase Admin (unreachable; kept for historical context)
let serviceAccount;
try {
  serviceAccount = require('../firebase-migration-package/firebase-service-account.json');
} catch (error) {
  console.error('❌ Firebase service account not found');
  console.error('Create firebase-service-account.json from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'assiduous-prod'
});

const auth = admin.auth();
const db = admin.firestore();

// Test user configurations
const TEST_USERS = [
  {
    email: 'admin@assiduous.com',
    password: 'Test123!@#',
    role: 'admin',
    displayName: 'Test Admin',
    profile: {
      firstName: 'Test',
      lastName: 'Admin',
      phone: '+1-555-0001',
      title: 'System Administrator'
    },
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_properties', 'view_analytics']
  },
  {
    email: 'agent@assiduous.com',
    password: 'Test123!@#',
    role: 'agent',
    displayName: 'Test Agent',
    profile: {
      firstName: 'Test',
      lastName: 'Agent',
      phone: '+1-555-0002',
      licenseNumber: 'LIC-TEST-001',
      specializations: ['residential', 'buyer', 'seller'],
      yearsExperience: 5,
      bio: 'Test agent account for authentication testing'
    },
    stats: {
      totalSales: 0,
      totalVolume: 0,
      activeListings: 0,
      avgRating: 0,
      reviewCount: 0
    }
  },
  {
    email: 'client@assiduous.com',
    password: 'Test123!@#',
    role: 'client',
    displayName: 'Test Client',
    profile: {
      firstName: 'Test',
      lastName: 'Client',
      phone: '+1-555-0003',
      preferences: {
        propertyTypes: ['house', 'condo'],
        priceRange: { min: 200000, max: 500000 },
        bedrooms: { min: 2, max: 4 },
        bathrooms: { min: 2, max: 3 }
      }
    },
    favorites: [],
    savedSearches: []
  }
];

/**
 * Create test users in Firebase Authentication and Firestore
 */
async function createTestUsers() {
  console.log('🔥 Creating test users in Firebase...\n');

  for (const userData of TEST_USERS) {
    try {
      console.log(`Creating user: ${userData.email}`);

      // Check if user already exists
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userData.email);
        console.log(`  ⚠️  User already exists in Firebase Auth: ${userRecord.uid}`);
      } catch (error) {
        // User doesn't exist, create it
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: true
        });
        console.log(`  ✅ Created Firebase Auth user: ${userRecord.uid}`);
      }

      // Set custom claims for role-based access
      await auth.setCustomUserClaims(userRecord.uid, {
        role: userData.role
      });
      console.log(`  ✅ Set custom claims: role=${userData.role}`);

      // Create or update Firestore document
      const userDoc = {
        uid: userRecord.uid,
        email: userData.email,
        role: userData.role,
        profile: userData.profile,
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
        lastLogin: admin.firestore.Timestamp.now(),
        emailVerified: true
      };

      // Add role-specific fields
      if (userData.role === 'admin') {
        userDoc.permissions = userData.permissions;
      } else if (userData.role === 'agent') {
        userDoc.stats = userData.stats;
        userDoc.profileComplete = true;
      } else if (userData.role === 'client') {
        userDoc.favorites = userData.favorites;
        userDoc.savedSearches = userData.savedSearches;
        userDoc.onboardingComplete = true;
      }

      await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
      console.log(`  ✅ Created Firestore document in users collection`);
      console.log('');

    } catch (error) {
      console.error(`  ❌ Error creating user ${userData.email}:`, error.message);
      console.log('');
    }
  }

  console.log('✅ Test user creation complete!\n');
  printLoginInstructions();
}

/**
 * Delete test users from Firebase Authentication and Firestore
 */
async function deleteTestUsers() {
  console.log('🗑️  Deleting test users from Firebase...\n');

  for (const userData of TEST_USERS) {
    try {
      console.log(`Deleting user: ${userData.email}`);

      // Get user by email
      const userRecord = await auth.getUserByEmail(userData.email);

      // Delete from Firestore
      await db.collection('users').doc(userRecord.uid).delete();
      console.log(`  ✅ Deleted Firestore document`);

      // Delete from Authentication
      await auth.deleteUser(userRecord.uid);
      console.log(`  ✅ Deleted Firebase Auth user`);
      console.log('');

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`  ℹ️  User not found, skipping`);
      } else {
        console.error(`  ❌ Error deleting user:`, error.message);
      }
      console.log('');
    }
  }

  console.log('✅ Test user deletion complete!\n');
}

/**
 * List all test users and their status
 */
async function listTestUsers() {
  console.log('📋 Test User Status:\n');

  for (const userData of TEST_USERS) {
    try {
      const userRecord = await auth.getUserByEmail(userData.email);
      const firestoreDoc = await db.collection('users').doc(userRecord.uid).get();

      console.log(`${userData.email}:`);
      console.log(`  UID: ${userRecord.uid}`);
      console.log(`  Role: ${userData.role}`);
      console.log(`  Auth: ✅ Exists`);
      console.log(`  Firestore: ${firestoreDoc.exists ? '✅ Exists' : '❌ Missing'}`);
      console.log(`  Email Verified: ${userRecord.emailVerified ? '✅ Yes' : '❌ No'}`);
      console.log('');

    } catch (error) {
      console.log(`${userData.email}:`);
      console.log(`  ❌ Not found in Firebase Auth`);
      console.log('');
    }
  }
}

/**
 * Print login instructions for testing
 */
function printLoginInstructions() {
  console.log('📝 Test User Credentials:\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('ADMIN USER:');
  console.log('  Email:    admin@assiduous.com');
  console.log('  Password: Test123!@#');
  console.log('  Login:    https://assiduous-prod.web.app/login.html');
  console.log('  Dashboard: https://assiduous-prod.web.app/admin/dashboard.html');
  console.log('');
  console.log('AGENT USER:');
  console.log('  Email:    agent@assiduous.com');
  console.log('  Password: Test123!@#');
  console.log('  Login:    https://assiduous-prod.web.app/login.html');
  console.log('  Dashboard: https://assiduous-prod.web.app/agent/dashboard.html');
  console.log('');
  console.log('CLIENT USER:');
  console.log('  Email:    client@assiduous.com');
  console.log('  Password: Test123!@#');
  console.log('  Login:    https://assiduous-prod.web.app/login.html');
  console.log('  Dashboard: https://assiduous-prod.web.app/client/dashboard.html');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  console.log('🔐 Assiduous Authentication Testing Tool\n');

  if (shouldDeleteUsers) {
    await deleteTestUsers();
  } else if (shouldCreateUsers) {
    await createTestUsers();
  } else {
    await listTestUsers();
    console.log('Usage:');
    console.log('  node scripts/test_authentication.js --create-users   # Create test users');
    console.log('  node scripts/test_authentication.js --delete-users   # Delete test users');
    console.log('  node scripts/test_authentication.js                  # List test users');
    console.log('');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
