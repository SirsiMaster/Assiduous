/**
 * Assiduous Real Estate Platform - Cloud Functions
 * Complete Backend API - Stream 1 Implementation
 * Day 1: Backend Foundation
 * Updated: Stripe Payment Integration
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {beforeUserCreated} from "firebase-functions/v2/identity";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Import Stripe functions (temporarily disabled for deployment)
let stripeModule: any = {
  createPaymentIntent: () => Promise.reject(new Error("Stripe not configured")),
  retrievePaymentIntent: () => Promise.reject(new Error("Stripe not configured")),
  createRefund: () => Promise.reject(new Error("Stripe not configured")),
  handleStripeWebhook: () => Promise.reject(new Error("Stripe not configured")),
};

// Import Property Ingestion functions (temporarily disabled)
// import * as propertyIngestion from "./propertyIngestion";

// Import Email Service
import * as emailService from "./emailService";

// Import Test Users function (REMOVE before production!)
import {createTestUsers} from "./createTestUsers";

// Import RBAC functions
import * as rbacFunctions from "./rbac";

// Define secrets for v2 functions
const sendgridApiKey = defineSecret("SENDGRID_API_KEY");
const sendgridFromEmail = defineSecret("SENDGRID_FROM_EMAIL");
// @ts-ignore - Will be used in SMS implementation
const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
// @ts-ignore - Will be used in SMS implementation
const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
// @ts-ignore - Will be used in SMS implementation
const twilioFromNumber = defineSecret("TWILIO_FROM_NUMBER");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
// @ts-ignore - Will be used in webhook implementation
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Set global options
setGlobalOptions({maxInstances: 10});

// ============================================================================
// API ENDPOINTS - Express-style routing with v2 API
// ============================================================================

/**
 * Main API endpoint
 * Handles all /api/* routes
 */
export const api = onRequest(
  {
    secrets: [sendgridApiKey, sendgridFromEmail, stripeSecretKey],
    region: "us-central1",
    maxInstances: 10,
  },
  async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const path = req.path;
  const method = req.method;

  logger.info("API Request", {path, method});

  try {
    // Health check
    if (path === "/health" && method === "GET") {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "Assiduous API v1.0",
      });
      return;
    }

    // Properties endpoints
    if (path.startsWith("/properties")) {
      await handlePropertyRoutes(req, res, path, method);
      return;
    }

    // User endpoints
    if (path.startsWith("/user")) {
      await handleUserRoutes(req, res, path, method);
      return;
    }

    // Lead endpoints
    if (path.startsWith("/leads")) {
      await handleLeadRoutes(req, res, path, method);
      return;
    }

    // Analytics endpoints
    if (path.startsWith("/analytics")) {
      await handleAnalyticsRoutes(req, res, path, method);
      return;
    }

    // Payment endpoints (Stripe)
    if (path.startsWith("/payments")) {
      await handlePaymentRoutes(req, res, path, method);
      return;
    }

    // Transaction endpoints
    if (path.startsWith("/transactions")) {
      await handleTransactionRoutes(req, res, path, method);
      return;
    }

    // Route not found
    res.status(404).json({error: "Route not found"});
  } catch (error) {
    logger.error("API Error", error);
    res.status(500).json({error: "Internal server error"});
  }
});

// ============================================================================
// HELPER FUNCTIONS - Auth & Validation
// ============================================================================

/**
 * Extract and verify Firebase Auth token
 */
async function verifyAuth(authHeader: string): Promise<any> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Invalid authorization header");
  }
  const token = authHeader.substring(7);
  const decodedToken = await admin.auth().verifyIdToken(token);
  
  // Get user document to check role
  const userDoc = await db.collection("users").doc(decodedToken.uid).get();
  const userData = userDoc.data() || {};
  
  return {
    ...decodedToken,
    uid: decodedToken.uid,
    email: decodedToken.email,
    role: userData.role || "client",
  };
}

/**
 * Check if user is admin
 */
function isAdmin(user: any): boolean {
  return user && user.role === "admin";
}

/**
 * Check if user is agent
 */
function isAgent(user: any): boolean {
  return user && user.role === "agent";
}

/**
 * Validate property data
 */
