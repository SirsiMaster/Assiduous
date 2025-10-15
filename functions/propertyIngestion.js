const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');

/**
 * API Endpoint: Ingest properties from external sources with remote images
 * POST /api/v1/properties/ingest
 * 
 * Supports:
 * - Remote image URLs (downloads and uploads to Firebase Storage)
 * - Base64 encoded images
 * - Multiple MLS/listing feeds
 * - Bulk property imports
 */
exports.ingestProperty = functions.https.onRequest(async (req, res) => {
  // CORS handling
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Verify API key or authentication
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    // Validate API key against Firestore
    const apiKeyDoc = await admin.firestore()
      .collection('api_keys')
      .doc(apiKey)
      .get();

    if (!apiKeyDoc.exists || !apiKeyDoc.data().active) {
      res.status(403).json({ error: 'Invalid or inactive API key' });
      return;
    }

    const { properties } = req.body;
    
    if (!properties || !Array.isArray(properties)) {
      res.status(400).json({ 
        error: 'Invalid request format. Expected { properties: [...] }' 
      });
      return;
    }

    // Process properties in parallel (with concurrency limit)
    const results = await processPropertiesBatch(properties, apiKeyDoc.data().organizationId);

    res.status(200).json({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    });

  } catch (error) {
    console.error('Property ingestion error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * Process a batch of properties with concurrency control
 */
async function processPropertiesBatch(properties, organizationId) {
  const BATCH_SIZE = 5; // Process 5 properties at a time
  const results = [];

  for (let i = 0; i < properties.length; i += BATCH_SIZE) {
    const batch = properties.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(prop => processProperty(prop, organizationId))
    );
    
    results.push(...batchResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          externalId: batch[index].externalId,
          error: result.reason.message
        };
      }
    }));
  }

  return results;
}

/**
 * Process a single property with image downloads
 */
