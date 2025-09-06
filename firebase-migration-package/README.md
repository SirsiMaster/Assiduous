# Firebase Migration Package for Assiduous

## Overview

This package provides a complete Firebase infrastructure for the Assiduous real estate platform, including:
- Customer/Buyer Verification (CBV) system
- KYC verification via Onfido
- Fund verification via Plaid
- Policy decision engine
- Migration from GitHub Pages to Firebase Hosting

## 🚀 Quick Start

```bash
cd firebase-migration-package
./scripts/init-firebase.sh    # Initialize Firebase project
./scripts/migrate.sh           # Build frontend
./scripts/deploy.sh            # Deploy to Firebase
./scripts/qa-check.sh          # Run validation tests
```

## 📁 Project Structure

```
firebase-migration-package/
├── docs/                      # Documentation
│   ├── CONFIGURATION_CHECKLIST.md
│   ├── ONFIDO_API_INTEGRATION.md
│   └── PLAID_API_INTEGRATION.md
├── functions/                 # Cloud Functions
│   ├── index.js              # Main API endpoints
│   ├── ivvAgent.js           # QA/QC testing agent
│   └── package.json          # Dependencies
├── scripts/                   # Automation scripts
│   ├── init-firebase.sh      # Project initialization
│   ├── migrate.sh            # Build preparation
│   ├── deploy.sh             # Deployment script
│   └── qa-check.sh           # Quality checks
├── src/                       # React frontend
│   ├── App.js
│   └── components/
│       └── VerificationStatus.js
├── .firebaserc               # Firebase project config
├── firebase.json             # Firebase services config
├── firestore.rules           # Security rules
├── firestore.indexes.json    # Database indexes
├── ARCHITECTURE.md           # System architecture
├── MIGRATION_PLAN.md         # Migration strategy
└── warp.md                   # Warp terminal guide
```

## 🔧 Configuration

### Before You Begin

1. **Update Firebase Project ID**
   - Edit `.firebaserc`
   - Replace `YOUR_FIREBASE_PROJECT_ID` with your actual project ID

2. **Set Environment Variables** (optional)
   ```bash
   export PROJECT_ID="assiduous-prod"
   export ONFIDO_WHS="your-onfido-webhook-secret"
   export PLAID_WHS="your-plaid-webhook-secret"
   ```

3. **Review Configuration Checklist**
   - See `docs/CONFIGURATION_CHECKLIST.md` for complete setup guide

## 🏗️ Architecture

### Components
- **Frontend**: React app served via Firebase Hosting
- **Backend**: Express.js on Cloud Functions
- **Database**: Firestore with security rules
- **Verification**: Onfido (KYC) + Plaid (funds) + optional AML

### Data Flow
1. Client initiates verification request
2. System creates verification record
3. User completes KYC via Onfido
4. User connects bank via Plaid
5. Webhooks update verification status
6. Policy engine evaluates and decides (PASS/FAIL/REVIEW)

## 🔐 Security Features

- HMAC signature verification on webhooks
- Server-only write access to verification data
- Encrypted sensitive data fields
- Idempotency support for API calls
- Firestore security rules

## 📚 API Endpoints

### Public API
- `POST /api/v1/verification` - Create new verification
  
### Webhook Endpoints
- `POST /api/webhook/kyc` - Onfido KYC updates
- `POST /api/webhook/bank` - Plaid balance updates

## 🧪 Testing

### Local Development
```bash
# Start emulators
firebase emulators:start

# Frontend: http://localhost:5000
# API: http://localhost:5001/YOUR_PROJECT_ID/us-central1/app
```

### IV&V Testing
After deployment, run:
```bash
./scripts/qa-check.sh
```

Check results in:
- `functions/ivv-report.json` - JSON format
- `functions/ivv-report.md` - Markdown report

## 🚢 Deployment Process

### Phase 1: Initialize
```bash
./scripts/init-firebase.sh
```
- Installs Firebase tools
- Configures project
- Sets webhook secrets

### Phase 2: Build
```bash
./scripts/migrate.sh
```
- Builds React frontend
- Prepares for deployment

### Phase 3: Deploy
```bash
./scripts/deploy.sh
```
- Deploys Cloud Functions
- Deploys Firebase Hosting

### Phase 4: Verify
```bash
./scripts/qa-check.sh
```
- Runs automated tests
- Generates QA report

## 🔄 Integration with Assiduous

This package is designed to integrate with the existing Assiduous platform:

### Alignment with Business Model
- **70% Focus**: Micro-flipping ($2-5K deals) - Quick verification essential
- **30% Focus**: Traditional real estate - Full KYC/AML compliance

### Existing Services to Connect
- `FirebaseService.js` - Core database operations
- `EncryptionService.js` - Field-level encryption
- `auth.js` - Authentication management
- `crm.js` - Client relationship management

### Migration Path
1. Current: GitHub Pages static hosting
2. Transition: Firebase Hosting + Functions
3. Future: Full Firebase integration with existing services

## 📖 Documentation

- `ARCHITECTURE.md` - System design and components
- `MIGRATION_PLAN.md` - Step-by-step migration guide
- `docs/CONFIGURATION_CHECKLIST.md` - Setup requirements
- `docs/ONFIDO_API_INTEGRATION.md` - KYC provider integration
- `docs/PLAID_API_INTEGRATION.md` - Banking provider integration

## ⚠️ Important Notes

1. **Never commit real API keys** - Use Firebase Functions config
2. **Test with sandbox first** - Both Onfido and Plaid offer sandbox environments
3. **Monitor costs** - Firebase Functions and Firestore have usage-based pricing
4. **Review security rules** - Customize `firestore.rules` for your needs

## 🆘 Troubleshooting

### Common Issues

**Firebase CLI not found**
```bash
npm install -g firebase-tools
```

**Project ID not set**
- Edit `.firebaserc` with your project ID

**Webhook signature failures**
- Verify secrets match between vendor and Firebase config
- Check HMAC implementation in `functions/index.js`

**Deployment fails**
- Ensure all Firebase services are enabled in console
- Check Firebase Functions logs for errors

## 📞 Support

For issues specific to:
- **Onfido**: https://documentation.onfido.com
- **Plaid**: https://plaid.com/docs
- **Firebase**: https://firebase.google.com/support

## 📝 License

Part of the Assiduous Real Estate Platform
© 2024 Assiduous - All Rights Reserved
