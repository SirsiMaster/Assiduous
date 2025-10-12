#!/bin/bash

##############################################################################
# AI ASSISTANT DEPLOYMENT WRAPPER
# 
# This script is used by AI assistants to deploy code.
# It ENFORCES that AI assistants can ONLY deploy to staging.
# 
# AI assistants are FORBIDDEN from deploying to production.
# Only the project owner can deploy to production.
##############################################################################

set -e

# Set AI assistant mode flag
export AI_ASSISTANT_MODE=true
export WARP_AI_MODE=true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AI ASSISTANT DEPLOYMENT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

log_info "Running as: AI ASSISTANT"
log_info "Restrictions: Can ONLY deploy to staging"
echo ""

# Validate command
case "$1" in
    "commit")
        log_info "Verifying code is committed to GitHub..."
        ./scripts/enforce-pipeline.sh commit
        ;;
    "deploy-staging")
        log_info "Deploying to STAGING (AI assistants can do this)..."
        ./scripts/enforce-pipeline.sh deploy-staging
        ;;
    "mark-tested")
        log_info "Marking staging as tested..."
        ./scripts/enforce-pipeline.sh mark-tested
        ;;
    "deploy-prod")
        log_error "🚨 PRODUCTION DEPLOYMENT FORBIDDEN FOR AI ASSISTANTS 🚨"
        echo ""
        log_error "AI assistants CANNOT deploy to production."
        log_error "Only the project owner can deploy to production."
        echo ""
        log_info "What I can do:"
        echo "  ✅ Deploy to staging: ./scripts/ai-deploy.sh deploy-staging"
        echo "  ✅ Mark as tested: ./scripts/ai-deploy.sh mark-tested"
        echo ""
        log_info "What ONLY OWNER can do:"
        echo "  🔐 Deploy to prod: ./scripts/enforce-pipeline.sh deploy-prod"
        echo "  🔐 Owner expedite: ./scripts/enforce-pipeline.sh owner-expedite-prod"
        echo ""
        exit 1
        ;;
    "status")
        ./scripts/enforce-pipeline.sh status
        ;;
    *)
        echo "AI Assistant Deployment Wrapper"
        echo ""
        echo "Usage: $0 {commit|deploy-staging|mark-tested|status}"
        echo ""
        echo "AI Assistant Capabilities:"
        echo "  ✅ commit          - Verify code is on GitHub"
        echo "  ✅ deploy-staging  - Deploy to staging"
        echo "  ✅ mark-tested     - Mark staging as tested"
        echo "  ✅ status          - Check pipeline status"
        echo ""
        echo "Forbidden for AI Assistants:"
        echo "  ❌ deploy-prod     - Only OWNER can deploy to production"
        echo ""
        echo "Pipeline: LOCAL → GITHUB → STAGING → [OWNER GATE] → PRODUCTION"
        exit 1
        ;;
esac
