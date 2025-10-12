#!/usr/bin/env node

/**
 * Copy Firestore Data from Production to Staging
 * This script reads all documents from production and writes them to staging
 */

const admin = require('firebase-admin');

// Initialize production Firebase
const prodServiceAccount = require('../firebase-migration-package/firebase-admin-sdk-prod.json');
const prodApp = admin.initializeApp({
  credential: admin.credential.cert(prodServiceAccount),
  databaseURL: 'https://assiduous-prod.firebaseio.com'
}, 'prod');
const prodDb = prodApp.firestore();

// Initialize staging Firebase
const stagingServiceAccount = require('../firebase-migration-package/assiduous-build/firebase-config-staging.json');
const stagingApp = admin.initializeApp({
  credential: admin.credential.cert(stagingServiceAccount),
  databaseURL: 'https://assiduous-staging.firebaseio.com'
}, 'staging');
const stagingDb = stagingApp.firestore();

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

async function copyCollection(collectionName) {
  console.log(`\n📦 Copying collection: ${collectionName}`);
  
  try {
    const snapshot = await prodDb.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Collection is empty, skipping`);
      return { collection: collectionName, count: 0, status: 'empty' };
    }

    console.log(`   Found ${snapshot.size} documents`);
    
    const batch = stagingDb.batch();
    let batchCount = 0;
    let totalCopied = 0;
    
    for (const doc of snapshot.docs) {
      const docRef = stagingDb.collection(collectionName).doc(doc.id);
      batch.set(docRef, doc.data());
      batchCount++;
      
      // Firestore batch limit is 500 operations
      if (batchCount >= 500) {
        await batch.commit();
        totalCopied += batchCount;
        console.log(`   ✅ Committed batch of ${batchCount} documents (total: ${totalCopied})`);
        batchCount = 0;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      totalCopied += batchCount;
      console.log(`   ✅ Committed final batch of ${batchCount} documents`);
    }
    
    console.log(`   ✅ Successfully copied ${totalCopied} documents`);
    return { collection: collectionName, count: totalCopied, status: 'success' };
    
  } catch (error) {
    console.error(`   ❌ Error copying ${collectionName}:`, error.message);
    return { collection: collectionName, count: 0, status: 'error', error: error.message };
  }
}

async function copyAllCollections() {
  console.log('🚀 Starting Firestore data copy from Production to Staging...\n');
  console.log('Production Project: assiduous-prod');
  console.log('Staging Project: assiduous-staging');
  
  const results = [];
  let totalDocuments = 0;
  
  for (const collectionName of collections) {
    const result = await copyCollection(collectionName);
    results.push(result);
    totalDocuments += result.count;
  }
  
  console.log('\n\n📊 Summary:');
  console.log('═'.repeat(60));
  
  results.forEach(r => {
    const status = r.status === 'success' ? '✅' : 
                   r.status === 'empty' ? '⚠️' : '❌';
    console.log(`${status} ${r.collection.padEnd(30)} ${r.count.toString().padStart(5)} documents`);
  });
  
  console.log('═'.repeat(60));
  console.log(`\nTotal documents copied: ${totalDocuments}`);
  console.log(`Collections copied: ${results.filter(r => r.status === 'success').length}/${collections.length}`);
  console.log(`Empty collections: ${results.filter(r => r.status === 'empty').length}`);
  console.log(`Failed collections: ${results.filter(r => r.status === 'error').length}`);
  
  if (results.some(r => r.status === 'error')) {
    console.log('\n❌ Some collections failed to copy:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   - ${r.collection}: ${r.error}`);
    });
    process.exit(1);
  }
  
  console.log('\n✅ Firestore data copy completed successfully!');
  process.exit(0);
}

copyAllCollections().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
