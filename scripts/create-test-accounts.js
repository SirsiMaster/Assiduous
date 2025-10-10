#!/usr/bin/env node

/**
 * Create test accounts directly in Firebase
 * Run this script to populate test users for development
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// or pass the service account directly
admin.initializeApp({
  projectId: 'assiduous-dev',
  databaseURL: 'https://assiduous-dev-default-rtdb.firebaseio.com'
});

const auth = admin.auth();
const db = admin.firestore();

// Test accounts to create
const testAccounts = [
  {
    email: 'agent@sirsimaster.com',
    password: 'Test123!',
    displayName: 'Test Agent',
    role: 'agent',
    firstName: 'Test',
    lastName: 'Agent',
    agentVerificationStatus: 'approved',
    agentInfo: {
      licenseNumber: 'TEST-12345',
      brokerage: 'Sirsi Realty',
      yearsExperience: 5,
      specializations: ['Residential', 'Commercial']
    }
  },
  {
    email: 'client@sirsimaster.com',
    password: 'Test123!',
    displayName: 'Test Client',
    role: 'client',
    firstName: 'Test',
    lastName: 'Client'
  },
  {
    email: 'admin@sirsimaster.com',
    password: 'Test123!',
    displayName: 'Test Admin',
    role: 'admin',
    firstName: 'Test',
    lastName: 'Admin'
  },
  {
    email: 'investor@sirsimaster.com',
    password: 'Test123!',
    displayName: 'Test Investor',
    role: 'investor',
    firstName: 'Test',
    lastName: 'Investor'
  }
];

async function createTestAccounts() {
  console.log('🚀 Creating test accounts in Firebase...\n');
  
  for (const account of testAccounts) {
    try {
      // Check if user already exists
      let user;
      try {
        user = await auth.getUserByEmail(account.email);
        console.log(`✓ User already exists: ${account.email}`);
      } catch (error) {
        // User doesn't exist, create it
        user = await auth.createUser({
          email: account.email,
          password: account.password,
          displayName: account.displayName,
          emailVerified: true
        });
        console.log(`✅ Created auth user: ${account.email}`);
      }
      
      // Create or update Firestore profile
      const userData = {
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        displayName: account.displayName,
        role: account.role,
        isActive: true,
        profileComplete: true,
        emailVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Add role-specific data
      if (account.role === 'agent') {
        userData.agentVerificationStatus = account.agentVerificationStatus;
        userData.agentInfo = account.agentInfo;
      }
      
      await db.collection('users').doc(user.uid).set(userData, { merge: true });
      console.log(`✅ Created Firestore profile: ${account.email}`);
      
      // Create agent stats for agent accounts
      if (account.role === 'agent') {
        await db.collection('agent_stats').doc(user.uid).set({
          activeListings: 24,
          commissionYTD: 45200,
          activeClients: 18,
          newLeads: 7,
          totalSales: 12,
          averageDaysToClose: 18,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Created agent stats for: ${account.email}`);
      }
      
      console.log(`\n📧 Account ready: ${account.email} / Password: ${account.password}`);
      console.log(`   Role: ${account.role}`);
      console.log(`   UID: ${user.uid}\n`);
      
    } catch (error) {
      console.error(`❌ Error creating account ${account.email}:`, error.message);
    }
  }
  
  console.log('\n✨ Test accounts creation complete!');
  console.log('\nYou can now login with these accounts:');
  console.log('---------------------------------------');
  testAccounts.forEach(acc => {
    console.log(`${acc.role.padEnd(10)} | ${acc.email.padEnd(25)} | ${acc.password}`);
  });
  console.log('---------------------------------------');
  
  process.exit(0);
}

// Run the script
createTestAccounts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});