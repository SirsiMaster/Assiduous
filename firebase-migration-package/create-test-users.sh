#!/bin/bash

echo "🚀 Creating test accounts in Firebase Auth..."

# Create test agent account
echo "Creating agent@sirsimaster.com..."
firebase auth:import --project assiduous-dev --hash-algo=STANDARD_SCRYPT --mem-cost=1024 --rounds=1 --salt-separator=Bw== /dev/stdin <<< '{
  "users": [{
    "uid": "agent-test-001",
    "email": "agent@sirsimaster.com",
    "emailVerified": true,
    "displayName": "Test Agent",
    "passwordHash": "Test123!",
    "passwordSalt": "salt123"
  }]
}' 2>/dev/null || {
  # If import fails, try using Firebase emulator or client SDK
  echo "Note: Direct password import not supported. Users will need to be created via the web interface."
}

# Since we can't directly set passwords via CLI import, let's create a Node.js script 
# that uses the client SDK to create the accounts

cat > temp-create-accounts.js << 'SCRIPT'
const firebase = require('firebase/compat/app');
require('firebase/compat/auth');
require('firebase/compat/firestore');

// Firebase config for dev environment
const firebaseConfig = {
    apiKey: "AIzaSyDLi14oefCZVVlQm7cPfDb0WQ9nXlIF4jY",
    authDomain: "assiduous-dev.firebaseapp.com",
    projectId: "assiduous-dev",
    storageBucket: "assiduous-dev.firebasestorage.app",
    messagingSenderId: "186714044941",
    appId: "1:186714044941:web:1525a0503610519dd5f344",
    databaseURL: "https://assiduous-dev-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const testAccounts = [
  {
    email: 'agent@sirsimaster.com',
    password: 'Test123!',
    displayName: 'Test Agent',
    role: 'agent',
    firstName: 'Test',
    lastName: 'Agent',
    agentVerificationStatus: 'approved'
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
  }
];

async function createAccounts() {
  for (const account of testAccounts) {
    try {
      // Try to create the account
      const userCredential = await auth.createUserWithEmailAndPassword(
        account.email,
        account.password
      );
      
      const user = userCredential.user;
      
      // Update display name
      await user.updateProfile({
        displayName: account.displayName
      });
      
      // Create Firestore profile
      await db.collection('users').doc(user.uid).set({
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        displayName: account.displayName,
        role: account.role,
        isActive: true,
        profileComplete: true,
        emailVerified: true,
        agentVerificationStatus: account.agentVerificationStatus || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Create agent stats if agent
      if (account.role === 'agent') {
        await db.collection('agent_stats').doc(user.uid).set({
          activeListings: 24,
          commissionYTD: 45200,
          activeClients: 18,
          newLeads: 7,
          totalSales: 12,
          averageDaysToClose: 18
        });
      }
      
      console.log('✅ Created:', account.email, '/', account.password);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('✓ Already exists:', account.email);
      } else {
        console.error('❌ Error creating', account.email, ':', error.message);
      }
    }
  }
  
  console.log('\n📋 Test Accounts Summary:');
  console.log('================================');
  testAccounts.forEach(acc => {
    console.log(`${acc.role.padEnd(8)} | ${acc.email.padEnd(25)} | ${acc.password}`);
  });
  console.log('================================');
  
  process.exit(0);
}

createAccounts();
SCRIPT

# Run the Node script
echo ""
echo "Creating test accounts with passwords..."
node temp-create-accounts.js

# Clean up
rm -f temp-create-accounts.js

echo ""
echo "✨ Done! You can now login with:"
echo "  - agent@sirsimaster.com / Test123!"
echo "  - client@sirsimaster.com / Test123!"
echo "  - admin@sirsimaster.com / Test123!"