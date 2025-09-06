#!/usr/bin/env bash
set -euo pipefail

# Build frontend if a package.json exists one level up or in current
if [ -f "../package.json" ]; then
  echo "Building frontend from parent repo root..."
  (cd .. && npm ci && npm run build || true)
elif [ -f "package.json" ]; then
  echo "Building frontend from current directory..."
  npm ci && npm run build || true
else
  echo "No frontend build detected; ensure your React build outputs to ./build/"
fi

# Nothing else needed: Hosting expects ./build as per firebase.json
echo "Migration step complete. Next: ./scripts/deploy.sh"
