#!/bin/bash

##############################################################################
# SETUP PIPELINE ENFORCEMENT
# This script installs the pipeline enforcement system
##############################################################################

set -e

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

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PIPELINE ENFORCEMENT SETUP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Step 1: Make scripts executable
log_info "Making scripts executable..."
chmod +x scripts/enforce-pipeline.sh
chmod +x scripts/firebase-wrapper.sh
chmod +x scripts/hooks/pre-commit-pipeline
log_success "Scripts are now executable"

# Step 2: Install git hook
log_info "Installing git pre-commit hook..."
if [[ -d ".git/hooks" ]]; then
    cp scripts/hooks/pre-commit-pipeline .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    log_success "Git pre-commit hook installed"
else
    log_warning "No .git directory found - hook not installed"
fi

# Step 3: Check if jq is installed
log_info "Checking for jq (JSON processor)..."
if command -v jq &> /dev/null; then
    log_success "jq is installed"
else
    log_error "jq is NOT installed"
    echo ""
    log_info "Install jq with:"
    echo "  macOS: brew install jq"
    echo "  Linux: sudo apt-get install jq"
    echo ""
    exit 1
fi

# Step 4: Check if Firebase CLI is installed
log_info "Checking for Firebase CLI..."
if command -v firebase &> /dev/null; then
    log_success "Firebase CLI is installed ($(firebase --version))"
else
    log_warning "Firebase CLI is NOT installed"
    echo ""
    log_info "Install Firebase CLI with:"
    echo "  npm install -g firebase-tools"
    echo ""
fi

# Step 5: Initialize pipeline state if not exists
if [[ ! -f ".pipeline-state.json" ]]; then
    log_info "Initializing pipeline state..."
    cat > .pipeline-state.json <<EOF
{
  "version": "1.0.0",
  "lastCommit": null,
  "stagingDeployment": {
    "commit": null,
    "timestamp": null,
    "tested": false,
    "qaApproved": false
  },
  "productionDeployment": {
    "commit": null,
    "timestamp": null,
    "sourceCommit": null
  },
  "pipeline": {
    "currentStage": "local",
    "stages": ["local", "github", "staging", "production"],
    "canSkipStages": false
  }
}
EOF
    log_success "Pipeline state initialized"
else
    log_success "Pipeline state already exists"
fi

# Step 6: Add .pipeline-state.json to .gitignore if not already there
if [[ -f ".gitignore" ]]; then
    if ! grep -q "\.pipeline-state\.json" .gitignore; then
        log_info "Adding .pipeline-state.json to .gitignore..."
        echo "" >> .gitignore
        echo "# Pipeline state (local tracking only)" >> .gitignore
        echo ".pipeline-state.json" >> .gitignore
        log_success "Added to .gitignore"
    else
        log_success ".pipeline-state.json already in .gitignore"
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  PIPELINE ENFORCEMENT INSTALLED${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""

log_info "Pipeline: LOCAL → GITHUB → STAGING → PRODUCTION"
echo ""
log_info "Available commands:"
echo "  ./scripts/enforce-pipeline.sh status           # Check pipeline status"
echo "  ./scripts/enforce-pipeline.sh commit           # Verify commit to GitHub"
echo "  ./scripts/enforce-pipeline.sh deploy-staging   # Deploy to staging"
echo "  ./scripts/enforce-pipeline.sh mark-tested      # Mark staging as tested"
echo "  ./scripts/enforce-pipeline.sh deploy-prod      # Deploy to production"
echo ""

log_success "Setup complete! Pipeline enforcement is now active."

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT${NC}"
echo "Direct 'firebase deploy' commands are now blocked."
echo "You MUST use the enforce-pipeline.sh script for all deployments."
echo ""
