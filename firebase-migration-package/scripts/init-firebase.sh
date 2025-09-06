#!/usr/bin/env bash
set -euo pipefail

# Requirements: npm, firebase-tools installed or installable
if ! command -v firebase >/dev/null 2>&1; then
  echo "Installing firebase-tools..."
  npm i -g firebase-tools
fi

echo "Logging into Firebase (browser popup)..."
firebase login

PROJECT_ID="${PROJECT_ID:-YOUR_FIREBASE_PROJECT_ID}"
read -p "Firebase project id [${PROJECT_ID}]: " INPUT || true
PROJECT_ID="${INPUT:-$PROJECT_ID}"
if [ -z "$PROJECT_ID" ]; then
  echo "PROJECT_ID required"; exit 1
fi

echo "Using project: $PROJECT_ID"
firebase use --add "$PROJECT_ID"

# Initialize services (idempotent)
echo "Ensuring Firestore/Hosting/Functions are initialized..."
# Ensure config files present (assumes you're in firebase-migration-package/)
[ -f firebase.json ] || { echo "Run from firebase-migration-package/ root"; exit 1; }

# Install Functions deps
pushd functions >/dev/null
npm install
popd >/dev/null

# Set function config secrets (prompt)
read -p "Onfido webhook secret (leave blank to skip): " ONFIDO_WHS || true
read -p "Plaid webhook secret (leave blank to skip): " PLAID_WHS || true
read -p "Sirsi webhook URL (leave blank if none): " SIRSI_WEBHOOK_URL || true

if [ -n "${ONFIDO_WHS}" ]; then
  firebase functions:config:set onfido.webhook_secret="$ONFIDO_WHS"
fi
if [ -n "${PLAID_WHS}" ]; then
  firebase functions:config:set plaid.webhook_secret="$PLAID_WHS"
fi
if [ -n "${SIRSI_WEBHOOK_URL}" ]; then
  firebase functions:config:set sirsi.webhook_url="$SIRSI_WEBHOOK_URL"
fi

echo "Firebase initialization complete."
echo "Next: run ./scripts/migrate.sh"
