#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=$(jq -r '.projects.default' .firebaserc 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "null" ]; then
  echo "Project not set in .firebaserc. Run ./scripts/init-firebase.sh first."; exit 1
fi

echo "Deploying Functions + Hosting to $PROJECT_ID ..."
# Deploy functions first (so rewrites can hit the function)
firebase deploy --only functions
firebase deploy --only hosting

echo "Deployed."
firebase hosting:sites:list || true
echo "Run ./scripts/qa-check.sh to validate."
