#!/bin/bash
# Google Cloud KMS Security Setup Script
# This script automates Phase 1 of the security hardening process
# 
# WARNING: This will create GCP resources that may incur costs
# Estimated cost: ~$0.54/month for KMS operations

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-assiduous-prod}"
KEYRING_NAME="assiduous-secrets"
LOCATION="us-central1"
GITHUB_SA_NAME="github-actions-deploy"
FIREBASE_SA_NAME="firebase-app-kms"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Google Cloud KMS Security Setup${NC}"
echo -e "${BLUE}  Project: $PROJECT_ID${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install Google Cloud SDK first:"
    echo "    brew install --cask google-cloud-sdk"
    exit 1
fi

print_status "gcloud CLI found"

# Verify authentication
print_info "Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated to Google Cloud. Please run: gcloud auth login"
    exit 1
fi

ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
print_status "Authenticated as: $ACCOUNT"

# Set project
print_info "Setting Google Cloud project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Check if user has necessary permissions
print_info "Verifying IAM permissions..."

# Check if user is owner (owner role includes all permissions)
if gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:user:$ACCOUNT AND bindings.role:roles/owner" \
    --format="value(bindings.role)" | grep -q "roles/owner"; then
    print_status "Has permission: roles/owner (includes all required permissions)"
else
    # If not owner, check for specific roles
    REQUIRED_ROLES=("roles/cloudkms.admin" "roles/iam.serviceAccountAdmin")
    HAS_PERMISSIONS=true
    
    for role in "${REQUIRED_ROLES[@]}"; do
        if gcloud projects get-iam-policy $PROJECT_ID \
            --flatten="bindings[].members" \
            --filter="bindings.members:user:$ACCOUNT AND bindings.role:$role" \
            --format="value(bindings.role)" | grep -q "$role"; then
            print_status "Has permission: $role"
        else
            print_warning "Missing permission: $role"
            HAS_PERMISSIONS=false
        fi
    done
    
    if [ "$HAS_PERMISSIONS" = false ]; then
        print_error "Insufficient permissions. Please ensure you have:"
        echo "  - roles/owner, or"
        echo "  - roles/cloudkms.admin"
        echo "  - roles/iam.serviceAccountAdmin"
        echo "  - roles/iam.securityAdmin"
        exit 1
    fi
fi

# Enable required APIs
print_info "Enabling required Google Cloud APIs..."
gcloud services enable cloudkms.googleapis.com \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com \
    secretmanager.googleapis.com \
    --project=$PROJECT_ID

print_status "APIs enabled"

# Create KMS Keyring
print_info "Creating KMS keyring: $KEYRING_NAME..."
if gcloud kms keyrings describe $KEYRING_NAME --location=$LOCATION &>/dev/null; then
    print_warning "Keyring $KEYRING_NAME already exists, skipping creation"
else
    gcloud kms keyrings create $KEYRING_NAME \
        --location=$LOCATION \
        --project=$PROJECT_ID
    print_status "Keyring created: $KEYRING_NAME"
fi

# Create encryption keys
KEYS=("firebase-config" "github-secrets" "app-secrets" "firestore-encryption")

for KEY in "${KEYS[@]}"; do
    print_info "Creating encryption key: $KEY..."
    if gcloud kms keys describe $KEY \
        --keyring=$KEYRING_NAME \
        --location=$LOCATION &>/dev/null; then
        print_warning "Key $KEY already exists, skipping creation"
    else
        # Calculate rotation time (90 days from now)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            ROTATION_TIME=$(date -u -v+90d +"%Y-%m-%dT%H:%M:%SZ")
        else
            # Linux
            ROTATION_TIME=$(date -u -d "+90 days" +"%Y-%m-%dT%H:%M:%SZ")
        fi
        
        gcloud kms keys create $KEY \
            --keyring=$KEYRING_NAME \
            --location=$LOCATION \
            --purpose=encryption \
            --rotation-period=90d \
            --next-rotation-time=$ROTATION_TIME \
            --project=$PROJECT_ID
        print_status "Key created: $KEY (auto-rotation enabled)"
    fi
done

# Create service accounts
GITHUB_SA="${GITHUB_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
FIREBASE_SA="${FIREBASE_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

print_info "Creating service account: $GITHUB_SA_NAME..."
if gcloud iam service-accounts describe $GITHUB_SA &>/dev/null; then
    print_warning "Service account $GITHUB_SA already exists, skipping creation"
else
    gcloud iam service-accounts create $GITHUB_SA_NAME \
        --display-name="GitHub Actions Deployment" \
        --description="Service account for CI/CD deployment with KMS access" \
        --project=$PROJECT_ID
    print_status "GitHub Actions service account created"
fi

print_info "Creating service account: $FIREBASE_SA_NAME..."
if gcloud iam service-accounts describe $FIREBASE_SA &>/dev/null; then
    print_warning "Service account $FIREBASE_SA already exists, skipping creation"
