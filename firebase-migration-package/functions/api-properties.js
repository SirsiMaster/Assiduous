/**
 * Properties API Cloud Functions
 * Real, working backend for property operations
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Main API endpoint for properties
 */
exports.propertiesAPI = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { method, path } = req;
      const pathParts = path.split('/').filter(p => p);
      
      // Log request for monitoring
      console.log(`Properties API: ${method} ${path}`);
      
      // Route to appropriate handler
      if (pathParts[0] !== 'api' || pathParts[1] !== 'properties') {
        return res.status(404).json({ error: 'Not found' });
      }
      
      const propertyId = pathParts[2];
      const action = pathParts[3];
      
      switch (method) {
        case 'GET':
          if (propertyId === 'stats') {
            return handleGetStats(req, res);
          } else if (propertyId === 'search') {
            return handleSearch(req, res);
          } else if (propertyId) {
            return handleGetProperty(propertyId, res);
          } else {
            return handleGetProperties(req, res);
          }
          
        case 'POST':
          if (propertyId === 'bulk') {
            return handleBulkCreate(req, res);
          }
          return handleCreateProperty(req, res);
          
        case 'PATCH':
        case 'PUT':
          if (!propertyId) {
            return res.status(400).json({ error: 'Property ID required' });
          }
          return handleUpdateProperty(propertyId, req, res);
          
        case 'DELETE':
          if (!propertyId) {
            return res.status(400).json({ error: 'Property ID required' });
          }
          return handleDeleteProperty(propertyId, res);
          
        default:
          return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Properties API error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });
});

/**
 * Get all properties with filters
 */
