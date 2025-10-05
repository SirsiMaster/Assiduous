#!/bin/bash
# Decrypt secrets using Google Cloud KMS
# For local development use only

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
KEYRING="${KMS_KEYRING:-assiduous-secrets}"
LOCATION="${KMS_LOCATION:-us-central1}"
PROJECT_ID="${GCP_PROJECT_ID:-assiduous-prod}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Decrypting Secrets from Google Cloud KMS${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "Project: $PROJECT_ID"
echo "Keyring: $KEYRING"
echo "Location: $LOCATION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗${NC} gcloud CLI not found"
    echo "Please install: brew install --cask google-cloud-sdk"
    exit 1
fi

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}✗${NC} Not authenticated to Google Cloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Create decryption directory
mkdir -p .secrets-decrypted
chmod 700 .secrets-decrypted

# Function to decrypt a file
decrypt_file() {
    local KEY_NAME=$1
    local INPUT_FILE=$2
    local OUTPUT_FILE=$3
    
    if [ ! -f "$INPUT_FILE" ]; then
        echo -e "${YELLOW}⚠${NC} Encrypted file not found: $INPUT_FILE (skipping)"
        return 0
    fi
    
    echo -e "${BLUE}🔓${NC} Decrypting $(basename $INPUT_FILE)..."
    
    gcloud kms decrypt \
        --project=$PROJECT_ID \
        --keyring=$KEYRING \
        --key=$KEY_NAME \
        --location=$LOCATION \
        --ciphertext-file="$INPUT_FILE" \
        --plaintext-file="$OUTPUT_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Decrypted: $OUTPUT_FILE"
        chmod 600 "$OUTPUT_FILE"  # Restrict permissions
    else
        echo -e "${RED}✗${NC} Failed to decrypt $INPUT_FILE"
        return 1
    fi
}

# Decrypt Firebase configuration
decrypt_file "firebase-config" \
    "secure-secrets/firebase-config.json.enc" \
    ".secrets-decrypted/firebase-config.json"

# Decrypt application secrets
decrypt_file "app-secrets" \
    "secure-secrets/app-secrets.json.enc" \
    ".secrets-decrypted/app-secrets.json"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Decryption Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Decrypted files location: .secrets-decrypted/"
echo ""
echo -e "${BLUE}Available secrets:${NC}"
ls -lh .secrets-decrypted/ 2>/dev/null || echo "  (no files decrypted)"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT SECURITY REMINDERS:${NC}"
echo "• These are SENSITIVE FILES - never commit them to git"
echo "• Use them for local development only"
echo "• Delete after use: rm -rf .secrets-decrypted/"
echo "• The .secrets-decrypted/ directory is in .gitignore"
echo ""
echo -e "${BLUE}To use in your application:${NC}"
echo "• Firebase config: .secrets-decrypted/firebase-config.json"
echo "• App secrets: .secrets-decrypted/app-secrets.json"
echo ""
