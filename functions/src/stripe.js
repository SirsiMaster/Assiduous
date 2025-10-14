const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe?.secret || process.env.STRIPE_SECRET_KEY);

const db = admin.firestore();

/**
 * Create Stripe Checkout Session for Agent Subscription
 * POST /api/v1/stripe/create-checkout-session
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { priceId, successUrl, cancelUrl } = data;

    // Get or create Stripe customer
    let customerId;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData.stripeCustomerId) {
      customerId = userData.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          firebaseUID: userId,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        },
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId || 'price_agent_monthly_99', // Default price ID
          quantity: 1,
        },
      ],
      success_url: successUrl || `${functions.config().app?.url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${functions.config().app?.url}/payment/cancel`,
      metadata: {
        firebaseUID: userId,
      },
      subscription_data: {
        metadata: {
          firebaseUID: userId,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create Stripe Customer Portal Session
 * POST /api/v1/stripe/create-portal-session
 */
exports.createPortalSession = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { returnUrl } = data;

    // Get Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData.stripeCustomerId) {
      throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer found');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl || `${functions.config().app?.url}/agent/settings`,
    });

    return {
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Stripe Webhook Handler
 * POST /stripe/webhook
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata.firebaseUID;
  if (!userId) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  await db.collection('users').doc(userId).update({
    subscription: {
      id: subscription.id,
      status: subscription.status,
      planId: subscription.items.data[0].price.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    subscriptionStatus: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create subscription record
  await db.collection('subscriptions').doc(subscription.id).set({
    userId,
    customerId: subscription.customer,
    status: subscription.status,
    planId: subscription.items.data[0].price.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Subscription created for user ${userId}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata.firebaseUID;
  if (!userId) return;

  const status = subscription.status === 'active' || subscription.status === 'trialing' 
    ? 'active' 
    : 'inactive';

  await db.collection('users').doc(userId).update({
    subscription: {
      id: subscription.id,
      status: subscription.status,
      planId: subscription.items.data[0].price.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    subscriptionStatus: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('subscriptions').doc(subscription.id).update({
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.firebaseUID;
  if (!userId) return;

  await db.collection('users').doc(userId).update({
    'subscription.status': 'canceled',
    subscriptionStatus: 'inactive',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('subscriptions').doc(subscription.id).update({
    status: 'canceled',
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Subscription canceled for user ${userId}`);
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  // Record payment
  await db.collection('payments').add({
    customerId,
    subscriptionId,
    invoiceId: invoice.id,
    amount: invoice.amount_paid / 100, // Convert cents to dollars
    currency: invoice.currency,
    status: 'succeeded',
    paidAt: new Date(invoice.status_transitions.paid_at * 1000),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Payment succeeded for subscription ${subscriptionId}`);
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  // Record failed payment
  await db.collection('payments').add({
    customerId,
    subscriptionId,
    invoiceId: invoice.id,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: 'failed',
    failedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Find user and update status
  const usersSnapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (!usersSnapshot.empty) {
    const userId = usersSnapshot.docs[0].id;
    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'payment_failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  console.log(`Payment failed for subscription ${subscriptionId}`);
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.firebaseUID;
  if (!userId) return;

  await db.collection('users').doc(userId).update({
    stripeCustomerId: session.customer,
    subscriptionStatus: 'active',
    onboardingComplete: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Checkout completed for user ${userId}`);
}

/**
 * Create Payment Intent (for one-time payments)
 * Used for viewing fees, earnest money, etc.
 */
exports.createPaymentIntent = async (amount, currency, metadata) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: currency || 'usd',
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Retrieve Payment Intent
 * Used to verify payment status
 */
exports.retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
};

/**
 * Create Refund
 * Used for refunding payments
 */
exports.createRefund = async (paymentIntentId, amount, reason) => {
  try {
    const refundData = {
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
    };

    // If amount specified, partial refund; otherwise full refund
    if (amount) {
      refundData.amount = Math.round(amount);
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
};

/**
 * Handle Stripe Webhook (exported for index.ts)
 * This is the same as stripeWebhook but exposed for external use
 */
exports.handleStripeWebhook = exports.stripeWebhook;

/**
 * Get subscription status
 * GET /api/v1/stripe/subscription-status
 */
exports.getSubscriptionStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData.stripeCustomerId) {
      return {
        hasSubscription: false,
        status: 'none',
      };
    }

    // Get latest subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      limit: 1,
      status: 'all',
    });

    if (subscriptions.data.length === 0) {
      return {
        hasSubscription: false,
        status: 'none',
      };
    }

    const subscription = subscriptions.data[0];

    return {
      hasSubscription: true,
      status: subscription.status,
      planId: subscription.items.data[0].price.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

module.exports = {
  createCheckoutSession: exports.createCheckoutSession,
  createPortalSession: exports.createPortalSession,
  stripeWebhook: exports.stripeWebhook,
  handleStripeWebhook: exports.stripeWebhook,
  getSubscriptionStatus: exports.getSubscriptionStatus,
  createPaymentIntent: exports.createPaymentIntent,
  retrievePaymentIntent: exports.retrievePaymentIntent,
  createRefund: exports.createRefund,
};