async function processProperty(propertyData, organizationId) {
  const {
    externalId,
    title,
    description,
    price,
    address,
    bedrooms,
    bathrooms,
    squareFeet,
    images, // Array of URLs or base64 strings
    status = 'active',
    metadata = {}
  } = propertyData;

  try {
    // Validate required fields
    if (!externalId) {
      throw new Error('externalId is required');
    }

    // Check if property already exists
    const existingQuery = await admin.firestore()
      .collection('properties')
      .where('externalId', '==', externalId)
      .where('organizationId', '==', organizationId)
      .limit(1)
      .get();

    let propertyId;
    let isUpdate = false;

    if (!existingQuery.empty) {
      propertyId = existingQuery.docs[0].id;
      isUpdate = true;
    } else {
      // Create new property document
      const newPropertyRef = await admin.firestore().collection('properties').add({
        externalId,
        organizationId,
        title,
        description,
        price,
        address,
        bedrooms,
        bathrooms,
        squareFeet,
        status,
        metadata,
        images: [], // Will be populated after image processing
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'api_ingestion'
      });
      propertyId = newPropertyRef.id;
    }

    // Process images (download/upload)
    let uploadedImages = [];
    if (images && images.length > 0) {
      uploadedImages = await processPropertyImages(images, propertyId);
    }

    // Update property with image URLs
    await admin.firestore().collection('properties').doc(propertyId).update({
      images: uploadedImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log ingestion activity
    await admin.firestore().collection('ingestion_logs').add({
      propertyId,
      externalId,
      organizationId,
      action: isUpdate ? 'updated' : 'created',
      imagesProcessed: uploadedImages.length,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      propertyId,
      externalId,
      action: isUpdate ? 'updated' : 'created',
      imagesProcessed: uploadedImages.length
    };

  } catch (error) {
    console.error(`Error processing property ${externalId}:`, error);
    
    // Log error
    await admin.firestore().collection('ingestion_errors').add({
      externalId,
      organizationId,
      error: error.message,
      propertyData: JSON.stringify(propertyData),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: false,
      externalId,
      error: error.message
    };
  }
}

/**
 * Process images: download from URLs or decode base64, compress, upload to Storage
 */
async function processPropertyImages(images, propertyId) {
  const uploadedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    try {
      const imageData = images[i];
      let imageBuffer;
      let contentType = 'image/jpeg';

      // Check if URL or base64
      if (typeof imageData === 'string') {
        if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
          // Download from URL
          const response = await axios.get(imageData, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024 // 50MB max
          });
          imageBuffer = Buffer.from(response.data);
          contentType = response.headers['content-type'] || 'image/jpeg';
        } else if (imageData.startsWith('data:image')) {
          // Base64 encoded
          const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            contentType = matches[1];
            imageBuffer = Buffer.from(matches[2], 'base64');
          }
        } else {
          // Assume raw base64
          imageBuffer = Buffer.from(imageData, 'base64');
        }
      } else if (imageData.url) {
        // Object with URL property
        const response = await axios.get(imageData.url, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        imageBuffer = Buffer.from(response.data);
        contentType = imageData.contentType || 'image/jpeg';
      }

      if (!imageBuffer) {
        console.error(`Invalid image data at index ${i}`);
        continue;
      }

      // Compress image using sharp
      const compressedBuffer = await sharp(imageBuffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Generate filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${i}.jpg`;
      const storagePath = `properties/${propertyId}/images/${filename}`;

      // Upload to Firebase Storage
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);
      
      await file.save(compressedBuffer, {
        contentType: 'image/jpeg',
        metadata: {
          metadata: {
            originalIndex: i.toString(),
            processedAt: new Date().toISOString(),
            source: 'api_ingestion'
          }
        }
      });

      // Make file publicly accessible (or adjust per security requirements)
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      uploadedImages.push({
        url: publicUrl,
        path: storagePath,
        filename: filename,
        size: compressedBuffer.length,
        contentType: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        source: 'api_ingestion'
      });

      console.log(`Processed image ${i + 1}/${images.length} for property ${propertyId}`);

    } catch (error) {
      console.error(`Error processing image ${i} for property ${propertyId}:`, error);
      // Continue processing other images
    }
  }

  return uploadedImages;
}

/**
 * Bulk delete properties by external IDs
 * DELETE /api/v1/properties/bulk
 */
exports.bulkDeleteProperties = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    const apiKeyDoc = await admin.firestore()
      .collection('api_keys')
      .doc(apiKey)
      .get();

    if (!apiKeyDoc.exists || !apiKeyDoc.data().active) {
      res.status(403).json({ error: 'Invalid or inactive API key' });
      return;
    }

    const { externalIds } = req.body;
    
    if (!externalIds || !Array.isArray(externalIds)) {
      res.status(400).json({ error: 'externalIds array required' });
      return;
    }

    const organizationId = apiKeyDoc.data().organizationId;
    let deletedCount = 0;

    for (const externalId of externalIds) {
      const propertiesQuery = await admin.firestore()
        .collection('properties')
        .where('externalId', '==', externalId)
        .where('organizationId', '==', organizationId)
        .get();

      for (const doc of propertiesQuery.docs) {
        await doc.ref.delete();
        deletedCount++;
      }
    }

    res.status(200).json({
      success: true,
      deleted: deletedCount
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate and manage API keys
 */
exports.createApiKey = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth || !context.auth.token.role === 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create API keys'
    );
  }

  const { organizationId, name, permissions = [] } = data;

  if (!organizationId || !name) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'organizationId and name are required'
    );
  }

  // Generate secure API key
  const crypto = require('crypto');
  const apiKey = crypto.randomBytes(32).toString('hex');

  await admin.firestore().collection('api_keys').doc(apiKey).set({
    organizationId,
    name,
    permissions,
    active: true,
    createdBy: context.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUsed: null,
    requestCount: 0
  });

  return { apiKey, organizationId, name };
});

module.exports = {
  ingestProperty: exports.ingestProperty,
  bulkDeleteProperties: exports.bulkDeleteProperties,
  createApiKey: exports.createApiKey
};
