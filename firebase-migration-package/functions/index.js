const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Body parsers
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
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
  },
  stripe: {
    secret: (functions.config().stripe && functions.config().stripe.secret) || '',
    webhook_secret: (functions.config().stripe && functions.config().stripe.webhook_secret) || '',
    price_agent: (functions.config().stripe && functions.config().stripe.price_agent) || '' // Agent subscription price ID
  },
  sendgrid: {
    key: (functions.config().sendgrid && functions.config().sendgrid.key) || '',
    from_email: (functions.config().sendgrid && functions.config().sendgrid.from_email) || 'no-reply@assiduous.ai'
  }
};

// Initialize Stripe and SendGrid
const stripe = cfg.stripe.secret ? require('stripe')(cfg.stripe.secret) : null;
if (cfg.sendgrid.key) {
  sgMail.setApiKey(cfg.sendgrid.key);
}

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

// --- Auth Middleware ---
async function withAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    console.error('Auth error:', e.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

function isAgent(req) {
  return req.user && req.user.role === 'agent';
}

function isClient(req) {
  return req.user && req.user.role === 'client';
}

// --- Day 4: Billing & Notifications ---

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create Stripe Checkout Session for Agent Subscription
app.post('/api/v1/billing/create-checkout-session', withAuth, async (req, res) => {
  try {
    if (!isAgent(req) && !isAdmin(req)) {
      return res.status(403).json({ error: 'Agents only' });
    }
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const priceId = cfg.stripe.price_agent;
    if (!priceId) {
      return res.status(500).json({ error: 'Subscription price not configured' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'https://assiduous-prod.web.app'}/agent/settings.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://assiduous-prod.web.app'}/agent/settings.html?canceled=true`,
      client_reference_id: req.user.uid,
      customer_email: req.user.email,
      metadata: {
        userId: req.user.uid,
        role: req.user.role || 'agent'
      }
    });

    console.log('Created checkout session:', session.id, 'for user:', req.user.uid);
    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('Checkout session error:', e);
    res.status(500).json({ error: 'Checkout session failed' });
  }
});

// Stripe Webhook Handler
app.post('/webhooks/stripe', async (req, res) => {
  let event = req.body;
  const sig = req.headers['stripe-signature'];

  if (!stripe) {
    console.error('Stripe not configured');
    return res.sendStatus(400);
  }

  try {
    // Verify webhook signature
    if (cfg.stripe.webhook_secret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, cfg.stripe.webhook_secret);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.sendStatus(400);
  }

  console.log('Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.client_reference_id || session.metadata?.userId;
        
        if (uid) {
          await db.collection('users').doc(uid).set({
            billing: {
              customerId: session.customer,
              subscriptionId: session.subscription,
              subscriptionStatus: 'active',
              currentPeriodEnd: null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
          }, { merge: true });

          // Create notification
          await db.collection('notifications').add({
            userId: uid,
            type: 'billing',
            title: 'Subscription Activated',
            message: 'Your agent subscription is now active. Welcome to Assiduous Pro!',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Send welcome email
          if (cfg.sendgrid.key && session.customer_email) {
            await sgMail.send({
              to: session.customer_email,
              from: cfg.sendgrid.from_email,
              subject: 'Welcome to Assiduous Agent Pro',
              html: `
                <h2>Welcome to Assiduous Agent Pro!</h2>
                <p>Your subscription is now active. You can now access all premium features.</p>
                <p>Thank you for choosing Assiduous!</p>
                <p><a href="https://assiduous-prod.web.app/agent/dashboard.html">Go to Dashboard</a></p>
              `
            });
          }

          console.log('Subscription activated for user:', uid);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const uid = sub.metadata?.userId;
        
        if (uid) {
          await db.collection('users').doc(uid).set({
            billing: {
              customerId: sub.customer,
              subscriptionId: sub.id,
              subscriptionStatus: sub.status,
              currentPeriodEnd: sub.current_period_end,
              cancelAtPeriodEnd: sub.cancel_at_period_end || false,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
          }, { merge: true });

          console.log('Subscription updated for user:', uid, 'Status:', sub.status);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const uid = sub.metadata?.userId;
        
        if (uid) {
          await db.collection('users').doc(uid).set({
            billing: {
              subscriptionStatus: 'canceled',
              canceledAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
          }, { merge: true });

          // Notify user
          await db.collection('notifications').add({
            userId: uid,
            type: 'billing',
            title: 'Subscription Canceled',
            message: 'Your agent subscription has been canceled.',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log('Subscription canceled for user:', uid);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        // Find user by customer ID
        const usersSnap = await db.collection('users')
          .where('billing.customerId', '==', customerId)
          .limit(1)
          .get();
        
        if (!usersSnap.empty) {
          const uid = usersSnap.docs[0].id;
          const userEmail = usersSnap.docs[0].data().email;

          await db.collection('notifications').add({
            userId: uid,
            type: 'billing',
            title: 'Payment Failed',
            message: 'Your subscription payment failed. Please update your payment method.',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Send email notification
          if (cfg.sendgrid.key && userEmail) {
            await sgMail.send({
              to: userEmail,
              from: cfg.sendgrid.from_email,
              subject: 'Payment Failed - Action Required',
              html: `
                <h2>Payment Failed</h2>
                <p>We were unable to process your subscription payment.</p>
                <p>Please update your payment method to avoid service interruption.</p>
                <p><a href="https://assiduous-prod.web.app/agent/settings.html">Update Payment Method</a></p>
              `
            });
          }

          console.log('Payment failed notification sent to user:', uid);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (e) {
    console.error('Webhook processing error:', e);
    res.sendStatus(500);
  }
});

// Get user's billing status
app.get('/api/v1/billing/status', withAuth, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const billing = userDoc.data().billing || {};
    res.json({
      status: billing.subscriptionStatus || 'inactive',
      customerId: billing.customerId || null,
      currentPeriodEnd: billing.currentPeriodEnd || null,
      cancelAtPeriodEnd: billing.cancelAtPeriodEnd || false
    });
  } catch (e) {
    console.error('Billing status error:', e);
    res.status(500).json({ error: 'Failed to get billing status' });
  }
});

// Get user notifications
app.get('/api/v1/notifications', withAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const unreadOnly = req.query.unreadOnly === 'true';
    
    let query = db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    const snap = await query.get();
    const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    res.json({ data: notifications });
  } catch (e) {
    console.error('Notifications error:', e);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
app.put('/api/v1/notifications/:id/read', withAuth, async (req, res) => {
  try {
    const notifRef = db.collection('notifications').doc(req.params.id);
    const notif = await notifRef.get();
    
    if (!notif.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (notif.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await notifRef.update({ read: true, readAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ ok: true });
  } catch (e) {
    console.error('Mark notification read error:', e);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Send test notification (admin only, for testing)
app.post('/api/v1/notifications/test', withAuth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { userId, title, message, type } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'userId, title, and message required' });
    }

    const notifRef = await db.collection('notifications').add({
      userId,
      type: type || 'system',
      title,
      message,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ id: notifRef.id, ok: true });
  } catch (e) {
    console.error('Test notification error:', e);
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

// Send email notification (for lead assignments, etc.)
async function sendEmailNotification(to, subject, htmlContent) {
  if (!cfg.sendgrid.key) {
    console.warn('SendGrid not configured, skipping email');
    return false;
  }

  try {
    await sgMail.send({
      to,
      from: cfg.sendgrid.from_email,
      subject,
      html: htmlContent
    });
    console.log('Email sent to:', to);
    return true;
  } catch (e) {
    console.error('SendGrid email error:', e.message);
    return false;
  }
}

// Export helper for use in other functions
exports.sendEmailNotification = sendEmailNotification;

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
