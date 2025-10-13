#!/bin/bash
#
# Automated Metrics Deployment Script
# Copies latest metrics to Firebase build directory and optionally deploys
#
# Usage:
#   ./scripts/deploy-metrics-to-firebase.sh           # Copy only
#   ./scripts/deploy-metrics-to-firebase.sh deploy    # Copy and deploy to Firebase
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$REPO_ROOT/firebase-migration-package/assiduous-build"
METRICS_SOURCE="$BUILD_DIR/admin/development/metrics_cache.json"
DEPLOY=${1:-""}

echo -e "${BLUE}📊 Metrics Deployment Script${NC}"
echo ""

# Step 1: Ensure metrics are up to date
echo -e "${YELLOW}→ Updating metrics from git...${NC}"
cd "$REPO_ROOT"
node scripts/update-metrics-enhanced.js

# Step 2: Verify metrics file exists
if [ ! -f "$METRICS_SOURCE" ]; then
    echo -e "❌ Error: metrics_cache.json not found at $METRICS_SOURCE"
    exit 1
fi

echo -e "${GREEN}✓ Metrics updated successfully${NC}"

# Step 3: Display current metrics
echo ""
echo -e "${BLUE}📈 Current Metrics:${NC}"
cat "$METRICS_SOURCE" | jq '{
    lastUpdated,
    commits: .project.totalCommits,
    totalDays: .project.totalDays,
    activeDays: .project.activeDays,
    hours: .project.totalHours,
    cost: .project.totalCost
}'

# Step 4: Deploy to Firebase if requested
if [ "$DEPLOY" = "deploy" ]; then
    echo ""
    echo -e "${YELLOW}→ Deploying to Firebase...${NC}"
    cd "$BUILD_DIR"
    firebase deploy --only hosting
    
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "${BLUE}🌐 Dashboard: https://assiduous-prod.web.app/admin/development/dashboard.html${NC}"
    echo -e "${BLUE}📊 Metrics API: https://assiduous-prod.web.app/admin/development/metrics_cache.json${NC}"
else
    echo ""
    echo -e "${GREEN}✓ Metrics ready for deployment${NC}"
    echo -e "${YELLOW}💡 To deploy to Firebase, run:${NC}"
    echo -e "   ./scripts/deploy-metrics-to-firebase.sh deploy"
fi

echo ""
echo -e "${GREEN}✨ Done!${NC}"
