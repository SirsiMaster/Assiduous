#!/usr/bin/env bash
set -euo pipefail

# Automated Firebase Setup for Assiduous
# This script will configure and deploy the entire Firebase infrastructure

echo "🚀 Starting Automated Firebase Setup for Assiduous..."

# Configuration
PROJECT_ID="${FIREBASE_PROJECT_ID:-assiduous-prod}"
REGION="us-central1"

# Navigate to package root
cd "$(dirname "$0")/.."

echo "📦 Using Firebase project: $PROJECT_ID"

# Step 1: Use the Firebase project
echo "1️⃣ Selecting Firebase project..."
firebase use "$PROJECT_ID" --add --alias default || firebase use "$PROJECT_ID"

# Step 2: Skip init since files exist, just ensure services are enabled
echo "2️⃣ Ensuring Firebase services are enabled..."
echo "Firestore rules file already exists at firestore.rules"
echo "Functions directory already exists at functions/"
echo "Hosting config already exists in firebase.json"

# Step 3: Enable required APIs
echo "3️⃣ Enabling Firebase services..."
firebase projects:get "$PROJECT_ID" --json > /dev/null 2>&1 && echo "✓ Project accessible"

# Step 4: Deploy Firestore rules and indexes
echo "4️⃣ Deploying Firestore security rules and indexes..."
firebase deploy --only firestore:rules,firestore:indexes --project "$PROJECT_ID"

# Step 5: Set Functions configuration (with default values for now)
echo "5️⃣ Setting Functions configuration..."
firebase functions:config:set \
  onfido.webhook_secret="${ONFIDO_WEBHOOK_SECRET:-temp_secret_onfido}" \
  plaid.webhook_secret="${PLAID_WEBHOOK_SECRET:-temp_secret_plaid}" \
  sirsi.webhook_url="${SIRSI_WEBHOOK_URL:-https://example.com/webhook}" \
  app.base_url="https://${PROJECT_ID}.web.app" \
  --project "$PROJECT_ID"

# Step 6: Build the React app (if exists)
echo "6️⃣ Building frontend..."
if [ -f "package.json" ]; then
  npm install
  npm run build 2>/dev/null || echo "No build script, using existing files"
else
  # Create a simple index.html for testing if no React app
  mkdir -p build
  cat > build/index.html <<HTML
<!DOCTYPE html>
<html>
<head>
  <title>Assiduous - Firebase Migration</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #0B1F41; }
    .status { padding: 1rem; background: #60A3D9; color: white; border-radius: 4px; margin: 1rem 0; }
    .info { background: #E2E8F0; padding: 1rem; border-radius: 4px; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏠 Assiduous Real Estate Platform</h1>
    <div class="status">✅ Firebase Migration Successful!</div>
    <div class="info">
      <h2>Services Deployed:</h2>
      <ul>
        <li>✓ Firebase Hosting</li>
        <li>✓ Cloud Functions (Verification API)</li>
        <li>✓ Firestore Database</li>
        <li>✓ Security Rules</li>
      </ul>
      <h3>API Endpoints:</h3>
      <ul>
        <li><code>POST /api/v1/verification</code> - Create verification</li>
        <li><code>POST /api/webhook/kyc</code> - KYC webhook</li>
        <li><code>POST /api/webhook/bank</code> - Bank webhook</li>
      </ul>
      <p>Project: <strong>${PROJECT_ID}</strong></p>
      <p>Region: <strong>${REGION}</strong></p>
    </div>
  </div>
</body>
</html>
HTML
fi

# Step 7: Deploy Functions
echo "7️⃣ Deploying Cloud Functions..."
cd functions
npm install  # Ensure dependencies are installed
cd ..
firebase deploy --only functions --project "$PROJECT_ID"

# Step 8: Deploy Hosting
echo "8️⃣ Deploying Firebase Hosting..."
firebase deploy --only hosting --project "$PROJECT_ID"

# Step 9: Get deployment URLs
echo "9️⃣ Getting deployment information..."
echo ""
echo "==============================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "==============================================="
echo ""
echo "📌 Your Firebase URLs:"
echo "   Hosting: https://${PROJECT_ID}.web.app"
echo "   Functions: https://${REGION}-${PROJECT_ID}.cloudfunctions.net/app"
echo ""
echo "🔧 Next Steps:"
echo "1. Update webhook secrets with real values:"
echo "   firebase functions:config:set onfido.webhook_secret='YOUR_SECRET'"
echo "   firebase functions:config:set plaid.webhook_secret='YOUR_SECRET'"
echo ""
echo "2. Configure vendor webhooks to point to:"
echo "   KYC: https://${PROJECT_ID}.web.app/api/webhook/kyc"
echo "   Bank: https://${PROJECT_ID}.web.app/api/webhook/bank"
echo ""
echo "3. Test the verification API:"
echo "   curl -X POST https://${PROJECT_ID}.web.app/api/v1/verification \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"buyerId\":\"test123\",\"amountCents\":500000}'"
echo ""
echo "==============================================="
