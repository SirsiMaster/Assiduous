# Onfido API Integration Guide

## Overview
This document provides the API request sequences for integrating Onfido KYC verification with the Assiduous platform.

## Prerequisites
- Onfido API account (sandbox for testing)
- API key from Onfido dashboard
- Webhook secret for HMAC verification

## API Request Sequence

### 1) Create Applicant
```bash
curl -X POST https://api.sandbox.onfido.com/v3/applicants \
  -H "Authorization: Token token=ONFIDO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name":"Test",
    "last_name":"Buyer",
    "dob":"1990-01-01",
    "id_numbers":[{"type":"ssn","value":"123-45-6789"}],
    "location":{"country_of_residence":"USA"}
  }'
```

### 2) Create Check (Document + Facial Similarity)
```bash
curl -X POST https://api.sandbox.onfido.com/v3/checks \
  -H "Authorization: Token token=ONFIDO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "applicant_id":"<APPLICANT_ID>",
    "report_names":["document","facial_similarity_photo"]
  }'
```

### 3) Configure Webhook
Configure webhook URL in Onfido dashboard:
- **URL**: `https://<PROJECT_ID>.web.app/api/webhook/kyc`
- **Secret (HMAC)**: The value you set via `firebase functions:config:set onfido.webhook_secret`

### 4) Webhook Payload Mapping
When Onfido webhook arrives, include "verificationId" in the webhook's payload by:
- Mapping your internal "verificationId" to applicant/check on creation
- Using a lookup in `/verifications` collection

## Implementation Notes

### Storing Verification ID
When creating an Onfido applicant/check, store the mapping:
```javascript
// In Firestore
{
  verificationId: "uuid-here",
  onfidoApplicantId: "applicant-id-from-onfido",
  onfidoCheckId: "check-id-from-onfido"
}
```

### Webhook Handler
The webhook handler in `functions/index.js` expects:
- HMAC signature verification
- Mapping of Onfido check ID → verification ID
- Status updates to `/verifications/{verificationId}/kyc`

## Environment Variables
Set in Firebase Functions config:
```bash
firebase functions:config:set onfido.api_key="YOUR_API_KEY"
firebase functions:config:set onfido.webhook_secret="YOUR_WEBHOOK_SECRET"
```

## Testing
1. Use Onfido sandbox environment first
2. Test webhook signatures locally with emulators
3. Verify HMAC validation is working
4. Test with sample applicant data
