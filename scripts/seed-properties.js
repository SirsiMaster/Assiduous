/**
 * Seed Properties Script
 * Populates Firestore with initial property data for Philadelphia micro-flipping market
 */

const admin = require('firebase-admin');
const serviceAccount = require('../.keys/firebase-app-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Philadelphia neighborhoods for micro-flipping
const neighborhoods = [
  'Fishtown', 'Kensington', 'Northern Liberties', 'Port Richmond',
  'Strawberry Mansion', 'Mantua', 'Grays Ferry', 'Point Breeze',
  'Germantown', 'West Philadelphia', 'Hunting Park', 'Juniata'
];

const propertyTypes = ['single_family', 'townhouse', 'condo', 'multi_family'];

const features = [
  'hardwood_floors', 'updated_kitchen', 'new_roof', 'finished_basement',
  'garage', 'backyard', 'central_air', 'renovated_bathroom', 'new_windows',
  'original_details', 'exposed_brick', 'high_ceilings', 'natural_light'
];

// Generate realistic property data
function generateProperty(index) {
  const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
  const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
  const bedrooms = Math.floor(Math.random() * 3) + 2; // 2-4 bedrooms
  const bathrooms = Math.floor(Math.random() * 2) + 1; // 1-2 bathrooms
  const sqft = Math.floor(Math.random() * 1000) + 1000; // 1000-2000 sqft
  
  // Philadelphia pricing for fixer-uppers
  const listPrice = Math.floor(Math.random() * 150000) + 50000; // $50k-$200k
  const repairCost = Math.floor(Math.random() * 30000) + 10000; // $10k-$40k
  const arv = listPrice + repairCost + Math.floor(Math.random() * 50000) + 20000; // ARV higher
  
  // Calculate flip estimate
  const profit = arv - listPrice - repairCost - (arv * 0.10); // 10% holding costs
  const roi = (profit / (listPrice + repairCost)) * 100;
  const holdingTime = Math.floor(Math.random() * 90) + 30; // 30-120 days
  
  // Select random features
  const propertyFeatures = [];
  const numFeatures = Math.floor(Math.random() * 5) + 3;
  for (let i = 0; i < numFeatures; i++) {
    const feature = features[Math.floor(Math.random() * features.length)];
    if (!propertyFeatures.includes(feature)) {
      propertyFeatures.push(feature);
    }
  }
  
  // Generate street address
  const streetNumber = Math.floor(Math.random() * 9000) + 1000;
  const streets = ['N 5th St', 'E Girard Ave', 'W Allegheny Ave', 'N Front St', 
                   'E Cumberland St', 'N 2nd St', 'W Huntingdon St', 'N American St'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  
  return {
    address: {
      street: `${streetNumber} ${street}`,
      city: 'Philadelphia',
      state: 'PA',
      zip: `19${Math.floor(Math.random() * 900) + 100}`,
      coordinates: new admin.firestore.GeoPoint(
        39.9526 + (Math.random() * 0.1 - 0.05),
        -75.1652 + (Math.random() * 0.1 - 0.05)
      )
    },
    price: {
      list: listPrice,
      arv: arv,
      repair: repairCost
    },
    details: {
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      sqft: sqft,
      lot: Math.floor(Math.random() * 2000) + 1000,
      year: Math.floor(Math.random() * 70) + 1950,
      type: type
    },
    images: [
      {
        url: `https://images.unsplash.com/photo-${1560184000000 + index}?w=800`,
        thumbnail: `https://images.unsplash.com/photo-${1560184000000 + index}?w=300`,
        caption: 'Front view'
      },
      {
        url: `https://images.unsplash.com/photo-${1560184000000 + index + 1}?w=800`,
        thumbnail: `https://images.unsplash.com/photo-${1560184000000 + index + 1}?w=300`,
        caption: 'Interior'
      }
    ],
    features: propertyFeatures,
    status: 'available',
    flipEstimate: {
      profit: Math.round(profit),
      roi: Math.round(roi * 10) / 10,
      holdingTime: holdingTime
    },
    description: `Great investment opportunity in ${neighborhood}! This ${type} features ${bedrooms} bedrooms and ${bathrooms} bathrooms with ${sqft} sqft of living space. Perfect for micro-flipping with an estimated ${holdingTime}-day turnaround. Property needs cosmetic updates and has strong profit potential.`,
    neighborhood: neighborhood,
    investmentScore: Math.round((roi / 100) * 100), // 0-100 score based on ROI
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

// Seed the database
async function seedProperties() {
  try {
    console.log('🚀 Starting property data seeding...\n');
    
    // Generate 50 properties
    const numProperties = 50;
    const batch = db.batch();
    const propertyRefs = [];
    
    for (let i = 0; i < numProperties; i++) {
      const property = generateProperty(i);
      const ref = db.collection('properties').doc();
      batch.set(ref, property);
      propertyRefs.push(ref);
      
      console.log(`✅ Generated property ${i + 1}: ${property.address.street}, ${property.address.city}`);
    }
    
    // Commit batch
    await batch.commit();
    
    console.log(`\n✅ Successfully seeded ${numProperties} properties!`);
    console.log(`\n📊 Property Stats:`);
    console.log(`   - Neighborhoods: ${neighborhoods.length}`);
    console.log(`   - Price Range: $50,000 - $200,000`);
    console.log(`   - Types: ${propertyTypes.join(', ')}`);
    console.log(`\n🔗 View in Firebase Console:`);
    console.log(`   https://console.firebase.google.com/project/assiduous-prod/firestore`);
    console.log(`\n🌐 Test API:`);
    console.log(`   https://us-central1-assiduous-prod.cloudfunctions.net/api/properties`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding properties:', error);
    process.exit(1);
  }
}

// Run the seeder
seedProperties();
