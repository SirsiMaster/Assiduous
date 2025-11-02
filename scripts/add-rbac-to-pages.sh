#!/bin/bash
# Add RBAC UI Enforcement to Pages
# Adds rbac-ui.js script tag to pages that need role-based UI restrictions

set -e

BASE_DIR="/Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build"

echo "🔒 Adding RBAC UI enforcement to pages..."
echo "================================================"

# Check if rbac-ui.js script tag already exists, if not, add it after firebase-init.js
add_rbac_script() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    echo "⚠️  SKIP: $file (not found)"
    return
  fi
  
  # Check if already has rbac-ui.js
  if grep -q "rbac-ui.js" "$file"; then
    echo "✅ EXISTS: $(basename $file) (already has RBAC)"
    return
  fi
  
  # Check if has firebase-init.js (required dependency)
  if ! grep -q "firebase-init.js" "$file"; then
    echo "⚠️  SKIP: $(basename $file) (no firebase-init.js found)"
    return
  fi
  
  # Add rbac-ui.js after firebase-init.js
  sed -i '' '/<script.*firebase-init\.js.*<\/script>/a\
    <script src="/assets/js/rbac-ui.js"><\/script>
' "$file"
  
  echo "✅ ADDED: $(basename $file)"
}

# Admin pages (require admin role for sensitive actions)
ADMIN_PAGES=(
  "admin/dashboard.html"
  "admin/properties.html"
  "admin/agents.html"
  "admin/clients.html"
  "admin/transactions.html"
  "admin/analytics.html"
  "admin/settings.html"
  "admin/agent-approvals.html"
  "admin/knowledge-base.html"
)

# Agent pages  
AGENT_PAGES=(
  "agent/dashboard.html"
  "agent-pending.html"
)

# Client pages
CLIENT_PAGES=(
  "client/dashboard.html"
  "client/properties.html"
)

echo ""
echo "📋 Processing Admin Pages..."
for page in "${ADMIN_PAGES[@]}"; do
  add_rbac_script "$BASE_DIR/$page"
done

echo ""
echo "📋 Processing Agent Pages..."
for page in "${AGENT_PAGES[@]}"; do
  add_rbac_script "$BASE_DIR/$page"
done

echo ""
echo "📋 Processing Client Pages..."
for page in "${CLIENT_PAGES[@]}"; do
  add_rbac_script "$BASE_DIR/$page"
done

echo ""
echo "================================================"
echo "✅ RBAC UI enforcement added to pages!"
echo ""
echo "Next steps:"
echo "1. Add data-rbac-role attributes to sensitive UI elements"
echo "2. Example: <button data-rbac-role=\"admin\">Delete</button>"
echo "3. Test with different user roles"
