#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: 'assiduous-prod',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function deleteAllDocumentsInCollection(collectionName) {
  console.log(`Deleting all documents in ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  
  if (snapshot.empty) {
    console.log(`  No documents found in ${collectionName}`);
    return 0;
  }
  
  // Delete in batches of 500 (Firestore limit)
  const batchSize = 500;
  let deletedCount = 0;
  
  while (!snapshot.empty) {
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      if (count < batchSize) {
        batch.delete(doc.ref);
        count++;
      }
    });
    
    await batch.commit();
    deletedCount += count;
    console.log(`  Deleted ${deletedCount} documents...`);
    
    // If there are more documents, get the next batch
    if (snapshot.docs.length > batchSize) {
      const newSnapshot = await db.collection(collectionName).limit(batchSize).get();
      snapshot.docs = newSnapshot.docs;
    } else {
      break;
    }
  }
  
  console.log(`  ✅ Deleted ${deletedCount} documents from ${collectionName}`);
  return deletedCount;
}

async function cleanAndRepopulate() {
  console.log('🧹 CLEANING ALL DATA AND REPOPULATING WITH CLEAN TEST DATA');
  console.log('=========================================================\n');
  
  try {
    // Step 1: Delete ALL properties (tagged and untagged)
    console.log('Step 1: Removing ALL existing properties...');
    const deletedProps = await deleteAllDocumentsInCollection('properties');
    
    // Step 2: Delete ALL leads
    console.log('\nStep 2: Removing ALL existing leads...');
    const deletedLeads = await deleteAllDocumentsInCollection('leads');
    
    // Step 3: Delete ALL transactions
    console.log('\nStep 3: Removing ALL existing transactions...');
    const deletedTrans = await deleteAllDocumentsInCollection('transactions');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Removed:`);
    console.log(`  • ${deletedProps} properties`);
    console.log(`  • ${deletedLeads} leads`);
    console.log(`  • ${deletedTrans} transactions`);
    
    // Now run the populate script to create fresh tagged data
    console.log('\n🎯 Now creating fresh, properly tagged test data...\n');
    
    // Import and run the populate function
    const { exec } = require('child_process');
    exec('node populate-test-data.js populate', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return;
      }
      console.log(stdout);
      
      console.log('\n' + '='.repeat(50));
      console.log('🎉 DATABASE CLEANED AND REPOPULATED!');
      console.log('='.repeat(50));
      console.log('\n✅ You now have a clean database with only tagged test data');
      console.log('💡 All test data can be removed with: node populate-test-data.js remove');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanAndRepopulate();