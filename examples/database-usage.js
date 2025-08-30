import { dataService } from '../src/services/DataService';
import { searchService } from '../src/services/SearchService';
import { databaseUtils } from '../src/services/DatabaseUtils';
import { QueryBuilder } from '../src/services/QueryBuilder';

// Example 1: Advanced Property Search
async function searchProperties() {
  const query = new QueryBuilder()
    .price(500000, 1000000)           // Price range
    .propertyType('single_family')     // Property type
    .amenities('garage', 'pool')       // Must have these amenities
    .location(37.7749, -122.4194, 5000)  // Within 5km of SF
    .sort('basic.price', 'asc')        // Sort by price
    .limit(10)                         // Limit results
    .build();

  const properties = await dataService.find('properties', query);
  console.log('Found properties:', properties);
}

// Example 2: Full-text Search
async function searchListings() {
  const results = await searchService.search('modern house near downtown', {
    collections: ['properties'],
    limit: 5,
    filters: {
      properties: {
        'basic.status': 'available',
        'basic.price': { $lte: 1000000 }
      }
    }
  });

  console.log('Search results:', results);
}

// Example 3: Complex Transaction Query
async function findTransactions() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const query = new QueryBuilder()
    .equals('status', 'pending')
    .greaterThan('details.offerAmount', 500000)
    .lessThan('timeline.created', threeDaysAgo.toISOString())
    .sort('timeline.created', 'desc')
    .build();

  const transactions = await dataService.find('transactions', query);
  console.log('Pending transactions:', transactions);
}

// Example 4: User Management with Validation
async function createUser() {
  try {
    const userData = {
      role: 'client',
      profile: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890'
      },
      preferences: {
        notifications: {
          email: true,
          push: true
        }
      }
    };

    const user = await dataService.create('users', userData);
    console.log('Created user:', user);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}

// Example 5: Property Management with References
async function listProperty() {
  try {
    const propertyData = {
      basic: {
        address: '123 Main St, San Francisco, CA 94105',
        price: 750000,
        status: 'available',
        type: 'single_family'
      },
      details: {
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        amenities: ['garage', 'garden']
      },
      location: {
        coordinates: [-122.4194, 37.7749]
      },
      metadata: {
        ownerId: 'usr_123',
        agentId: 'usr_456'
      }
    };

    const property = await dataService.create('properties', propertyData);
    console.log('Listed property:', property);
  } catch (error) {
    console.error('Failed to list property:', error);
  }
}

// Example 6: Transaction Processing
async function processTransaction() {
  try {
    // Create transaction
    const transaction = await dataService.create('transactions', {
      propertyId: 'prop_123',
      buyerId: 'usr_789',
      sellerId: 'usr_123',
      agentId: 'usr_456',
      status: 'pending',
      details: {
        offerAmount: 740000,
        terms: {
          downPayment: 148000,
          financingType: 'conventional'
        }
      }
    });

    // Update property status
    await dataService.update('properties', 
      { _id: 'prop_123' },
      { 'basic.status': 'pending' }
    );

    console.log('Processed transaction:', transaction);
  } catch (error) {
    console.error('Failed to process transaction:', error);
  }
}

// Example 7: Data Migration
async function migrateToDB() {
  try {
    // Generate migration script
    const script = await databaseUtils.generateMongoMigration();
    console.log('Migration script:', script);

    // Create backup before migration
    const backup = await databaseUtils.createBackup();
    console.log('Backup created:', backup.timestamp);

    // Validate data integrity
    const issues = await databaseUtils.validateIntegrity();
    if (issues.length > 0) {
      console.error('Data integrity issues:', issues);
      return;
    }

    console.log('Data ready for migration');
  } catch (error) {
    console.error('Migration preparation failed:', error);
  }
}

// Example 8: Advanced Search with Suggestions
async function searchWithSuggestions() {
  // Get search suggestions
  const suggestions = await searchService.suggest('mod', 'properties', 'description');
  console.log('Search suggestions:', suggestions);

  // Perform search with multiple conditions
  const query = new QueryBuilder()
    .or([
      QueryBuilder.price(500000, 750000),
      QueryBuilder.recent(7)
    ])
    .and([
      QueryBuilder.propertyType('single_family', 'condo'),
      QueryBuilder.amenities('parking', 'gym')
    ])
    .build();

  const results = await dataService.find('properties', query);
  console.log('Search results:', results);
}

// Example 9: Batch Operations
async function batchProcess() {
  try {
    // Find all expired listings
    const expiredListings = await dataService.find('properties', {
      'basic.status': 'available',
      'metadata.createdAt': {
        $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    // Update all expired listings
    for (const listing of expiredListings) {
      await dataService.update('properties',
        { _id: listing._id },
        { 
          'basic.status': 'expired',
          'metadata.updatedAt': new Date().toISOString()
        }
      );

      // Update search index
      await searchService.updateIndex('properties', listing);
    }

    console.log(`Updated ${expiredListings.length} expired listings`);
  } catch (error) {
    console.error('Batch process failed:', error);
  }
}

// Example 10: Real-time Updates
function setupRealtimeUpdates() {
  // Set up interval to check for updates (simulating real-time)
  setInterval(async () => {
    try {
      const recentTransactions = await dataService.find('transactions', {
        'timeline.created': {
          $gt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      });

      if (recentTransactions.length > 0) {
        console.log('New transactions:', recentTransactions);
        // Update UI or trigger notifications
      }
    } catch (error) {
      console.error('Real-time update check failed:', error);
    }
  }, 5000);  // Check every 5 seconds
}

// Run examples
async function runExamples() {
  await searchProperties();
  await searchListings();
  await findTransactions();
  await createUser();
  await listProperty();
  await processTransaction();
  await migrateToDB();
  await searchWithSuggestions();
  await batchProcess();
  setupRealtimeUpdates();
}

runExamples().catch(console.error);
