#!/bin/bash

##############################################################################
# FIREBASE CLI WRAPPER
# This wrapper prevents direct firebase deployments that bypass the pipeline
##############################################################################

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if user is trying to deploy
if [[ "$1" == "deploy" ]]; then
    echo -e "${RED}❌ BLOCKED: Direct firebase deploy detected${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  PIPELINE VIOLATION${NC}"
    echo ""
    echo "You cannot run 'firebase deploy' directly."
    echo "You MUST use the enforced pipeline:"
    echo ""
    echo "  LOCAL → GITHUB → STAGING → PRODUCTION"
    echo ""
    echo "Use these commands instead:"
    echo "  ./scripts/enforce-pipeline.sh deploy-staging   # Deploy to staging"
    echo "  ./scripts/enforce-pipeline.sh mark-tested      # Mark staging as tested"
    echo "  ./scripts/enforce-pipeline.sh deploy-prod      # Deploy to production"
    echo ""
    echo "To check pipeline status:"
    echo "  ./scripts/enforce-pipeline.sh status"
    echo ""
    exit 1
fi

# For all other firebase commands, pass through to actual firebase CLI
exec $(which firebase) "$@"