else
    gcloud iam service-accounts create $FIREBASE_SA_NAME \
        --display-name="Firebase App KMS Access" \
        --description="Service account for Firebase apps to access KMS" \
        --project=$PROJECT_ID
    print_status "Firebase service account created"
fi

# Grant KMS permissions
print_info "Granting KMS decrypt permissions to service accounts..."

# GitHub SA permissions
for KEY in "firebase-config" "github-secrets"; do
    gcloud kms keys add-iam-policy-binding $KEY \
        --keyring=$KEYRING_NAME \
        --location=$LOCATION \
        --member="serviceAccount:${GITHUB_SA}" \
        --role="roles/cloudkms.cryptoKeyDecrypter" \
        --project=$PROJECT_ID &>/dev/null
done
print_status "GitHub Actions SA permissions granted"

# Firebase SA permissions
for KEY in "app-secrets" "firestore-encryption"; do
    gcloud kms keys add-iam-policy-binding $KEY \
        --keyring=$KEYRING_NAME \
        --location=$LOCATION \
        --member="serviceAccount:${FIREBASE_SA}" \
        --role="roles/cloudkms.cryptoKeyDecrypter" \
        --project=$PROJECT_ID &>/dev/null
done
print_status "Firebase SA permissions granted"

# Create service account keys
print_info "Creating service account keys..."

# Create secure directory for keys
mkdir -p .keys
chmod 700 .keys

# GitHub Actions key
if [ -f ".keys/github-actions-key.json" ]; then
    print_warning "GitHub Actions key already exists, skipping creation"
else
    gcloud iam service-accounts keys create .keys/github-actions-key.json \
        --iam-account=$GITHUB_SA \
        --project=$PROJECT_ID
    print_status "GitHub Actions key created: .keys/github-actions-key.json"
fi

# Firebase app key
if [ -f ".keys/firebase-app-key.json" ]; then
    print_warning "Firebase app key already exists, skipping creation"
else
    gcloud iam service-accounts keys create .keys/firebase-app-key.json \
        --iam-account=$FIREBASE_SA \
        --project=$PROJECT_ID
    print_status "Firebase app key created: .keys/firebase-app-key.json"
fi

# Create .secrets directory
print_info "Creating secure secrets directory..."
mkdir -p .secrets
mkdir -p secure-secrets
chmod 700 .secrets

# Update .gitignore
if ! grep -q "^\.keys/$" .gitignore 2>/dev/null; then
    echo ".keys/" >> .gitignore
    echo ".secrets/" >> .gitignore
    echo ".secrets-decrypted/" >> .gitignore
    print_status "Updated .gitignore"
fi

# Generate setup summary
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  KMS Setup Complete! 🎉${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Created Resources:${NC}"
echo "  • Keyring: $KEYRING_NAME (location: $LOCATION)"
echo "  • Encryption Keys: firebase-config, github-secrets, app-secrets, firestore-encryption"
echo "  • Service Accounts:"
echo "    - $GITHUB_SA"
echo "    - $FIREBASE_SA"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. Add service account keys to GitHub Secrets:"
echo "   • Go to: https://github.com/SirsiMaster/Assiduous/settings/secrets/actions"
echo "   • Add new secret: GCP_SA_KEY"
echo "   • Value: Contents of .keys/github-actions-key.json"
echo "   • Add secret: GCP_PROJECT_ID = $PROJECT_ID"
echo "   • Add secret: KMS_KEYRING = $KEYRING_NAME"
echo "   • Add secret: KMS_LOCATION = $LOCATION"
echo ""
echo "2. Rotate exposed Firebase API keys:"
echo "   • Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
echo "   • Generate new API keys for all environments"
echo ""
echo "3. Create encrypted secret files:"
echo "   • Edit .secrets/firebase-config.json with new Firebase config"
echo "   • Edit .secrets/app-secrets.json with application secrets"
echo "   • Run: ./scripts/encrypt-secrets.sh"
echo ""
echo "4. Remove hardcoded secrets from code:"
echo "   • admin/development/dashboard.html"
echo "   • admin/development/import_complete_history_to_firebase.js"
echo "   • (see docs/SECURITY_AUDIT_REPORT.md for full list)"
echo ""
echo "5. Review and run:"
echo "   • ./scripts/decrypt-secrets.sh (for local development)"
echo "   • Update GitHub Actions workflow with KMS integration"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  • Security Audit: docs/SECURITY_AUDIT_REPORT.md"
echo "  • KMS Guide: docs/GOOGLE_KMS_IMPLEMENTATION.md"
echo ""
echo -e "${BLUE}Monthly Cost Estimate:${NC}"
echo "  • KMS keys: ~\$0.24/month"
echo "  • Operations: ~\$0.30/month"
echo "  • Total: ~\$0.54/month"
echo ""
echo -e "${GREEN}Ready for Phase 2: Secret Migration${NC}"
echo ""
