/**
 * Assiduous Real Estate Platform - Cloud Functions
 * Complete Backend API - Stream 1 Implementation
 * Day 1: Backend Foundation
 * Updated: Stripe Payment Integration
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest, onCall, HttpsError} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {beforeUserCreated} from "firebase-functions/v2/identity";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";
// Stripe SDK (used in Gen2 API routes)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require("stripe");

// Import Stripe functions
const stripeModule = require("./stripe");

// Import Property Ingestion functions (temporarily disabled)
// import * as propertyIngestion from "./propertyIngestion";

// Import Email Service
import * as emailService from "./emailService";

// Import Test Users function (REMOVE before production!)
import {createTestUsers} from "./createTestUsers";
// Import Test User normalization function (development only)
import {normalizeTestUsers} from "./normalizeTestUsers";

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

// Base URL for Go API (Cloud Run) used for proxying select routes like
// /microflip and /notifications.
const goApiBaseURL = process.env.GO_API_BASE_URL || '';


// ============================================================================
// SHARED HELPERS (ID GENERATOR, PORTAL MESSAGES)
// ============================================================================

/**
 * Generate unique alphanumeric referral code (non-sequential).
 */
function generateRandomReferralCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // remove ambiguous chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate sequential ID using atomic counter
 * Format: TYPE-YEAR-SEQUENCE (e.g., PROP-2024-001234)
 */
