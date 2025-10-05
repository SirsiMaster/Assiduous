# 🔐 Google Cloud KMS Implementation Guide
**Project**: Assiduous Real Estate Platform  
**Purpose**: Secure secrets management using Google Cloud Key Management Service  
**Date**: October 5, 2025

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: KMS Setup](#phase-1-kms-setup)
4. [Phase 2: Secret Migration](#phase-2-secret-migration)
5. [Phase 3: GitHub Actions Integration](#phase-3-github-actions-integration)
6. [Phase 4: Application Integration](#phase-4-application-integration)
7. [Testing & Validation](#testing--validation)
8. [Maintenance & Operations](#maintenance--operations)

---

## Overview

### Why Google Cloud KMS?

Google Cloud Key Management Service (KMS) provides:
- **Hardware security modules (HSMs)** for cryptographic operations
- **Automatic key rotation** and versioning
- **Audit logging** for all key usage
- **IAM integration** for fine-grained access control
- **Compliance** with SOC 2, ISO 27001, PCI DSS
- **No key material exposure** - keys never leave Google infrastructure

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Google Cloud Project                     │
│                      (assiduous-prod)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Cloud KMS Keyring                         │  │
│  │           "assiduous-secrets"                         │  │
│  │                                                        │  │
│  │  ┌────────────────┐  ┌────────────────┐             │  │
│  │  │ firebase-config│  │ github-secrets │             │  │
│  │  │   (Encryption  │  │   (Encryption  │             │  │
│  │  │      Key)      │  │      Key)      │  ...        │  │
│  │  └────────────────┘  └────────────────┘             │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ▲                                 │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    IAM Authentication
                             │
        ┌────────────────────┴────────────────────┐
        │                                          │
   ┌────▼────┐                              ┌─────▼─────┐
   │ GitHub  │                              │  Firebase │
   │ Actions │                              │   Apps    │
   │ Service │                              │           │
   │ Account │                              │           │
   └─────────┘                              └───────────┘
```

---

## Prerequisites

### 1. Google Cloud Project Setup

```bash
# Set project ID
export PROJECT_ID="assiduous-prod"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudkms.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Required Permissions

Your account needs these IAM roles:
- `roles/cloudkms.admin` - Manage keys and keyrings
- `roles/iam.serviceAccountAdmin` - Create service accounts
- `roles/iam.securityAdmin` - Grant IAM permissions

```bash
# Verify permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:$(gcloud config get-value account)"
```

### 3. Install Required Tools

```bash
# Install Google Cloud SDK (if not already installed)
# macOS
brew install --cask google-cloud-sdk

# Verify installation
gcloud --version
```

---

## Phase 1: KMS Setup

### Step 1.1: Create KMS Keyring

A keyring is a logical grouping of encryption keys.

```bash
# Set variables
export KEYRING_NAME="assiduous-secrets"
export LOCATION="us-central1"  # Choose based on your Firebase region

# Create keyring
gcloud kms keyrings create $KEYRING_NAME \
  --location=$LOCATION \
  --project=$PROJECT_ID

# Verify creation
gcloud kms keyrings list --location=$LOCATION
```

### Step 1.2: Create Encryption Keys

Create separate keys for different secret categories:

```bash
# Firebase Configuration Key
gcloud kms keys create firebase-config \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)

# GitHub Secrets Key
gcloud kms keys create github-secrets \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)

# Application Secrets Key
gcloud kms keys create app-secrets \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)

# Encryption Keys for Firestore (field-level encryption)
gcloud kms keys create firestore-encryption \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)

# Verify keys
gcloud kms keys list \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION
```

### Step 1.3: Create Service Accounts

```bash
# Service account for GitHub Actions
gcloud iam service-accounts create github-actions-deploy \
  --display-name="GitHub Actions Deployment" \
  --description="Service account for CI/CD deployment with KMS access"

# Service account for Firebase applications
gcloud iam service-accounts create firebase-app-kms \
  --display-name="Firebase App KMS Access" \
  --description="Service account for Firebase apps to access KMS"

# Get service account emails
export GITHUB_SA="github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
export FIREBASE_SA="firebase-app-kms@${PROJECT_ID}.iam.gserviceaccount.com"

echo "GitHub SA: $GITHUB_SA"
echo "Firebase SA: $FIREBASE_SA"
```

### Step 1.4: Grant KMS Permissions

```bash
# Grant GitHub Actions service account permission to decrypt secrets
gcloud kms keys add-iam-policy-binding firebase-config \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION \
  --member="serviceAccount:${GITHUB_SA}" \
  --role="roles/cloudkms.cryptoKeyDecrypter"

gcloud kms keys add-iam-policy-binding github-secrets \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION \
  --member="serviceAccount:${GITHUB_SA}" \
  --role="roles/cloudkms.cryptoKeyDecrypter"

# Grant Firebase app service account permission to decrypt application secrets
gcloud kms keys add-iam-policy-binding app-secrets \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION \
  --member="serviceAccount:${FIREBASE_SA}" \
  --role="roles/cloudkms.cryptoKeyDecrypter"

gcloud kms keys add-iam-policy-binding firestore-encryption \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION \
  --member="serviceAccount:${FIREBASE_SA}" \
  --role="roles/cloudkms.cryptoKeyDecrypterViaDelegation"

# Verify permissions
gcloud kms keys get-iam-policy firebase-config \
  --keyring=$KEYRING_NAME \
  --location=$LOCATION
```

### Step 1.5: Create Service Account Keys

```bash
# Create key for GitHub Actions (store as GitHub secret)
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=$GITHUB_SA

echo "⚠️  IMPORTANT: Store github-actions-key.json as GitHub secret GCP_SA_KEY"
echo "⚠️  Never commit this file to git!"

# Create key for Firebase app (for local development only)
gcloud iam service-accounts keys create firebase-app-key.json \
  --iam-account=$FIREBASE_SA

echo "⚠️  IMPORTANT: Store firebase-app-key.json securely"
echo "⚠️  For production, use Workload Identity Federation instead"
```

---

## Phase 2: Secret Migration

### Step 2.1: Inventory Current Secrets

Create a spreadsheet/document listing:
- All Firebase API keys
- GitHub personal access tokens
- Third-party API keys
- Encryption keys
- Database credentials

### Step 2.2: Create Secret Files

```bash
# Navigate to project directory
cd /Users/thekryptodragon/Development/assiduous

# Create secrets directory (ignored by git)
mkdir -p .secrets
echo ".secrets/" >> .gitignore

# Create plaintext secret files (will be encrypted)
cat > .secrets/firebase-config.json <<EOF
{
  "development": {
    "apiKey": "YOUR_NEW_DEV_API_KEY",
    "authDomain": "assiduous-dev.firebaseapp.com",
    "projectId": "assiduous-dev",
    "storageBucket": "assiduous-dev.appspot.com",
    "messagingSenderId": "YOUR_DEV_SENDER_ID",
    "appId": "YOUR_DEV_APP_ID"
  },
  "production": {
    "apiKey": "YOUR_NEW_PROD_API_KEY",
    "authDomain": "assiduous-prod.firebaseapp.com",
    "projectId": "assiduous-prod",
    "storageBucket": "assiduous-prod.appspot.com",
    "messagingSenderId": "YOUR_PROD_SENDER_ID",
    "appId": "YOUR_PROD_APP_ID"
  }
}
EOF

cat > .secrets/app-secrets.json <<EOF
{
  "encryptionKey": "YOUR_AES_256_KEY_HERE",
  "jwtSecret": "YOUR_JWT_SECRET_HERE",
  "apiKeys": {
    "openai": "YOUR_OPENAI_KEY",
    "stripe": "YOUR_STRIPE_KEY"
  }
}
EOF
```

### Step 2.3: Encrypt Secrets with KMS

```bash
# Encrypt Firebase config
gcloud kms encrypt \
  --keyring=$KEYRING_NAME \
  --key=firebase-config \
  --location=$LOCATION \
  --plaintext-file=.secrets/firebase-config.json \
  --ciphertext-file=.secrets/firebase-config.json.enc

# Encrypt app secrets
gcloud kms encrypt \
  --keyring=$KEYRING_NAME \
  --key=app-secrets \
  --location=$LOCATION \
  --plaintext-file=.secrets/app-secrets.json \
  --ciphertext-file=.secrets/app-secrets.json.enc

# Verify encrypted files exist
ls -la .secrets/*.enc

# Remove plaintext files
shred -vfz -n 10 .secrets/firebase-config.json
shred -vfz -n 10 .secrets/app-secrets.json
```

### Step 2.4: Store Encrypted Secrets in Repository

```bash
# Create secure-secrets directory in repo
mkdir -p secure-secrets

# Move encrypted files to repository (safe to commit)
mv .secrets/*.enc secure-secrets/

# Create README for the directory
cat > secure-secrets/README.md <<EOF
# Encrypted Secrets

This directory contains secrets encrypted with Google Cloud KMS.

**DO NOT** commit plaintext secrets to this directory.

## Decryption

Secrets are automatically decrypted during deployment by GitHub Actions
using the GCP service account with KMS decrypt permissions.

For local development decryption:
\`\`\`bash
./scripts/decrypt-secrets.sh
\`\`\`

## Key Information
- **Keyring**: assiduous-secrets
- **Location**: us-central1
- **Rotation**: Automatic every 90 days
EOF

# Commit encrypted secrets
git add secure-secrets/
git add .gitignore
git commit -m "feat(security): add KMS-encrypted secrets

- Add encrypted Firebase configuration
- Add encrypted application secrets
- Update .gitignore to exclude plaintext secrets"
```

---

## Phase 3: GitHub Actions Integration

### Step 3.1: Add GitHub Secrets

In GitHub repository settings (Settings → Secrets and variables → Actions):

1. **GCP_PROJECT_ID**: `assiduous-prod`
2. **GCP_SA_KEY**: Contents of `github-actions-key.json`
3. **KMS_KEYRING**: `assiduous-secrets`
4. **KMS_LOCATION**: `us-central1`

### Step 3.2: Create Decryption Script

```bash
# Create scripts directory if not exists
mkdir -p scripts

# Create decryption helper script
cat > scripts/decrypt-secrets.sh <<'EOF'
#!/bin/bash
# Decrypt secrets using Google Cloud KMS

set -e

KEYRING="${KMS_KEYRING:-assiduous-secrets}"
LOCATION="${KMS_LOCATION:-us-central1}"
PROJECT_ID="${GCP_PROJECT_ID:-assiduous-prod}"

echo "🔓 Decrypting secrets from KMS..."
echo "Project: $PROJECT_ID"
echo "Keyring: $KEYRING"
echo "Location: $LOCATION"

# Create temporary decryption directory
mkdir -p .secrets-decrypted

# Decrypt Firebase config
echo "Decrypting Firebase configuration..."
gcloud kms decrypt \
  --project=$PROJECT_ID \
  --keyring=$KEYRING \
  --key=firebase-config \
  --location=$LOCATION \
  --ciphertext-file=secure-secrets/firebase-config.json.enc \
  --plaintext-file=.secrets-decrypted/firebase-config.json

# Decrypt app secrets
echo "Decrypting application secrets..."
gcloud kms decrypt \
  --project=$PROJECT_ID \
  --keyring=$KEYRING \
  --key=app-secrets \
  --location=$LOCATION \
  --ciphertext-file=secure-secrets/app-secrets.json.enc \
  --plaintext-file=.secrets-decrypted/app-secrets.json

echo "✅ Secrets decrypted successfully"
echo "Decrypted files location: .secrets-decrypted/"
echo "⚠️  Remember: These are sensitive files, never commit them!"
EOF

chmod +x scripts/decrypt-secrets.sh
```

### Step 3.3: Update GitHub Actions Workflow

Update `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting on Push to Main

on:
  push:
    branches:
      - main
  workflow_dispatch:

# SECURITY: Implement least-privilege permissions
permissions:
  contents: read
  id-token: write

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    
    steps:
      # Checkout code
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      # Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      # Authenticate to Google Cloud
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'
      
      # Setup Google Cloud SDK
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      # Decrypt secrets from KMS
      - name: Decrypt Secrets from KMS
        env:
          GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
          KMS_KEYRING: ${{ secrets.KMS_KEYRING }}
          KMS_LOCATION: ${{ secrets.KMS_LOCATION }}
        run: |
          echo "🔓 Decrypting secrets..."
          chmod +x ./scripts/decrypt-secrets.sh
          ./scripts/decrypt-secrets.sh
      
      # Install dependencies
      - name: Install Dependencies
        run: |
          if [ -f "package.json" ]; then
            npm ci || npm install
          fi
          npm install -g firebase-tools
      
      # Prepare Firebase deployment with decrypted config
      - name: Prepare Firebase Deployment
        run: |
          echo "📦 Preparing files for Firebase deployment..."
          
          # ... (existing deployment preparation steps)
          
          # Inject decrypted Firebase config into build
          if [ -f ".secrets-decrypted/firebase-config.json" ]; then
            echo "Injecting Firebase configuration..."
            # Create a config loader that reads from environment
            cat > firebase-migration-package/assiduous-build/firebase-config.js << 'CONFIGEOF'
// Firebase configuration loaded from secure KMS-decrypted secrets
// DO NOT commit Firebase config directly to code
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
export default firebaseConfig;
CONFIGEOF
          fi
      
      # Deploy to Firebase
      - name: Deploy to Firebase Hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          FIREBASE_CONFIG: ${{ secrets.FIREBASE_CONFIG }}
        run: |
          echo "🚀 Deploying to Firebase Hosting..."
          cd firebase-migration-package
          firebase deploy \
            --only hosting \
            --token "$FIREBASE_TOKEN" \
            --project ${{ secrets.GCP_PROJECT_ID }}
      
      # Cleanup decrypted secrets
      - name: Cleanup Secrets
        if: always()
        run: |
          echo "🧹 Cleaning up decrypted secrets..."
          rm -rf .secrets-decrypted
          echo "✅ Cleanup complete"
      
      # Security scan
      - name: Run Security Scan
        if: success()
        run: |
          echo "🔍 Running security scan..."
          npm audit --audit-level=high
```

---

## Phase 4: Application Integration

### Step 4.1: Create KMS Client Service

Create `assets/js/services/kmsservice.js`:

```javascript
/**
 * Google Cloud KMS Service
 * Handles decryption of secrets for frontend applications
 * 
 * SECURITY NOTE: Frontend apps should NOT decrypt secrets directly.
 * This service is for server-side (Cloud Functions) use only.
 * Frontend apps receive configuration from secure backend endpoints.
 */

class KMSService {
  constructor() {
    this.config = {
      projectId: process.env.GCP_PROJECT_ID || 'assiduous-prod',
      keyring: process.env.KMS_KEYRING || 'assiduous-secrets',
      location: process.env.KMS_LOCATION || 'us-central1'
    };
    
    // Only initialize in server-side environments
    if (typeof window === 'undefined') {
      this.kmsClient = require('@google-cloud/kms').KeyManagementServiceClient;
      this.client = new this.kmsClient();
    }
  }

  /**
   * Decrypt a secret using KMS
   * @param {string} keyName - Name of the KMS key
   * @param {Buffer} ciphertext - Encrypted data
   * @returns {Promise<string>} Decrypted plaintext
   */
  async decrypt(keyName, ciphertext) {
    if (typeof window !== 'undefined') {
      throw new Error('KMS decryption should only be called server-side');
    }

    const name = this.client.cryptoKeyPath(
      this.config.projectId,
      this.config.location,
      this.config.keyring,
      keyName
    );

    const [result] = await this.client.decrypt({
      name,
      ciphertext
    });

    return result.plaintext.toString('utf8');
  }

  /**
   * Load Firebase configuration from KMS
   * @returns {Promise<Object>} Firebase config object
   */
  async getFirebaseConfig() {
    const fs = require('fs').promises;
    const encryptedConfig = await fs.readFile('secure-secrets/firebase-config.json.enc');
    const decrypted = await this.decrypt('firebase-config', encryptedConfig);
    return JSON.parse(decrypted);
  }

  /**
   * Load application secrets from KMS
   * @returns {Promise<Object>} App secrets object
   */
  async getAppSecrets() {
    const fs = require('fs').promises;
    const encryptedSecrets = await fs.readFile('secure-secrets/app-secrets.json.enc');
    const decrypted = await this.decrypt('app-secrets', encryptedSecrets);
    return JSON.parse(decrypted);
  }
}

// Export for Node.js (Cloud Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KMSService;
}

// Export for ES6 modules
export default KMSService;
```

### Step 4.2: Update Firebase Service

Update `assets/js/services/firebaseservice.js` to load config securely:

```javascript
// Remove hardcoded Firebase config
// const firebaseConfig = { ... }; // DELETE THIS

// Load Firebase config from secure endpoint or KMS
let firebaseConfig;

// In production, load from backend endpoint
async function loadFirebaseConfig() {
  if (typeof window !== 'undefined') {
    // Frontend: Load from secure backend endpoint
    const response = await fetch('/api/config/firebase');
    if (!response.ok) {
      throw new Error('Failed to load Firebase configuration');
    }
    firebaseConfig = await response.json();
  } else {
    // Backend (Cloud Functions): Load from KMS
    const KMSService = require('./kmsservice');
    const kms = new KMSService();
    firebaseConfig = await kms.getFirebaseConfig();
  }
  
  return firebaseConfig;
}

// Initialize Firebase asynchronously
export async function initializeFirebase() {
  if (!firebaseConfig) {
    await loadFirebaseConfig();
  }
  
  const app = firebase.initializeApp(firebaseConfig);
  return app;
}
```

### Step 4.3: Create Configuration API Endpoint

Create Cloud Function to serve configuration:

```javascript
// functions/src/config.js
const functions = require('firebase-functions');
const KMSService = require('./services/kmsservice');

exports.getFirebaseConfig = functions.https.onRequest(async (req, res) => {
  // SECURITY: Verify request origin
  const allowedOrigins = [
    'https://assiduousflip.web.app',
    'https://assiduous-prod.web.app'
  ];
  
  const origin = req.headers.origin;
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const kms = new KMSService();
    const config = await kms.getFirebaseConfig();
    
    // Return only public-safe configuration
    // API keys are safe to expose in Firebase (with proper restrictions)
    const publicConfig = {
      apiKey: config.production.apiKey,
      authDomain: config.production.authDomain,
      projectId: config.production.projectId,
      storageBucket: config.production.storageBucket,
      messagingSenderId: config.production.messagingSenderId,
      appId: config.production.appId
    };

    res.set('Access-Control-Allow-Origin', origin);
    res.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    res.json(publicConfig);
  } catch (error) {
    console.error('Error loading Firebase config:', error);
    res.status(500).json({ error: 'Configuration unavailable' });
  }
});
```

---

## Testing & Validation

### Test 1: Verify KMS Setup

```bash
# List all keys
gcloud kms keys list \
  --keyring=assiduous-secrets \
  --location=us-central1

# Check key rotation schedule
gcloud kms keys describe firebase-config \
  --keyring=assiduous-secrets \
  --location=us-central1
```

### Test 2: Test Encryption/Decryption

```bash
# Create test file
echo "Test secret data" > test-secret.txt

# Encrypt
gcloud kms encrypt \
  --keyring=assiduous-secrets \
  --key=app-secrets \
  --location=us-central1 \
  --plaintext-file=test-secret.txt \
  --ciphertext-file=test-secret.enc

# Decrypt
gcloud kms decrypt \
  --keyring=assiduous-secrets \
  --key=app-secrets \
  --location=us-central1 \
  --ciphertext-file=test-secret.enc \
  --plaintext-file=test-secret-decrypted.txt

# Verify
diff test-secret.txt test-secret-decrypted.txt

# Cleanup
rm test-secret*
```

### Test 3: Validate GitHub Actions

```bash
# Push a test commit to trigger workflow
git checkout -b test/kms-integration
echo "# KMS Test" > kms-test.md
git add kms-test.md
git commit -m "test(security): validate KMS integration"
git push origin test/kms-integration

# Check GitHub Actions logs for:
# - Successful authentication to GCP
# - Successful secret decryption
# - Successful Firebase deployment
```

### Test 4: Audit KMS Access

```bash
# View KMS audit logs
gcloud logging read \
  "resource.type=cloudkms_cryptokey" \
  --limit=50 \
  --format=json
```

---

## Maintenance & Operations

### Routine Tasks

#### Monitor Key Usage (Weekly)
```bash
# Check key usage metrics
gcloud logging read \
  "resource.type=cloudkms_cryptokey
  AND protoPayload.methodName='google.cloud.kms.v1.KeyManagementService.Decrypt'" \
  --limit=100 \
  --format=json
```

#### Review IAM Permissions (Monthly)
```bash
# Audit service account permissions
gcloud projects get-iam-policy assiduous-prod \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount" \
  --format="table(bindings.role)"
```

#### Rotate Service Account Keys (Quarterly)
```bash
# List existing keys
gcloud iam service-accounts keys list \
  --iam-account=github-actions-deploy@assiduous-prod.iam.gserviceaccount.com

# Create new key
gcloud iam service-accounts keys create new-github-key.json \
  --iam-account=github-actions-deploy@assiduous-prod.iam.gserviceaccount.com

# Update GitHub secret GCP_SA_KEY with new key content

# Delete old keys (after verifying new key works)
gcloud iam service-accounts keys delete OLD_KEY_ID \
  --iam-account=github-actions-deploy@assiduous-prod.iam.gserviceaccount.com
```

### Emergency Procedures

#### Suspected Key Compromise
1. **Immediate**: Disable the compromised key
   ```bash
   gcloud kms keys versions disable KEY_VERSION \
     --key=KEY_NAME \
     --keyring=assiduous-secrets \
     --location=us-central1
   ```

2. **Rotate**: Force key rotation
   ```bash
   gcloud kms keys update KEY_NAME \
     --keyring=assiduous-secrets \
     --location=us-central1 \
     --next-rotation-time=now
   ```

3. **Audit**: Review all key usage in audit logs
4. **Re-encrypt**: Re-encrypt all secrets with new key version
5. **Notify**: Inform security team and stakeholders

### Cost Optimization

KMS pricing (as of 2025):
- Key versions: $0.06/month per active key version
- Encrypt/Decrypt operations: $0.03 per 10,000 operations

Estimated monthly cost for Assiduous:
- 4 keys × $0.06 = $0.24
- ~100,000 decryptions/month = $0.30
- **Total: ~$0.54/month**

### Monitoring Alerts

Set up Cloud Monitoring alerts for:
1. **Unusual key usage**: > 1000 operations/hour
2. **Failed decryption attempts**: > 10/hour
3. **IAM policy changes**: Any modification
4. **Key state changes**: Key disabled or destroyed

```bash
# Create alert policy (example)
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="KMS High Decrypt Rate" \
  --condition-display-name="Decrypt rate exceeds threshold" \
  --condition-threshold-value=1000 \
  --condition-threshold-duration=3600s
```

---

## Troubleshooting

### Issue: "Permission denied" during decryption

**Solution**:
```bash
# Check service account permissions
gcloud kms keys get-iam-policy KEY_NAME \
  --keyring=assiduous-secrets \
  --location=us-central1

# Grant decrypt permission
gcloud kms keys add-iam-policy-binding KEY_NAME \
  --keyring=assiduous-secrets \
  --location=us-central1 \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudkms.cryptoKeyDecrypter"
```

### Issue: GitHub Actions fails to authenticate to GCP

**Solution**:
1. Verify `GCP_SA_KEY` secret is correctly set in GitHub
2. Ensure service account has necessary roles
3. Check service account key hasn't expired

```bash
# List service account keys
gcloud iam service-accounts keys list \
  --iam-account=SERVICE_ACCOUNT_EMAIL

# Create new key if needed
gcloud iam service-accounts keys create new-key.json \
  --iam-account=SERVICE_ACCOUNT_EMAIL
```

### Issue: Secrets not decrypting in Cloud Functions

**Solution**:
1. Ensure `@google-cloud/kms` package is installed
2. Verify Cloud Function has correct service account
3. Check KMS API is enabled
4. Validate encrypted file paths are correct

---

## Security Best Practices

1. **Never commit plaintext secrets** - Always encrypt before committing
2. **Rotate keys regularly** - Enable automatic 90-day rotation
3. **Principle of least privilege** - Grant minimum necessary KMS permissions
4. **Audit key usage** - Regularly review Cloud Audit Logs
5. **Separate environments** - Use different keys for dev/staging/prod
6. **Monitor alerts** - Set up Cloud Monitoring for anomalies
7. **Document everything** - Maintain runbook for key operations
8. **Backup keys** - KMS handles this, but document key IDs
9. **Test disaster recovery** - Practice key compromise scenarios
10. **Review quarterly** - Security review every 3 months

---

## Additional Resources

- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)
- [KMS Best Practices](https://cloud.google.com/kms/docs/best-practices)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)

---

**Implementation Status**: 📋 Ready for Phase 1 execution  
**Next Steps**: Begin KMS keyring creation and service account setup
