#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: 'assiduous-prod',
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function analyzeProperties() {
  console.log('🔍 Analyzing all properties in Firestore...\n');
  
  try {
    const propertiesSnapshot = await db.collection('properties').get();
    console.log(`Total properties: ${propertiesSnapshot.size}\n`);
    
    let testProperties = [];
    let untaggedProperties = [];
    let propertyTypes = {};
    let propertyStatuses = {};
    let creationDates = [];
    
    propertiesSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Check if it's test data
      if (data.isTestData) {
        testProperties.push({
          id: doc.id,
          title: data.title,
          testRunId: data.testRunId,
          createdAt: data.createdAt
        });
      } else {
        untaggedProperties.push({
          id: doc.id,
          title: data.title || 'No title',
          address: data.address?.street || 'No address',
          price: data.price?.list || 0,
          createdAt: data.createdAt,
          hasFlipAnalysis: !!data.flipAnalysis,
          status: data.status,
          description: data.description ? data.description.substring(0, 50) : 'No description'
        });
      }
      
      // Count property types
      const type = data.details?.type || 'Unknown';
      propertyTypes[type] = (propertyTypes[type] || 0) + 1;
      
      // Count statuses
      const status = data.status || 'Unknown';
      propertyStatuses[status] = (propertyStatuses[status] || 0) + 1;
      
      // Track creation dates
      if (data.createdAt) {
        creationDates.push(data.createdAt);
      }
    });
    
    // Show test properties
    console.log('📦 TEST PROPERTIES (with isTestData tag):');
    console.log('==========================================');
    console.log(`Count: ${testProperties.length}\n`);
    if (testProperties.length > 0) {
      console.log('Sample test properties:');
      testProperties.slice(0, 3).forEach(prop => {
        console.log(`  - ${prop.title}`);
        console.log(`    ID: ${prop.id}`);
        console.log(`    Test Run: ${prop.testRunId}`);
      });
    }
    
    // Show untagged properties
    console.log('\n📦 UNTAGGED PROPERTIES (no isTestData tag):');
    console.log('============================================');
    console.log(`Count: ${untaggedProperties.length}\n`);
    
    if (untaggedProperties.length > 0) {
      // Group by similar patterns
      let patterns = {
        withTitle: untaggedProperties.filter(p => p.title && p.title !== 'No title'),
        withoutTitle: untaggedProperties.filter(p => !p.title || p.title === 'No title'),
        withFlipAnalysis: untaggedProperties.filter(p => p.hasFlipAnalysis),
        withoutFlipAnalysis: untaggedProperties.filter(p => !p.hasFlipAnalysis)
      };
      
      console.log('Properties WITH titles:', patterns.withTitle.length);
      if (patterns.withTitle.length > 0) {
        patterns.withTitle.slice(0, 3).forEach(prop => {
          console.log(`  - ${prop.title}`);
          console.log(`    Address: ${prop.address}`);
          console.log(`    Price: $${prop.price.toLocaleString()}`);
        });
      }
      
      console.log('\nProperties WITHOUT titles:', patterns.withoutTitle.length);
      if (patterns.withoutTitle.length > 0) {
        patterns.withoutTitle.slice(0, 3).forEach(prop => {
          console.log(`  - ID: ${prop.id}`);
          console.log(`    Address: ${prop.address}`);
          console.log(`    Price: $${prop.price.toLocaleString()}`);
        });
      }
      
      console.log('\nProperties WITH flipAnalysis:', patterns.withFlipAnalysis.length);
      console.log('Properties WITHOUT flipAnalysis:', patterns.withoutFlipAnalysis.length);
    }
    
    // Show property types breakdown
    console.log('\n📊 PROPERTY TYPES:');
    console.log('==================');
    Object.entries(propertyTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    // Show status breakdown
    console.log('\n📊 PROPERTY STATUSES:');
    console.log('=====================');
    Object.entries(propertyStatuses).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Check creation dates
    if (creationDates.length > 0) {
      const sortedDates = creationDates.sort((a, b) => {
        const aTime = a.toDate ? a.toDate() : new Date(a);
        const bTime = b.toDate ? b.toDate() : new Date(b);
        return aTime - bTime;
      });
      
      const oldest = sortedDates[0];
      const newest = sortedDates[sortedDates.length - 1];
      
      console.log('\n📅 CREATION DATES:');
      console.log('==================');
      if (oldest) {
        const oldestDate = oldest.toDate ? oldest.toDate() : new Date(oldest);
        console.log(`  Oldest: ${oldestDate.toLocaleString()}`);
      }
      if (newest) {
        const newestDate = newest.toDate ? newest.toDate() : new Date(newest);
        console.log(`  Newest: ${newestDate.toLocaleString()}`);
      }
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    if (untaggedProperties.length > 0) {
      console.log('• You have ' + untaggedProperties.length + ' untagged properties');
      console.log('• These were likely created through the web-based populate-data.html tool');
      console.log('• Or from previous testing sessions');
      console.log('• They cannot be automatically removed since they lack the isTestData tag');
      console.log('\nTo remove ALL properties (tagged and untagged):');
      console.log('  1. Go to Firebase Console');
      console.log('  2. Delete the entire properties collection');
      console.log('  3. Re-run: node populate-test-data.js');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing properties:', error.message);
  }
  
  process.exit(0);
}

analyzeProperties();