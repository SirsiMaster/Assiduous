#!/usr/bin/env node

/**
 * Verify Firestore Data Import to Staging
 * Checks if production data was successfully imported to staging
 */

const admin = require('firebase-admin');

// Initialize staging Firebase
const serviceAccount = require('../firebase-migration-package/assiduous-build/firebase-config-staging.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://assiduous-staging.firebaseio.com'
});

const db = admin.firestore();

async function verifyImport() {
  console.log('🔍 Verifying Firestore data import to staging...\n');

  const collections = [
    'users',
    'properties',
    'agents',
    'clients',
    'transactions',
    'messages',
    'notifications',
    'development_sessions',
    'development_metrics',
    'git_commits',
    'project_milestones',
    'deployment_logs'
  ];

  let totalDocuments = 0;
  const results = [];

  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).limit(5).get();
      const count = snapshot.size;
      totalDocuments += count;
      
      results.push({
        collection: collectionName,
        count: count,
        status: count > 0 ? '✅' : '⚠️'
      });

      console.log(`${count > 0 ? '✅' : '⚠️'} ${collectionName.padEnd(25)} ${count} documents`);
    } catch (error) {
      results.push({
        collection: collectionName,
        count: 0,
        status: '❌',
        error: error.message
      });
      console.log(`❌ ${collectionName.padEnd(25)} ERROR: ${error.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`Total documents found: ${totalDocuments}`);
  console.log(`Collections with data: ${results.filter(r => r.count > 0).length}/${collections.length}`);

  if (totalDocuments === 0) {
    console.log('\n❌ No documents found! Import may have failed.');
    process.exit(1);
  } else if (totalDocuments < 100) {
    console.log('\n⚠️  Warning: Low document count. Verify import completed successfully.');
    process.exit(0);
  } else {
    console.log('\n✅ Import verification successful!');
    process.exit(0);
  }
}

verifyImport().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
