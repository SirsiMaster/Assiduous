# Stripe Payment Integration Setup Guide

## Overview
This guide covers the complete setup, configuration, and testing of Stripe payment integration for the Assiduous real estate platform.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Stripe Account Setup](#stripe-account-setup)
3. [Environment Configuration](#environment-configuration)
4. [Firebase Functions Deployment](#firebase-functions-deployment)
5. [Frontend Integration](#frontend-integration)
6. [Testing Payments](#testing-payments)
7. [Webhook Configuration](#webhook-configuration)
8. [Production Checklist](#production-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ Stripe account (https://dashboard.stripe.com/register)
- ✅ Firebase project (assiduous-prod)
- ✅ Node.js 18+ installed

### Required Tools
```bash
npm install -g firebase-tools
firebase login
```

---

## Stripe Account Setup

### 1. Create Stripe Account
1. Go to https://dashboard.stripe.com/register
2. Sign up with your business email
3. Complete business verification
4. Activate payments

### 2. Get API Keys
1. Navigate to **Developers** → **API Keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

**Test Mode Keys:**
- Publishable: `pk_test_...`
- Secret: `sk_test_...`

**Production Keys (when ready):**
- Publishable: `pk_live_...`
- Secret: `sk_live_...`

### 3. Configure Payment Methods
1. Go to **Settings** → **Payment Methods**
2. Enable:
   - ✅ Credit/Debit Cards
   - ✅ ACH Direct Debit (for large transactions)
   - ✅ Apple Pay
   - ✅ Google Pay

---

## Environment Configuration

### 1. Create Environment File

```bash
cd /Users/thekryptodragon/Development/assiduous/functions
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `functions/.env`:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Payment Settings
PAYMENT_CURRENCY=usd
PAYMENT_SUCCESS_URL=https://assiduous-prod.web.app/payment-success
PAYMENT_CANCEL_URL=https://assiduous-prod.web.app/payment-cancel
```

### 3. Set Firebase Config (Production)

For production deployment, use Firebase environment config:
```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_LIVE_KEY" \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
```

View current config:
```bash
firebase functions:config:get
```

---

## Firebase Functions Deployment

### 1. Build Functions
```bash
cd /Users/thekryptodragon/Development/assiduous/functions
npm run build
```

### 2. Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:api,functions:stripeWebhook
```

### 3. Verify Deployment
```bash
# Get function URLs
firebase functions:list

# Expected output:
# api(us-central1): https://us-central1-assiduous-prod.cloudfunctions.net/api
# stripeWebhook(us-central1): https://us-central1-assiduous-prod.cloudfunctions.net/stripeWebhook
```

### 4. Test API Endpoint
```bash
curl https://us-central1-assiduous-prod.cloudfunctions.net/api/health
# Expected: {"status":"healthy","timestamp":"...","service":"Assiduous API v1.0"}
```

---

## Frontend Integration

### 1. Add Stripe.js to HTML
Add to your HTML pages (e.g., `client/payment.html`):
```html
<script src="https://js.stripe.com/v3/"></script>
```

### 2. Initialize Stripe Client
```javascript
// Replace with your publishable key
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');
```

### 3. Create Payment Intent
```javascript
async function createPayment(amount, description) {
  const auth = firebase.auth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();
  
  const response = await fetch(
    'https://us-central1-assiduous-prod.cloudfunctions.net/api/payments/create-intent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        description: description
      })
    }
  );
  
  const data = await response.json();
  return data.clientSecret;
}
```

### 4. Complete Payment
```javascript
async function completePayment(clientSecret, cardElement) {
  const {error, paymentIntent} = await stripe.confirmCardPayment(
    clientSecret,
    {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'Customer Name'
        }
      }
    }
  );
  
  if (error) {
    console.error('Payment failed:', error);
    return {success: false, error: error.message};
  }
  
  if (paymentIntent.status === 'succeeded') {
    console.log('Payment succeeded!');
    return {success: true, paymentIntentId: paymentIntent.id};
  }
}
```

---

## Testing Payments

### Test Card Numbers

Stripe provides test card numbers for various scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Declined - insufficient funds |
| `4000 0000 0000 0002` | Declined - generic decline |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0127` | Incorrect CVC |

**Additional Test Details:**
- **Expiry Date:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Test Workflow

#### 1. Create Payment Intent
```bash
curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "amount": 25000,
    "currency": "usd",
    "description": "Property viewing fee"
  }'
```

Expected response:
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

#### 2. Test in Frontend
```javascript
// Create Stripe card element
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// Submit payment
const clientSecret = await createPayment(250, 'Viewing Fee');
const result = await completePayment(clientSecret, cardElement);

if (result.success) {
  console.log('Payment successful!', result.paymentIntentId);
  // Redirect to success page
  window.location.href = '/payment-success?payment=' + result.paymentIntentId;
}
```

#### 3. Verify Payment
```bash
curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/api/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'
```

Expected response:
```json
{
  "status": "succeeded",
  "amount": 25000,
  "currency": "usd",
  "verified": true
}
```

---

## Webhook Configuration

### 1. Get Webhook Endpoint URL
```bash
firebase functions:list | grep stripeWebhook
# Output: stripeWebhook(us-central1): https://us-central1-assiduous-prod.cloudfunctions.net/stripeWebhook
```

### 2. Configure in Stripe Dashboard
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://us-central1-assiduous-prod.cloudfunctions.net/stripeWebhook`
4. Select events to listen for:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
   - ✅ `customer.created`
   - ✅ `customer.updated`

5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### 3. Update Environment with Webhook Secret
```bash
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET"
firebase deploy --only functions:stripeWebhook
```

### 4. Test Webhook
1. In Stripe Dashboard → Webhooks
2. Click your webhook endpoint
3. Click **Send test webhook**
4. Select `payment_intent.succeeded`
5. Verify in Firebase Functions logs:
```bash
firebase functions:log --only stripeWebhook
```

---

## Production Checklist

Before going live with real payments:

### Stripe Configuration
- [ ] Verify business details in Stripe account
- [ ] Complete identity verification
- [ ] Activate account for live payments
- [ ] Switch to production API keys
- [ ] Configure payout schedule
- [ ] Set up tax reporting (if applicable)

### Firebase Setup
- [ ] Deploy functions to production
- [ ] Set production environment variables
- [ ] Configure webhook with production URL
- [ ] Enable Firebase security rules for payments
- [ ] Set up Firebase monitoring and alerts

### Frontend
- [ ] Replace test publishable key with live key
- [ ] Update API URLs to production
- [ ] Implement proper error handling
- [ ] Add loading states for payment processing
- [ ] Create payment success/failure pages
- [ ] Implement receipt/confirmation emails

### Security
- [ ] Enable HTTPS everywhere
- [ ] Validate all inputs server-side
- [ ] Never log sensitive card data
- [ ] Implement rate limiting
- [ ] Add fraud detection (Stripe Radar)
- [ ] Set up PCI compliance

### Testing
- [ ] Test all payment flows end-to-end
- [ ] Test with real card (small amount)
- [ ] Verify webhooks are working
- [ ] Test refund process
- [ ] Load test payment API
- [ ] Test mobile responsiveness

### Compliance
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add Refund Policy
- [ ] Display pricing clearly
- [ ] Show transaction fees transparently

---

## Payment Amounts for Assiduous

### Micro-Flipping Fees
- **Viewing Fee:** $250 (25000 cents)
- **Deal Analysis Fee:** $500 (50000 cents)
- **Earnest Money Deposit:** $1,000 - $5,000
- **Assignment Fee:** 2-5% of property value

### Premium Features
- **Premium Listing:** $99/month
- **Featured Property:** $49/property
- **Market Analysis Report:** $199

### Implementation Example
```javascript
// Micro-flip viewing fee
const viewingFee = 250; // $250
const clientSecret = await createPayment(viewingFee, 'Property Viewing Fee');

// Deal analysis
const analysisFee = 500; // $500
const clientSecret = await createPayment(analysisFee, 'Deal Analysis Report');

// Earnest money deposit
const depositAmount = 2500; // $2,500
const clientSecret = await createPayment(depositAmount, 'Earnest Money Deposit - 123 Main St');
```

---

## Troubleshooting

### Common Issues

#### 1. "Authentication required" error
**Solution:** Ensure Firebase ID token is included in Authorization header
```javascript
const token = await firebase.auth().currentUser.getIdToken();
// Add to headers: 'Authorization': `Bearer ${token}`
```

#### 2. "No such payment_intent" error
**Solution:** Verify payment intent ID is correct and hasn't expired
```javascript
// Payment intents expire after 24 hours
const paymentIntent = await stripe.paymentIntents.retrieve('pi_xxx');
console.log('Status:', paymentIntent.status);
```

#### 3. Webhook not receiving events
**Solutions:**
- Verify webhook URL is publicly accessible
- Check webhook signing secret is correct
- Ensure webhook is configured for the right events
- Check Firebase Functions logs for errors

#### 4. "Card declined" errors
**Solutions:**
- Use test card numbers in test mode
- Check card details are entered correctly
- Verify sufficient funds (for live mode)
- Try different test card for different scenarios

### Debugging

#### View Function Logs
```bash
firebase functions:log --only api
firebase functions:log --only stripeWebhook
```

#### Test API Locally
```bash
cd functions
npm run serve
# Functions available at http://localhost:5001/assiduous-prod/us-central1/api
```

#### Inspect Stripe Events
1. Go to Stripe Dashboard → **Developers** → **Events**
2. View all payment events and their status
3. Click any event to see full JSON payload

---

## Support & Resources

### Documentation
- **Stripe Docs:** https://stripe.com/docs
- **Firebase Functions:** https://firebase.google.com/docs/functions
- **Payment Intents:** https://stripe.com/docs/payments/payment-intents

### Stripe Dashboard
- **Test Mode:** https://dashboard.stripe.com/test/dashboard
- **Live Mode:** https://dashboard.stripe.com/dashboard
- **Logs:** https://dashboard.stripe.com/test/logs

### Contact
- **Stripe Support:** https://support.stripe.com
- **Firebase Support:** https://firebase.google.com/support

---

## Next Steps

1. ✅ Complete Stripe account setup
2. ✅ Deploy Cloud Functions
3. ✅ Configure webhooks
4. ✅ Integrate frontend payment forms
5. ✅ Test with test cards
6. ✅ Switch to production keys
7. ✅ Launch! 🚀

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Production Ready
