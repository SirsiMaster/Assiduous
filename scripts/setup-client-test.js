#!/usr/bin/env node

/**
 * Setup script to create/verify client user profile in Firestore
 * This ensures client@assiduousrealty.com can properly authenticate
 * and use the system for end-to-end testing.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with environment / CLI credentials
try {
  admin.initializeApp({
    projectId: 'assiduous-prod',
  });
} catch (e) {
  console.error('Failed to initialize Firebase Admin:', e.message);
  console.log('\nMake sure you are logged in to Firebase:');
  console.log('  firebase login');
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// UID from all-users.json export for client@assiduousrealty.com
const CLIENT_EMAIL = 'client@assiduousrealty.com';
const CLIENT_UID = 'ca1TyBnysrORrPBU7bnlHwCoFxj1';
const CLIENT_PASSWORD = 'TestClient123!';

async function setupClient() {
  console.log('='.repeat(60));
  console.log('SETTING UP CLIENT TEST ACCOUNT');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Update password
    console.log('1. Updating client password...');
    await auth.updateUser(CLIENT_UID, {
      password: CLIENT_PASSWORD,
      emailVerified: true,
      displayName: 'Test Client',
    });
    console.log('   ✓ Password updated');
    console.log('');

    // Step 2: Ensure Firestore user profile exists with correct role
    console.log('2. Checking Firestore user profile...');
    const userRef = db.collection('users').doc(CLIENT_UID);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('   ! User profile does not exist, creating...');
      await userRef.set({
        email: CLIENT_EMAIL,
        role: 'client',
        displayName: 'Test Client',
        firstName: 'Test',
        lastName: 'Client',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('   ✓ User profile created');
    } else {
      console.log('   ✓ User profile exists');
      const userData = userDoc.data();
      console.log('   - Role:', userData.role || 'NOT SET');
      console.log('   - Display Name:', userData.displayName || 'NOT SET');

      // Update role if needed
      if (userData.role !== 'client') {
        console.log('   ! Updating role to client...');
        await userRef.update({
          role: 'client',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('   ✓ Role updated');
      }
    }

    console.log('');

    // Step 3: Success message
    console.log('='.repeat(60));
    console.log('✓ CLIENT ACCOUNT READY FOR TESTING');
    console.log('='.repeat(60));
    console.log('');
    console.log('Email:    client@assiduousrealty.com');
    console.log('Password: TestClient123!');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Open browser to: https://assiduous-prod.web.app/#login');
    console.log('2. Login with the credentials above');
    console.log('3. Verify redirect to client dashboard');
    console.log('4. Test client workflows (properties, saved searches, etc.)');
    console.log('');
  } catch (error) {
    console.error('Error setting up client account:', error);
    process.exit(1);
  }

  process.exit(0);
}

setupClient();
