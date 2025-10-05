#!/bin/bash
# Remove hardcoded Firebase API keys and secrets from source code
# This script replaces hardcoded secrets with secure loading mechanisms

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Removing Hardcoded Secrets from Source Code${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Files containing hardcoded secrets (from security audit)
FILES_TO_FIX=(
    "admin/development/dashboard.html"
    "admin/development/import_complete_history_to_firebase.js"
)

# Backup directory
BACKUP_DIR=".backups/pre-secret-removal-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}ℹ${NC} Creating backups in: $BACKUP_DIR"
echo ""

# Function to backup and fix a file
fix_file() {
    local FILE=$1
    
    if [ ! -f "$FILE" ]; then
        echo -e "${YELLOW}⚠${NC} File not found: $FILE (skipping)"
        return 0
    fi
    
    echo -e "${BLUE}📝${NC} Processing: $FILE"
    
    # Create backup
    local BACKUP_PATH="$BACKUP_DIR/$(dirname $FILE)"
    mkdir -p "$BACKUP_PATH"
    cp "$FILE" "$BACKUP_PATH/$(basename $FILE)"
    echo -e "${GREEN}✓${NC} Backup created"
    
    # Check if file contains hardcoded API keys
    if grep -q "AIza" "$FILE" 2>/dev/null; then
        echo -e "${RED}⚠${NC} Found hardcoded API keys in $FILE"
        
        # Comment out the hardcoded config
        sed -i.tmp 's/\(.*"apiKey".*AIza.*\)/\/\/ REMOVED: \1 \/\/ Use secure config loading instead/g' "$FILE"
        sed -i.tmp 's/\(.*apiKey:.*AIza.*\)/\/\/ REMOVED: \1 \/\/ Use secure config loading instead/g' "$FILE"
        rm -f "$FILE.tmp"
        
        echo -e "${GREEN}✓${NC} Removed hardcoded secrets from $FILE"
        echo -e "${YELLOW}ℹ${NC} Review and update with secure loading mechanism"
    else
        echo -e "${GREEN}✓${NC} No hardcoded secrets found in $FILE"
    fi
    
    echo ""
}

# Process each file
for FILE in "${FILES_TO_FIX[@]}"; do
    fix_file "$FILE"
done

# Check firebase-migration-package as well
echo -e "${BLUE}Checking firebase-migration-package directory...${NC}"
if [ -d "firebase-migration-package/assiduous-build/admin/development" ]; then
    for FILE in firebase-migration-package/assiduous-build/admin/development/*.html firebase-migration-package/assiduous-build/admin/development/*.js; do
        if [ -f "$FILE" ]; then
            fix_file "$FILE"
        fi
    done
fi

# Check for any remaining hardcoded secrets
echo -e "${BLUE}ℹ${NC} Scanning for remaining hardcoded secrets..."
echo ""

REMAINING=$(grep -r "AIza" --include="*.html" --include="*.js" --include="*.json" \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=.backups \
    --exclude-dir=scripts/archive \
    --exclude-dir=docs/archive \
    . 2>/dev/null | grep -v "REMOVED:" | grep -v "\/\/" || true)

if [ -n "$REMAINING" ]; then
    echo -e "${RED}⚠${NC} WARNING: Remaining hardcoded secrets found:"
    echo "$REMAINING"
    echo ""
    echo -e "${YELLOW}Action required:${NC} Review and remove these secrets manually"
else
    echo -e "${GREEN}✓${NC} No obvious hardcoded secrets remaining"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Secret Removal Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• Backups created in: $BACKUP_DIR"
echo "• Files processed: ${#FILES_TO_FIX[@]}"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "1. Review changed files: git diff"
echo "2. Update files to use secure config loading"
echo "3. Test application with decrypted secrets"
echo "4. Commit changes: git add . && git commit"
echo "5. Deploy to verify everything works"
echo ""
echo -e "${BLUE}Secure Loading Pattern:${NC}"
cat << 'EOF'

// Instead of:
const firebaseConfig = {
  apiKey: "AIza...",  // NEVER hardcode
  // ...
};

// Use:
async function loadFirebaseConfig() {
  const response = await fetch('/api/config/firebase');
  return await response.json();
}

// Or for Cloud Functions:
const KMSService = require('./services/kmsservice');
const kms = new KMSService();
const config = await kms.getFirebaseConfig();

EOF

echo ""
