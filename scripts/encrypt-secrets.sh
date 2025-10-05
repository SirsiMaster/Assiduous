#!/bin/bash
# Encrypt secrets using Google Cloud KMS
# This script encrypts plaintext secrets and stores them in secure-secrets/

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
echo -e "${BLUE}  Encrypting Secrets with Google Cloud KMS${NC}"
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

# Create directories
mkdir -p secure-secrets
mkdir -p .secrets

# Function to encrypt a file
encrypt_file() {
    local KEY_NAME=$1
    local INPUT_FILE=$2
    local OUTPUT_FILE=$3
    
    if [ ! -f "$INPUT_FILE" ]; then
        echo -e "${YELLOW}⚠${NC} File not found: $INPUT_FILE (skipping)"
        return 0
    fi
    
    echo -e "${BLUE}🔐${NC} Encrypting $INPUT_FILE..."
    
    gcloud kms encrypt \
        --project=$PROJECT_ID \
        --keyring=$KEYRING \
        --key=$KEY_NAME \
        --location=$LOCATION \
        --plaintext-file="$INPUT_FILE" \
        --ciphertext-file="$OUTPUT_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Encrypted: $OUTPUT_FILE"
        
        # Securely delete plaintext file
        if command -v shred &> /dev/null; then
            shred -vfz -n 10 "$INPUT_FILE" 2>/dev/null
            echo -e "${GREEN}✓${NC} Securely deleted plaintext: $INPUT_FILE"
        else
            # macOS doesn't have shred, use rm with overwrite
            echo "Overwriting and deleting: $INPUT_FILE"
            dd if=/dev/urandom of="$INPUT_FILE" bs=1 count=$(wc -c < "$INPUT_FILE") conv=notrunc 2>/dev/null
            rm -f "$INPUT_FILE"
            echo -e "${GREEN}✓${NC} Deleted plaintext: $INPUT_FILE"
        fi
    else
        echo -e "${RED}✗${NC} Failed to encrypt $INPUT_FILE"
        return 1
    fi
}

# Encrypt Firebase configuration
if [ -f ".secrets/firebase-config.json" ]; then
    encrypt_file "firebase-config" \
        ".secrets/firebase-config.json" \
        "secure-secrets/firebase-config.json.enc"
else
    echo -e "${YELLOW}⚠${NC} Firebase config not found (.secrets/firebase-config.json)"
    echo "   Create it first with your Firebase configuration"
fi

# Encrypt application secrets
if [ -f ".secrets/app-secrets.json" ]; then
    encrypt_file "app-secrets" \
        ".secrets/app-secrets.json" \
        "secure-secrets/app-secrets.json.enc"
else
    echo -e "${YELLOW}⚠${NC} App secrets not found (.secrets/app-secrets.json)"
    echo "   Create it first with your application secrets"
fi

# Encrypt any additional secret files
for file in .secrets/*.json; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        if [[ "$filename" != "firebase-config.json" ]] && [[ "$filename" != "app-secrets.json" ]]; then
            echo -e "${YELLOW}⚠${NC} Found additional secret: $filename"
            echo "   Please encrypt manually or add to this script"
        fi
    fi
done

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Encryption Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Encrypted files are in: secure-secrets/"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Verify encrypted files: ls -lh secure-secrets/"
echo "2. Commit encrypted files: git add secure-secrets/"
echo "3. Test decryption: ./scripts/decrypt-secrets.sh"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "• Plaintext secrets have been securely deleted"
echo "• Only encrypted files are safe to commit to git"
echo "• Keep service account keys (.keys/) secure and never commit them"
echo ""