function validateProperty(payload: any): string | null {
  const required = ["title", "price", "status", "city", "state", "zip", "type"];
  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
      return `Missing required field: ${key}`;
    }
  }
  
  // Validate price is a number
  if (typeof payload.price !== "number" || payload.price < 0) {
    return "Invalid price: must be a positive number";
  }
  
  return null;
}

// ============================================================================
// PROPERTY ROUTES
// ============================================================================

async function handlePropertyRoutes(
  req: any,
  res: any,
  path: string,
  method: string
) {
  try {
    // GET /properties - List properties with filters
    if (path === "/properties" && method === "GET") {
      const {
        status = "available",
        city,
        type,
        agentId,
        minPrice,
        maxPrice,
        beds,
        baths,
        limit = "25",
        orderBy = "createdAt",
        direction = "desc",
      } = req.query;

      let query: any = db.collection("properties");

      // Apply filters
      if (status) query = query.where("status", "==", status);
      if (city) query = query.where("city", "==", city);
      if (type) query = query.where("type", "==", type);
      if (agentId) query = query.where("agentId", "==", agentId);
      
      // Note: Range queries need indexes
      if (minPrice) query = query.where("price", ">=", Number(minPrice));
      if (maxPrice) query = query.where("price", "<=", Number(maxPrice));
      if (beds) query = query.where("beds", ">=", Number(beds));
      if (baths) query = query.where("baths", ">=", Number(baths));

      query = query.orderBy(orderBy, direction).limit(Number(limit));

      const snapshot = await query.get();
      const data = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({data, total: data.length});
      return;
    }

    // GET /properties/:id - Get single property
    if (path.match(/\/properties\/[a-zA-Z0-9]+$/) && method === "GET") {
      const id = path.split("/").pop();
      const doc = await db.collection("properties").doc(id!).get();

      if (!doc.exists) {
        res.status(404).json({error: "Property not found"});
        return;
      }

      res.json({id: doc.id, ...doc.data()});
      return;
    }

    // POST /properties - Create property (authenticated, agent/admin only)
    if (path === "/properties" && method === "POST") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user) && !isAgent(user)) {
        res.status(403).json({error: "Forbidden: Admin or Agent role required"});
        return;
      }

      // Validate property data
      const validationError = validateProperty(req.body);
      if (validationError) {
        res.status(400).json({error: validationError});
        return;
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const propertyData = {
        ...req.body,
        price: Number(req.body.price),
        beds: Number(req.body.beds || 0),
        baths: Number(req.body.baths || 0),
        sqft: Number(req.body.sqft || 0),
        agentId: isAgent(user) ? user.uid : (req.body.agentId || null),
        createdAt: now,
        updatedAt: now,
        images: req.body.images || [],
        features: req.body.features || [],
        status: req.body.status || "available",
      };

      const docRef = await db.collection("properties").add(propertyData);
      res.status(201).json({id: docRef.id, message: "Property created successfully"});
      return;
    }

    // PUT /properties/:id - Update property (authenticated, agent/admin)
    if (path.match(/\/properties\/[a-zA-Z0-9]+$/) && method === "PUT") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user) && !isAgent(user)) {
        res.status(403).json({error: "Forbidden: Admin or Agent role required"});
        return;
      }

      const id = path.split("/").pop();
      const docRef = db.collection("properties").doc(id!);
      const doc = await docRef.get();

      if (!doc.exists) {
        res.status(404).json({error: "Property not found"});
        return;
      }

      const existingData = doc.data();
      
      // Agents can only edit their own properties
      if (isAgent(user) && existingData?.agentId !== user.uid) {
        res.status(403).json({error: "Forbidden: Cannot edit another agent's property"});
        return;
      }

      const updateData: any = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      // Convert numeric fields
      if (updateData.price) updateData.price = Number(updateData.price);
      if (updateData.beds) updateData.beds = Number(updateData.beds);
      if (updateData.baths) updateData.baths = Number(updateData.baths);
      if (updateData.sqft) updateData.sqft = Number(updateData.sqft);

      await docRef.update(updateData);
      res.json({success: true, message: "Property updated successfully"});
      return;
    }

    // DELETE /properties/:id - Delete property (admin only)
    if (path.match(/\/properties\/[a-zA-Z0-9]+$/) && method === "DELETE") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user)) {
        res.status(403).json({error: "Forbidden: Admin role required"});
        return;
      }

      const id = path.split("/").pop();
      const docRef = db.collection("properties").doc(id!);
      const doc = await docRef.get();

      if (!doc.exists) {
        res.status(404).json({error: "Property not found"});
        return;
      }

      await docRef.delete();
      res.json({success: true, message: "Property deleted successfully"});
      return;
    }

    // POST /properties/:id/images:signedUpload - Get signed URL for image upload
    if (path.match(/\/properties\/[a-zA-Z0-9]+\/images:signedUpload$/) && method === "POST") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user) && !isAgent(user)) {
        res.status(403).json({error: "Forbidden: Admin or Agent role required"});
        return;
      }

      const propertyId = path.split("/")[2];
      const propRef = db.collection("properties").doc(propertyId);
      const propDoc = await propRef.get();

      if (!propDoc.exists) {
        res.status(404).json({error: "Property not found"});
        return;
      }

      const propData = propDoc.data();
      if (isAgent(user) && propData?.agentId !== user.uid) {
        res.status(403).json({error: "Forbidden: Cannot upload images for another agent's property"});
        return;
      }

      const {fileName, contentType} = req.body;
      if (!fileName || !contentType) {
        res.status(400).json({error: "fileName and contentType are required"});
        return;
      }

      // Generate signed URL for upload
      const bucket = admin.storage().bucket();
      const destPath = `properties/${propertyId}/${Date.now()}_${fileName}`;
      const file = bucket.file(destPath);

      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType,
      });

      res.json({
        uploadUrl: url,
        storagePath: destPath,
        message: "Upload your file to the uploadUrl using PUT request",
      });
      return;
    }

    res.status(404).json({error: "Route not found"});
  } catch (error: any) {
    logger.error("Property route error", error);
    if (error.message.includes("Invalid authorization")) {
      res.status(401).json({error: "Invalid or expired token"});
    } else {
      res.status(500).json({error: "Internal server error", details: error.message});
    }
  }
}