async function handleGetProperties(req, res) {
  try {
    let query = db.collection('properties');
    
    // Apply filters from query params
    const {
      limit = 20,
      offset = 0,
      status,
      neighborhood,
      minPrice,
      maxPrice,
      minBedrooms,
      type,
      sortBy = 'listingDate',
      order = 'desc'
    } = req.query;
    
    // Status filter
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Neighborhood filter
    if (neighborhood) {
      query = query.where('neighborhood', '==', neighborhood);
    }
    
    // Property type filter
    if (type) {
      query = query.where('type', '==', type);
    }
    
    // Price range filters
    if (minPrice) {
      query = query.where('price', '>=', parseInt(minPrice));
    }
    if (maxPrice) {
      query = query.where('price', '<=', parseInt(maxPrice));
    }
    
    // Bedrooms filter
    if (minBedrooms) {
      query = query.where('bedrooms', '>=', parseInt(minBedrooms));
    }
    
    // Sorting
    const validSortFields = ['price', 'listingDate', 'sqft', 'bedrooms'];
    if (validSortFields.includes(sortBy)) {
      query = query.orderBy(sortBy, order === 'asc' ? 'asc' : 'desc');
    }
    
    // Pagination
    if (offset > 0) {
      query = query.offset(parseInt(offset));
    }
    query = query.limit(parseInt(limit));
    
    // Execute query
    const snapshot = await query.get();
    const properties = [];
    
    snapshot.forEach(doc => {
      properties.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get total count for pagination
    const countSnapshot = await db.collection('properties')
      .where('status', '==', status || 'available')
      .get();
    
    res.status(200).json({
      properties,
      pagination: {
        total: countSnapshot.size,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: properties.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
}

/**
 * Get single property by ID
 */
async function handleGetProperty(propertyId, res) {
  try {
    const doc = await db.collection('properties').doc(propertyId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Increment view count
    await doc.ref.update({
      views: admin.firestore.FieldValue.increment(1)
    });
    
    res.status(200).json({
      property: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
}

/**
 * Create new property
 */
async function handleCreateProperty(req, res) {
  try {
    const propertyData = req.body;
    
    // Validate required fields
    if (!propertyData.title || !propertyData.price || !propertyData.address) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'price', 'address']
      });
    }
    
    // Add server-side fields
    const newProperty = {
      ...propertyData,
      status: propertyData.status || 'available',
      views: 0,
      saves: 0,
      listingDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Calculate micro-flipping metrics if not provided
    if (!newProperty.microFlipping && propertyData.price) {
      newProperty.microFlipping = calculateMicroFlipping(propertyData);
    }
    
    // Create document
    const docRef = await db.collection('properties').add(newProperty);
    
    res.status(201).json({
      success: true,
      id: docRef.id,
      property: {
        id: docRef.id,
        ...newProperty
      }
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
}

/**
 * Update property
 */
async function handleUpdateProperty(propertyId, req, res) {
  try {
    const updates = req.body;
    
    // Add update timestamp
    updates.lastModified = new Date().toISOString();
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    // Update document
    await db.collection('properties').doc(propertyId).update(updates);
    
    // Get updated document
    const doc = await db.collection('properties').doc(propertyId).get();
    
    res.status(200).json({
      success: true,
      property: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Error updating property:', error);
    if (error.code === 5) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.status(500).json({ error: 'Failed to update property' });
  }
}

/**
 * Delete property
 */
async function handleDeleteProperty(propertyId, res) {
  try {
    await db.collection('properties').doc(propertyId).delete();
    
    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
}

/**
 * Get property statistics
 */
async function handleGetStats(req, res) {
  try {
    const properties = await db.collection('properties').get();
    
    let stats = {
      total: 0,
      available: 0,
      pending: 0,
      sold: 0,
      totalValue: 0,
      averagePrice: 0,
      averageROI: 0,
      neighborhoods: {},
      types: {}
    };
    
    properties.forEach(doc => {
      const property = doc.data();
      stats.total++;
      
      // Status counts
      if (property.status === 'available') stats.available++;
      else if (property.status === 'pending') stats.pending++;
      else if (property.status === 'sold') stats.sold++;
      
      // Financial metrics
      if (property.price) {
        stats.totalValue += property.price;
      }
      
      if (property.microFlipping?.roi) {
        stats.averageROI += property.microFlipping.roi;
      }
      
      // Neighborhood distribution
      if (property.neighborhood) {
        stats.neighborhoods[property.neighborhood] = 
          (stats.neighborhoods[property.neighborhood] || 0) + 1;
      }
      
      // Type distribution
      if (property.type) {
        stats.types[property.type] = 
          (stats.types[property.type] || 0) + 1;
      }
    });
    
    // Calculate averages
    if (stats.total > 0) {
      stats.averagePrice = Math.round(stats.totalValue / stats.total);
      stats.averageROI = Math.round(stats.averageROI / stats.total);
    }
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

/**
 * Search properties
 */
async function handleSearch(req, res) {
  try {
    const { q, filters = {} } = req.query;
    
    if (!q) {
      return handleGetProperties(req, res);
    }
    
    // Get all properties and filter in memory (Firestore doesn't support full-text search)
    const snapshot = await db.collection('properties').get();
    const searchTerm = q.toLowerCase();
    
    const results = [];
    snapshot.forEach(doc => {
      const property = doc.data();
      
      // Search in multiple fields
      const searchFields = [
        property.title,
        property.address,
        property.neighborhood,
        property.description,
        property.city
      ].filter(Boolean).map(f => f.toLowerCase());
      
      const matches = searchFields.some(field => field.includes(searchTerm));
      
      if (matches) {
        results.push({
          id: doc.id,
          ...property
        });
      }
    });
    
    res.status(200).json({
      properties: results,
      query: q,
      total: results.length
    });
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}

/**
 * Bulk create properties
 */
async function handleBulkCreate(req, res) {
  try {
    const { properties } = req.body;
    
    if (!Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ error: 'Properties array required' });
    }
    
    const batch = db.batch();
    const created = [];
    
    properties.forEach(property => {
      const docRef = db.collection('properties').doc();
      const newProperty = {
        ...property,
        id: docRef.id,
        status: property.status || 'available',
        views: 0,
        saves: 0,
        listingDate: new Date().toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (!newProperty.microFlipping && property.price) {
        newProperty.microFlipping = calculateMicroFlipping(property);
      }
      
      batch.set(docRef, newProperty);
      created.push({ id: docRef.id, ...newProperty });
    });
    
    await batch.commit();
    
    res.status(201).json({
      success: true,
      count: created.length,
      properties: created
    });
  } catch (error) {
    console.error('Error bulk creating properties:', error);
    res.status(500).json({ error: 'Bulk create failed' });
  }
}

/**
 * Calculate micro-flipping metrics
 */
function calculateMicroFlipping(property) {
  const price = property.price || 0;
  
  // Estimate ARV (After Repair Value) - typically 20-40% increase
  const arvMultiplier = 1.15 + Math.random() * 0.25;
  const afterRepairValue = Math.round(price * arvMultiplier);
  
  // Estimate repair costs (5-15% of purchase price)
  const repairCostPercent = 0.05 + Math.random() * 0.10;
  const estimatedRepairCost = Math.round(price * repairCostPercent);
  
  // Calculate potential profit
  const potentialProfit = afterRepairValue - price - estimatedRepairCost;
  
  // Calculate ROI
  const totalInvestment = price + estimatedRepairCost;
  const roi = totalInvestment > 0 ? Math.round((potentialProfit / totalInvestment) * 100) : 0;
  
  // Calculate investment score (0-100)
  let score = 50;
  if (roi > 30) score += 30;
  else if (roi > 20) score += 20;
  else if (roi > 10) score += 10;
  
  // Neighborhood bonus
  const hotNeighborhoods = ['Fishtown', 'Northern Liberties', 'Graduate Hospital'];
  if (hotNeighborhoods.includes(property.neighborhood)) {
    score += 15;
  }
  
  // Price point bonus (lower prices better for flipping)
  if (price < 200000) score += 10;
  else if (price < 300000) score += 5;
  
  return {
    afterRepairValue,
    estimatedRepairCost,
    potentialProfit,
    roi,
    investmentScore: Math.min(100, score),
    holdingTime: '3-4 months',
    marketDemand: score > 70 ? 'High' : score > 50 ? 'Medium' : 'Low'
  };
}

// Export for use in index.js
module.exports = { propertiesAPI };