#!/bin/bash
# Automated Compat SDK to Modular SDK Conversion
# Converts firebase.auth() and firebase.firestore() to window.auth and window.db

set -e

BASE_DIR="/Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build"

echo "🔄 Converting compat SDK to modular SDK..."
echo "================================================"

# Files to convert (from COMPAT_SDK_REMEDIATION.md)
FILES=(
  "client/dashboard.html"
  "client/property-detail.html"
  "client/saved.html"
  "client/messages.html"
  "client/viewings.html"
  "client/onboarding.html"
  "client/micro-flip-calculator.html"
  "agent/dashboard.html"
  "agent-pending.html"
  "admin/agents.html"
  "admin/clients.html"
  "admin/transactions.html"
  "admin/knowledge-base.html"
  "admin/agent-approvals.html"
  "components/auth-guard.js"
  "components/universal-header.js"
  "assets/js/services/id-generator.js"
  "assets/js/services/developmentmetricsservice.js"
  "populate-data.html"
  "firebase-config.js"
  "admin/development/populate_session_data.js"
  "admin/development/import_all_historical_data.js"
  "admin/development/import_complete_history_to_firebase.js"
)

CONVERTED=0
SKIPPED=0

for file in "${FILES[@]}"; do
  filepath="$BASE_DIR/$file"
  
  if [ ! -f "$filepath" ]; then
    echo "⚠️  SKIP: $file (not found)"
    ((SKIPPED++))
    continue
  fi
  
  # Create backup
  cp "$filepath" "$filepath.bak"
  
  # Convert firebase.auth() -> window.auth
  sed -i '' 's/firebase\.auth()/window.auth/g' "$filepath"
  
  # Convert firebase.firestore() -> window.db  
  sed -i '' 's/firebase\.firestore()/window.db/g' "$filepath"
  
  # Check if any changes were made
  if ! diff -q "$filepath" "$filepath.bak" > /dev/null 2>&1; then
    echo "✅ CONVERTED: $file"
    ((CONVERTED++))
    rm "$filepath.bak"
  else
    echo "⚠️  NO CHANGES: $file (already converted?)"
    rm "$filepath.bak"
    ((SKIPPED++))
  fi
done

echo "================================================"
echo "✅ Conversion complete!"
echo "   Converted: $CONVERTED files"
echo "   Skipped: $SKIPPED files"
echo ""
echo "Next: Verify with: grep -r 'firebase\\.auth()\\|firebase\\.firestore()' $BASE_DIR"
