#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: 'assiduous-prod',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function verifyData() {
  console.log('🔍 Verifying data in Firestore...\n');
  
  try {
    // Check properties
    const propertiesSnapshot = await db.collection('properties').get();
    console.log(`📊 Properties: ${propertiesSnapshot.size} documents`);
    
    // Show first few properties
    let count = 0;
    propertiesSnapshot.forEach(doc => {
      if (count < 3) {
        const data = doc.data();
        console.log(`  - ${data.title || 'Unknown'} (${data.status || 'N/A'})`);
        if (data.isTestData) {
          console.log(`    ✅ Tagged as test data`);
        }
        count++;
      }
    });
    
    // Check users
    const usersSnapshot = await db.collection('users').get();
    console.log(`\n👥 Users: ${usersSnapshot.size} documents`);
    
    // Show users
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isTestData) {
        console.log(`  - ${data.email} (${data.role}) ✅ Test user`);
      }
    });
    
    // Check leads
    const leadsSnapshot = await db.collection('leads').get();
    console.log(`\n📧 Leads: ${leadsSnapshot.size} documents`);
    
    // Check transactions
    const transactionsSnapshot = await db.collection('transactions').get();
    console.log(`\n💼 Transactions: ${transactionsSnapshot.size} documents`);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Data verification complete!');
    console.log('='.repeat(50));
    
    // Test data count
    const testPropsCount = propertiesSnapshot.docs.filter(doc => doc.data().isTestData).length;
    const testUsersCount = usersSnapshot.docs.filter(doc => doc.data().isTestData).length;
    const testLeadsCount = leadsSnapshot.docs.filter(doc => doc.data().isTestData).length;
    const testTransCount = transactionsSnapshot.docs.filter(doc => doc.data().isTestData).length;
    
    console.log('\n🏷️  Test Data Summary:');
    console.log(`  • Test properties: ${testPropsCount}`);
    console.log(`  • Test users: ${testUsersCount}`);
    console.log(`  • Test leads: ${testLeadsCount}`);
    console.log(`  • Test transactions: ${testTransCount}`);
    
    if (testPropsCount > 0) {
      console.log('\n✅ Test data is properly tagged and can be removed with:');
      console.log('   node populate-test-data.js remove');
    }
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
  
  process.exit(0);
}

verifyData();