#!/usr/bin/env node

/**
 * Firestore Production Data Seeding Script
 * 
 * Seeds realistic data across all Firestore collections for testing and development.
 * 
 * Usage:
 *   node scripts/seed_firestore_production.js [--dry-run] [--collection=users]
 * 
 * Options:
 *   --dry-run        Print what would be seeded without writing to Firebase
 *   --collection=X   Only seed specific collection
 *   --clear          Clear existing data before seeding (DANGEROUS)
 */

const admin = require('firebase-admin');
const { faker } = require('@faker-js/faker');

// Parse command line args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldClear = args.includes('--clear');
const collectionFilter = args.find(arg => arg.startsWith('--collection='))?.split('=')[1];

// Initialize Firebase Admin
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

const db = admin.firestore();

// Helper functions
function generateId(prefix = 'doc') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Seeding data generators
const DataGenerators = {
  
  /**
   * Seed users collection (clients and agents)
   */
  async users() {
    const users = [];
    
    // Create 20 client users
    for (let i = 0; i < 20; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      
      users.push({
        uid: generateId('user'),
        email,
        role: 'client',
        profile: {
          firstName,
          lastName,
          phone: faker.phone.number(),
          avatar: faker.image.avatar(),
          bio: faker.person.bio(),
          preferences: {
            propertyTypes: randomElement([
              ['house', 'condo'],
              ['condo', 'townhouse'],
              ['house'],
              ['multi-family']
            ]),
            priceRange: {
              min: faker.number.int({ min: 100000, max: 300000 }),
              max: faker.number.int({ min: 400000, max: 800000 })
            },
            locations: [faker.location.city(), faker.location.city()],
            bedrooms: { min: 2, max: 4 },
            bathrooms: { min: 2, max: 3 }
          }
        },
        status: randomElement(['active', 'active', 'active', 'inactive']),
        createdAt: admin.firestore.Timestamp.fromDate(randomDate(new Date(2024, 0, 1), new Date())),
        lastLogin: admin.firestore.Timestamp.fromDate(randomDate(new Date(2025, 0, 1), new Date())),
        emailVerified: true,
        onboardingComplete: true
      });
    }
    
    // Create 10 agent users
    for (let i = 0; i < 10; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      
      users.push({
        uid: generateId('agent'),
        email,
        role: 'agent',
        profile: {
          firstName,
          lastName,
          phone: faker.phone.number(),
          avatar: faker.image.avatar(),
          bio: faker.person.bio(),
          licenseNumber: `LIC-${faker.number.int({ min: 100000, max: 999999 })}`,
          specializations: randomElement([
            ['residential', 'buyer'],
            ['commercial', 'seller'],
            ['luxury', 'investment'],
            ['residential', 'seller', 'buyer']
          ]),
          yearsExperience: faker.number.int({ min: 2, max: 20 }),
          certifications: ['NAR', 'CRS'],
          languages: ['English', randomElement(['Spanish', 'Mandarin', 'French'])]
        },
        stats: {
          totalSales: faker.number.int({ min: 10, max: 150 }),
          totalVolume: faker.number.int({ min: 2000000, max: 50000000 }),
          activeListings: faker.number.int({ min: 3, max: 25 }),
          avgRating: faker.number.float({ min: 4.0, max: 5.0, precision: 0.1 }),
          reviewCount: faker.number.int({ min: 10, max: 100 })
        },
        status: randomElement(['active', 'active', 'active', 'inactive']),
        createdAt: admin.firestore.Timestamp.fromDate(randomDate(new Date(2023, 0, 1), new Date())),
        lastLogin: admin.firestore.Timestamp.fromDate(randomDate(new Date(2025, 0, 1), new Date())),
        emailVerified: true,
        profileComplete: true
      });
    }
    
    // Create 3 admin users
    for (let i = 0; i < 3; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = `admin${i + 1}@assiduous.com`;
      
      users.push({
        uid: generateId('admin'),
        email,
        role: 'admin',
        profile: {
          firstName,
          lastName,
          phone: faker.phone.number(),
          avatar: faker.image.avatar(),
          title: randomElement(['System Administrator', 'Operations Manager', 'Tech Lead'])
        },
        permissions: ['read', 'write', 'delete', 'manage_users', 'manage_properties', 'view_analytics'],
        status: 'active',
        createdAt: admin.firestore.Timestamp.fromDate(randomDate(new Date(2023, 0, 1), new Date())),
        lastLogin: admin.firestore.Timestamp.fromDate(randomDate(new Date(2025, 0, 1), new Date())),
        emailVerified: true
      });
    }
    
    return users;
  },
  
  /**
   * Seed properties collection
   */
  async properties() {
    const properties = [];
    const propertyTypes = ['house', 'condo', 'townhouse', 'multi-family', 'land'];
    const statuses = ['available', 'pending', 'sold', 'under-contract'];
    const cities = ['San Francisco', 'Los Angeles', 'San Diego', 'Oakland', 'San Jose'];
    
    for (let i = 0; i < 100; i++) {
      const price = faker.number.int({ min: 200000, max: 2000000 });
      const bedrooms = faker.number.int({ min: 1, max: 6 });
      const bathrooms = faker.number.int({ min: 1, max: 4 });
      const sqft = faker.number.int({ min: 800, max: 5000 });
      const city = randomElement(cities);
      
      properties.push({
        propertyId: generateId('prop'),
        title: `${bedrooms} Bed ${bathrooms} Bath ${randomElement(propertyTypes)} in ${city}`,
        type: randomElement(propertyTypes),
        status: randomElement(statuses),
        price: {
          amount: price,
          currency: 'USD',
          pricePerSqft: Math.round(price / sqft)
        },
        address: {
          street: faker.location.streetAddress(),
          city,
          state: 'CA',
          zip: faker.location.zipCode(),
          country: 'USA',
          coordinates: {
            lat: faker.location.latitude({ min: 32, max: 38 }),
            lng: faker.location.longitude({ min: -122, max: -117 })
          }
        },
        details: {
          bedrooms,
          bathrooms,
          sqft,
          lotSize: faker.number.int({ min: 2000, max: 10000 }),
          yearBuilt: faker.number.int({ min: 1950, max: 2024 }),
          stories: faker.number.int({ min: 1, max: 3 }),
          garage: faker.number.int({ min: 0, max: 3 }),
          propertyTax: faker.number.int({ min: 3000, max: 15000 }),
          hoaFees: faker.number.int({ min: 0, max: 500 })
        },
        features: faker.helpers.arrayElements([
          'pool', 'spa', 'fireplace', 'hardwood-floors', 'granite-counters',
          'stainless-appliances', 'walk-in-closet', 'central-ac', 'solar-panels',
          'smart-home', 'updated-kitchen', 'new-roof', 'security-system'
        ], faker.number.int({ min: 3, max: 8 })),
        description: faker.lorem.paragraphs(3),
        images: Array.from({ length: faker.number.int({ min: 5, max: 15 }) }, () => ({
          url: faker.image.urlLoremFlickr({ category: 'house' }),
          caption: faker.lorem.sentence(),
          isPrimary: false
        })),
        agent: {
          agentId: generateId('agent'),
          name: faker.person.fullName(),
          phone: faker.phone.number(),
          email: faker.internet.email()
        },
        views: faker.number.int({ min: 10, max: 500 }),
        saves: faker.number.int({ min: 2, max: 50 }),
        daysOnMarket: faker.number.int({ min: 1, max: 120 }),
        listedAt: admin.firestore.Timestamp.fromDate(randomDate(new Date(2024, 6, 1), new Date())),
        updatedAt: admin.firestore.Timestamp.fromDate(randomDate(new Date(2024, 10, 1), new Date())),
        microFlipScore: {
          profitPotential: faker.number.int({ min: 60, max: 98 }),
          roi: faker.number.float({ min: 8, max: 25, precision: 0.1 }),
          riskLevel: randomElement(['low', 'medium', 'high']),
          estimatedProfit: faker.number.int({ min: 10000, max: 100000 }),
          timeToClose: faker.number.int({ min: 30, max: 90 })
        }
      });
    }
    
    return properties;
  },
  
  /**
   * Seed transactions collection
   */
  async transactions() {
    const transactions = [];
    const statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    const types = ['purchase', 'sale', 'micro-flip'];
    
    for (let i = 0; i < 50; i++) {
      const amount = faker.number.int({ min: 200000, max: 2000000 });
      const transactionType = randomElement(types);
      const status = randomElement(statuses);
      const createdDate = randomDate(new Date(2024, 0, 1), new Date());
      
      transactions.push({
        transactionId: generateId('txn'),
        type: transactionType,
        status,
        property: {
          propertyId: generateId('prop'),
          address: faker.location.streetAddress(),
          city: randomElement(['San Francisco', 'Los Angeles', 'San Diego'])
        },
        buyer: status !== 'sale' ? {
          userId: generateId('user'),
          name: faker.person.fullName(),
          email: faker.internet.email()
        } : null,
        seller: status !== 'purchase' ? {
          userId: generateId('user'),
          name: faker.person.fullName(),
          email: faker.internet.email()
        } : null,
        agent: {
          agentId: generateId('agent'),
          name: faker.person.fullName(),
          commission: faker.number.float({ min: 2.5, max: 6.0, precision: 0.1 })
        },
        financial: {
          purchasePrice: amount,
          downPayment: Math.round(amount * 0.2),
          loanAmount: Math.round(amount * 0.8),
          closingCosts: faker.number.int({ min: 5000, max: 20000 }),
          earnestMoney: Math.round(amount * 0.01),
          ...(transactionType === 'micro-flip' && {
            rehabCost: faker.number.int({ min: 10000, max: 50000 }),
            estimatedARV: Math.round(amount * 1.15),
            projectedProfit: faker.number.int({ min: 10000, max: 80000 })
          })
        },
        timeline: {
          created: admin.firestore.Timestamp.fromDate(createdDate),
          offerAccepted: status !== 'pending' ? admin.firestore.Timestamp.fromDate(
            new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          ) : null,
          inspection: status === 'in-progress' || status === 'completed' ? admin.firestore.Timestamp.fromDate(
            new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000)
          ) : null,
          appraisal: status === 'in-progress' || status === 'completed' ? admin.firestore.Timestamp.fromDate(
            new Date(createdDate.getTime() + 21 * 24 * 60 * 60 * 1000)
          ) : null,
          closing: status === 'completed' ? admin.firestore.Timestamp.fromDate(
            new Date(createdDate.getTime() + 45 * 24 * 60 * 60 * 1000)
          ) : admin.firestore.Timestamp.fromDate(
            new Date(createdDate.getTime() + faker.number.int({ min: 30, max: 60 }) * 24 * 60 * 60 * 1000)
          )
        },
        documents: faker.helpers.arrayElements([
          { name: 'Purchase Agreement', status: 'signed', uploadedAt: admin.firestore.Timestamp.fromDate(createdDate) },
          { name: 'Inspection Report', status: 'pending', uploadedAt: null },
          { name: 'Appraisal Report', status: 'in-review', uploadedAt: admin.firestore.Timestamp.fromDate(new Date()) },
          { name: 'Title Report', status: 'signed', uploadedAt: admin.firestore.Timestamp.fromDate(createdDate) }
        ], faker.number.int({ min: 2, max: 4 })),
        notes: faker.lorem.sentences(2),
        createdAt: admin.firestore.Timestamp.fromDate(createdDate),
        updatedAt: admin.firestore.Timestamp.fromDate(randomDate(createdDate, new Date()))
      });
    }
    
    return transactions;
  },
  
  /**
   * Seed messages collection
   */
  async messages() {
    const messages = [];
    const types = ['inquiry', 'offer', 'update', 'document-request', 'general'];
    
    for (let i = 0; i < 150; i++) {
      const sentDate = randomDate(new Date(2024, 0, 1), new Date());
      
      messages.push({
        messageId: generateId('msg'),
        type: randomElement(types),
        subject: faker.lorem.sentence(),
        body: faker.lorem.paragraphs(2),
        from: {
          userId: generateId('user'),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          role: randomElement(['client', 'agent'])
        },
        to: {
          userId: generateId('user'),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          role: randomElement(['client', 'agent', 'admin'])
        },
        propertyId: Math.random() > 0.3 ? generateId('prop') : null,
        transactionId: Math.random() > 0.5 ? generateId('txn') : null,
        status: randomElement(['unread', 'read', 'archived']),
        priority: randomElement(['low', 'normal', 'high']),
        attachments: Math.random() > 0.7 ? [
          {
            name: faker.system.fileName(),
            url: faker.internet.url(),
            size: faker.number.int({ min: 1000, max: 5000000 }),
            type: faker.system.mimeType()
          }
        ] : [],
        sentAt: admin.firestore.Timestamp.fromDate(sentDate),
        readAt: Math.random() > 0.3 ? admin.firestore.Timestamp.fromDate(
          new Date(sentDate.getTime() + faker.number.int({ min: 1, max: 72 }) * 60 * 60 * 1000)
        ) : null
      });
    }
    
    return messages;
  },
  
  /**
   * Seed notifications collection
   */
  async notifications() {
    const notifications = [];
    const types = ['new-property', 'price-change', 'offer-status', 'document-uploaded', 'message-received', 'appointment-reminder'];
    
    for (let i = 0; i < 100; i++) {
      const createdDate = randomDate(new Date(2024, 6, 1), new Date());
      
      notifications.push({
        notificationId: generateId('notif'),
        userId: generateId('user'),
        type: randomElement(types),
        title: faker.lorem.sentence(),
        message: faker.lorem.sentences(2),
        data: {
          propertyId: Math.random() > 0.5 ? generateId('prop') : null,
          transactionId: Math.random() > 0.6 ? generateId('txn') : null,
          messageId: Math.random() > 0.7 ? generateId('msg') : null
        },
        read: Math.random() > 0.4,
        dismissed: Math.random() > 0.7,
        priority: randomElement(['low', 'normal', 'high', 'urgent']),
        actionUrl: faker.internet.url(),
        createdAt: admin.firestore.Timestamp.fromDate(createdDate),
        readAt: Math.random() > 0.5 ? admin.firestore.Timestamp.fromDate(
          new Date(createdDate.getTime() + faker.number.int({ min: 1, max: 48 }) * 60 * 60 * 1000)
        ) : null
      });
    }
    
    return notifications;
  },
  
  /**
   * Seed development_sessions collection
   */
  async development_sessions() {
    const sessions = [];
    const startDate = new Date(2024, 6, 1); // July 1, 2024
    const endDate = new Date(); // Today
    
    let currentDate = new Date(startDate);
    let sessionCount = 0;
    
    while (currentDate <= endDate) {
      // Create 0-2 sessions per day (not every day has sessions)
      const sessionsToday = faker.number.int({ min: 0, max: 2 });
      
      for (let i = 0; i < sessionsToday; i++) {
        const duration = faker.number.float({ min: 2.0, max: 8.0, precision: 0.25 });
        const hourlyRate = 300;
        const totalCost = Math.round(duration * hourlyRate);
        const commitsCreated = faker.number.int({ min: 5, max: 50 });
        
        sessions.push({
          sessionId: `${currentDate.toISOString().split('T')[0].replace(/-/g, '')}_${String(i).padStart(2, '0')}`,
          date: currentDate.toISOString().split('T')[0],
          startTime: admin.firestore.Timestamp.fromDate(new Date(currentDate.getTime() + (8 + i * 6) * 60 * 60 * 1000)),
          endTime: admin.firestore.Timestamp.fromDate(new Date(currentDate.getTime() + (8 + i * 6 + duration) * 60 * 60 * 1000)),
          duration,
          focus: randomElement([
            'Feature development',
            'Bug fixes and testing',
            'UI/UX improvements',
            'Database optimization',
            'Security enhancements',
            'Documentation updates',
            'Performance optimization',
            'Integration work'
          ]),
          developer: 'AI Development Assistant',
          status: 'completed',
          costTracking: {
            hourlyRate,
            totalCost,
            billable: true,
            invoiceStatus: randomElement(['paid', 'pending', 'invoiced'])
          },
          metrics: {
            commitsCreated,
            filesModified: faker.number.int({ min: 5, max: 30 }),
            linesAdded: faker.number.int({ min: 100, max: 2000 }),
            linesDeleted: faker.number.int({ min: 50, max: 800 }),
            deploymentsSuccess: faker.number.int({ min: 1, max: 10 }),
            deploymentsFailed: faker.number.int({ min: 0, max: 2 }),
            bugsFixed: faker.number.int({ min: 0, max: 8 }),
            featuresAdded: faker.number.int({ min: 0, max: 5 })
          },
          technologies: faker.helpers.arrayElements([
            'HTML5', 'CSS3', 'JavaScript', 'Firebase', 'Firestore', 'Chart.js',
            'Node.js', 'Express', 'React', 'Next.js', 'GitHub API'
          ], faker.number.int({ min: 3, max: 7 })),
          quality: {
            codeReview: Math.random() > 0.5,
            testCoverage: faker.number.int({ min: 0, max: 85 }),
            documentation: Math.random() > 0.3,
            performance: randomElement(['excellent', 'good', 'fair']),
            security: randomElement(['secure', 'needs-review'])
          },
          createdAt: admin.firestore.Timestamp.fromDate(currentDate),
          updatedAt: admin.firestore.Timestamp.fromDate(currentDate)
        });
        
        sessionCount++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return sessions;
  },
  
  /**
   * Seed git_commits collection
   */
  async git_commits() {
    const commits = [];
    const commitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore'];
    const scopes = ['dashboard', 'auth', 'properties', 'transactions', 'api', 'ui', 'database', 'security'];
    
    for (let i = 0; i < 200; i++) {
      const commitDate = randomDate(new Date(2024, 0, 1), new Date());
      const type = randomElement(commitTypes);
      const scope = randomElement(scopes);
      
      commits.push({
        sha: faker.git.commitSha(),
        message: `${type}(${scope}): ${faker.git.commitMessage()}`,
        author: 'AI Development Assistant',
        email: 'ai@assiduous.dev',
        date: admin.firestore.Timestamp.fromDate(commitDate),
        type,
        scope,
        impact: randomElement(['low', 'medium', 'high']),
        repository: 'SirsiMaster/Assiduous',
        branch: randomElement(['main', 'develop', 'staging']),
        filesChanged: faker.number.int({ min: 1, max: 20 }),
        insertions: faker.number.int({ min: 10, max: 500 }),
        deletions: faker.number.int({ min: 5, max: 200 }),
        syncedAt: admin.firestore.Timestamp.fromDate(commitDate),
        githubSynced: true
      });
    }
    
    return commits;
  }
};

// Main seeding function
async function seedCollection(collectionName) {
  console.log(`\n🌱 Seeding ${collectionName}...`);
  
  if (!DataGenerators[collectionName]) {
    console.error(`❌ No generator found for collection: ${collectionName}`);
    return;
  }
  
  const data = await DataGenerators[collectionName]();
  console.log(`📊 Generated ${data.length} documents`);
  
  if (isDryRun) {
    console.log('🔍 DRY RUN - Sample document:');
    console.log(JSON.stringify(data[0], null, 2));
    return;
  }
  
  if (shouldClear) {
    console.log(`⚠️  Clearing existing ${collectionName} data...`);
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`🗑️  Deleted ${snapshot.size} existing documents`);
  }
  
  // Write in batches of 500 (Firestore limit)
  let batchCount = 0;
  let batch = db.batch();
  let batchSize = 0;
  
  for (const doc of data) {
    const docRef = db.collection(collectionName).doc();
    batch.set(docRef, doc);
    batchSize++;
    
    if (batchSize === 500) {
      await batch.commit();
      batchCount++;
      console.log(`  ✅ Batch ${batchCount} committed (${batchCount * 500} docs)`);
      batch = db.batch();
      batchSize = 0;
    }
  }
  
  // Commit remaining documents
  if (batchSize > 0) {
    await batch.commit();
    batchCount++;
    console.log(`  ✅ Final batch committed (${data.length} total docs)`);
  }
  
  console.log(`✅ ${collectionName} seeded successfully!`);
}

// Main execution
async function main() {
  console.log('🚀 Firestore Production Data Seeding');
  console.log('====================================\n');
  console.log(`Project: ${serviceAccount.project_id}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Clear existing: ${shouldClear ? 'YES ⚠️' : 'NO'}`);
  
  const collections = collectionFilter 
    ? [collectionFilter]
    : [
        'users',
        'properties',
        'transactions',
        'messages',
        'notifications',
        'development_sessions',
        'git_commits'
      ];
  
  console.log(`Collections: ${collections.join(', ')}\n`);
  
  if (!isDryRun && shouldClear) {
    console.log('⚠️  WARNING: You are about to CLEAR and RE-SEED production data!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  try {
    for (const collection of collections) {
      await seedCollection(collection);
    }
    
    console.log('\n✅ All collections seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Users: 33 (20 clients, 10 agents, 3 admins)');
    console.log('  - Properties: 100');
    console.log('  - Transactions: 50');
    console.log('  - Messages: 150');
    console.log('  - Notifications: 100');
    console.log('  - Development Sessions: ~180');
    console.log('  - Git Commits: 200');
    console.log('\n🎉 Database is ready for testing!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { DataGenerators, seedCollection };
