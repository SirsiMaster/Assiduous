import {onRequest} from "firebase-functions/v2/https";
import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import sharp from "sharp";

/**
 * Property Ingestion API - Bulk import properties with image processing
 */

interface PropertyData {
  externalId: string;
  title?: string;
  description?: string;
  price?: number;
  address?: any;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  images?: any[];
  status?: string;
  metadata?: any;
}

/**
 * Ingest properties from external sources
 */
export const ingestProperty = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    // Verify API key
    const apiKey = req.headers["x-api-key"] as string || req.query.apiKey as string;
    if (!apiKey) {
      res.status(401).json({error: "API key required"});
      return;
    }

    const apiKeyDoc = await admin.firestore()
      .collection("api_keys")
      .doc(apiKey)
      .get();

    if (!apiKeyDoc.exists || !apiKeyDoc.data()?.active) {
      res.status(403).json({error: "Invalid or inactive API key"});
      return;
    }

    const {properties} = req.body;

    if (!properties || !Array.isArray(properties)) {
      res.status(400).json({
        error: "Invalid request format. Expected { properties: [...] }",
      });
      return;
    }

    const organizationId = apiKeyDoc.data()?.organizationId;
    const results = await processPropertiesBatch(properties, organizationId);

    res.status(200).json({
      success: true,
      processed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results: results,
    });
  } catch (error: any) {
    logger.error("Property ingestion error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * Process properties in batches
 */
async function processPropertiesBatch(
  properties: PropertyData[],
  organizationId: string
): Promise<any[]> {
  const BATCH_SIZE = 5;
  const results = [];

  for (let i = 0; i < properties.length; i += BATCH_SIZE) {
    const batch = properties.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((prop) => processProperty(prop, organizationId))
    );

    results.push(...batchResults.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          externalId: batch[index].externalId,
          error: result.reason.message,
        };
      }
    }));
  }

  return results;
}

/**
 * Process single property
 */
