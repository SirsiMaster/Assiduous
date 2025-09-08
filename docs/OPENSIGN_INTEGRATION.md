# OpenSign Integration Documentation
## Assiduous Platform E-Signature Implementation

**Version:** 1.0.0  
**Last Updated:** September 8, 2025  
**Status:** Implementation Ready

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [API Reference](#api-reference)
5. [Security Implementation](#security-implementation)
6. [User Workflows](#user-workflows)
7. [Development Guide](#development-guide)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The OpenSign integration provides comprehensive e-signature capabilities for all contracts and documents in the Assiduous platform. This replaces manual signing processes with a secure, legally compliant digital signature solution.

### Key Features
- **Multi-party signing** with role-based permissions
- **OTP verification** for guest signers
- **Encrypted document storage** in Firebase
- **Audit trail** with completion certificates
- **Template management** for common real estate documents
- **Webhook integration** for real-time status updates
- **Mobile-responsive** signing experience

### Integration Points
- **Transactions**: Each transaction can have multiple signing sessions
- **Templates**: Reusable document templates for common contracts
- **Notifications**: Real-time updates on signing progress
- **Storage**: Encrypted document storage with access controls

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Client Applications                    │
│  (Admin Portal, Client Portal, Mobile Apps)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Firebase Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Firestore   │  │   Storage    │  │     Auth     │ │
│  │  Database    │  │   (PDFs)     │  │   (Users)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Cloud Functions Middleware                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ • createSigningSession  • opensignWebhook        │  │
│  │ • verifyOtp            • scheduledExpireSessions │  │
│  │ • resendReminder       • downloadSignedDocument  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  OpenSign Platform                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Parse Server │  │   MongoDB    │  │  S3 Storage  │ │
│  │    (API)     │  │  (Metadata)  │  │   (Docs)     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Document Creation**
   - User uploads document or selects template
   - Document stored in Firebase Storage (encrypted)
   - Metadata saved to Firestore

2. **Signing Session Initiation**
   - Cloud Function creates envelope in OpenSign
   - Session details stored in Firestore
   - Signing URLs generated for each participant

3. **Signing Process**
   - User accesses signing URL
   - OTP verification for guest users
   - Document signed via OpenSign interface
   - Webhook updates Firestore in real-time

4. **Completion**
   - Signed document downloaded from OpenSign
   - Encrypted and stored in Firebase Storage
   - Audit trail saved for compliance
   - Notifications sent to all parties

---

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Firebase project configured
- SendGrid API key for email notifications
- AWS S3 bucket (or Firebase Storage compatibility)

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/SirsiMaster/Assiduous.git
cd assiduous

# Copy environment template
cp .env.opensign.example .env.opensign

# Edit environment variables
nano .env.opensign
```

### 2. Start OpenSign Services

```bash
# Start OpenSign with Docker Compose
docker-compose -f docker-compose.opensign.yml up -d

# Verify services are running
docker ps | grep opensign

# Check OpenSign health
curl http://localhost:3000/health
```

### 3. Configure Firebase

```bash
# Deploy updated Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
cd firebase-migration-package/functions
npm install
firebase deploy --only functions
```

### 4. Initialize Templates

```bash
# Run template initialization script
node scripts/init-opensign-templates.js
```

### Environment Variables

```env
# OpenSign Core
OPENSIGN_MASTER_KEY=your_secure_master_key
OPENSIGN_JWT_SECRET=your_jwt_secret
OPENSIGN_ENCRYPTION_KEY=32_character_key
OPENSIGN_WEBHOOK_SECRET=webhook_verification_secret

# MongoDB
MONGO_ROOT_USERNAME=opensign_admin
MONGO_ROOT_PASSWORD=secure_password

# AWS S3 (for document storage)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
OPENSIGN_S3_BUCKET=assiduous-opensign-docs

# SendGrid (email notifications)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=contracts@assiduousflip.com

# Firebase Functions URL
FIREBASE_FUNCTIONS_URL=https://us-central1-assiduous-prod.cloudfunctions.net/app
```

---

## API Reference

### OpenSignService Methods

#### `createSigningSession(transactionId, templateId, signers, options)`
Creates a new signing session for a transaction.

```javascript
const session = await openSignService.createSigningSession(
  'trans_123',
  'template_456',
  [
    { email: 'buyer@example.com', name: 'John Doe', role: 'Buyer' },
    { email: 'seller@example.com', name: 'Jane Smith', role: 'Seller' }
  ],
  {
    expirationDays: 7,
    emailSubject: 'Purchase Agreement Ready for Signature',
    emailMessage: 'Please review and sign the attached purchase agreement.'
  }
);
```

#### `getSigningUrl(sessionId, signerEmail, generateOtp)`
Gets the signing URL for a specific signer.

```javascript
const { url, requiresOtp } = await openSignService.getSigningUrl(
  'session_789',
  'buyer@example.com',
  true // Generate OTP for verification
);
```

#### `verifyOtp(sessionId, signerEmail, otp)`
Verifies the OTP for a signer.

```javascript
const isValid = await openSignService.verifyOtp(
  'session_789',
  'buyer@example.com',
  '123456'
);
```

#### `getSessionStatus(sessionId)`
Gets the current status of a signing session.

```javascript
const status = await openSignService.getSessionStatus('session_789');
console.log(status);
// {
//   status: 'pending',
//   signers: [...],
//   createdAt: Date,
//   expiresAt: Date
// }
```

#### `cancelSession(sessionId, reason)`
Cancels an active signing session.

```javascript
await openSignService.cancelSession(
  'session_789',
  'Transaction cancelled by buyer'
);
```

#### `resendReminder(sessionId, signerEmail)`
Sends a reminder to a specific signer.

```javascript
await openSignService.resendReminder(
  'session_789',
  'seller@example.com'
);
```

### Cloud Functions Endpoints

#### POST `/createSigningSession`
Creates a new signing session.

```bash
curl -X POST https://your-functions-url/createSigningSession \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "trans_123",
    "templateId": "template_456",
    "signers": [...]
  }'
```

#### POST `/opensignWebhook`
Webhook endpoint for OpenSign events.

```bash
# This is called by OpenSign automatically
# Webhook events: envelope.viewed, envelope.signed, envelope.completed, envelope.declined
```

#### POST `/verifyOtp`
Verifies OTP for guest signers.

```bash
curl -X POST https://your-functions-url/verifyOtp \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_789",
    "email": "buyer@example.com",
    "otp": "123456"
  }'
```

---

## Security Implementation

### Encryption

All sensitive documents are encrypted using AES-256-GCM before storage:

```javascript
// Encryption process
1. Document uploaded to OpenSign
2. On completion, document downloaded via webhook
3. Document encrypted using EncryptionService
4. Encrypted document stored in Firebase Storage
5. Encryption keys stored securely in environment variables
```

### Access Control

**Firestore Security Rules:**
- Only authenticated users can access signing sessions
- Users can only view sessions where they are participants
- Cloud Functions have exclusive write access to signing sessions

**Storage Security Rules:**
- Contract documents accessible only to transaction participants
- Templates readable by all authenticated users
- Pending documents accessible only to uploading user

### OTP Verification

For guest signers without Firebase accounts:
1. 6-digit OTP generated and hashed
2. OTP sent via SendGrid email
3. OTP valid for 10 minutes
4. 3 attempt limit before lockout
5. OTP verified before providing signing URL

---

## User Workflows

### Agent Workflow: Send Contract for Signature

1. **Access Contracts Dashboard**
   ```
   Navigate to: /admin/contracts/
   ```

2. **Create New Signing Session**
   - Click "Send for Signature"
   - Select transaction
   - Choose template or upload document
   - Add signers (auto-populated from transaction)
   - Set expiration date
   - Add custom message

3. **Monitor Progress**
   - View real-time status updates
   - See who has viewed/signed
   - Send reminders as needed
   - Download completed documents

### Client Workflow: Sign Documents

1. **Receive Email Notification**
   - Email contains signing link
   - Custom message from agent
   - Expiration date warning

2. **Verify Identity (if guest)**
   - Enter email address
   - Receive OTP code
   - Enter OTP to proceed

3. **Sign Document**
   - Review document in OpenSign
   - Add signature (draw, type, or upload)
   - Add initials where required
   - Confirm and submit

4. **Receive Confirmation**
   - Email with signed copy
   - Access to audit trail
   - Notification to all parties

### Admin Workflow: Template Management

1. **Access Template Manager**
   ```
   Navigate to: /admin/templates/
   ```

2. **Create New Template**
   - Upload PDF document
   - Define signature fields
   - Set field properties (required, optional)
   - Map to transaction types
   - Save template

3. **Manage Existing Templates**
   - Edit field mappings
   - Update document versions
   - Set template permissions
   - Archive old templates

---

## Development Guide

### Local Development Setup

```bash
# 1. Start OpenSign services
docker-compose -f docker-compose.opensign.yml up

# 2. Start Firebase emulators
firebase emulators:start

# 3. Start development server
cd assiduousflip
python -m http.server 8080

# 4. Access application
open http://localhost:8080/assiduousflip/
```

### Adding New Document Types

1. Create template in OpenSign dashboard
2. Add template metadata to Firestore
3. Update UI to include new template option
4. Test signing workflow end-to-end

### Customizing Email Templates

Email templates are located in:
- `functions/templates/signature-request.html`
- `functions/templates/signature-reminder.html`
- `functions/templates/signature-complete.html`

### Debugging Webhooks

```bash
# Use ngrok for local webhook testing
ngrok http 5001

# Update OpenSign webhook URL to ngrok URL
# Monitor webhook logs in Firebase Functions
```

---

## Testing

### Unit Tests

```bash
# Run service tests
npm test -- OpenSignService.test.js

# Run Cloud Functions tests
cd functions
npm test
```

### Integration Tests

```bash
# Run end-to-end tests
npm run test:e2e

# Test specific workflow
npm run test:e2e -- --grep "signing workflow"
```

### Manual Testing Checklist

- [ ] Create signing session from admin portal
- [ ] Receive email notification
- [ ] Complete OTP verification (guest user)
- [ ] Sign document in OpenSign
- [ ] Verify webhook updates in Firestore
- [ ] Download completed document
- [ ] Verify encryption of stored document
- [ ] Check audit trail generation
- [ ] Test reminder functionality
- [ ] Test session expiration

---

## Deployment

### Production Deployment

```bash
# 1. Build and push Docker images
docker build -t opensign-prod .
docker push your-registry/opensign-prod:latest

# 2. Deploy Firebase Functions
firebase deploy --only functions --project production

# 3. Deploy Firestore rules
firebase deploy --only firestore:rules --project production

# 4. Update production environment
kubectl apply -f k8s/opensign-deployment.yaml
```

### Monitoring

- **OpenSign Dashboard**: http://your-domain:4040
- **Firebase Console**: https://console.firebase.google.com
- **CloudWatch Logs**: Monitor function execution
- **Sentry**: Error tracking and alerts

---

## Troubleshooting

### Common Issues

#### OpenSign API Connection Failed
```bash
# Check service status
docker ps | grep opensign

# Check logs
docker logs assiduous-opensign

# Verify network connectivity
curl http://localhost:1337/parse/health
```

#### Webhook Not Receiving Events
```bash
# Verify webhook URL in OpenSign
# Check Cloud Functions logs
firebase functions:log

# Test webhook manually
curl -X POST your-webhook-url \
  -H "X-OpenSign-Signature: test" \
  -d '{"type":"test"}'
```

#### OTP Not Sending
```bash
# Check SendGrid configuration
# Verify email templates exist
# Check spam folder
# Review SendGrid activity logs
```

#### Document Upload Fails
```bash
# Check file size limits (20MB default)
# Verify S3/Storage permissions
# Check network connectivity
# Review error logs
```

### Support Resources

- **OpenSign Documentation**: https://docs.opensignlabs.com
- **Firebase Documentation**: https://firebase.google.com/docs
- **GitHub Issues**: https://github.com/SirsiMaster/Assiduous/issues
- **Discord Community**: https://discord.com/invite/opensign

---

## Appendix

### Database Schema

#### signingTemplates Collection
```javascript
{
  id: "template_123",
  name: "Purchase Agreement",
  description: "Standard residential purchase agreement",
  storagePath: "templates/purchase-agreement.pdf",
  opensignTemplateId: "opensign_template_456",
  fieldMap: {
    buyerName: "field_1",
    sellerName: "field_2",
    propertyAddress: "field_3",
    purchasePrice: "field_4"
  },
  category: "purchase",
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### signingSessions Collection
```javascript
{
  id: "session_789",
  transactionId: "trans_123",
  templateId: "template_123",
  envelopeId: "opensign_env_abc",
  status: "pending", // pending, completed, declined, expired, cancelled
  signers: [
    {
      email: "buyer@example.com",
      name: "John Doe",
      role: "Buyer",
      status: "pending", // pending, viewed, signed
      signedAt: null,
      viewedAt: null,
      otpVerified: false,
      ipAddress: null
    }
  ],
  documents: {
    signed: "contracts/trans_123/session_789/signed.pdf",
    audit: "contracts/trans_123/session_789/audit.pdf"
  },
  createdAt: Timestamp,
  expiresAt: Timestamp,
  completedAt: null,
  metadata: {
    propertyAddress: "123 Main St",
    salePrice: 250000
  }
}
```

### Migration Script

For migrating existing contracts to OpenSign:

```javascript
// scripts/migrate-contracts.js
const migrateContracts = async () => {
  // 1. Get all existing transactions with documents
  const transactions = await getTransactionsWithDocuments();
  
  // 2. For each transaction
  for (const transaction of transactions) {
    // 3. Upload document to template storage
    const templateId = await createTemplateFromDocument(transaction.document);
    
    // 4. Create archived signing session
    await createArchivedSession({
      transactionId: transaction.id,
      templateId,
      status: 'archived',
      signers: transaction.parties,
      completedAt: transaction.signedDate
    });
  }
};
```

---

*Last updated: September 8, 2025*
*Version: 1.0.0*
