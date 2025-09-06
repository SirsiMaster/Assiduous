# Plaid API Integration Guide

## Overview
This document provides the API request sequences for integrating Plaid fund verification with the Assiduous platform.

## Prerequisites
- Plaid API account (sandbox for testing)
- Client ID and Secret from Plaid dashboard
- Webhook configuration for balance updates

## API Request Sequence

### 1) Create Link Token (Server-side)
Add your verificationId into metadata:
```bash
curl -X POST https://sandbox.plaid.com/link/token/create \
  -H "Content-Type: application/json" \
  -d '{
    "client_id":"PLAID_CLIENT_ID",
    "secret":"PLAID_SECRET",
    "client_name":"Sirsi CBV",
    "country_codes":["US"],
    "language":"en",
    "user":{"client_user_id":"<BUYER_ID>"},
    "products":["auth","transactions"],
    "webhook":"https://<PROJECT_ID>.web.app/api/webhook/bank"
  }'
```

### 2) Frontend Integration
Frontend opens Plaid Link with the link_token from above:
```javascript
// In your React component
const linkHandler = Plaid.create({
  token: linkToken,
  onSuccess: (public_token, metadata) => {
    // Send public_token to your server
    exchangePublicToken(public_token);
  }
});
```

### 3) Exchange Public Token for Access Token (Server-side)
```bash
curl -X POST https://sandbox.plaid.com/item/public_token/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "client_id":"PLAID_CLIENT_ID",
    "secret":"PLAID_SECRET",
    "public_token":"<PUBLIC_TOKEN>"
  }'
```

### 4) Retrieve Balance Snapshot (Server-side)
```bash
curl -X POST https://sandbox.plaid.com/accounts/balance/get \
  -H "Content-Type: application/json" \
  -d '{
    "client_id":"PLAID_CLIENT_ID",
    "secret":"PLAID_SECRET",
    "access_token":"<ACCESS_TOKEN>"
  }'
```

## Implementation Notes

### Balance Mapping
Map the account's available balance to cents and store:
```javascript
// Store in Firestore
await db.collection('verifications').doc(verificationId).update({
  'funds.balanceCents': Math.floor(balance.available * 100),
  'funds.currency': balance.iso_currency_code,
  'funds.status': 'VERIFIED',
  'funds.updatedAt': FieldValue.serverTimestamp()
});
```

### Webhook Configuration
Configure Plaid webhook (set in Link token create):
- **URL**: `https://<PROJECT_ID>.web.app/api/webhook/bank`
- **HMAC Secret**: Sign with `plaid.webhook_secret` (validate in the function)

## Environment Variables
Set in Firebase Functions config:
```bash
firebase functions:config:set plaid.client_id="YOUR_CLIENT_ID"
firebase functions:config:set plaid.secret="YOUR_SECRET"
firebase functions:config:set plaid.webhook_secret="YOUR_WEBHOOK_SECRET"
```

## Testing with Sandbox
1. Use Plaid sandbox environment
2. Test credentials: `user_good` / `pass_good`
3. Test various account balances
4. Verify webhook signatures

## Plaid Link Flow
1. Server creates Link token with verificationId
2. Frontend opens Plaid Link modal
3. User connects bank account
4. Frontend receives public_token
5. Server exchanges for access_token
6. Server fetches and stores balance
7. Webhook updates balance changes