async function generateSequentialId(type: string): Promise<string> {
  const year = new Date().getFullYear();
  const counterKey = `${type.toUpperCase()}_${year}`;
  const counterRef = db.collection("_id_counters").doc(counterKey);

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);

    let nextSequence = 1;
    if (doc.exists) {
      const data = doc.data() as {current?: number} | undefined;
      nextSequence = ((data?.current) || 0) + 1;
      transaction.update(counterRef, {
        current: nextSequence,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // First time for this type+year combo
      transaction.set(counterRef, {
        type: type.toUpperCase(),
        year,
        current: 1,
        created: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const paddedSequence = String(nextSequence).padStart(6, "0");
    return `${type.toUpperCase()}-${year}-${paddedSequence}`;
  });
}

interface PortalMessagePayload {
  userId: string;
  type?: string;
  template?: string | null;
  subject: string;
  bodyPreview: string;
  channels?: string[];
  email?: string | null;
  externalProvider?: string | null;
  externalMessageId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}

/**
 * Log a portal message for a specific user.
 * Messages are stored under users/{userId}/messages/{messageId}.
 */
async function logPortalMessage(payload: PortalMessagePayload): Promise<string | null> {
  const {
    userId,
    type = "email_mirror",
    template = null,
    subject,
    bodyPreview,
    channels = ["email", "inbox"],
    email = null,
    externalProvider = null,
    externalMessageId = null,
    meta = {},
  } = payload;

  if (!userId) {
    logger.warn("logPortalMessage called without userId");
    return null;
  }

  const messageRef = db
    .collection("users")
    .doc(userId)
    .collection("messages")
    .doc();

  await messageRef.set({
    type,
    template,
    subject,
    bodyPreview,
    channels,
    email,
    externalProvider,
    externalMessageId,
    meta,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    readAt: null,
  });

  logger.info("Portal message logged", {userId, subject});
  return messageRef.id;
}

// ============================================================================
// GITHUB WEBHOOK - SERVER-SIDE METRICS INGESTION
// ============================================================================

/**
 * GitHub webhook handler
 * - Triggered on push events from GitHub
 * - Logs each commit into `git_commits`
 * - Increments per-day `development_metrics` documents
 *
 * NOTE: Configure this endpoint as a GitHub webhook URL (push events only).
 */
export const githubWebhook = onRequest({
  region: "us-central1",
  maxInstances: 5,
}, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const contentType = req.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    res.status(400).send("Invalid content type");
    return;
  }

  const payload = (req.body || {}) as any;
  const commits = Array.isArray(payload.commits) ? payload.commits : [];

  if (commits.length === 0) {
    res.status(200).json({ok: true, processed: 0});
    return;
  }

  try {
    const batch = db.batch();

    commits.forEach((commit: any) => {
      const id: string = commit.id || commit.sha;
      if (!id) {
        return;
      }

      const ts = new Date(commit.timestamp || commit.date || new Date().toISOString());
      const dateStr = ts.toISOString().split("T")[0];

      // 1) Write git_commits entry (idempotent by commit id)
      const commitRef = db.collection("git_commits").doc(id);
      batch.set(commitRef, {
        hash: id,
        message: commit.message || "",
        author: commit.author?.name || payload.pusher?.name || "unknown",
        email: commit.author?.email || payload.pusher?.email || null,
        branch: payload.ref || null,
        repository: payload.repository?.full_name || null,
        timestamp: admin.firestore.Timestamp.fromDate(ts),
        importedBy: "github-webhook",
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      // 2) Increment daily development_metrics for this date
      const metricsRef = db.collection("development_metrics").doc(dateStr);
      batch.set(metricsRef, {
        date: dateStr,
        commits: admin.firestore.FieldValue.increment(1),
        // Hours / cost can be computed later by scheduled job if desired
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
    });

    await batch.commit();
    res.status(200).json({ok: true, processed: commits.length});
  } catch (err) {
    logger.error("GitHub webhook processing failed", err as any);
    res.status(500).json({error: "Failed to process webhook"});
  }
});

// ============================================================================
// API ENDPOINTS - Express-style routing with v2 API
// ============================================================================

/**
 * Main API endpoint
 * Handles all /api/* routes
 */
export const api = onRequest(
  {
    secrets: [sendgridApiKey, sendgridFromEmail, stripeSecretKey, stripeWebhookSecret],
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

    // Micro-flip underwriting endpoints (proxy to Go API)
    if (path.startsWith("/microflip")) {
      await handleMicroflipRoutes(req, res, path, method);
      return;
    }

    // Notification endpoints (proxy to Go API)
    if (path.startsWith("/notifications")) {
      await handleNotificationRoutes(req, res, path, method);
      return;
    }

    // Payment endpoints (Stripe)
    if (path.startsWith("/microflip")) {
      await handleMicroflipRoutes(req, res, path, method);
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
// DAILY METRICS RECOMPUTE ENDPOINT (HTTPS)
// ============================================================================

/**
 * Recompute daily development_metrics from git_commits for a recent window.
 *
 * This is intended to be called by Cloud Scheduler via HTTPS (server-side only):
 * - e.g. once per day to guarantee consistency even if a webhook was missed.
 */
export const recomputeDailyMetrics = onRequest({
  region: "us-central1",
  maxInstances: 1,
}, async (_req, res) => {
  try {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 90); // last 90 days

    const snapshot = await db.collection("git_commits")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(past))
      .get();

    const byDate: Record<string, {commits: number}> = {};

    snapshot.forEach((doc) => {
      const d = doc.data();
      const ts: Date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
      const dateStr = ts.toISOString().split("T")[0];
      if (!byDate[dateStr]) {
        byDate[dateStr] = {commits: 0};
      }
      byDate[dateStr].commits += 1;
    });

    const batch = db.batch();
    Object.entries(byDate).forEach(([dateStr, metrics]) => {
      const ref = db.collection("development_metrics").doc(dateStr);
      batch.set(ref, {
        date: dateStr,
        commits: metrics.commits,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
    });

    await batch.commit();

    res.status(200).json({ok: true, daysUpdated: Object.keys(byDate).length});
  } catch (err) {
    logger.error("recomputeDailyMetrics failed", err as any);
    res.status(500).json({error: "Failed to recompute metrics"});
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
// MICRO-FLIP ROUTES (PROXY TO GO API)
// ============================================================================

async function handleMicroflipRoutes(
  req: any,
  res: any,
  path: string,
  method: string,
) {
  try {
    if (!goApiBaseURL) {
      logger.error("GO_API_BASE_URL not configured for microflip proxy");
      res.status(500).json({
        error: "microflip_api_unconfigured",
        message: "GO_API_BASE_URL is not configured on Cloud Functions.",
      });
      return;
    }

    // Only allow POST for analyze/portfolio
    if (
      method !== "POST" ||
      (path !== "/microflip/analyze" && path !== "/microflip/portfolio")
    ) {
      res.status(404).json({error: "Route not found"});
      return;
    }

    const targetURL = `${goApiBaseURL.replace(/\/$/, "")}/api${path}`;

    // Forward body and auth header to Go API
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authHeader = req.headers.authorization as string | undefined;
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await axios.request({
      url: targetURL,
      method,
      headers,
      // Body is already parsed JSON from Functions runtime
      data: req.body || {},
      // Surface non-2xx responses to caller with original status code
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error("Microflip proxy error", {
      message: error?.message,
      code: error?.code,
    });
    res.status(502).json({
      error: "microflip_proxy_error",
      message: error?.message || "Failed to reach micro-flip engine",
    });
  }
}

// ============================================================================
// NOTIFICATION ROUTES (PROXY TO GO API)
// ============================================================================

async function handleNotificationRoutes(
  req: any,
  res: any,
  path: string,
  method: string,
) {
  try {
    if (!goApiBaseURL) {
      logger.error("GO_API_BASE_URL not configured for notification proxy");
      res.status(500).json({
        error: "notifications_api_unconfigured",
        message: "GO_API_BASE_URL is not configured on Cloud Functions.",
      });
      return;
    }

    const targetURL = `${goApiBaseURL.replace(/\/$/, "")}/api${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authHeader = req.headers.authorization as string | undefined;
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await axios.request({
      url: targetURL,
      method,
      headers,
      params: req.query || {},
      data: req.body || {},
      validateStatus: () => true,
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error("Notification proxy error", {
      message: error?.message,
      code: error?.code,
    });
    res.status(502).json({
      error: "notifications_proxy_error",
      message: error?.message || "Failed to reach notifications API",
    });
  }
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
  // Helper: get Stripe instance (cached)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stripeInstance: any | null = null;
  function getStripe() {
    if (!stripeInstance) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
      stripeInstance = new Stripe(key);
    }
    return stripeInstance;
  }

  // Webhook must use raw body for signature verification
  if (path === "/payments/webhook" && method === "POST") {
    try {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        res.status(500).send("Webhook secret not configured");
        return;
      }
      const stripe = getStripe();
      const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

      // Minimal handlers (extend as needed)
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const uid = session.metadata?.firebaseUID || null;
        if (uid) {
          await db.collection("users").doc(uid).set({
            stripeCustomerId: session.customer,
            subscriptionStatus: "active",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
        }
      }

      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as any;
        const cust = invoice.customer;
        const snap = await db.collection("users").where("stripeCustomerId", "==", cust).limit(1).get();
        if (!snap.empty) {
          await db.collection("users").doc(snap.docs[0].id).set({
            subscriptionStatus: "payment_failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
        }
      }

      res.json({received: true});
      return;
    } catch (err: any) {
      logger.error("Stripe webhook error", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  }
  // POST /payments/create-checkout-session - Start subscription checkout
  if (path === "/payments/create-checkout-session" && method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }
    try {
      const user = await verifyAuth(authHeader);
      const {priceId, successUrl, cancelUrl} = req.body;
      if (!priceId) {
        res.status(400).json({error: "priceId required"});
        return;
      }
      // Ensure customer exists
      const userRef = db.collection("users").doc(user.uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data() || {};
      const stripe = getStripe();
      let customerId = userData.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {firebaseUID: user.uid},
        });
        customerId = customer.id;
        await userRef.set({stripeCustomerId: customerId}, {merge: true});
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{price: priceId, quantity: 1}],
        success_url: successUrl || `${req.headers.origin || "https://assiduous-prod.web.app"}/agent/settings.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.origin || "https://assiduous-prod.web.app"}/agent/settings.html?canceled=true`,
        metadata: {firebaseUID: user.uid},
        subscription_data: {metadata: {firebaseUID: user.uid}},
      });
      res.json({url: session.url});
      return;
    } catch (e: any) {
      logger.error("Checkout session error", e);
      res.status(500).json({error: e.message || "Checkout failed"});
      return;
    }
  }

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

  // POST /payments/portal-session - Customer portal session
  if (path === "/payments/portal-session" && method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }
    try {
      const user = await verifyAuth(authHeader);
      const {returnUrl} = req.body;
      const userDoc = await db.collection("users").doc(user.uid).get();
      const custId = userDoc.data()?.stripeCustomerId;
      if (!custId) {
        res.status(400).json({error: "No Stripe customer"});
        return;
      }
      const portal = await getStripe().billingPortal.sessions.create({
        customer: custId,
        return_url: returnUrl || `${req.headers.origin || "https://assiduous-prod.web.app"}/agent/settings.html`,
      });
      res.json({url: portal.url});
      return;
    } catch (e: any) {
      logger.error("Portal session error", e);
      res.status(500).json({error: e.message || "Portal failed"});
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
 * Helper: build a sanitized public profile document from users/{userId} data.
 */
function buildPublicProfileFromUser(userId: string, userData: FirebaseFirestore.DocumentData) {
  const profile = (userData.profile as any) || {};

  return {
    userId,
    email: (userData.email as string) || "",
    role: (userData.role as string) || "client",
    status: (userData.status as string) || "active",
    firstName: (userData.firstName as string) || "",
    lastName: (userData.lastName as string) || "",
    displayName: (userData.displayName as string) || (userData.email as string) || "",
    profile: {
      bio: (profile.bio as string) || "",
      city: (profile.city as string) || "",
      state: (profile.state as string) || "",
      zip: (profile.zip as string) || "",
      photoUrl: (profile.photoUrl as string) || "",
      linkedinUrl: (profile.linkedinUrl as string) || "",
      twitterHandle: (profile.twitterHandle as string) || "",
      instagramHandle: (profile.instagramHandle as string) || "",
      websiteUrl: (profile.websiteUrl as string) || "",
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

/**
 * Trigger: User profile created - Send welcome email, initialize profile/QR,
 * and sync a sanitized copy into public_profiles/{userId} for QR/public views.
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
    
    // Ensure profile object exists
    try {
      if (!userData.profile) {
        await db.collection("users").doc(userId).set(
          {
            profile: {
              photoUrl: "",
              bio: "",
              city: "",
              state: "",
              zip: "",
              linkedinUrl: "",
              twitterHandle: "",
              instagramHandle: "",
              websiteUrl: "",
            },
          },
          {merge: true}
        );
      }
    } catch (e: any) {
      logger.error("Failed to backfill profile object for new user", {userId, error: e?.message});
    }
    
    // Auto-generate profile QR (best effort; do not block welcome email)
    try {
      await generateUserProfileQRInternal(userId);
    } catch (e: any) {
      logger.error("Failed to auto-generate profile QR on user create", {userId, error: e?.message});
    }

    // Sync public profile snapshot for QR/public view pages
    try {
      const publicProfile = buildPublicProfileFromUser(userId, userData);
      await db.collection("public_profiles").doc(userId).set(publicProfile, {merge: true});
    } catch (e: any) {
      logger.error("Failed to sync public profile on user create", {userId, error: e?.message});
    }
    
    // Send welcome email
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

/**
 * Trigger: User profile updated - keep public_profiles/{userId} in sync so
 * that QR/public pages always show the latest profile info.
 */
export const onUserProfileUpdated = onDocumentUpdated(
  {
    document: "users/{userId}",
  },
  async (event) => {
    if (!event.data?.after) return null;
    const userId = event.params.userId;
    const userData = event.data.after.data();
    try {
      const publicProfile = buildPublicProfileFromUser(userId, userData);
      await db.collection("public_profiles").doc(userId).set(publicProfile, {merge: true});
    } catch (e: any) {
      logger.error("Failed to sync public profile on user update", {userId, error: e?.message});
    }
    return null;
  }
);

/**
 * Maintenance endpoint: seedPublicProfiles
 *
 * One-off HTTP function to backfill public_profiles/{userId} docs for all
 * existing users. This is safe because it only writes sanitized subsets of
 * user data. Use `?dryRun=true` to preview without writing.
 */
export const seedPublicProfiles = onRequest({
  region: "us-central1",
  maxInstances: 1,
}, async (req, res) => {
  const dryRun = req.query.dryRun === "true" || req.query.dryRun === "1";
  logger.info("seedPublicProfiles invoked", {dryRun});

  try {
    const snapshot = await db.collection("users").get();
    let processed = 0;

    for (const docSnap of snapshot.docs) {
      const userId = docSnap.id;
      const data = docSnap.data() || {};
      const publicProfile = buildPublicProfileFromUser(userId, data);
      if (!dryRun) {
        await db.collection("public_profiles").doc(userId).set(publicProfile, {merge: true});
      }
      processed++;
    }

    res.status(200).json({success: true, dryRun, processed});
  } catch (error: any) {
    logger.error("seedPublicProfiles failed", {error: error?.message});
    res.status(500).json({success: false, error: error?.message || "Internal error"});
  }
});

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
// QR CODE FUNCTIONS (USER PROFILE + PROPERTY/REFERRAL)
// ============================================================================

/**
 * Internal helper to (re)generate a user's profile QR.
 * Used by both the callable function and the Firestore trigger.
 */
async function generateUserProfileQRInternal(targetUserId: string, regenerate = false) {
  const userRef = db.collection("users").doc(targetUserId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new HttpsError("not-found", "User not found");
  }

  const userData = userDoc.data() || {};

  // If QR already exists and we're not regenerating, return existing
  if (userData.profileQRCode && !regenerate) {
    return {
      qrCodeUrl: userData.profileQRCode as string,
      profileUrl: userData.profileUrl as string,
      regenerated: false,
    };
  }

  const role = (userData.role as string) || "client";
  const baseUrl = "https://assiduous-prod.web.app";

  let profileUrl: string;
  if (role === "admin") {
    profileUrl = `${baseUrl}/admin/profile.html?id=${targetUserId}`;
  } else if (role === "agent") {
    profileUrl = `${baseUrl}/agent/profile.html?id=${targetUserId}`;
  } else {
    profileUrl = `${baseUrl}/client/profile.html?id=${targetUserId}`;
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}`;

  await userRef.update({
    profileQRCode: qrCodeUrl,
    profileUrl,
    profileQRGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info("Generated profile QR for user", {userId: targetUserId, role});

  return {
    qrCodeUrl,
    profileUrl,
    regenerated: !!regenerate,
  };
}

/**
 * getPublicUserProfile (HTTP)
 *
 * Returns a sanitized, public-safe view of a user's profile that can be
 * rendered for unauthenticated viewers (e.g., QR code scans). This function
 * intentionally whitelists only non-sensitive fields.
 */
export const getPublicUserProfile = onRequest({region: "us-central1"}, async (req, res) => {
  // Basic CORS to allow calls from the hosted web app
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const userId = (req.query.id as string | undefined) || (req.query.uid as string | undefined);

  if (!userId) {
    res.status(400).json({success: false, error: "Missing required query parameter 'id'"});
    return;
  }

  try {
    const snap = await db.collection("users").doc(userId).get();
    if (!snap.exists) {
      res.status(404).json({success: false, error: "User not found"});
      return;
    }

    const data = snap.data() || {};
    const profile = (data.profile as any) || {};

    const publicProfile = {
      id: userId,
      firstName: (data.firstName as string) || "",
      lastName: (data.lastName as string) || "",
      displayName: (data.displayName as string) || "",
      role: (data.role as string) || "client",
      email: (data.email as string) || "",
      phone: (data.phone as string) || "",
      profile: {
        bio: (profile.bio as string) || "",
        city: (profile.city as string) || "",
        state: (profile.state as string) || "",
        zip: (profile.zip as string) || "",
        photoUrl: (profile.photoUrl as string) || "",
        linkedinUrl: (profile.linkedinUrl as string) || "",
        twitterHandle: (profile.twitterHandle as string) || "",
        instagramHandle: (profile.instagramHandle as string) || "",
        websiteUrl: (profile.websiteUrl as string) || "",
      },
    };

    res.json({success: true, data: publicProfile});
  } catch (error: any) {
    logger.error("getPublicUserProfile error", {error: error?.message, userId});
    res.status(500).json({success: false, error: "Internal server error"});
  }
});

/**
 * generateUserQR (callable)
 * Generates or fetches a user's profile QR code.
 *
 * Frontend uses httpsCallable(functions, "generateUserQR").
 */
export const generateUserQR = onCall({region: "us-central1"}, async (request) => {
  // Ensure the caller is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const data = (request.data || {}) as {userId?: string; regenerate?: boolean};
  const targetUserId = data.userId || request.auth.uid;
  const regenerate = !!data.regenerate;

  try {
    const {qrCodeUrl, profileUrl, regenerated} = await generateUserProfileQRInternal(
      targetUserId,
      regenerate
    );

    return {
      success: true,
      qrCodeUrl,
      profileUrl,
      regenerated,
    };
  } catch (error: any) {
    logger.error("Error generating user QR", {error: error?.message, userId: targetUserId});
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error?.message || "Failed to generate user QR");
  }
});

/**
 * backfillUserProfiles (HTTP onRequest)
 *
 * Admin-only maintenance endpoint to backfill profile objects and
 * profile QR fields for existing users.
 *
 * Usage (example):
 *   - Obtain an ID token for an admin user.
 *   - Call this endpoint with Authorization: Bearer <ID_TOKEN>.
 *   - Optional query params:
 *       dryRun=true|false (default true)
 *       pageSize=100 (max docs per call)
 *       startAfter=<lastUserId> (for pagination)
 */
export const backfillUserProfiles = onRequest({
  region: "us-central1",
  maxInstances: 1,
}, async (req, res) => {
  // Basic CORS for manual invocation from browser tools
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader) {
    res.status(401).json({error: "Authorization header required"});
    return;
  }

  let caller: any;
  try {
    caller = await verifyAuth(authHeader);
  } catch (error: any) {
    logger.error("backfillUserProfiles verifyAuth failed", {error: error?.message});
    res.status(401).json({error: "Invalid or expired token"});
    return;
  }

  if (!isAdmin(caller)) {
    res.status(403).json({error: "Admin role required"});
    return;
  }

  const dryRunParam = (req.query.dryRun as string | undefined) ?? "true";
  const dryRun = dryRunParam !== "false";
  const pageSizeParam = (req.query.pageSize as string | undefined) ?? "100";
  const pageSize = Math.max(1, Math.min(parseInt(pageSizeParam, 10) || 100, 500));
  const startAfterId = req.query.startAfter as string | undefined;

  try {
    let query: FirebaseFirestore.Query = db
      .collection("users")
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);

    if (startAfterId) {
      const cursorDoc = await db.collection("users").doc(startAfterId).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      res.json({
        dryRun,
        processed: 0,
        message: "No users found for this page.",
      });
      return;
    }

    let profileBackfilled = 0;
    let qrBackfilled = 0;

    for (const docSnap of snapshot.docs) {
      const userId = docSnap.id;
      const data = docSnap.data() || {};
      const updates: Record<string, unknown> = {};

      if (!data.profile) {
        updates.profile = {
          photoUrl: "",
          bio: "",
          city: "",
          state: "",
          zip: "",
          linkedinUrl: "",
          twitterHandle: "",
          instagramHandle: "",
          websiteUrl: "",
        };
        profileBackfilled++;
      }

      const missingQR = !data.profileUrl || !data.profileQRCode;

      if (!dryRun && Object.keys(updates).length > 0) {
        await docSnap.ref.update({
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      if (!dryRun && missingQR) {
        try {
          await generateUserProfileQRInternal(userId, false);
          qrBackfilled++;
        } catch (error: any) {
          logger.error("backfillUserProfiles: failed to generate QR for user", {
            userId,
            error: error?.message,
          });
        }
      } else if (dryRun && (Object.keys(updates).length > 0 || missingQR)) {
        // Count potential QR backfills in dry-run mode
        if (missingQR) {
          qrBackfilled++;
        }
      }
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    res.json({
      dryRun,
      processed: snapshot.size,
      profileBackfilled,
      qrBackfilled,
      nextPageCursor: lastDoc ? lastDoc.id : null,
    });
  } catch (error: any) {
    logger.error("backfillUserProfiles failed", {error: error?.message});
    res.status(500).json({error: error?.message || "Internal error"});
  }
});

/**
 * generatePropertyQR (callable)
 * Generate or regenerate QR code for a property.
 */
export const generatePropertyQR = onCall({region: "us-central1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {propertyId, regenerate} = (request.data || {}) as {
    propertyId?: string;
    regenerate?: boolean;
  };

  if (!propertyId) {
    throw new HttpsError("invalid-argument", "propertyId is required");
  }

  try {
    const propertyRef = db.collection("properties").doc(propertyId);
    const propertyDoc = await propertyRef.get();

    if (!propertyDoc.exists) {
      throw new HttpsError("not-found", "Property not found");
    }

    const propertyData = propertyDoc.data() || {};

    // If QR already exists and we're not regenerating, return existing
    if (propertyData.assiduousId && propertyData.qrCodeUrl && !regenerate) {
      return {
        success: true,
        assiduousId: propertyData.assiduousId,
        qrCodeUrl: propertyData.qrCodeUrl,
        propertyUrl: propertyData.propertyUrl,
        regenerated: false,
      };
    }

    // Generate sequential Assiduous ID
    const assiduousId = await generateSequentialId("PROP");

    const baseUrl = "https://assiduous-prod.web.app";
    const propertyUrl = `${baseUrl}/property-detail.html?id=${propertyId}`;

    const qrCodeUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(propertyUrl)}`;

    await propertyRef.update({
      assiduousId,
      qrCodeUrl,
      propertyUrl,
      qrGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      qrGeneratedBy: request.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("Generated property QR", {propertyId, assiduousId});

    return {
      success: true,
      assiduousId,
      qrCodeUrl,
      propertyUrl,
      regenerated: !!regenerate,
    };
  } catch (error: any) {
    logger.error("Error generating property QR", {error: error?.message});
    throw new HttpsError("internal", error?.message || "Failed to generate property QR");
  }
});

/**
 * sharePropertyQR (callable)
 * Share property via QR code with tracking (email/SMS).
 */
export const sharePropertyQR = onCall(
  {
    region: "us-central1",
    secrets: [sendgridApiKey, sendgridFromEmail, twilioAccountSid, twilioAuthToken, twilioFromNumber],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {
      propertyId,
      recipientEmail,
      recipientPhone,
      method,
      personalMessage,
    } = (request.data || {}) as {
      propertyId?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      method?: "email" | "sms";
      personalMessage?: string;
    };

    if (!propertyId) {
      throw new HttpsError("invalid-argument", "propertyId is required");
    }

    if (!recipientEmail && !recipientPhone) {
      throw new HttpsError("invalid-argument", "recipientEmail or recipientPhone is required");
    }

    try {
      const sharerId = request.auth.uid;

      const propertyDoc = await db.collection("properties").doc(propertyId).get();
      if (!propertyDoc.exists) {
        throw new HttpsError("not-found", "Property not found");
      }

      const property = propertyDoc.data() || {};
      const qrCodeUrl = property.qrCodeUrl as string | undefined;
      const assiduousId = property.assiduousId as string | undefined;

      if (!qrCodeUrl || !assiduousId) {
        throw new HttpsError("failed-precondition", "Property does not have QR code. Generate it first.");
      }

      const sharerDoc = await db.collection("users").doc(sharerId).get();
      const sharerData = sharerDoc.data() || {};
      const sharerName = (sharerData.displayName as string) || (sharerData.email as string) || "Someone";

      const trackedUrl = `${property.propertyUrl}&shared_by=${sharerId}`;

      const shareRef = await db.collection("property_shares").add({
        propertyId,
        assiduousId,
        sharedBy: sharerId,
        sharerName,
        method,
        recipientEmail: recipientEmail || null,
        recipientPhone: recipientPhone || null,
        sharedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewed: false,
      });

      let externalEmailId: string | null = null;
      let externalSmsId: string | null = null;

      // Email via SendGrid
      if (method === "email" && recipientEmail) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sgMail = require("@sendgrid/mail");
        const apiKey = process.env.SENDGRID_API_KEY;

        if (!apiKey) {
          logger.warn("SendGrid API key not configured. Email not sent.");
          return {success: true, sent: false};
        }

        sgMail.setApiKey(apiKey);

        const emailHtml = `
          <h2>Property shared with you from ${sharerName}</h2>
          <p>Scan this QR code to view the property:</p>
          <img src="${qrCodeUrl}" alt="Property QR Code" style="max-width:250px;" />
          <p>Or click here: <a href="${trackedUrl}">${trackedUrl}</a></p>
          ${personalMessage ? `<p><em>${personalMessage}</em></p>` : ""}
        `;

        const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SUPPORT_EMAIL;
        const msg = {
          to: recipientEmail,
          from: fromEmail,
          replyTo: process.env.SUPPORT_EMAIL,
          subject: `${sharerName} shared a property with you`,
          html: emailHtml,
        };

        const [response] = await sgMail.send(msg);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const headers: any = response && response.headers ? response.headers : {};
        externalEmailId = headers["x-message-id"] || headers["x-message-id".toLowerCase()] || null;

        logger.info("Property QR shared via email", {propertyId, recipientEmail, sharerId});
      }

      // SMS via Twilio
      if (method === "sms" && recipientPhone) {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

        if (!twilioSid || !twilioToken || !twilioFrom) {
          logger.warn("Twilio credentials not configured. SMS not sent.");
          return {success: true, sent: false, method: "sms"};
        }

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilioClient = require("twilio")(twilioSid, twilioToken);
        const smsBody = `${sharerName} shared a property with you! View it here: ${trackedUrl}`;

        const smsResult = await twilioClient.messages.create({
          body: smsBody,
          from: twilioFrom,
          to: recipientPhone,
        });

        externalSmsId = smsResult && smsResult.sid ? smsResult.sid : null;
        logger.info("Property QR shared via SMS", {propertyId, recipientPhone, sharerId});
      }

      // Mirror into sharer's portal inbox
      try {
        const channel = method === "email" ? "email" : "sms";
        const destination = recipientEmail || recipientPhone || "";
        await logPortalMessage({
          userId: sharerId,
          type: "email_mirror",
          template: "property_share",
          subject: `Property QR shared via ${channel.toUpperCase()}`,
          bodyPreview: destination
            ? `We sent your property link to ${destination}.`
            : `Property shared via ${channel}.`,
          channels: ["email", "inbox"],
          email: destination || null,
          externalProvider: channel === "email" ? "sendgrid" : "twilio",
          externalMessageId: externalEmailId || externalSmsId,
          meta: {
            propertyId,
            assiduousId,
            trackedUrl,
            qrCodeUrl,
            method,
            recipientEmail: recipientEmail || null,
            recipientPhone: recipientPhone || null,
            shareId: shareRef.id,
          },
        });
      } catch (inboxError: any) {
        logger.warn("Failed to log portal message for property share", {error: inboxError?.message});
      }

      return {success: true, sent: true};
    } catch (error: any) {
      logger.error("Error sharing property QR", {error: error?.message});
      throw new HttpsError("internal", error?.message || "Failed to share property QR");
    }
  }
);

/**
 * generateReferralCode (callable)
 * Generate unique referral code + QR for a user.
 */
export const generateReferralCode = onCall({region: "us-central1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const userId = request.auth.uid;
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const referralCode = generateRandomReferralCode(8);

    const baseUrl = "https://assiduous-prod.web.app";
    const signupUrl = `${baseUrl}/signup.html?ref=${referralCode}`;
    const qrCodeUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(signupUrl)}`;

    await userRef.update({
      referralCode,
      qrCodeUrl,
      referralSignupUrl: signupUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("Generated referral code", {userId, referralCode});

    return {
      success: true,
      referralCode,
      qrCodeUrl,
      signupUrl,
    };
  } catch (error: any) {
    logger.error("Error generating referral code", {error: error?.message});
    throw new HttpsError("internal", error?.message || "Failed to generate referral code");
  }
});

/**
 * sendClientInvitation (callable)
 * Send client invitation via email with QR link.
 */
export const sendClientInvitation = onCall(
  {region: "us-central1", secrets: [sendgridApiKey, sendgridFromEmail]},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {clientEmail, clientName, personalMessage} = (request.data || {}) as {
      clientEmail?: string;
      clientName?: string;
      personalMessage?: string;
    };

    if (!clientEmail || !clientName) {
      throw new HttpsError("invalid-argument", "clientEmail and clientName are required");
    }

    try {
      const agentId = request.auth.uid;
      const agentDoc = await db.collection("users").doc(agentId).get();
      if (!agentDoc.exists) {
        throw new HttpsError("not-found", "Agent not found");
      }

      const agentData = agentDoc.data() || {};
      const agentName = (agentData.displayName as string) || (agentData.email as string);
      const agentReferralCode = agentData.referralCode as string | undefined;

      if (!agentReferralCode) {
        throw new HttpsError(
          "failed-precondition",
          "Agent must have referral code. Call generateReferralCode first."
        );
      }

      const tempToken = generateRandomReferralCode(16);
      const invitationData = {
        email: clientEmail,
        name: clientName,
        agentId,
        agentName,
        agentReferralCode,
        tempToken,
        status: "invited",
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      };

      const invitationRef = await db.collection("client_invitations").add(invitationData);

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sgMail = require("@sendgrid/mail");
      const apiKey = process.env.SENDGRID_API_KEY;

      if (!apiKey) {
        logger.warn("SendGrid API key not configured. Invitation email not sent.");
        return {success: true, emailSent: false, tempToken};
      }

      sgMail.setApiKey(apiKey);

      const signupUrl = `https://assiduous-prod.web.app/signup.html?token=${tempToken}`;
      const qrCodeUrl =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(signupUrl)}`;

      const emailHtml = `
        <h2>Welcome to Assiduous Real Estate</h2>
        <p>Hi ${clientName},</p>
        <p>${agentName} has invited you to join Assiduous.</p>
        ${personalMessage ? `<p><em>${personalMessage}</em></p>` : ""}
        <p>Click the link below to complete your registration:</p>
        <p><a href="${signupUrl}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Complete Registration</a></p>
        <p>Or scan this QR code:</p>
        <img src="${qrCodeUrl}" alt="Registration QR Code" style="max-width:200px;" />
        <p style="color:#666;font-size:12px;margin-top:24px;">This invitation expires in 7 days.</p>
      `;

      const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SUPPORT_EMAIL;
      const msg = {
        to: clientEmail,
        from: fromEmail,
        replyTo: process.env.SUPPORT_EMAIL,
        subject: `${agentName} invited you to Assiduous`,
        html: emailHtml,
      };

      const [response] = await sgMail.send(msg);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headers: any = response && response.headers ? response.headers : {};
      const externalEmailId =
        headers["x-message-id"] || headers["x-message-id".toLowerCase()] || null;

      logger.info("Invitation sent", {clientEmail, agentId});

      // Mirror invitation into agent's portal inbox (best-effort)
      try {
        await logPortalMessage({
          userId: agentId,
          type: "email_mirror",
          template: "client_invitation",
          subject: `Invitation sent to ${clientName}`,
          bodyPreview: `We emailed ${clientEmail} an invitation to join Assiduous.`,
          channels: ["email", "inbox"],
          email: clientEmail,
          externalProvider: "sendgrid",
          externalMessageId: externalEmailId,
          meta: {
            invitationId: invitationRef.id,
            signupUrl,
            qrCodeUrl,
            tempToken,
          },
        });
      } catch (logError: any) {
        logger.warn("Failed to log portal message for client invitation", {error: logError?.message});
      }

      return {success: true, emailSent: true, tempToken};
    } catch (error: any) {
      logger.error("Error sending client invitation", {error: error?.message});
      throw new HttpsError("internal", error?.message || "Failed to send client invitation");
    }
  }
);

/**
 * shareQRCode (callable)
 * Share referral QR code via email or SMS.
 */
export const shareQRCode = onCall(
  {
    region: "us-central1",
    secrets: [sendgridApiKey, sendgridFromEmail, twilioAccountSid, twilioAuthToken, twilioFromNumber],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {recipientEmail, recipientPhone, method} = (request.data || {}) as {
      recipientEmail?: string;
      recipientPhone?: string;
      method?: "email" | "sms";
    };

    if (!recipientEmail && !recipientPhone) {
      throw new HttpsError("invalid-argument", "recipientEmail or recipientPhone is required");
    }

    try {
      const userId = request.auth.uid;
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data() || {};
      const agentName = (userData.displayName as string) || (userData.email as string);
      const qrCodeUrl = userData.qrCodeUrl as string | undefined;
      const signupUrl = userData.referralSignupUrl as string | undefined;

      if (!qrCodeUrl || !signupUrl) {
        throw new HttpsError(
          "failed-precondition",
          "User must have QR code. Call generateReferralCode first."
        );
      }

      let externalEmailId: string | null = null;
      let externalSmsId: string | null = null;

      // Email via SendGrid
      if (method === "email" && recipientEmail) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sgMail = require("@sendgrid/mail");
        const apiKey = process.env.SENDGRID_API_KEY;

        if (!apiKey) {
          logger.warn("SendGrid API key not configured. Email not sent.");
          return {success: true, sent: false};
        }

        sgMail.setApiKey(apiKey);

        const emailHtml = `
          <h2>Join ${agentName} on Assiduous</h2>
          <p>Scan this QR code to get started:</p>
          <img src="${qrCodeUrl}" alt="QR Code" style="max-width:250px;" />
          <p>Or click here: <a href="${signupUrl}">${signupUrl}</a></p>
        `;

        const msg = {
          to: recipientEmail,
          from: process.env.SENDGRID_FROM_EMAIL || process.env.SUPPORT_EMAIL,
          replyTo: process.env.SUPPORT_EMAIL,
          subject: `Connect with ${agentName} on Assiduous`,
          html: emailHtml,
        };

        const [response] = await sgMail.send(msg);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const headers: any = response && response.headers ? response.headers : {};
        externalEmailId =
          headers["x-message-id"] || headers["x-message-id".toLowerCase()] || null;

        logger.info("Referral QR shared via email", {userId, recipientEmail});
      }

      // SMS via Twilio
      if (method === "sms" && recipientPhone) {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

        if (!twilioSid || !twilioToken || !twilioFrom) {
          logger.warn("Twilio credentials not configured. SMS not sent.");
          return {success: true, sent: false, method: "sms"};
        }

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilioClient = require("twilio")(twilioSid, twilioToken);
        const smsBody = `${agentName} invited you to Assiduous! Sign up here: ${signupUrl}`;

         const smsResult = await twilioClient.messages.create({
          body: smsBody,
          from: twilioFrom,
          to: recipientPhone,
        });

        externalSmsId = smsResult && smsResult.sid ? smsResult.sid : null;
        logger.info("Referral QR shared via SMS", {userId, recipientPhone});
      }

      // Mirror into portal inbox
      try {
        const channel = method === "email" ? "email" : "sms";
        const destination = recipientEmail || recipientPhone || "";
        await logPortalMessage({
          userId,
          type: "email_mirror",
          template: "referral_share",
          subject: `Referral QR shared via ${channel.toUpperCase()}`,
          bodyPreview: destination
            ? `We sent your referral link to ${destination}.`
            : `Referral shared via ${channel}.`,
          channels: ["email", "inbox"],
          email: destination || null,
          externalProvider: channel === "email" ? "sendgrid" : "twilio",
          externalMessageId: externalEmailId || externalSmsId,
          meta: {
            signupUrl,
            qrCodeUrl,
            method,
            recipientEmail: recipientEmail || null,
            recipientPhone: recipientPhone || null,
          },
        });
      } catch (logError: any) {
        logger.warn("Failed to log portal message for referral share", {error: logError?.message});
      }

      return {success: true, sent: true};
    } catch (error: any) {
      logger.error("Error sharing QR code", {error: error?.message});
      throw new HttpsError("internal", error?.message || "Failed to share QR code");
    }
  }
);

/**
 * trackPropertyView (callable)
 * Track property views originating from shared links.
 */
export const trackPropertyView = onCall({region: "us-central1"}, async (request) => {
  const {propertyId, sharedBy, viewerEmail} = (request.data || {}) as {
    propertyId?: string;
    sharedBy?: string;
    viewerEmail?: string;
  };

  if (!propertyId) {
    throw new HttpsError("invalid-argument", "propertyId is required");
  }

  try {
    const viewData = {
      propertyId,
      viewedAt: admin.firestore.FieldValue.serverTimestamp(),
      viewerEmail: viewerEmail || null,
      viewerId: request.auth ? request.auth.uid : null,
      sharedBy: sharedBy || null,
      authenticated: !!request.auth,
    };

    await db
      .collection("properties")
      .doc(propertyId)
      .collection("views")
      .add(viewData);

    if (sharedBy) {
      const sharesSnapshot = await db
        .collection("property_shares")
        .where("propertyId", "==", propertyId)
        .where("sharedBy", "==", sharedBy)
        .where("viewed", "==", false)
        .limit(1)
        .get();

      if (!sharesSnapshot.empty) {
        const shareDoc = sharesSnapshot.docs[0];
        await shareDoc.ref.update({
          viewed: true,
          viewedAt: admin.firestore.FieldValue.serverTimestamp(),
          viewerId: request.auth ? request.auth.uid : null,
        });
      }
    }

    logger.info("Property view tracked", {propertyId});
    return {success: true};
  } catch (error: any) {
    logger.error("Error tracking property view", {error: error?.message});
    throw new HttpsError("internal", error?.message || "Failed to track property view");
  }
});

// ============================================================================
// TEST USERS API (REMOVE BEFORE PRODUCTION!)
// ============================================================================

/**
 * Create Test Users - Development/Staging Only
 * Creates test users for authentication testing
 * SECURITY: This function should be removed before production deployment
 */
export {createTestUsers};

/**
 * normalizeTestUsers - Development Only
 * Normalizes test accounts so they match the canonical user schema
 * (users/{uid} docs with role, status, agentInfo, profileComplete, etc.)
 */
export {normalizeTestUsers};

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