async function processProperty(
  propertyData: PropertyData,
  organizationId: string
): Promise<any> {
  const {
    externalId,
    title,
    description,
    price,
    address,
    bedrooms,
    bathrooms,
    squareFeet,
    images,
    status = "active",
    metadata = {},
  } = propertyData;

  try {
    if (!externalId) {
      throw new Error("externalId is required");
    }

    // Check if property exists
    const existingQuery = await admin.firestore()
      .collection("properties")
      .where("externalId", "==", externalId)
      .where("organizationId", "==", organizationId)
      .limit(1)
      .get();

    let propertyId: string;
    let isUpdate = false;

    if (!existingQuery.empty) {
      propertyId = existingQuery.docs[0].id;
      isUpdate = true;
    } else {
      const newPropertyRef = await admin.firestore().collection("properties").add({
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
        images: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: "api_ingestion",
      });
      propertyId = newPropertyRef.id;
    }

    // Process images
    let uploadedImages: any[] = [];
    if (images && images.length > 0) {
      uploadedImages = await processPropertyImages(images, propertyId);
    }

    // Update property with images
    await admin.firestore().collection("properties").doc(propertyId).update({
      images: uploadedImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log activity
    await admin.firestore().collection("ingestion_logs").add({
      propertyId,
      externalId,
      organizationId,
      action: isUpdate ? "updated" : "created",
      imagesProcessed: uploadedImages.length,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      propertyId,
      externalId,
      action: isUpdate ? "updated" : "created",
      imagesProcessed: uploadedImages.length,
    };
  } catch (error: any) {
    logger.error(`Error processing property ${externalId}:`, error);

    await admin.firestore().collection("ingestion_errors").add({
      externalId,
      organizationId,
      error: error.message,
      propertyData: JSON.stringify(propertyData),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: false,
      externalId,
      error: error.message,
    };
  }
}

/**
 * Process property images
 */
async function processPropertyImages(
  images: any[],
  propertyId: string
): Promise<any[]> {
  const uploadedImages = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const imageData = images[i];
      let imageBuffer: Buffer;

      // Handle different image formats
      if (typeof imageData === "string") {
        if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
          // Download from URL
          const response = await axios.get(imageData, {
            responseType: "arraybuffer",
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024,
          });
          imageBuffer = Buffer.from(response.data);
        } else if (imageData.startsWith("data:image")) {
          // Base64 with data URI
          const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            imageBuffer = Buffer.from(matches[2], "base64");
          } else {
            continue;
          }
        } else {
          // Raw base64
          imageBuffer = Buffer.from(imageData, "base64");
        }
      } else if (imageData.url) {
        const response = await axios.get(imageData.url, {
          responseType: "arraybuffer",
          timeout: 30000,
        });
        imageBuffer = Buffer.from(response.data);
      } else {
        continue;
      }

      // Compress image
      const compressedBuffer = await sharp(imageBuffer)
        .resize(2048, 2048, {fit: "inside", withoutEnlargement: true})
        .jpeg({quality: 80})
        .toBuffer();

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const filename = `${timestamp}_${i}.jpg`;
      const storagePath = `properties/${propertyId}/images/${filename}`;

      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);

      await file.save(compressedBuffer, {
        contentType: "image/jpeg",
        metadata: {
          metadata: {
            originalIndex: i.toString(),
            processedAt: new Date().toISOString(),
            source: "api_ingestion",
          },
        },
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      uploadedImages.push({
        url: publicUrl,
        path: storagePath,
        filename: filename,
        size: compressedBuffer.length,
        contentType: "image/jpeg",
        uploadedAt: new Date().toISOString(),
        source: "api_ingestion",
      });

      logger.info(`Processed image ${i + 1}/${images.length} for property ${propertyId}`);
    } catch (error: any) {
      logger.error(`Error processing image ${i} for property ${propertyId}:`, error);
      // Continue processing other images
    }
  }

  return uploadedImages;
}

/**
 * Bulk delete properties
 */
export const bulkDeleteProperties = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "DELETE");
    res.set("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
    res.status(204).send("");
    return;
  }

  if (req.method !== "DELETE") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const apiKey = req.headers["x-api-key"] as string || req.query.apiKey as string;
    if (!apiKey) {
      res.status(401).json({error: "API key required"});
      return;
    }

    const apiKeyDoc = await admin.firestore()
      .collection("api_keys")
      .doc(apiKey)
      .get();

    if (!apiKeyDoc.exists || !apiKeyDoc.data()?.active) {
      res.status(403).json({error: "Invalid or inactive API key"});
      return;
    }

    const {externalIds} = req.body;

    if (!externalIds || !Array.isArray(externalIds)) {
      res.status(400).json({error: "externalIds array required"});
      return;
    }

    const organizationId = apiKeyDoc.data()?.organizationId;
    let deletedCount = 0;

    for (const externalId of externalIds) {
      const propertiesQuery = await admin.firestore()
        .collection("properties")
        .where("externalId", "==", externalId)
        .where("organizationId", "==", organizationId)
        .get();

      for (const doc of propertiesQuery.docs) {
        await doc.ref.delete();
        deletedCount++;
      }
    }

    res.status(200).json({
      success: true,
      deleted: deletedCount,
    });
  } catch (error: any) {
    logger.error("Bulk delete error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * Create API key (callable function)
 */
export const createApiKey = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new Error("Only admins can create API keys");
  }

  const {organizationId, name, permissions = []} = request.data;

  if (!organizationId || !name) {
    throw new Error("organizationId and name are required");
  }

  const crypto = require("crypto");
  const apiKey = crypto.randomBytes(32).toString("hex");

  await admin.firestore().collection("api_keys").doc(apiKey).set({
    organizationId,
    name,
    permissions,
    active: true,
    createdBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUsed: null,
    requestCount: 0,
  });

  return {apiKey, organizationId, name};
});
