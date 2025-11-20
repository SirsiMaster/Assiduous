# API Credentials Setup Guide

## 🔐 Required API Keys for Assiduous

### 1. SendGrid (Email Service) - **PRIORITY**

**Purpose**: Send transactional emails (welcome, lead notifications, viewing confirmations)

**Steps**:
1. Go to https://signup.sendgrid.com/
2. Sign up with:
   - Email: your-email@gmail.com
   - Company: Assiduous Real Estate
   - Role: Developer
   - Use case: Transactional emails
3. Verify email address
4. Navigate to: Settings → API Keys
5. Click "Create API Key"
6. Name: "Assiduous Production"
7. Select: "Full Access"
8. Copy the API key (shown only once!)

**Save the key** - We'll add it to `.env` file next

---

### 2. Stripe (Payment Processing) - **PRIORITY**

**Purpose**: Accept subscription payments from agents ($99/month)

**Steps**:
1. Go to https://dashboard.stripe.com/register
2. Sign up and verify email
3. Complete business profile:
   - Business name: Assiduous Real Estate
   - Industry: Real Estate
4. Navigate to: Developers → API Keys
5. Copy both keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
6. Navigate to: Developers → Webhooks
7. Add endpoint: `https://us-central1-assiduous-prod.cloudfunctions.net/stripeWebhook`
8. Select events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`
9. Copy **Webhook signing secret** (starts with `whsec_`)

---

### 3. Firebase Service Account (Already Configured)

**Status**: ✅ Already set up through Firebase CLI

---

## 📝 Setting Up Environment Variables

### Step 1: Create `.env` File in `functions/` Directory

```bash
# From project root
cd functions
cp .env.example .env
```

### Step 2: Edit `.env` File with Real Credentials

```bash
# Open in your editor
nano .env
# or
code .env
```

### Step 3: Fill in the Values

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE

# SendGrid Configuration  
SENDGRID_API_KEY=SG.YOUR_ACTUAL_KEY_HERE

# Default Email Settings
NOTIFICATION_EMAIL=noreply@assiduousrealty.com

# Payment Settings (keep defaults)
PAYMENT_CURRENCY=usd
PAYMENT_SUCCESS_URL=https://assiduous-prod.web.app/payment-success
PAYMENT_CANCEL_URL=https://assiduous-prod.web.app/payment-cancel
```

### Step 4: Verify `.env` is in `.gitignore`

```bash
# Check if .env is ignored
grep "\.env" ../.gitignore
```

Should see:
```
.env
functions/.env
*.env
```

---

## 🚀 Deploy Updated Configuration

### Option 1: Deploy Functions with New Environment (Recommended)

```bash
# From project root
firebase deploy --only functions
```

The `.env` file will be automatically uploaded during deployment.

---

## 🧪 Test the Setup

### Test 1: SendGrid Email

```bash
# Create a test user to trigger welcome email
# Go to: https://assiduous-prod.web.app/client/signup.html
# Sign up with a test email
# Check inbox for welcome email
```

### Test 2: Stripe Payment

```bash
# Test checkout flow
# Use test card: 4242 4242 4242 4242
# Any future expiry date
# Any 3-digit CVC
```

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Never commit `.env` to Git
- [ ] Use test keys in development
- [ ] Use production keys only in production
- [ ] Rotate keys if compromised
- [ ] Keep `.env.example` updated (without real values)

---

## 📞 Support Resources

- **SendGrid Docs**: https://docs.sendgrid.com/
- **Stripe Docs**: https://stripe.com/docs
- **Firebase Docs**: https://firebase.google.com/docs/functions/config-env

---

## ✅ Completion Checklist

- [ ] SendGrid account created
- [ ] SendGrid API key obtained
- [ ] Stripe account created  
- [ ] Stripe API keys obtained
- [ ] Stripe webhook configured
- [ ] `.env` file created in `functions/`
- [ ] All keys added to `.env`
- [ ] Functions deployed with new config
- [ ] Email test passed
- [ ] Payment test passed

Once all items are checked, Step 5 is complete! 🎉
