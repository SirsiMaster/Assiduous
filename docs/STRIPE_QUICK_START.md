# Stripe Payment Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Get Your Stripe Keys
1. Sign up at https://dashboard.stripe.com/register
2. Go to **Developers** → **API Keys**
3. Copy your test keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Step 2: Configure Environment
```bash
cd /Users/thekryptodragon/Development/assiduous/functions
cp .env.example .env
```

Edit `.env` and add your keys:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE  # Leave empty for now
```

### Step 3: Deploy to Firebase
```bash
# Build functions
npm run build

# Deploy to Firebase
firebase deploy --only functions

# Verify deployment
curl https://us-central1-assiduous-prod.cloudfunctions.net/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T...",
  "service": "Assiduous API v1.0"
}
```

---

## 💳 Test Payment Flow (3 Minutes)

### Test Card Numbers
| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 9995` | ❌ Declined |
| `4000 0025 0000 3155` | 🔐 Requires 3D Secure |

**All test cards:**
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Quick Test Script

**1. Create Payment (Terminal)**
```bash
# Get your Firebase ID token first (from browser console)
# firebase.auth().currentUser.getIdToken().then(token => console.log(token))

curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "amount": 25000,
    "currency": "usd",
    "description": "Property viewing fee - Test"
  }'
```

**Expected Response:**
```json
{
  "clientSecret": "pi_3QRxxxxxxxxxxx_secret_yyyyyyyy",
  "paymentIntentId": "pi_3QRxxxxxxxxxxx"
}
```

**2. Test in Frontend (Browser Console)**
```javascript
// Initialize Stripe (replace with your publishable key)
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');

// Get Firebase token
const user = firebase.auth().currentUser;
const token = await user.getIdToken();

// Create payment intent
const response = await fetch(
  'https://us-central1-assiduous-prod.cloudfunctions.net/api/payments/create-intent',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 25000, // $250 in cents
      currency: 'usd',
      description: 'Viewing Fee'
    })
  }
);

const data = await response.json();
console.log('Client Secret:', data.clientSecret);

// Confirm payment with test card
const result = await stripe.confirmCardPayment(data.clientSecret, {
  payment_method: {
    card: {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 2034,
      cvc: '123'
    }
  }
});

console.log('Payment Result:', result);
// Expected: result.paymentIntent.status === 'succeeded'
```

**3. Verify Payment**
```bash
curl -X POST https://us-central1-assiduous-prod.cloudfunctions.net/api/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "paymentIntentId": "pi_3QRxxxxxxxxxxx"
  }'
```

**Expected Response:**
```json
{
  "status": "succeeded",
  "amount": 25000,
  "currency": "usd",
  "verified": true
}
```

---

## 🎯 Payment Amounts Reference

### Micro-Flipping Fees
```javascript
const FEES = {
  VIEWING_FEE: 25000,        // $250.00
  DEAL_ANALYSIS: 50000,      // $500.00
  EARNEST_DEPOSIT: 250000,   // $2,500.00 (typical)
  ASSIGNMENT_FEE: 500000,    // $5,000.00 (example 2% of $250k property)
};
```

### Usage Example
```javascript
// Viewing fee payment
async function payViewingFee(propertyId) {
  const clientSecret = await createPayment(25000, `Viewing Fee - Property ${propertyId}`);
  const result = await completePayment(clientSecret);
  return result;
}

// Deal analysis payment
async function payDealAnalysis(propertyId) {
  const clientSecret = await createPayment(50000, `Deal Analysis - Property ${propertyId}`);
  const result = await completePayment(clientSecret);
  return result;
}
```

---

## 🔍 Debugging Tips

### Check Function Logs
```bash
# View all API logs
firebase functions:log --only api

# View webhook logs
firebase functions:log --only stripeWebhook

# Follow logs in real-time
firebase functions:log --only api,stripeWebhook --tail
```

### Common Issues & Solutions

#### ❌ "Unauthorized" Error
**Problem:** Missing or invalid Firebase ID token

**Solution:**
```javascript
// Get fresh token
const user = firebase.auth().currentUser;
const token = await user.getIdToken(true); // Force refresh
```

#### ❌ "Card declined" in Test Mode
**Problem:** Using real card numbers in test mode

**Solution:** Use Stripe test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 9995`

#### ❌ "No such payment_intent"
**Problem:** Payment intent ID is invalid or expired (24hr expiry)

**Solution:** Create a new payment intent

#### ❌ Webhook not receiving events
**Problem:** Webhook secret not configured

**Solution:**
1. Get webhook endpoint: `firebase functions:list | grep stripeWebhook`
2. Add to Stripe Dashboard → Webhooks
3. Copy signing secret to `.env`
4. Redeploy functions

---

## 📊 Test Checklist

Before launching to production:

### Backend Tests
- [ ] Health check endpoint responds correctly
- [ ] Create payment intent with authentication
- [ ] Create payment intent fails without authentication
- [ ] Payment verification returns correct status
- [ ] Refund creation works (partial and full)
- [ ] Webhook receives and processes events
- [ ] Function logs show no errors

### Frontend Tests
- [ ] Payment form loads Stripe.js correctly
- [ ] Card element renders properly
- [ ] Successful payment redirects to success page
- [ ] Failed payment shows error message
- [ ] Payment status updates in database
- [ ] Receipt/confirmation displays correctly

### Security Tests
- [ ] Cannot create payment without authentication
- [ ] Cannot access other users' payment data
- [ ] Webhook signature verification works
- [ ] Card details never logged or stored
- [ ] HTTPS enforced on all endpoints

---

## 🎉 Production Deployment

### 1. Switch to Live Keys
Update Firebase config with live keys:
```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_LIVE_KEY" \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
```

### 2. Update Frontend
Replace test publishable key:
```javascript
// Before (test)
const stripe = Stripe('pk_test_...');

// After (production)
const stripe = Stripe('pk_live_...');
```

### 3. Deploy
```bash
firebase deploy --only functions
```

### 4. Test with Real Card
```bash
# Use a real credit card with small amount
# Amount: $1.00 (100 cents) for testing
```

### 5. Verify in Stripe Dashboard
1. Go to https://dashboard.stripe.com/payments
2. Switch to **Live** mode (toggle in top-left)
3. Verify test payment appears
4. Check webhook events received

---

## 📞 Support Resources

### Documentation
- **Full Setup Guide:** `/docs/STRIPE_SETUP.md`
- **Stripe API Docs:** https://stripe.com/docs/api
- **Firebase Functions:** https://firebase.google.com/docs/functions

### Dashboards
- **Stripe Test:** https://dashboard.stripe.com/test/dashboard
- **Stripe Live:** https://dashboard.stripe.com/dashboard
- **Firebase Console:** https://console.firebase.google.com/project/assiduous-prod

### Contact
- **Stripe Support:** https://support.stripe.com
- **Firebase Support:** https://firebase.google.com/support

---

## ⚡ Advanced: Local Testing

### Run Functions Locally
```bash
cd functions
npm run serve

# Functions available at:
# http://localhost:5001/assiduous-prod/us-central1/api
```

### Test Locally
```bash
# Create payment locally
curl -X POST http://localhost:5001/assiduous-prod/us-central1/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 25000, "currency": "usd", "description": "Test"}'
```

### Use Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:5001/assiduous-prod/us-central1/stripeWebhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

---

**Last Updated:** January 2025  
**Quick Start Version:** 1.0  
**Ready to Accept Payments:** ✅ Yes!
