# Configuration Checklist

## One-Time Setup Requirements

This document lists all the configuration changes needed before deploying the Firebase migration package.

## Required Edits

### 1. Firebase Project Configuration

#### `.firebaserc`
- [ ] Replace `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase project ID
- Location: `firebase-migration-package/.firebaserc`
- Example: Change `"default": "YOUR_FIREBASE_PROJECT_ID"` to `"default": "assiduous-prod"`

### 2. Environment Configuration

#### `scripts/init-firebase.sh`
When running this script, you'll be prompted for:
- [ ] Firebase project ID
- [ ] Onfido webhook secret
- [ ] Plaid webhook secret  
- [ ] Sirsi webhook URL (if applicable)

**Tip**: You can set these as environment variables before running:
```bash
export PROJECT_ID="assiduous-prod"
export ONFIDO_WHS="your-onfido-secret"
export PLAID_WHS="your-plaid-secret"
export SIRSI_WEBHOOK_URL="https://your-webhook-url"
```

### 3. Application Base URL (Optional)

#### `functions/index.js`
- [ ] Replace `APP_BASE_URL` default with your Firebase Hosting URL
- Current: `process.env.APP_BASE_URL || 'https://example.web.app'`
- Change to: `process.env.APP_BASE_URL || 'https://assiduous-prod.web.app'`

**Alternative**: Set via Firebase Functions config:
```bash
firebase functions:config:set app.base_url="https://assiduous-prod.web.app"
```

Then update `functions/index.js` to read from config:
```javascript
const appBase = functions.config().app?.base_url || 'https://example.web.app';
```

## Vendor Account Setup

### Onfido (KYC Provider)
1. [ ] Create Onfido account at https://onfido.com
2. [ ] Get API keys from dashboard
3. [ ] Configure webhook endpoint
4. [ ] Set webhook secret for HMAC

### Plaid (Banking/Funds Verification)
1. [ ] Create Plaid account at https://plaid.com
2. [ ] Get Client ID and Secret
3. [ ] Configure webhook endpoint
4. [ ] Set webhook verification secret

### Optional: AML Provider
1. [ ] Choose AML provider (ComplyAdvantage, Trulioo, etc.)
2. [ ] Get API credentials
3. [ ] Implement webhook handler

## Firebase Services Setup

### Required Firebase Services
- [ ] Authentication (if using user auth)
- [ ] Firestore Database
- [ ] Cloud Functions
- [ ] Firebase Hosting

### Enable in Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project
3. Enable each service from the left menu

## Domain Configuration (Optional)

### Custom Domain Setup
1. [ ] Add custom domain in Firebase Hosting console
2. [ ] Update DNS CNAME records
3. [ ] Wait for SSL provisioning
4. [ ] Update all webhook URLs with new domain

## Security Configuration

### API Keys and Secrets
- [ ] Never commit real API keys to Git
- [ ] Use Firebase Functions config for secrets
- [ ] Enable Firebase App Check (optional)
- [ ] Configure CORS appropriately

### Firestore Security Rules
- [ ] Review and customize `firestore.rules`
- [ ] Test rules in Firebase console
- [ ] Deploy rules with `firebase deploy --only firestore:rules`

## Pre-Deployment Checklist

Before running deployment scripts:
1. [ ] All configuration files updated
2. [ ] Vendor accounts created and configured
3. [ ] Firebase project created and services enabled
4. [ ] Secrets set via `firebase functions:config:set`
5. [ ] Local testing completed with emulators

## Post-Deployment Verification

After deployment:
1. [ ] Run `./scripts/qa-check.sh`
2. [ ] Review `functions/ivv-report.md`
3. [ ] Test webhook endpoints
4. [ ] Verify Firestore security rules
5. [ ] Check Firebase Functions logs
