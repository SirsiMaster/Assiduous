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
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Import Stripe functions (conditional to avoid deployment errors)
let stripeModule: any;
try {
  stripeModule = require("./stripe.js");
} catch (error) {
  logger.warn("Stripe module not loaded. Stripe features disabled.");
  stripeModule = {
    createPaymentIntent: () => Promise.reject(new Error("Stripe not configured")),
    retrievePaymentIntent: () => Promise.reject(new Error("Stripe not configured")),
    createRefund: () => Promise.reject(new Error("Stripe not configured")),
    handleStripeWebhook: () => Promise.reject(new Error("Stripe not configured")),
  };
}

// Import Property Ingestion functions
import * as propertyIngestion from "./propertyIngestion";

// Import Email Service
import * as emailService from "./emailService";

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
export const api = onRequest(async (req, res) => {
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

    // Route not found
    res.status(404).json({error: "Route not found"});
  } catch (error) {
    logger.error("API Error", error);
    res.status(500).json({error: "Internal server error"});
  }
});

// ============================================================================
// PROPERTY ROUTES
// ============================================================================

async function handlePropertyRoutes(
  req: any,
  res: any,
  path: string,
  method: string
) {
  // GET /properties - List properties
  if (path === "/properties" && method === "GET") {
    const limit = parseInt(req.query.limit || "20");
    const city = req.query.city;
    const status = req.query.status || "available";

    let query = db.collection("properties").where("status", "==", status);

    if (city) {
      query = query.where("address.city", "==", city);
    }

    const snapshot = await query.limit(limit).get();
    const properties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({properties, total: properties.length});
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

    res.json({property: {id: doc.id, ...doc.data()}});
    return;
  }

  // POST /properties/search - Search properties
  if (path === "/properties/search" && method === "POST") {
    const {priceRange, bedrooms, propertyType} = req.body;

    let query = db.collection("properties").where("status", "==", "available");

    if (propertyType) {
      query = query.where("details.type", "==", propertyType);
    }

    const snapshot = await query.get();
    let properties = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side filtering
    if (priceRange) {
      properties = properties.filter((p: any) => {
        const price = p.price?.list || 0;
        return (
          (!priceRange.min || price >= priceRange.min) &&
          (!priceRange.max || price <= priceRange.max)
        );
      });
    }

    if (bedrooms) {
      properties = properties.filter(
        (p: any) => p.details?.bedrooms >= bedrooms
      );
    }

    res.json({properties, count: properties.length});
    return;
  }

  // POST /properties - Create property (authenticated)
  if (path === "/properties" && method === "POST") {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    const propertyData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: req.body.status || "available",
    };

    const docRef = await db.collection("properties").add(propertyData);
    res.status(201).json({id: docRef.id, message: "Property created"});
    return;
  }

  res.status(404).json({error: "Route not found"});
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
  // POST /leads - Submit lead (public)
  if (path === "/leads" && method === "POST") {
    const {propertyId, name, email, phone, message, type = "inquiry"} = req.body;

    if (!propertyId || !name || !email) {
      res.status(400).json({error: "Required fields missing"});
      return;
    }

    const leadData = {
      propertyId,
      user: {name, email, phone: phone || ""},
      message: message || "",
      type,
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("leads").add(leadData);
    res.status(201).json({leadId: docRef.id, success: true});
    return;
  }

  // GET /leads - Get leads (authenticated)
  if (path === "/leads" && method === "GET") {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    const limit = parseInt(req.query.limit || "50");
    const snapshot = await db
      .collection("leads")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const leads = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json({leads});
    return;
  }

  res.status(404).json({error: "Route not found"});
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
// FIRESTORE TRIGGERS
// ============================================================================

/**
 * Trigger: New lead created - Send notification to agent
 */
export const onLeadCreated = onDocumentCreated(
  "leads/{leadId}",
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
    const agentEmail = process.env.DEFAULT_AGENT_EMAIL || "agent@assiduous.com";
    
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
  "users/{userId}",
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
export const ingestProperty = propertyIngestion.ingestProperty;

/**
 * Bulk Delete Properties - Delete multiple properties by externalId
 */
export const bulkDeleteProperties = propertyIngestion.bulkDeleteProperties;

/**
 * Create API Key - Generate API keys for external integrations (admin only)
 */
export const createApiKey = propertyIngestion.createApiKey;
