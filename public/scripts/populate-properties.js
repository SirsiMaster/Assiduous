#!/usr/bin/env node

/**
 * Populate Firebase with Real Philadelphia Properties
 * This will add 50 realistic properties for demo/testing
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://assiduous-prod.firebaseio.com'
});

const db = admin.firestore();

// Philadelphia neighborhoods
const neighborhoods = [
  'Center City', 'Rittenhouse Square', 'Old City', 'Northern Liberties', 
  'Fishtown', 'South Philadelphia', 'University City', 'Manayunk',
  'Chestnut Hill', 'Queen Village', 'Bella Vista', 'Fairmount',
  'Spring Garden', 'Graduate Hospital', 'Passyunk Square', 'East Falls',
  'Roxborough', 'Mount Airy', 'West Philadelphia', 'Port Richmond'
];

// Property types
const propertyTypes = ['single_family', 'townhouse', 'condo', 'multi_family'];

// Street names in Philadelphia
const streetNames = [
  'Market Street', 'Broad Street', 'Walnut Street', 'Chestnut Street',
  'Pine Street', 'Spruce Street', 'South Street', 'Spring Garden Street',
  'Girard Avenue', 'Passyunk Avenue', 'Frankford Avenue', 'Main Street',
  'Ridge Avenue', 'Lancaster Avenue', 'Baltimore Avenue', 'Washington Avenue',
  'Snyder Avenue', 'Oregon Avenue', 'Allegheny Avenue', 'Erie Avenue'
];

// Generate realistic Philadelphia properties
function generateProperties() {
  const properties = [];
  
  for (let i = 1; i <= 50; i++) {
    const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const street = streetNames[Math.floor(Math.random() * streetNames.length)];
    const bedrooms = Math.floor(Math.random() * 4) + 1;
    const bathrooms = Math.min(bedrooms, Math.floor(Math.random() * 3) + 1);
    const yearBuilt = 1900 + Math.floor(Math.random() * 124);
    const sqft = 800 + Math.floor(Math.random() * 2700);
    
    // Price based on neighborhood and property characteristics
    let basePrice = 150000;
    if (['Rittenhouse Square', 'Center City', 'Old City'].includes(neighborhood)) {
      basePrice = 400000;
    } else if (['Northern Liberties', 'Fishtown', 'Graduate Hospital'].includes(neighborhood)) {
      basePrice = 350000;
    } else if (['Fairmount', 'Spring Garden', 'Queen Village'].includes(neighborhood)) {
      basePrice = 300000;
    } else if (['Manayunk', 'Chestnut Hill', 'East Falls'].includes(neighborhood)) {
      basePrice = 275000;
    } else {
      basePrice = 200000;
    }
    
    // Adjust price based on size and type
    const pricePerSqft = basePrice / 1500;
    const price = Math.round((pricePerSqft * sqft) + (Math.random() * 50000 - 25000));
    
    // Calculate micro-flip potential
    const afterRepairValue = Math.round(price * (1.15 + Math.random() * 0.25));
    const estimatedRepairCost = Math.round(15000 + Math.random() * 35000);
    const potentialProfit = afterRepairValue - price - estimatedRepairCost;
    const roi = Math.round((potentialProfit / (price + estimatedRepairCost)) * 100);
    
    const property = {
      title: `${bedrooms}BR ${propertyType.replace('_', ' ')} in ${neighborhood}`,
      address: `${1000 + Math.floor(Math.random() * 8999)} ${street}`,
      city: 'Philadelphia',
      state: 'PA',
      zipCode: `191${String(Math.floor(Math.random() * 90) + 10)}`,
      neighborhood: neighborhood,
      price: price,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      sqft: sqft,
      type: propertyType,
      status: i <= 40 ? 'available' : (i <= 45 ? 'pending' : 'sold'),
      yearBuilt: yearBuilt,
      description: generateDescription(propertyType, bedrooms, neighborhood, yearBuilt),
      features: generateFeatures(propertyType),
      images: generateImageUrls(propertyType, i),
      
      // Micro-flipping data
      microFlipping: {
        afterRepairValue: afterRepairValue,
        estimatedRepairCost: estimatedRepairCost,
        potentialProfit: potentialProfit,
        roi: roi,
        investmentScore: calculateInvestmentScore(roi, neighborhood, price),
        repairItems: generateRepairItems(),
        holdingTime: '3-4 months',
        marketDemand: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]
      },
      
      // Listing details
      listingDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastModified: new Date().toISOString(),
      views: Math.floor(Math.random() * 500),
      saves: Math.floor(Math.random() * 50),
      agentId: `agent_${Math.floor(Math.random() * 10) + 1}`,
      mlsNumber: `MLS${2025}${String(i).padStart(6, '0')}`,
      
      // Additional details
      parking: Math.random() > 0.3 ? 'Garage' : (Math.random() > 0.5 ? 'Street' : 'Driveway'),
      heating: ['Gas', 'Electric', 'Oil'][Math.floor(Math.random() * 3)],
      cooling: 'Central Air',
      basement: Math.random() > 0.5 ? 'Full' : (Math.random() > 0.5 ? 'Partial' : 'None'),
      taxAmount: Math.round(price * 0.015),
      hoaFee: propertyType === 'condo' ? Math.round(200 + Math.random() * 400) : 0
    };
    
    properties.push(property);
  }
  
  return properties;
}

function generateDescription(type, bedrooms, neighborhood, yearBuilt) {
  const intros = [
    `Charming ${bedrooms} bedroom ${type.replace('_', ' ')} in the heart of ${neighborhood}.`,
    `Beautiful ${yearBuilt} ${type.replace('_', ' ')} with ${bedrooms} bedrooms in desirable ${neighborhood}.`,
    `Investors alert! ${bedrooms}BR ${type.replace('_', ' ')} with tremendous potential in ${neighborhood}.`,
    `Perfect micro-flip opportunity in ${neighborhood}. This ${bedrooms} bedroom property is ready for your vision.`
  ];
  
  const details = [
    'Features original hardwood floors and high ceilings throughout.',
    'Recently updated kitchen with stainless steel appliances.',
    'Large backyard perfect for entertaining.',
    'Close to public transportation and local amenities.',
    'Great bones and solid foundation, ready for cosmetic updates.',
    'Prime location with easy access to Center City.'
  ];
  
  return intros[Math.floor(Math.random() * intros.length)] + ' ' + 
         details[Math.floor(Math.random() * details.length)];
}

function generateFeatures(type) {
  const allFeatures = [
    'Hardwood Floors', 'Updated Kitchen', 'Granite Countertops',
    'Stainless Steel Appliances', 'Central Air', 'Washer/Dryer',
    'Deck/Patio', 'Finished Basement', 'Walk-in Closet',
    'Storage Space', 'Natural Light', 'Crown Molding',
    'Exposed Brick', 'High Ceilings', 'Fireplace'
  ];
  
  const count = 3 + Math.floor(Math.random() * 5);
  const features = [];
  
  for (let i = 0; i < count; i++) {
    const feature = allFeatures[Math.floor(Math.random() * allFeatures.length)];
    if (!features.includes(feature)) {
      features.push(feature);
    }
  }
  
  return features;
}

function generateImageUrls(type, seed) {
  // Using placeholder images that look like real properties
  const imageTypes = ['exterior', 'living', 'kitchen', 'bedroom', 'bathroom'];
  return imageTypes.map(imgType => 
    `https://source.unsplash.com/800x600/?${type.replace('_', '')},${imgType},house&sig=${seed}${imgType}`
  );
}

function generateRepairItems() {
  const allRepairs = [
    { item: 'Kitchen Update', cost: 8000 },
    { item: 'Bathroom Renovation', cost: 5000 },
    { item: 'New Flooring', cost: 4000 },
    { item: 'Paint Interior', cost: 3000 },
    { item: 'Update Fixtures', cost: 2000 },
    { item: 'Landscaping', cost: 2500 },
    { item: 'Roof Repair', cost: 6000 },
    { item: 'HVAC Service', cost: 1500 },
    { item: 'Window Replacement', cost: 5000 },
    { item: 'Electrical Update', cost: 3500 }
  ];
  
  const count = 2 + Math.floor(Math.random() * 4);
  const repairs = [];
  
  for (let i = 0; i < count; i++) {
    const repair = allRepairs[Math.floor(Math.random() * allRepairs.length)];
    if (!repairs.find(r => r.item === repair.item)) {
      repairs.push(repair);
    }
  }
  
  return repairs;
}

function calculateInvestmentScore(roi, neighborhood, price) {
  let score = 50; // Base score
  
  // ROI impact (up to 30 points)
  score += Math.min(30, roi * 1.5);
  
  // Neighborhood desirability (up to 15 points)
  const hotNeighborhoods = ['Fishtown', 'Northern Liberties', 'Graduate Hospital', 'Passyunk Square'];
  if (hotNeighborhoods.includes(neighborhood)) {
    score += 15;
  } else {
    score += 8;
  }
  
  // Price point impact (up to 5 points)
  if (price < 250000) {
    score += 5; // Better for micro-flipping
  }
  
  return Math.min(100, Math.round(score));
}

// Upload to Firebase
async function uploadProperties() {
  console.log('🏠 Generating 50 Philadelphia properties...');
  const properties = generateProperties();
  
  console.log('📤 Uploading to Firebase...');
  
  const batch = db.batch();
  
  properties.forEach((property, index) => {
    const docRef = db.collection('properties').doc();
    batch.set(docRef, {
      ...property,
      id: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    if ((index + 1) % 10 === 0) {
      console.log(`  ✓ Prepared ${index + 1} properties...`);
    }
  });
  
  try {
    await batch.commit();
    console.log('✅ Successfully uploaded 50 properties to Firebase!');
    
    // Log some statistics
    const stats = {
      total: properties.length,
      available: properties.filter(p => p.status === 'available').length,
      avgPrice: Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length),
      avgROI: Math.round(properties.reduce((sum, p) => sum + p.microFlipping.roi, 0) / properties.length)
    };
    
    console.log('\n📊 Property Statistics:');
    console.log(`  • Total Properties: ${stats.total}`);
    console.log(`  • Available: ${stats.available}`);
    console.log(`  • Average Price: $${stats.avgPrice.toLocaleString()}`);
    console.log(`  • Average ROI: ${stats.avgROI}%`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading properties:', error);
    process.exit(1);
  }
}

// Run the upload
uploadProperties();