// ============================================================================
// USER ROUTES
// ============================================================================

async function handleUserRoutes(
  req: any,
  res: any,
  path: string,
  method: string
) {
  // All user routes require authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({error: "Unauthorized"});
    return;
  }

  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // GET /user/profile
    if (path === "/user/profile" && method === "GET") {
      const doc = await db.collection("users").doc(userId).get();

      if (!doc.exists) {
        // Create default profile
        const defaultProfile = {
          id: userId,
          email: decodedToken.email,
          profile: {name: "", phone: "", role: "buyer"},
          preferences: {
            locations: [],
            priceRange: {min: 0, max: 1000000},
            propertyTypes: [],
          },
          favorites: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("users").doc(userId).set(defaultProfile);
        res.json({user: defaultProfile});
        return;
      }

      res.json({user: {id: doc.id, ...doc.data()}});
      return;
    }

    // PUT /user/profile
    if (path === "/user/profile" && method === "PUT") {
      const {profile, preferences} = req.body;
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (profile) updateData.profile = profile;
      if (preferences) updateData.preferences = preferences;

      await db.collection("users").doc(userId).update(updateData);
      res.json({message: "Profile updated"});
      return;
    }

    // GET /user/favorites
    if (path === "/user/favorites" && method === "GET") {
      const userDoc = await db.collection("users").doc(userId).get();
      const favorites = userDoc.data()?.favorites || [];

      if (favorites.length === 0) {
        res.json({favorites: []});
        return;
      }

      const propertyPromises = favorites.map((id: string) =>
        db.collection("properties").doc(id).get()
      );
      const propertyDocs = await Promise.all(propertyPromises);
      const properties = propertyDocs
        .filter((doc) => doc.exists)
        .map((doc) => ({id: doc.id, ...doc.data()}));

      res.json({favorites: properties});
      return;
    }

    // POST /user/favorites
    if (path === "/user/favorites" && method === "POST") {
      const {propertyId} = req.body;
      if (!propertyId) {
        res.status(400).json({error: "Property ID required"});
        return;
      }

      await db.collection("users").doc(userId).update({
        favorites: admin.firestore.FieldValue.arrayUnion(propertyId),
      });
      res.json({message: "Added to favorites"});
      return;
    }
  } catch (error) {
    logger.error("User route error", error);
    res.status(401).json({error: "Invalid token"});
    return;
  }

  res.status(404).json({error: "Route not found"});
}

