/**
 * Firestore Seed Script
 * Populates database with realistic test data for development and staging
 * 
 * Usage: node scripts/database/seed-firestore.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'assiduous-prod'
  });
}

const db = admin.firestore();

// Sample data generators
const generateProperties = (count = 50) => {
  const types = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'];
  const statuses = ['available', 'pending', 'sold'];
  const cities = ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'];
  
  return Array.from({ length: count }, (_, i) => ({
    title: `${types[Math.floor(Math.random() * types.length)]} Property ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    price: {
      list: Math.floor(Math.random() * 1000000) + 200000,
      sold: null
    },
    address: {
      street: `${Math.floor(Math.random() * 9999)} Main St`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: 'CA',
      zip: `9${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    },
    details: {
      type: types[Math.floor(Math.random() * types.length)],
      bedrooms: Math.floor(Math.random() * 5) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      sqft: Math.floor(Math.random() * 3000) + 800
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }));
};

const generateUsers = (count = 30) => {
  const roles = ['client', 'agent', 'admin'];
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  
  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const role = i === 0 ? 'admin' : (i < 5 ? 'agent' : 'client');
    
    return {
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      firstName,
      lastName,
      role,
      phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      accountId: `ACCT-2025-${String(i + 1).padStart(6, '0')}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: true,
      accountStatus: 'active'
    };
  });
};

const generateTransactions = (properties, users, count = 20) => {
  const types = ['sale', 'lease', 'flip'];
  const statuses = ['pending', 'completed', 'cancelled'];
  
  return Array.from({ length: count }, (_, i) => {
    const property = properties[Math.floor(Math.random() * properties.length)];
    const client = users.filter(u => u.role === 'client')[Math.floor(Math.random() * users.filter(u => u.role === 'client').length)];
    const agent = users.filter(u => u.role === 'agent')[0];
    
    return {
      propertyId: property.id,
      clientId: client?.id || 'unknown',
      agentId: agent?.id || 'unknown',
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      amount: property.price.list,
      commission: Math.floor(property.price.list * 0.03),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
  });
};

const generateLeads = (properties, count = 40) => {
  const types = ['inquiry', 'viewing', 'offer'];
  const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  const names = ['Alice Cooper', 'Bob Martin', 'Carol White', 'Dan Brown', 'Eve Taylor'];
  
  return Array.from({ length: count }, (_, i) => {
    const property = properties[Math.floor(Math.random() * properties.length)];
    
    return {
      propertyId: property.id,
      user: {
        name: names[Math.floor(Math.random() * names.length)],
        email: `lead${i}@example.com`,
        phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
      },
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      message: 'Interested in this property',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
  });
};

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');
  
  try {
    // Check if data already exists
    const propertiesSnapshot = await db.collection('properties').limit(1).get();
    if (!propertiesSnapshot.empty) {
      console.log('⚠️  Database already contains data.');
      console.log('   Run with --force to overwrite existing data.\n');
      
      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
      
      console.log('🗑️  Clearing existing data...\n');
      // Clear existing collections
      const collections = ['properties', 'users', 'transactions', 'leads'];
      for (const collection of collections) {
        const snapshot = await db.collection(collection).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`   Cleared ${collection}`);
      }
      console.log('');
    }
    
    // Generate data
    console.log('📝 Generating data...');
    const properties = generateProperties(50);
    const users = generateUsers(30);
    
    // Seed properties
    console.log('   Properties: 50');
    const propertyRefs = [];
    for (const property of properties) {
      const ref = await db.collection('properties').add(property);
      propertyRefs.push({ id: ref.id, ...property });
    }
    
    // Seed users
    console.log('   Users: 30 (1 admin, 4 agents, 25 clients)');
    const userRefs = [];
    for (const user of users) {
      const ref = await db.collection('users').add(user);
      userRefs.push({ id: ref.id, ...user });
    }
    
    // Seed transactions
    console.log('   Transactions: 20');
    const transactions = generateTransactions(propertyRefs, userRefs, 20);
    for (const transaction of transactions) {
      await db.collection('transactions').add(transaction);
    }
    
    // Seed leads
    console.log('   Leads: 40');
    const leads = generateLeads(propertyRefs, 40);
    for (const lead of leads) {
      await db.collection('leads').add(lead);
    }
    
    console.log('\n✅ Database seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - 50 properties (available, pending, sold)`);
    console.log(`   - 30 users (1 admin, 4 agents, 25 clients)`);
    console.log(`   - 20 transactions`);
    console.log(`   - 40 leads`);
    console.log('\n🔍 View in Firebase Console:');
    console.log(`   https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID || 'assiduous-prod'}/firestore\n`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
