#!/usr/bin/env bash
set -euo pipefail

# Guess hosting URL
PROJECT_ID=$(jq -r '.projects.default' .firebaserc 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "null" ]; then
  echo "Project not set in .firebaserc"; exit 1
fi
BASE_URL="https://${PROJECT_ID}.web.app"

echo "Running IV&V Agent against ${BASE_URL} ..."
pushd functions >/dev/null
IVV_BASE_URL="$BASE_URL" node ivvAgent.js --base="$BASE_URL" --project="$PROJECT_ID"
popd >/dev/null

echo "IV&V complete. See functions/ivv-report.json and functions/ivv-report.md"
