/**
 * Verify Firestore Data Script
 * Checks what's actually in the properties collection
 */

const admin = require('firebase-admin');
const serviceAccount = require('../.keys/firebase-app-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyFirestoreData() {
  try {
    console.log('🔍 Checking Firestore properties collection...\n');
    
    // Get all properties
    const propertiesSnapshot = await db.collection('properties').get();
    
    console.log(`📊 Total properties in Firestore: ${propertiesSnapshot.size}\n`);
    
    if (propertiesSnapshot.size === 0) {
      console.log('❌ NO PROPERTIES FOUND IN FIRESTORE!');
      console.log('   The collection is empty. Properties need to be seeded.\n');
      process.exit(1);
    }
    
    console.log('✅ Properties exist! Here are the first 5:\n');
    
    propertiesSnapshot.docs.slice(0, 5).forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${doc.id}`);
      console.log(`   Address: ${data.address?.street || 'N/A'}, ${data.address?.city || 'N/A'}`);
      console.log(`   Price: $${data.price?.list?.toLocaleString() || 'N/A'}`);
      console.log(`   Bedrooms: ${data.details?.bedrooms || 'N/A'}, Bathrooms: ${data.details?.bathrooms || 'N/A'}`);
      console.log(`   Status: ${data.status || 'N/A'}`);
      console.log(`   Neighborhood: ${data.neighborhood || 'N/A'}`);
      console.log(`   ROI: ${data.flipEstimate?.roi || 'N/A'}%\n`);
    });
    
    // Get property stats
    const available = propertiesSnapshot.docs.filter(doc => doc.data().status === 'available').length;
    const pending = propertiesSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const sold = propertiesSnapshot.docs.filter(doc => doc.data().status === 'sold').length;
    
    console.log('📈 Property Status Breakdown:');
    console.log(`   Available: ${available}`);
    console.log(`   Pending: ${pending}`);
    console.log(`   Sold: ${sold}`);
    
    // Check neighborhoods
    const neighborhoods = new Set();
    propertiesSnapshot.docs.forEach(doc => {
      const neighborhood = doc.data().neighborhood;
      if (neighborhood) neighborhoods.add(neighborhood);
    });
    
    console.log(`\n🏘️  Neighborhoods: ${neighborhoods.size}`);
    console.log(`   ${Array.from(neighborhoods).slice(0, 10).join(', ')}`);
    
    // Check users collection
    console.log('\n👥 Checking users collection...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Total users: ${usersSnapshot.size}`);
    
    if (usersSnapshot.size > 0) {
      console.log('\n✅ Sample users:');
      usersSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.email || 'N/A'} (${data.role || 'N/A'})`);
      });
    }
    
    console.log('\n✅ VERIFICATION COMPLETE');
    console.log('   Firestore is populated with real data!');
    console.log('\n🔗 View in Firebase Console:');
    console.log('   https://console.firebase.google.com/project/assiduous-prod/firestore/data/~2Fproperties');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying Firestore data:', error);
    process.exit(1);
  }
}

// Run verification
verifyFirestoreData();