// ============================================================================
// LEAD ROUTES
// ============================================================================

async function handleLeadRoutes(
  req: any,
  res: any,
  path: string,
  method: string
) {
  try {
    // POST /leads - Submit lead (public, no auth required)
    if (path === "/leads" && method === "POST") {
      const {propertyId, name, email, phone, message, clientId} = req.body;

      if (!propertyId || !name || !email) {
        res.status(400).json({error: "Required fields: propertyId, name, email"});
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({error: "Invalid email format"});
        return;
      }

      const leadData = {
        propertyId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : "",
        message: message ? message.trim() : "",
        clientId: clientId || null,
        status: "new",
        assignedAgentId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection("leads").add(leadData);
      
      logger.info("Lead created", {leadId: docRef.id, propertyId, email});
      
      res.status(201).json({
        id: docRef.id,
        success: true,
        message: "Lead submitted successfully",
      });
      return;
    }

    // GET /leads - Get leads (authenticated, filtered by role)
    if (path === "/leads" && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      const mine = req.query.mine === "true";
      const status = req.query.status;
      const limit = parseInt(req.query.limit || "100");

      let query: any = db.collection("leads");

      // Agents can only see their assigned leads when mine=true
      if (isAgent(user) && mine) {
        query = query.where("assignedAgentId", "==", user.uid);
      }
      // Admins see all leads unless filtered
      else if (!isAdmin(user)) {
        res.status(403).json({error: "Forbidden: Admin or Agent role required"});
        return;
      }

      // Apply status filter if provided
      if (status) {
        query = query.where("status", "==", status);
      }

      query = query.orderBy("createdAt", "desc").limit(limit);

      const snapshot = await query.get();
      const data = snapshot.docs.map((doc: any) => ({id: doc.id, ...doc.data()}));

      res.json({data, total: data.length});
      return;
    }

    // PUT /leads/:id - Update lead (authenticated, agent/admin)
    if (path.match(/\/leads\/[a-zA-Z0-9]+$/) && method === "PUT") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user) && !isAgent(user)) {
        res.status(403).json({error: "Forbidden: Admin or Agent role required"});
        return;
      }

      const leadId = path.split("/").pop();
      const leadRef = db.collection("leads").doc(leadId!);
      const leadDoc = await leadRef.get();

      if (!leadDoc.exists) {
        res.status(404).json({error: "Lead not found"});
        return;
      }

      const existingData = leadDoc.data();
      
      // Agents can only update their own assigned leads
      if (isAgent(user) && existingData?.assignedAgentId !== user.uid) {
        res.status(403).json({error: "Forbidden: Can only update assigned leads"});
        return;
      }

      const updateData: any = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await leadRef.update(updateData);
      logger.info("Lead updated", {leadId, userId: user.uid});
      
      res.json({success: true, message: "Lead updated successfully"});
      return;
    }

    // POST /leads/:id/assign:auto - Auto-assign lead to next agent (admin only)
    if (path.match(/\/leads\/[a-zA-Z0-9]+\/assign:auto$/) && method === "POST") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user)) {
        res.status(403).json({error: "Forbidden: Admin role required"});
        return;
      }

      const leadId = path.split("/")[2];
      const leadRef = db.collection("leads").doc(leadId);
      const leadDoc = await leadRef.get();

      if (!leadDoc.exists) {
        res.status(404).json({error: "Lead not found"});
        return;
      }

      // Get next agent via round-robin
      const agentsSnap = await db
        .collection("users")
        .where("role", "==", "agent")
        .where("active", "==", true)
        .get();

      if (agentsSnap.empty) {
        res.status(400).json({error: "No active agents available"});
        return;
      }

      const agents = agentsSnap.docs.map((d) => ({uid: d.id, ...d.data()}));
      
      // Get round-robin counter
      const rrRef = db.collection("counters").doc("leadRouting");
      const rrDoc = await rrRef.get();
      
      let nextAgentUid = agents[0].uid;
      if (rrDoc.exists) {
        const lastUid = rrDoc.data()?.lastAssignedAgentUid;
        const lastIndex = agents.findIndex((a: any) => a.uid === lastUid);
        nextAgentUid = agents[(lastIndex + 1) % agents.length].uid;
      }

      // Update counter
      await rrRef.set({lastAssignedAgentUid: nextAgentUid}, {merge: true});

      // Assign lead
      await leadRef.update({
        assignedAgentId: nextAgentUid,
        status: "assigned",
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create relationship if clientId exists
      const leadData = leadDoc.data();
      if (leadData?.clientId) {
        await db.collection("relationships").add({
          clientId: leadData.clientId,
          agentId: nextAgentUid,
          leadId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      logger.info("Lead auto-assigned", {leadId, agentId: nextAgentUid});
      
      res.json({success: true, agentId: nextAgentUid});
      return;
    }

    // POST /leads/:id/assign:manual - Manually assign lead (admin only)
    if (path.match(/\/leads\/[a-zA-Z0-9]+\/assign:manual$/) && method === "POST") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user)) {
        res.status(403).json({error: "Forbidden: Admin role required"});
        return;
      }

      const {agentId} = req.body;
      if (!agentId) {
        res.status(400).json({error: "agentId required"});
        return;
      }

      const leadId = path.split("/")[2];
      const leadRef = db.collection("leads").doc(leadId);
      const leadDoc = await leadRef.get();

      if (!leadDoc.exists) {
        res.status(404).json({error: "Lead not found"});
        return;
      }

      // Verify agent exists and is active
      const agentDoc = await db.collection("users").doc(agentId).get();
      if (!agentDoc.exists || agentDoc.data()?.role !== "agent") {
        res.status(400).json({error: "Invalid agent ID"});
        return;
      }

      await leadRef.update({
        assignedAgentId: agentId,
        status: "assigned",
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create relationship if clientId exists
      const leadData = leadDoc.data();
      if (leadData?.clientId) {
        await db.collection("relationships").add({
          clientId: leadData.clientId,
          agentId,
          leadId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      logger.info("Lead manually assigned", {leadId, agentId});
      
      res.json({success: true, message: "Lead assigned successfully"});
      return;
    }

    res.status(404).json({error: "Route not found"});
  } catch (error: any) {
    logger.error("Lead route error", error);
    if (error.message.includes("Invalid authorization")) {
      res.status(401).json({error: "Invalid or expired token"});
    } else {
      res.status(500).json({error: "Internal server error", details: error.message});
    }
  }
}

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

async function handleAnalyticsRoutes(
  req: any,
  res: any,
  path: string,
  method: string
) {
  // POST /analytics/track - Track event (public)
  if (path === "/analytics/track" && method === "POST") {
    const {event, properties, userId} = req.body;

    if (!event) {
      res.status(400).json({error: "Event name required"});
      return;
    }

    const analyticsData = {
      event,
      properties: properties || {},
      userId: userId || "anonymous",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("analytics_events").add(analyticsData);
    res.json({success: true});
    return;
  }

  // GET /analytics/dashboard - Get dashboard (authenticated)
  if (path === "/analytics/dashboard" && method === "GET") {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    const propertiesSnapshot = await db.collection("properties").get();
    const usersSnapshot = await db.collection("users").get();
    const leadsSnapshot = await db.collection("leads").get();

    res.json({
      metrics: {
        properties: propertiesSnapshot.size,
        users: usersSnapshot.size,
        leads: leadsSnapshot.size,
      },
    });
    return;
  }

  res.status(404).json({error: "Route not found"});
}

// ============================================================================
// PAYMENT ROUTES (STRIPE)
// ============================================================================

async function handlePaymentRoutes(
  req: any,
  res: any,
  path: string,
  method: string
) {
  // POST /payments/create-intent - Create payment intent
  if (path === "/payments/create-intent" && method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    try {
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const {amount, currency = "usd", description} = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({error: "Invalid amount"});
        return;
      }

      // Create payment intent using Stripe module
      const paymentIntent = await stripeModule.createPaymentIntent(
        amount,
        currency,
        {
          userId,
          description: description || "Property transaction",
        }
      );

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
      return;
    } catch (error: any) {
      logger.error("Payment intent creation error", error);
      res.status(500).json({error: error.message || "Payment failed"});
      return;
    }
  }

  // POST /payments/verify - Verify payment
  if (path === "/payments/verify" && method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    try {
      const {paymentIntentId} = req.body;

      if (!paymentIntentId) {
        res.status(400).json({error: "Payment intent ID required"});
        return;
      }

      const paymentIntent = await stripeModule.retrievePaymentIntent(
        paymentIntentId
      );

      res.json({
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        verified: paymentIntent.status === "succeeded",
      });
      return;
    } catch (error: any) {
      logger.error("Payment verification error", error);
      res.status(500).json({error: error.message || "Verification failed"});
      return;
    }
  }

  // POST /payments/refund - Process refund
  if (path === "/payments/refund" && method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    try {
      const token = authHeader.split("Bearer ")[1];
      await admin.auth().verifyIdToken(token);

      const {paymentIntentId, amount, reason} = req.body;

      if (!paymentIntentId) {
        res.status(400).json({error: "Payment intent ID required"});
        return;
      }

      const refund = await stripeModule.createRefund(
        paymentIntentId,
        amount,
        reason
      );

      res.json({
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      });
      return;
    } catch (error: any) {
      logger.error("Refund error", error);
      res.status(500).json({error: error.message || "Refund failed"});
      return;
    }
  }

  res.status(404).json({error: "Route not found"});
}

// ============================================================================
// TRANSACTION ROUTES
// ============================================================================

async function handleTransactionRoutes(
  req: any,
  res: any,
  path: string,
  method: string
) {
  try {
    // POST /transactions - Create transaction
    if (path === "/transactions" && method === "POST") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user) && !isAgent(user)) {
        res.status(403).json({error: "Forbidden: Admin or Agent role required"});
        return;
      }

      const {
        propertyId,
        offerPrice,
        agreedPrice,
        buyerId,
        commissionRate = 0.03,
      } = req.body;

      if (!propertyId || !offerPrice) {
        res.status(400).json({error: "propertyId and offerPrice are required"});
        return;
      }

      const agentId = isAgent(user) ? user.uid : req.body.agentId;
      const agreed = agreedPrice || offerPrice;
      const commissionAmount = agreed * commissionRate;

      const transactionData = {
        propertyId,
        offerPrice: Number(offerPrice),
        agreedPrice: Number(agreed),
        buyerId: buyerId || null,
        agentId,
        status: "offer",
        milestones: [
          {
            name: "Offer Submitted",
            at: admin.firestore.FieldValue.serverTimestamp(),
          },
        ],
        commissionRate: Number(commissionRate),
        commissionAmount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const txnRef = await db.collection("transactions").add(transactionData);
      logger.info("Transaction created", {transactionId: txnRef.id, agentId});

      res.status(201).json({success: true, id: txnRef.id});
      return;
    }

    // GET /transactions - List transactions
    if (path === "/transactions" && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      let query = db.collection("transactions");

      // Agents see only their transactions
      if (isAgent(user)) {
        query = query.where("agentId", "==", user.uid) as any;
      }

      // Clients see transactions where they're the buyer
      if (!isAdmin(user) && !isAgent(user)) {
        query = query.where("buyerId", "==", user.uid) as any;
      }

      const snapshot = await query.orderBy("createdAt", "desc").limit(100).get();
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({data: transactions});
      return;
    }

    // GET /transactions/:id - Get transaction details
    if (path.match(/\/transactions\/[a-zA-Z0-9]+$/) && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      const id = path.split("/").pop();
      const docRef = db.collection("transactions").doc(id!);
      const doc = await docRef.get();

      if (!doc.exists) {
        res.status(404).json({error: "Transaction not found"});
        return;
      }

      const txnData = doc.data();

      // Check access permissions
      if (
        !isAdmin(user) &&
        txnData?.agentId !== user.uid &&
        txnData?.buyerId !== user.uid
      ) {
        res.status(403).json({error: "Forbidden: Access denied"});
        return;
      }

      res.json({id: doc.id, ...txnData});
      return;
    }

    // PUT /transactions/:id - Update transaction
    if (path.match(/\/transactions\/[a-zA-Z0-9]+$/) && method === "PUT") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      const id = path.split("/").pop();
      const docRef = db.collection("transactions").doc(id!);
      const doc = await docRef.get();

      if (!doc.exists) {
        res.status(404).json({error: "Transaction not found"});
        return;
      }

      const existingData = doc.data();

      // Only admin or transaction agent can update
      if (!isAdmin(user) && existingData?.agentId !== user.uid) {
        res.status(403).json({error: "Forbidden: Access denied"});
        return;
      }

      const updateData: any = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Recalculate commission if agreed price or rate changes
      if (updateData.agreedPrice || updateData.commissionRate) {
        const agreed = updateData.agreedPrice || existingData?.agreedPrice || 0;
        const rate = updateData.commissionRate || existingData?.commissionRate || 0.03;
        updateData.commissionAmount = Number(agreed) * Number(rate);
      }

      // Add milestone if status changes
      if (updateData.status && updateData.status !== existingData?.status) {
        updateData.milestones = admin.firestore.FieldValue.arrayUnion({
          name: `Status: ${updateData.status}`,
          at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await docRef.update(updateData);
      logger.info("Transaction updated", {transactionId: id, agentId: user.uid});

      res.json({success: true, message: "Transaction updated"});
      return;
    }

    // DELETE /transactions/:id - Delete transaction (admin only)
    if (path.match(/\/transactions\/[a-zA-Z0-9]+$/) && method === "DELETE") {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      if (!isAdmin(user)) {
        res.status(403).json({error: "Forbidden: Admin role required"});
        return;
      }

      const id = path.split("/").pop();
      await db.collection("transactions").doc(id!).delete();
      logger.info("Transaction deleted", {transactionId: id});

      res.json({success: true, message: "Transaction deleted"});
      return;
    }

    // POST /transactions/:id/documents:signedUpload - Get signed URL for document upload
    if (
      path.match(/\/transactions\/[a-zA-Z0-9]+\/documents:signedUpload$/) &&
      method === "POST"
    ) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      const transactionId = path.split("/")[2];
      const txnRef = db.collection("transactions").doc(transactionId);
      const txnDoc = await txnRef.get();

      if (!txnDoc.exists) {
        res.status(404).json({error: "Transaction not found"});
        return;
      }

      const txnData = txnDoc.data();

      // Check access permissions
      if (
        !isAdmin(user) &&
        txnData?.agentId !== user.uid &&
        txnData?.buyerId !== user.uid
      ) {
        res.status(403).json({error: "Forbidden: Access denied"});
        return;
      }

      const {fileName, contentType, docType = "general"} = req.body;
      if (!fileName || !contentType) {
        res.status(400).json({error: "fileName and contentType are required"});
        return;
      }

      // Generate signed URL for upload
      const bucket = admin.storage().bucket();
      const destPath = `documents/${transactionId}/${Date.now()}_${fileName}`;
      const file = bucket.file(destPath);

      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType,
      });

      // Optionally store document metadata in subcollection
      await db
        .collection("transactions")
        .doc(transactionId)
        .collection("documents")
        .add({
          fileName,
          storagePath: destPath,
          type: docType,
          uploadedBy: user.uid,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      logger.info("Document signed URL generated", {
        transactionId,
        fileName,
        uploadedBy: user.uid,
      });

      res.json({
        uploadUrl: url,
        storagePath: destPath,
        docType,
        message: "Upload your file to the uploadUrl using PUT request",
      });
      return;
    }

    // GET /transactions/:id/documents - List transaction documents
    if (
      path.match(/\/transactions\/[a-zA-Z0-9]+\/documents$/) &&
      method === "GET"
    ) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({error: "Authentication required"});
        return;
      }

      const user = await verifyAuth(authHeader);
      const transactionId = path.split("/")[2];
      const txnRef = db.collection("transactions").doc(transactionId);
      const txnDoc = await txnRef.get();

      if (!txnDoc.exists) {
        res.status(404).json({error: "Transaction not found"});
        return;
      }

      const txnData = txnDoc.data();

      // Check access permissions
      if (
        !isAdmin(user) &&
        txnData?.agentId !== user.uid &&
        txnData?.buyerId !== user.uid
      ) {
        res.status(403).json({error: "Forbidden: Access denied"});
        return;
      }

      const docsSnapshot = await db
        .collection("transactions")
        .doc(transactionId)
        .collection("documents")
        .orderBy("uploadedAt", "desc")
        .get();

      const documents = docsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({data: documents});
      return;
    }

    res.status(404).json({error: "Route not found"});
  } catch (error: any) {
    logger.error("Transaction route error", error);
    if (error.message.includes("Invalid authorization")) {
      res.status(401).json({error: "Invalid or expired token"});
    } else {
      res.status(500).json({error: "Internal server error", details: error.message});
    }
  }
}

// ============================================================================
// FIRESTORE TRIGGERS
// ============================================================================

/**
 * Trigger: New lead created - Send notification to agent
 */
export const onLeadCreated = onDocumentCreated(
  {
    document: "leads/{leadId}",
    secrets: [sendgridApiKey, sendgridFromEmail],
  },
  async (event) => {
    if (!event.data) {
      return null;
    }
    const lead = event.data.data();
    const leadId = event.params.leadId;
    logger.info("New lead created", {leadId, lead});
    
    // Get property details if propertyId exists
    let propertyTitle = "General inquiry";
    if (lead.propertyId) {
      const propertyDoc = await db.collection("properties").doc(lead.propertyId).get();
      if (propertyDoc.exists) {
        propertyTitle = propertyDoc.data()?.title || propertyTitle;
      }
    }
    
    // Send email to default agent (or assigned agent)
    // TODO: Implement agent assignment logic
    const agentEmail = process.env.DEFAULT_AGENT_EMAIL || "sirsimaster@gmail.com";
    
    await emailService.sendLeadNotification(agentEmail, {
      ...lead.user,
      propertyId: lead.propertyId,
      propertyTitle,
      message: lead.message,
      type: lead.type,
    });
    
    return null;
  }
);

/**
 * Trigger: New user created - Send welcome email
 */
export const onNewUserCreated = beforeUserCreated(async (event) => {
  if (event.data) {
    logger.info("New user created", {uid: event.data.uid});
    
    // Send welcome email after user profile is created
    // This will be triggered after Firestore user document is created
  }
  return;
});

/**
 * Trigger: User profile created - Send welcome email
 */
export const onUserProfileCreated = onDocumentCreated(
  {
    document: "users/{userId}",
    secrets: [sendgridApiKey, sendgridFromEmail],
  },
  async (event) => {
    if (!event.data) return null;
    
    const userData = event.data.data();
    const userId = event.params.userId;
    
    if (userData.email && userData.displayName) {
      logger.info("Sending welcome email to new user", {userId, email: userData.email});
      await emailService.sendWelcomeEmail(
        userId,
        userData.email,
        userData.displayName
      );
    }
    
    return null;
  }
);

// ============================================================================
// STRIPE WEBHOOK HANDLER & CALLABLE FUNCTIONS
// ============================================================================

/**
 * Stripe webhook handler
 * Handles payment events from Stripe
 */
export const stripeWebhook = stripeModule.handleStripeWebhook;

/**
 * Create Stripe Checkout Session (callable function)
 * Allows authenticated users to start subscription checkout
 */
export const createCheckoutSession = stripeModule.createCheckoutSession;

/**
 * Create Stripe Customer Portal Session (callable function)
 * Allows users to manage their subscription
 */
export const createPortalSession = stripeModule.createPortalSession;

/**
 * Get Subscription Status (callable function)
 * Check user's current subscription status
 */
export const getSubscriptionStatus = stripeModule.getSubscriptionStatus;

// ============================================================================
// PROPERTY INGESTION API
// ============================================================================

/**
 * Property Ingestion - Bulk import properties with image processing
 */
// Property ingestion temporarily disabled
// export const ingestProperty = propertyIngestion.ingestProperty;
// export const bulkDeleteProperties = propertyIngestion.bulkDeleteProperties;
// export const createApiKey = propertyIngestion.createApiKey;

// ============================================================================
// TEST USERS API (REMOVE BEFORE PRODUCTION!)
// ============================================================================

/**
 * Create Test Users - Development/Staging Only
 * Creates test users for authentication testing
 * SECURITY: This function should be removed before production deployment
 */
export {createTestUsers};

// ============================================================================
// RBAC (ROLE-BASED ACCESS CONTROL) FUNCTIONS
// ============================================================================

/**
 * RBAC Functions - Server-side role validation and management
 * All role checks and updates happen in Cloud Functions for security
 */
export const checkUserRole = rbacFunctions.checkUserRole;
export const checkPermission = rbacFunctions.checkPermission;
export const getUserPermissions = rbacFunctions.getUserPermissions;
export const updateUserRole = rbacFunctions.updateUserRole;
export const auditRoleChanges = rbacFunctions.auditRoleChanges;
export const validateRoleAssignment = rbacFunctions.validateRoleAssignment;
