#!/usr/bin/env node

/**
 * Setup script to create/verify agent user profile in Firestore
 * This ensures agent@assiduousrealty.com can properly authenticate and use the system
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with environment credentials
// The Firebase CLI should have set these up automatically
try {
  admin.initializeApp({
    projectId: 'assiduous-prod'
  });
} catch (e) {
  console.error('Failed to initialize Firebase Admin:', e.message);
  console.log('\nMake sure you are logged in to Firebase:');
  console.log('  firebase login');
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const AGENT_EMAIL = 'agent@assiduousrealty.com';
const AGENT_UID = 'Z6hg8czNPIMvBHInG3ITzrOoTHB2';
const AGENT_PASSWORD = 'TestAgent123!';

async function setupAgent() {
  console.log('='.repeat(60));
  console.log('SETTING UP AGENT TEST ACCOUNT');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Update password
    console.log('1. Updating agent password...');
    await auth.updateUser(AGENT_UID, {
      password: AGENT_PASSWORD,
      emailVerified: true,
      displayName: 'Test Agent'
    });
    console.log('   ✓ Password updated');
    console.log('');

    // Step 2: Check if Firestore user profile exists
    console.log('2. Checking Firestore user profile...');
    const userRef = db.collection('users').doc(AGENT_UID);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('   ! User profile does not exist, creating...');
      await userRef.set({
        email: AGENT_EMAIL,
        role: 'agent',
        displayName: 'Test Agent',
        firstName: 'Test',
        lastName: 'Agent',
        phone: '+1234567890',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('   ✓ User profile created');
    } else {
      console.log('   ✓ User profile exists');
      const userData = userDoc.data();
      console.log('   - Role:', userData.role || 'NOT SET');
      console.log('   - Display Name:', userData.displayName || 'NOT SET');
      
      // Update role if needed
      if (userData.role !== 'agent') {
        console.log('   ! Updating role to agent...');
        await userRef.update({
          role: 'agent',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('   ✓ Role updated');
      }
    }
    console.log('');

    // Step 3: Success message
    console.log('='.repeat(60));
    console.log('✓ AGENT ACCOUNT READY FOR TESTING');
    console.log('='.repeat(60));
    console.log('');
    console.log('Email:    agent@assiduousrealty.com');
    console.log('Password: TestAgent123!');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('1. Open browser to: https://assiduous-prod.web.app/auth/login.html');
    console.log('2. Login with the credentials above');
    console.log('3. Navigate to: https://assiduous-prod.web.app/agent/clients.html');
    console.log('4. Test CRUD operations:');
    console.log('   - Click "Add Client"');
    console.log('   - Fill in form');
    console.log('   - Click "Save Client"');
    console.log('   - Verify client appears in table');
    console.log('   - Test Edit and Delete');
    console.log('');

  } catch (error) {
    console.error('Error setting up agent:', error);
    process.exit(1);
  }

  process.exit(0);
}

setupAgent();
