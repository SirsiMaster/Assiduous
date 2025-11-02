/**
 * Data Population Script for AssiduousFlip MVP
 * Creates sample properties, users, and transactions for Philadelphia market
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
const serviceAccount = {
  "type": "service_account",
  "project_id": "assiduous-prod"
};

// Initialize admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'assiduous-prod'
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Philadelphia neighborhoods
const neighborhoods = [
  'Center City', 'Fishtown', 'Northern Liberties', 'South Philadelphia', 
  'Fairmount', 'Manayunk', 'Chestnut Hill', 'Old City', 'Queen Village',
  'Graduate Hospital', 'Rittenhouse Square', 'Washington Square West',
  'Bella Vista', 'Passyunk Square', 'East Falls', 'Roxborough',
  'Mt. Airy', 'Germantown', 'Kensington', 'Port Richmond'
];

// Street names in Philadelphia
const streets = [
  'Market St', 'Broad St', 'Walnut St', 'Chestnut St', 'Pine St',
  'South St', 'Spring Garden St', 'Fairmount Ave', 'Girard Ave',
  'Passyunk Ave', 'Ridge Ave', 'Main St', 'Lancaster Ave',
  'Baltimore Ave', 'Frankford Ave', 'Germantown Ave', 'Cheltenham Ave'
];

// Property types for micro-flipping
const propertyTypes = [
  { type: 'Single Family', weight: 40 },
  { type: 'Condo', weight: 25 },
  { type: 'Townhouse', weight: 20 },
  { type: 'Multi-Family', weight: 10 },
  { type: 'Land', weight: 5 }
];

// Generate random Philadelphia address
function generateAddress() {
  const number = Math.floor(Math.random() * 9000) + 100;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
  const zipCodes = ['19103', '19104', '19106', '19107', '19123', '19125', '19130', '19146', '19147', '19148'];
  const zip = zipCodes[Math.floor(Math.random() * zipCodes.length)];
  
  return {
    street: `${number} ${street}`,
    city: 'Philadelphia',
    state: 'PA',
    zip: zip,
    neighborhood: neighborhood,
    coordinates: {
      lat: 39.9526 + (Math.random() - 0.5) * 0.1,
      lng: -75.1652 + (Math.random() - 0.5) * 0.1
    }
  };
}

// Generate property details
function generatePropertyDetails(type) {
  const bedrooms = type === 'Land' ? 0 : Math.floor(Math.random() * 4) + 1;
  const bathrooms = type === 'Land' ? 0 : Math.floor(Math.random() * 3) + 1;
  const sqft = type === 'Land' ? 0 : Math.floor(Math.random() * 2500) + 800;
  const lotSize = Math.floor(Math.random() * 8000) + 2000;
  const yearBuilt = type === 'Land' ? null : Math.floor(Math.random() * 50) + 1950;
  
  return {
    type: type,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    sqft: sqft,
    lotSize: lotSize,
    yearBuilt: yearBuilt,
    parking: Math.random() > 0.5 ? 'Garage' : 'Street',
    heating: 'Gas',
    cooling: 'Central AC',
    basement: Math.random() > 0.5,
    garage: Math.random() > 0.3
  };
}

// Generate micro-flip analysis
function generateFlipAnalysis(purchasePrice) {
  const rehab = Math.floor(Math.random() * 30000) + 10000;
  const holdingCosts = Math.floor(rehab * 0.15);
  const totalInvestment = purchasePrice + rehab + holdingCosts;
  const arv = totalInvestment * (1.15 + Math.random() * 0.25); // 15-40% profit margin
  const profit = arv - totalInvestment;
  const roi = (profit / totalInvestment) * 100;
  
  return {
    purchasePrice: purchasePrice,
    rehabCost: rehab,
    holdingCosts: holdingCosts,
    totalInvestment: totalInvestment,
    arv: Math.floor(arv),
    estimatedProfit: Math.floor(profit),
    roi: Math.round(roi * 10) / 10,
    timeline: Math.floor(Math.random() * 4) + 2 + ' months',
    riskLevel: roi > 20 ? 'Low' : roi > 15 ? 'Medium' : 'High'
  };
}

// Generate property images (using placeholder service)
function generateImages(propertyType) {
  const baseUrl = 'https://images.unsplash.com/photo-';
  const houseImages = [
    '1564013799919-ab600027ffc6?w=800&h=600&fit=crop', // Modern house
    '1583608205317-6ec9c6c68b4b?w=800&h=600&fit=crop', // Traditional house
    '1572120360610-bcfd7fc4e8e8?w=800&h=600&fit=crop', // Suburban house
    '1568605114967-8c0b544245a8?w=800&h=600&fit=crop', // Brick house
    '1598228723793-5beb5d1a98b0?w=800&h=600&fit=crop'  // White house
  ];
  
  const interiorImages = [
    '1560448204-e2d1c3ca2e?w=800&h=600&fit=crop',   // Living room
    '1556912173-4c6c0e5f2e?w=800&h=600&fit=crop',   // Kitchen
    '1540518614846-451e0f4c5f?w=800&h=600&fit=crop', // Bedroom
    '1552321554-5c2f66f1b?w=800&h=600&fit=crop',    // Bathroom
  ];
  
  return {
    main: baseUrl + houseImages[Math.floor(Math.random() * houseImages.length)],
    interior: interiorImages.map(img => baseUrl + img)
  };
}

// Create sample properties
async function createProperties(count = 50) {
  console.log(`Creating ${count} sample properties...`);
  const properties = [];
  
  for (let i = 0; i < count; i++) {
    // Select property type based on weights
    const rand = Math.random() * 100;
    let cumWeight = 0;
    let selectedType = 'Single Family';
    
    for (const pt of propertyTypes) {
      cumWeight += pt.weight;
      if (rand <= cumWeight) {
        selectedType = pt.type;
        break;
      }
    }
    
    const basePrice = Math.floor(Math.random() * 300000) + 50000;
    const address = generateAddress();
    const details = generatePropertyDetails(selectedType);
    const flipAnalysis = generateFlipAnalysis(basePrice);
    const images = generateImages(selectedType);
    
    const property = {
      title: `${details.bedrooms}BR ${selectedType} in ${address.neighborhood}`,
      description: `Great investment opportunity! This ${selectedType.toLowerCase()} in ${address.neighborhood} offers excellent flip potential with ${flipAnalysis.roi}% projected ROI. ${details.sqft} sqft, ${details.bedrooms} bedrooms, ${details.bathrooms} bathrooms. Perfect for micro-flipping with estimated ${flipAnalysis.timeline} turnaround.`,
      
      address: address,
      details: details,
      
      price: {
        list: basePrice,
        original: basePrice,
        pricePerSqft: details.sqft ? Math.floor(basePrice / details.sqft) : null
      },
      
      flipAnalysis: flipAnalysis,
      
      status: Math.random() > 0.2 ? 'available' : Math.random() > 0.5 ? 'pending' : 'sold',
      featured: Math.random() > 0.8,
      
      images: images,
      
      agent: {
        id: `agent_${Math.floor(Math.random() * 10) + 1}`,
        name: `Agent ${Math.floor(Math.random() * 10) + 1}`,
        phone: '(215) 555-' + String(Math.floor(Math.random() * 9000) + 1000),
        email: `agent${Math.floor(Math.random() * 10) + 1}@assiduousflip.com`
      },
      
      metrics: {
        views: Math.floor(Math.random() * 500),
        favorites: Math.floor(Math.random() * 50),
        inquiries: Math.floor(Math.random() * 20)
      },
      
      tags: [
        address.neighborhood,
        selectedType,
        flipAnalysis.riskLevel + ' Risk',
        details.bedrooms + ' Bedrooms'
      ],
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    properties.push(property);
  }
  
  // Batch write properties
  const batch = db.batch();
  properties.forEach(property => {
    const docRef = db.collection('properties').doc();
    batch.set(docRef, property);
  });
  
  await batch.commit();
  console.log(`✅ Created ${count} properties`);
  return properties;
}

// Create sample users
async function createUsers() {
  console.log('Creating sample users...');
  
  const users = [
    // Admin
    {
      email: 'admin@assiduousflip.com',
      password: 'Admin123!@#',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '(215) 555-0001'
    },
    // Agents
    {
      email: 'agent1@assiduousflip.com',
      password: 'Agent123!@#',
      role: 'agent',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(215) 555-0002',
      agentInfo: {
        licenseNumber: 'PA-RS-123456',
        licenseState: 'PA',
        brokerageName: 'AssiduousFlip Realty',
        status: 'approved'
      }
    },
    {
      email: 'agent2@assiduousflip.com',
      password: 'Agent123!@#',
      role: 'agent',
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '(215) 555-0003',
      agentInfo: {
        licenseNumber: 'PA-RS-234567',
        licenseState: 'PA',
        brokerageName: 'AssiduousFlip Realty',
        status: 'approved'
      }
    },
    // Clients
    {
      email: 'client1@example.com',
      password: 'Client123!@#',
      role: 'client',
      firstName: 'John',
      lastName: 'Doe',
      phone: '(215) 555-0010'
    },
    {
      email: 'client2@example.com',
      password: 'Client123!@#',
      role: 'client',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '(215) 555-0011'
    },
    // Investors
    {
      email: 'investor1@example.com',
      password: 'Investor123!@#',
      role: 'investor',
      firstName: 'Robert',
      lastName: 'Williams',
      phone: '(215) 555-0020'
    }
  ];
  
  for (const userData of users) {
    try {
      // Create auth user
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: `${userData.firstName} ${userData.lastName}`,
        emailVerified: true
      });
      
      // Create Firestore profile
      const profile = {
        uid: userRecord.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
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
      console.log(`✅ Created user: ${userData.email}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ User already exists: ${userData.email}`);
      } else {
        console.error(`❌ Error creating user ${userData.email}:`, error);
      }
    }
  }
}

// Create sample leads
async function createLeads(count = 20) {
  console.log(`Creating ${count} sample leads...`);
  const leads = [];
  
  const leadTypes = ['inquiry', 'showing_request', 'offer', 'contact'];
  const leadStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  
  for (let i = 0; i < count; i++) {
    const lead = {
      propertyId: `property_${Math.floor(Math.random() * 50) + 1}`,
      user: {
        name: `Lead ${i + 1}`,
        email: `lead${i + 1}@example.com`,
        phone: `(215) 555-${String(Math.floor(Math.random() * 9000) + 1000)}`
      },
      message: `I'm interested in this property. ${Math.random() > 0.5 ? 'Can we schedule a showing?' : 'Please send more information.'}`,
      type: leadTypes[Math.floor(Math.random() * leadTypes.length)],
      status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)],
      source: Math.random() > 0.5 ? 'website' : 'referral',
      assignedAgent: Math.random() > 0.3 ? `agent_${Math.floor(Math.random() * 2) + 1}` : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    leads.push(lead);
  }
  
  // Batch write leads
  const batch = db.batch();
  leads.forEach(lead => {
    const docRef = db.collection('leads').doc();
    batch.set(docRef, lead);
  });
  
  await batch.commit();
  console.log(`✅ Created ${count} leads`);
}

// Create sample transactions
async function createTransactions(count = 15) {
  console.log(`Creating ${count} sample transactions...`);
  const transactions = [];
  
  const statuses = ['pending', 'under_contract', 'closed', 'cancelled'];
  
  for (let i = 0; i < count; i++) {
    const purchasePrice = Math.floor(Math.random() * 300000) + 100000;
    const transaction = {
      propertyId: `property_${Math.floor(Math.random() * 50) + 1}`,
      buyerId: `client_${Math.floor(Math.random() * 5) + 1}`,
      agentId: `agent_${Math.floor(Math.random() * 2) + 1}`,
      
      type: 'purchase',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      
      financial: {
        purchasePrice: purchasePrice,
        downPayment: purchasePrice * 0.2,
        loanAmount: purchasePrice * 0.8,
        closingCosts: purchasePrice * 0.03,
        commission: purchasePrice * 0.06
      },
      
      dates: {
        offerDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        acceptanceDate: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000),
        closingDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
      },
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    transactions.push(transaction);
  }
  
  // Batch write transactions
  const batch = db.batch();
  transactions.forEach(transaction => {
    const docRef = db.collection('transactions').doc();
    batch.set(docRef, transaction);
  });
  
  await batch.commit();
  console.log(`✅ Created ${count} transactions`);
}

// Main execution function
async function populateData() {
  console.log('🚀 Starting data population for AssiduousFlip MVP...\n');
  
  try {
    // Create collections in order
    await createUsers();
    console.log('');
    
    await createProperties(50);
    console.log('');
    
    await createLeads(20);
    console.log('');
    
    await createTransactions(15);
    console.log('');
    
    console.log('✅ Data population complete!');
    console.log('\n📊 Summary:');
    console.log('- 6 test users created (admin, 2 agents, 2 clients, 1 investor)');
    console.log('- 50 Philadelphia properties with flip analysis');
    console.log('- 20 sample leads');
    console.log('- 15 sample transactions');
    console.log('\n🔑 Test Credentials:');
    console.log('Admin: admin@assiduousflip.com / Admin123!@#');
    console.log('Agent: agent1@assiduousflip.com / Agent123!@#');
    console.log('Client: client1@example.com / Client123!@#');
    console.log('Investor: investor1@example.com / Investor123!@#');
    
  } catch (error) {
    console.error('❌ Error populating data:', error);
  }
  
  process.exit(0);
}

// Run the script
populateData();