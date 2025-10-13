#!/usr/bin/env node

/**
 * Test Data Population Script for AssiduousFlip
 * All test data is tagged with isTestData: true for easy removal
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with application default credentials
admin.initializeApp({
  projectId: 'assiduous-prod',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
const auth = admin.auth();

// Test data tag - ALL test data will have this field
const TEST_DATA_TAG = { isTestData: true, testRunId: `test_${Date.now()}` };

// Philadelphia neighborhoods
const neighborhoods = [
  'Center City', 'Fishtown', 'Northern Liberties', 'South Philadelphia', 
  'Fairmount', 'Manayunk', 'Chestnut Hill', 'Old City', 'Queen Village',
  'Graduate Hospital', 'Rittenhouse Square', 'Washington Square West'
];

// Street names
const streets = [
  'Market St', 'Broad St', 'Walnut St', 'Chestnut St', 'Pine St',
  'South St', 'Spring Garden St', 'Fairmount Ave', 'Girard Ave'
];

// Property images from Unsplash
const propertyImages = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  'https://images.unsplash.com/photo-1583608205317-ac51e38c5e83?w=800',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'
];

// Generate random address
function generateAddress() {
  const number = Math.floor(Math.random() * 9000) + 100;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
  
  return {
    street: `${number} ${street}`,
    city: 'Philadelphia',
    state: 'PA',
    zip: `191${Math.floor(Math.random() * 90) + 10}`,
    neighborhood: neighborhood,
    coordinates: {
      lat: 39.9526 + (Math.random() - 0.5) * 0.1,
      lng: -75.1652 + (Math.random() - 0.5) * 0.1
    }
  };
}

// Create test users
async function createTestUsers() {
  console.log('\n📝 Creating test users...');
  
  const testUsers = [
    {
      email: 'test_admin@assiduousflip.com',
      password: 'TestAdmin123!',
      displayName: 'Test Admin',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin'
    },
    {
      email: 'test_agent@assiduousflip.com',
      password: 'TestAgent123!',
      displayName: 'Test Agent',
      role: 'agent',
      firstName: 'Test',
      lastName: 'Agent',
      agentInfo: {
        licenseNumber: 'TEST-123456',
        licenseState: 'PA',
        brokerageName: 'Test Realty',
        status: 'approved'
      }
    },
    {
      email: 'test_client@assiduousflip.com',
      password: 'TestClient123!',
      displayName: 'Test Client',
      role: 'client',
      firstName: 'Test',
      lastName: 'Client'
    }
  ];

  const createdUsers = [];

  for (const userData of testUsers) {
    try {
      // Create auth user
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: true
      });

      // Create Firestore profile with test tag
      const profile = {
        ...TEST_DATA_TAG,
        uid: userRecord.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: userData.displayName,
        role: userData.role,
        phone: '(215) 555-0100',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        emailVerified: true,
        profileComplete: true
      };

      // Add role-specific data
      if (userData.agentInfo) {
        profile.agentInfo = userData.agentInfo;
      }

      await db.collection('users').doc(userRecord.uid).set(profile);
      
      console.log(`✅ Created user: ${userData.email} (Password: ${userData.password})`);
      createdUsers.push({
        email: userData.email,
        password: userData.password,
        uid: userRecord.uid,
        role: userData.role
      });

    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User already exists: ${userData.email}`);
        // Try to get existing user
        try {
          const existing = await auth.getUserByEmail(userData.email);
          createdUsers.push({
            email: userData.email,
            password: userData.password,
            uid: existing.uid,
            role: userData.role
          });
        } catch (e) {
          console.error(`❌ Could not retrieve user: ${userData.email}`);
        }
      } else {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
  }

  return createdUsers;
}

// Create test properties
async function createTestProperties(count = 20) {
  console.log(`\n🏠 Creating ${count} test properties...`);
  
  const batch = db.batch();
  const propertyIds = [];
  
  for (let i = 0; i < count; i++) {
    const docRef = db.collection('properties').doc();
    propertyIds.push(docRef.id);
    
    const propertyType = ['Single Family', 'Condo', 'Townhouse'][Math.floor(Math.random() * 3)];
    const basePrice = Math.floor(Math.random() * 200000) + 100000;
    const address = generateAddress();
    
    // Property details
    const bedrooms = Math.floor(Math.random() * 3) + 2;
    const bathrooms = Math.floor(Math.random() * 2) + 1;
    const sqft = Math.floor(Math.random() * 1500) + 1000;
    
    // Flip analysis
    const rehabCost = Math.floor(Math.random() * 30000) + 15000;
    const totalInvestment = basePrice + rehabCost;
    const arv = totalInvestment * (1.2 + Math.random() * 0.2);
    const profit = arv - totalInvestment;
    const roi = (profit / totalInvestment) * 100;
    
    const property = {
      ...TEST_DATA_TAG,
      title: `TEST: ${bedrooms}BR ${propertyType} in ${address.neighborhood}`,
      description: `TEST PROPERTY - ${propertyType} with ${bedrooms} bedrooms and ${bathrooms} bathrooms. Great flip potential with ${roi.toFixed(1)}% ROI.`,
      
      address: address,
      
      details: {
        type: propertyType,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        sqft: sqft,
        yearBuilt: 1950 + Math.floor(Math.random() * 50),
        parking: 'Street',
        heating: 'Gas',
        cooling: 'Central AC'
      },
      
      price: {
        list: basePrice,
        original: basePrice,
        pricePerSqft: Math.floor(basePrice / sqft)
      },
      
      flipAnalysis: {
        purchasePrice: basePrice,
        rehabCost: rehabCost,
        holdingCosts: Math.floor(rehabCost * 0.1),
        totalInvestment: totalInvestment,
        arv: Math.floor(arv),
        estimatedProfit: Math.floor(profit),
        roi: Math.round(roi * 10) / 10,
        timeline: '3-4 months',
        riskLevel: roi > 20 ? 'Low' : roi > 15 ? 'Medium' : 'High'
      },
      
      status: i < 15 ? 'available' : 'pending',
      featured: i < 5,
      
      images: {
        main: propertyImages[i % propertyImages.length],
        interior: []
      },
      
      agent: {
        id: 'test_agent_' + (i % 3),
        name: 'Test Agent ' + (i % 3),
        phone: '(215) 555-0' + (100 + (i % 3)),
        email: `test_agent${i % 3}@assiduousflip.com`
      },
      
      metrics: {
        views: Math.floor(Math.random() * 200),
        favorites: Math.floor(Math.random() * 20),
        inquiries: Math.floor(Math.random() * 10)
      },
      
      tags: ['TEST', address.neighborhood, propertyType],
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(docRef, property);
  }
  
  await batch.commit();
  console.log(`✅ Created ${count} test properties`);
  return propertyIds;
}

// Create test leads
async function createTestLeads(count = 10, propertyIds = []) {
  console.log(`\n📧 Creating ${count} test leads...`);
  
  const batch = db.batch();
  
  for (let i = 0; i < count; i++) {
    const docRef = db.collection('leads').doc();
    
    const lead = {
      ...TEST_DATA_TAG,
      propertyId: propertyIds[i % propertyIds.length] || 'unknown',
      user: {
        name: `Test Lead ${i + 1}`,
        email: `test_lead_${i + 1}@example.com`,
        phone: `(215) 555-${String(1000 + i).padStart(4, '0')}`
      },
      message: 'TEST LEAD - Interested in this property. Please contact me for more information.',
      type: ['inquiry', 'showing_request', 'offer'][i % 3],
      status: 'new',
      source: 'website',
      assignedAgent: i % 2 === 0 ? 'test_agent_1' : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(docRef, lead);
  }
  
  await batch.commit();
  console.log(`✅ Created ${count} test leads`);
}

// Create test transactions
async function createTestTransactions(count = 5, propertyIds = []) {
  console.log(`\n💼 Creating ${count} test transactions...`);
  
  const batch = db.batch();
  
  for (let i = 0; i < count; i++) {
    const docRef = db.collection('transactions').doc();
    
    const purchasePrice = 150000 + (i * 50000);
    
    const transaction = {
      ...TEST_DATA_TAG,
      propertyId: propertyIds[i % propertyIds.length] || 'unknown',
      buyerId: `test_client_${i}`,
      sellerId: `test_seller_${i}`,
      agentId: `test_agent_${i % 2}`,
      
      type: 'purchase',
      status: ['pending', 'under_contract', 'closed'][i % 3],
      
      financial: {
        purchasePrice: purchasePrice,
        downPayment: purchasePrice * 0.2,
        loanAmount: purchasePrice * 0.8,
        closingCosts: purchasePrice * 0.03,
        commission: purchasePrice * 0.06
      },
      
      dates: {
        offerDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        acceptanceDate: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000),
        closingDate: new Date(Date.now() + (30 + i) * 24 * 60 * 60 * 1000)
      },
      
      notes: 'TEST TRANSACTION - This is test data',
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(docRef, transaction);
  }
  
  await batch.commit();
  console.log(`✅ Created ${count} test transactions`);
}

// Remove all test data
async function removeTestData() {
  console.log('\n🗑️  Removing all test data...');
  
  const collections = ['properties', 'users', 'leads', 'transactions'];
  
  for (const collectionName of collections) {
    console.log(`Cleaning ${collectionName}...`);
    
    const snapshot = await db.collection(collectionName)
      .where('isTestData', '==', true)
      .get();
    
    if (snapshot.empty) {
      console.log(`No test data found in ${collectionName}`);
      continue;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    console.log(`✅ Removed ${count} test documents from ${collectionName}`);
  }
  
  // Remove test users from Auth
  console.log('\nRemoving test auth users...');
  const testEmails = [
    'test_admin@assiduousflip.com',
    'test_agent@assiduousflip.com',
    'test_client@assiduousflip.com'
  ];
  
  for (const email of testEmails) {
    try {
      const user = await auth.getUserByEmail(email);
      await auth.deleteUser(user.uid);
      console.log(`✅ Removed auth user: ${email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`User not found: ${email}`);
      } else {
        console.error(`Error removing user ${email}:`, error.message);
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🚀 AssiduousFlip Test Data Manager');
  console.log('===================================');
  
  try {
    if (command === 'remove' || command === 'clean') {
      await removeTestData();
      console.log('\n✅ All test data removed successfully!');
      
    } else if (command === 'populate' || !command) {
      console.log('Creating test data (tagged for easy removal)...\n');
      
      // Create test data
      const users = await createTestUsers();
      const propertyIds = await createTestProperties(20);
      await createTestLeads(10, propertyIds);
      await createTestTransactions(5, propertyIds);
      
      console.log('\n' + '='.repeat(50));
      console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
      console.log('='.repeat(50));
      console.log('\n📋 Test Credentials:');
      console.log('-------------------');
      users.forEach(user => {
        console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
      });
      console.log('\n📊 Summary:');
      console.log('-----------');
      console.log('• 3 test users (admin, agent, client)');
      console.log('• 20 test properties in Philadelphia');
      console.log('• 10 test leads');
      console.log('• 5 test transactions');
      console.log('\n🏷️  All data is tagged with isTestData: true');
      console.log('💡 To remove all test data, run: node populate-test-data.js remove');
      
    } else {
      console.log('Usage:');
      console.log('  node populate-test-data.js           - Create test data');
      console.log('  node populate-test-data.js populate  - Create test data');
      console.log('  node populate-test-data.js remove    - Remove all test data');
      console.log('  node populate-test-data.js clean     - Remove all test data');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();