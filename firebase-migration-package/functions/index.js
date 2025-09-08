const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Config (set via `firebase functions:config:set ...`)
const cfg = {
  onfido: {
    webhook_secret: (functions.config().onfido && functions.config().onfido.webhook_secret) || ''
  },
  plaid: {
    webhook_secret: (functions.config().plaid && functions.config().plaid.webhook_secret) || ''
  },
  sirsi: {
    webhook_url: (functions.config().sirsi && functions.config().sirsi.webhook_url) || ''
  }
};

// Helpers
function verifyHmac(secret, payload, signatureHeader) {
  if (!signatureHeader || !secret) return false;
  const calc = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // timingSafeEqual requires equal length
  if (signatureHeader.length !== calc.length) return false;
  return crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(signatureHeader));
}

async function evaluatePolicy(verificationId) {
  const ref = db.collection('verifications').doc(verificationId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const v = snap.data() || {};
  const kyc = v.kyc || {};
  const funds = v.funds || {};
  const aml = v.aml || {};

  let decision = 'REVIEW';
  let microFlipScore = 0; // Assiduous: Score for micro-flipping deals
  
  // Standard policy evaluation
  if (kyc.status === 'PASSED') {
    const hasFunds = (funds.status === 'VERIFIED' && Number(funds.balanceCents || 0) >= Math.ceil(Number(v.amountCents) * 1.05)) || funds.status === 'ESCROWED';
    if (hasFunds) {
      decision = (aml.status === 'HIGH') ? 'REVIEW' : 'PASS';
    }
  } else if (kyc.status === 'FAILED') {
    decision = 'FAIL';
  }
  
  // Assiduous: Calculate micro-flip score for deals under $50K
  if (v.transactionType === 'micro-flip' && Number(v.amountCents) <= 5000000) { // $50K or less
    if (kyc.status === 'PASSED') microFlipScore += 40;
    if (funds.status === 'VERIFIED') {
      const fundRatio = Number(funds.balanceCents || 0) / Number(v.amountCents);
      if (fundRatio >= 1.5) microFlipScore += 40; // Has 150% of needed funds
      else if (fundRatio >= 1.05) microFlipScore += 25; // Has 105% of needed funds
    }
    if (aml.status !== 'HIGH') microFlipScore += 20;
    
    // Fast-track micro-flips with high scores
    if (microFlipScore >= 80 && decision === 'PASS') {
      decision = 'FAST_TRACK'; // Assiduous: Priority processing
    }
  }

  await ref.set({ 
    status: decision, 
    microFlipScore,
    updatedAt: admin.firestore.FieldValue.serverTimestamp() 
  }, { merge: true });

  if (cfg.sirsi.webhook_url) {
    try {
      await axios.post(cfg.sirsi.webhook_url, { verificationId, status: decision }, { timeout: 5000 });
    } catch (e) {
      console.warn('Sirsi webhook notify failed:', e.message);
    }
  }
}

// --- Public API ---

// Create a verification (idempotent)
app.post('/api/v1/verification', async (req, res) => {
  try {
    const idemKey = req.header('Idempotency-Key') || uuidv4();
    const { 
      buyerId, 
      propertyId, // Assiduous: Link to property
      agentId, // Assiduous: Track agent for commissions
      amountCents, 
      currency = 'USD', 
      jurisdiction = 'US', 
      mode = 'open_banking',
      transactionType = 'micro-flip' // Assiduous: micro-flip or traditional
    } = req.body || {};
    if (!buyerId || !amountCents) return res.status(400).json({ error: 'buyerId and amountCents required' });

    const idemRef = db.collection('idempotency').doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists) {
      const { verificationId } = idemSnap.data();
      const vSnap = await db.collection('verifications').doc(verificationId).get();
      return res.json({ verification: vSnap.data(), idempotencyKey: idemKey });
    }

    const verificationId = uuidv4();
    const doc = {
      id: verificationId,
      buyerId,
      propertyId: propertyId || null, // Assiduous: Property reference
      agentId: agentId || null, // Assiduous: Agent assignment
      transactionType: transactionType || 'traditional', // Assiduous: Deal type
      amountCents: Number(amountCents),
      currency,
      jurisdiction,
      status: 'IN_PROGRESS',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      kyc: { status: 'PENDING' },
      funds: { status: 'PENDING' },
      // Assiduous-specific fields
      microFlipScore: null, // To be calculated based on verification
      commissionStatus: 'PENDING' // For agent commission tracking
    };

    await db.collection('verifications').doc(verificationId).set(doc);
    await idemRef.set({ verificationId, createdAt: admin.firestore.FieldValue.serverTimestamp() });

    // NOTE: In production, generate vendor-specific links here via their APIs.
    const appBase = process.env.APP_BASE_URL || 'https://example.web.app';
    const links = {
      kycUrl: `${appBase}/kyc/start?verificationId=${verificationId}`,
      bankLinkUrl: `${appBase}/bank/connect?verificationId=${verificationId}`
    };

    res.json({ verificationId, links, idempotencyKey: idemKey });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// Onfido Webhook (KYC)
app.post('/api/webhook/kyc', async (req, res) => {
  const raw = JSON.stringify(req.body || {});
  const sig = req.header('x-onfido-signature') || req.header('X-Signature');
  const ok = verifyHmac(cfg.onfido.webhook_secret, raw, sig);
  await db.collection('webhook_logs').add({
    provider: 'onfido',
    endpoint: '/api/webhook/kyc',
    invalidSignature: !ok,
    rawPayload: req.body,
    headers: req.headers,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  if (!ok) return res.status(401).send('invalid signature');

  // Map provider payload → verification doc (adjust mapping for real Onfido payload)
  const { verificationId, status, providerData } = req.body || {};
  const kycStatus = (status === 'report.completed' && providerData && providerData.result === 'clear')
    ? 'PASSED'
    : (status === 'report.completed' ? 'FAILED' : 'PENDING');

  if (verificationId) {
    await db.collection('verifications').doc(verificationId).set({
      kyc: { status: kycStatus, providerResponse: providerData || {}, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    }, { merge: true });
    await evaluatePolicy(verificationId);
  }

  res.status(200).send('ok');
});

// Plaid Webhook (Funds)
app.post('/api/webhook/bank', async (req, res) => {
  const raw = JSON.stringify(req.body || {});
  const sig = req.header('Plaid-Signature');
  const ok = verifyHmac(cfg.plaid.webhook_secret, raw, sig);
  await db.collection('webhook_logs').add({
    provider: 'plaid',
    endpoint: '/api/webhook/bank',
    invalidSignature: !ok,
    rawPayload: req.body,
    headers: req.headers,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  if (!ok) return res.status(401).send('invalid signature');

  // Adjust mapping for real Plaid webhooks. For MVP, expect direct fields:
  const { verificationId, balanceCents, currency = 'USD', asOf } = req.body || {};
  if (verificationId) {
    await db.collection('verifications').doc(verificationId).set({
      funds: {
        status: 'VERIFIED',
        balanceCents: Number(balanceCents || 0),
        currency, asOf,
        providerResponse: req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });
    await evaluatePolicy(verificationId);
  }

  res.status(200).send('ok');
});

// Import GitHub automation functions
const { githubWebhook } = require('./github-webhook');
const { syncGitHubData, scheduledSync } = require('./sync-service');

// Import OpenSign functions
const opensignFunctions = require('./opensign-functions');

// Main HTTP Cloud Function
exports.app = functions.https.onRequest(app);

// GitHub automation functions
exports.githubWebhook = githubWebhook;
exports.syncGitHubData = syncGitHubData;
exports.scheduledSync = scheduledSync;

// OpenSign integration functions
exports.createSigningSession = opensignFunctions.createSigningSession;
exports.createTemplateFromUpload = opensignFunctions.createTemplateFromUpload;
exports.opensignWebhook = opensignFunctions.opensignWebhook;
exports.verifyOtp = opensignFunctions.verifyOtp;
exports.generateOtp = opensignFunctions.generateOtp;
exports.resendReminder = opensignFunctions.resendReminder;
exports.scheduledExpireSessions = opensignFunctions.scheduledExpireSessions;
exports.downloadSignedDocument = opensignFunctions.downloadSignedDocument;
