#!/bin/bash

##############################################################################
# PIPELINE ENFORCEMENT SCRIPT
# This script ENFORCES the mandatory deployment pipeline:
# LOCAL → GITHUB → STAGING → PRODUCTION
#
# OWNER AUTHORIZATION:
# - Project owner can expedite by saying "deploy to prod"
# - AI assistants MUST follow full pipeline (no exceptions)
# - AI assistants can ONLY deploy to staging, never production
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PIPELINE_STATE="$PROJECT_ROOT/.pipeline-state.json"
FIREBASE_DIR="$PROJECT_ROOT/firebase-migration-package/assiduous-build"

##############################################################################
# UTILITY FUNCTIONS
##############################################################################

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

log_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Load pipeline state
load_state() {
    if [[ ! -f "$PIPELINE_STATE" ]]; then
        log_error "Pipeline state file not found: $PIPELINE_STATE"
        exit 1
    fi
    cat "$PIPELINE_STATE"
}

# Save pipeline state
save_state() {
    echo "$1" > "$PIPELINE_STATE"
    log_success "Pipeline state updated"
}

# Get current git commit
get_current_commit() {
    git rev-parse HEAD 2>/dev/null || echo "unknown"
}

# Get current git branch
get_current_branch() {
    git branch --show-current 2>/dev/null || echo "unknown"
}

# Check if working directory is clean
is_working_dir_clean() {
    if [[ -z $(git status --porcelain) ]]; then
        return 0
    else
        return 1
    fi
}

# Check if commit exists on remote
is_commit_on_remote() {
    local commit=$1
    git fetch origin >/dev/null 2>&1
    if git branch -r --contains "$commit" | grep -q "origin/main"; then
        return 0
    else
        return 1
    fi
}

##############################################################################
# PIPELINE STAGE FUNCTIONS
##############################################################################

# Stage 1: LOCAL → GITHUB
enforce_local_to_github() {
    log_header "STAGE 1: LOCAL → GITHUB"
    
    # Check for uncommitted changes
    if ! is_working_dir_clean; then
        log_error "You have uncommitted changes!"
        echo ""
        git status --short
        echo ""
        log_error "PIPELINE VIOLATION: You must commit all changes to GitHub first."
        log_info "Run: git add . && git commit -m \"your message\" && git push origin main"
        exit 1
    fi
    
    local current_commit=$(get_current_commit)
    local current_branch=$(get_current_branch)
    
    # Check if current commit is pushed to GitHub
    if ! is_commit_on_remote "$current_commit"; then
        log_error "Current commit is NOT pushed to GitHub!"
        log_error "PIPELINE VIOLATION: GitHub must be the source of truth."
        log_info "Run: git push origin main"
        exit 1
    fi
    
    log_success "Current commit ($current_commit) is on GitHub"
    log_success "Branch: $current_branch"
    
    # Update pipeline state
    local state=$(load_state)
    state=$(echo "$state" | jq --arg commit "$current_commit" '.lastCommit = $commit')
    state=$(echo "$state" | jq '.pipeline.currentStage = "github"')
    save_state "$state"
}

# Stage 2: GITHUB → STAGING
enforce_github_to_staging() {
    log_header "STAGE 2: GITHUB → STAGING"
    
    local state=$(load_state)
    local current_stage=$(echo "$state" | jq -r '.pipeline.currentStage')
    
    if [[ "$current_stage" != "github" ]]; then
        log_error "PIPELINE VIOLATION: Cannot deploy to staging from stage '$current_stage'"
        log_error "Current pipeline stage: $current_stage"
        log_error "Required pipeline stage: github"
        log_info "You must commit and push to GitHub first."
        exit 1
    fi
    
    local current_commit=$(get_current_commit)
    
    # Check if Firebase CLI is available
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI not found!"
        log_error "Install: npm install -g firebase-tools"
        exit 1
    fi
    
    # Check if we're in the Firebase directory
    if [[ ! -d "$FIREBASE_DIR" ]]; then
        log_error "Firebase directory not found: $FIREBASE_DIR"
        exit 1
    fi
    
    cd "$FIREBASE_DIR"
    
    # Check if firebase.json exists
    if [[ ! -f "firebase.json" ]]; then
        log_error "firebase.json not found in $FIREBASE_DIR"
        exit 1
    fi
    
    log_info "Deploying commit $current_commit to STAGING..."
    
    # Switch to staging project
    firebase use staging || {
        log_error "Failed to switch to staging project"
        log_error "Run: firebase use --add staging"
        exit 1
    }
    
    # Deploy to staging
    log_info "Deploying to Firebase Staging..."
    firebase deploy || {
        log_error "Deployment to staging FAILED"
        exit 1
    }
    
    log_success "Deployed to staging: https://assiduous-staging.web.app"
    
    # Update pipeline state
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    state=$(echo "$state" | jq --arg commit "$current_commit" '.stagingDeployment.commit = $commit')
    state=$(echo "$state" | jq --arg ts "$timestamp" '.stagingDeployment.timestamp = $ts')
    state=$(echo "$state" | jq '.stagingDeployment.tested = false')
    state=$(echo "$state" | jq '.stagingDeployment.qaApproved = false')
    state=$(echo "$state" | jq '.pipeline.currentStage = "staging"')
    save_state "$state"
    
    log_warning "⚠️  CRITICAL: You MUST test in staging before deploying to production!"
    log_info "Run QA/QC tests at: https://assiduous-staging.web.app/test-enhanced-auth.html"
}

# Mark staging as tested
mark_staging_tested() {
    log_header "MARK STAGING AS TESTED"
    
    local state=$(load_state)
    local current_stage=$(echo "$state" | jq -r '.pipeline.currentStage')
    
    if [[ "$current_stage" != "staging" ]]; then
        log_error "PIPELINE VIOLATION: Staging is not deployed yet"
        log_error "Current stage: $current_stage"
        exit 1
    fi
    
    log_info "Did you complete ALL QA/QC tests in staging?"
    log_info "Tests required:"
    echo "  1. ✅ Opened in browser with DevTools"
    echo "  2. ✅ Zero JavaScript console errors"
    echo "  3. ✅ All user workflows tested end-to-end"
    echo "  4. ✅ All methods/functions verified to exist"
    echo "  5. ✅ All API calls return expected data"
    echo "  6. ✅ All database operations work correctly"
    echo "  7. ✅ All UI elements visible and functional"
    echo "  8. ✅ Mobile responsive design verified"
    echo ""
    
    read -p "Have you completed ALL tests? (type 'YES' to confirm): " confirmation
    
    if [[ "$confirmation" != "YES" ]]; then
        log_error "QA/QC not confirmed. Staging NOT marked as tested."
        log_error "You MUST test staging before production deployment."
        exit 1
    fi
    
    # Update state
    state=$(echo "$state" | jq '.stagingDeployment.tested = true')
    state=$(echo "$state" | jq '.stagingDeployment.qaApproved = true')
    save_state "$state"
    
    log_success "Staging marked as tested and QA approved"
    log_success "You may now deploy to production"
}

# Check if caller is AI assistant
is_ai_assistant() {
    # Check if being called from Warp AI or similar
    if [[ -n "$WARP_AI_MODE" ]] || [[ -n "$AI_ASSISTANT_MODE" ]]; then
        return 0
    fi
    return 1
}

# Stage 3: STAGING → PRODUCTION (REQUIRES OWNER AUTHORIZATION)
enforce_staging_to_production() {
    log_header "STAGE 3: STAGING → PRODUCTION"
    
    # AI ASSISTANTS CANNOT DEPLOY TO PRODUCTION
    if is_ai_assistant; then
        log_error "🚨 AI ASSISTANT BLOCKED FROM PRODUCTION DEPLOYMENT 🚨"
        echo ""
        log_error "AI assistants CANNOT deploy to production."
        log_error "Only the project owner can deploy to production."
        echo ""
        log_info "As an AI assistant, I can only:"
        echo "  ✅ Deploy to staging"
        echo "  ✅ Mark staging as tested"
        echo "  ❌ Deploy to production (FORBIDDEN)"
        echo ""
        log_info "Owner must run this command directly:"
        echo "  ./scripts/enforce-pipeline.sh deploy-prod"
        echo ""
        exit 1
    fi
    
    local state=$(load_state)
    local current_stage=$(echo "$state" | jq -r '.pipeline.currentStage')
    
    # Check current stage
    if [[ "$current_stage" != "staging" ]]; then
        log_error "PIPELINE VIOLATION: Cannot deploy to production from stage '$current_stage'"
        log_error "You must deploy to staging first!"
        exit 1
    fi
    
    # Check if staging was tested
    local staging_tested=$(echo "$state" | jq -r '.stagingDeployment.tested')
    if [[ "$staging_tested" != "true" ]]; then
        log_error "PIPELINE VIOLATION: Staging has NOT been tested!"
        log_error "You MUST test in staging before deploying to production."
        log_info "Run: ./scripts/enforce-pipeline.sh mark-tested"
        exit 1
    fi
    
    # Check if staging was QA approved
    local qa_approved=$(echo "$state" | jq -r '.stagingDeployment.qaApproved')
    if [[ "$qa_approved" != "true" ]]; then
        log_error "PIPELINE VIOLATION: Staging has NOT been QA approved!"
        log_error "You MUST complete QA/QC in staging first."
        exit 1
    fi
    
    local staging_commit=$(echo "$state" | jq -r '.stagingDeployment.commit')
    
    log_warning "🚨 PRODUCTION DEPLOYMENT WARNING 🚨"
    echo ""
    log_info "You are about to deploy to PRODUCTION:"
    echo "  Commit: $staging_commit"
    echo "  Staging tested: ✅"
    echo "  QA approved: ✅"
    echo "  Production URL: https://assiduous-prod.web.app"
    echo ""
    log_warning "This will affect LIVE USERS!"
    echo ""
    
    read -p "Type 'DEPLOY TO PRODUCTION' to confirm: " confirmation
    
    if [[ "$confirmation" != "DEPLOY TO PRODUCTION" ]]; then
        log_error "Production deployment CANCELLED"
        exit 1
    fi
    
    cd "$FIREBASE_DIR"
    
    # Switch to production project
    firebase use production || {
        log_error "Failed to switch to production project"
        exit 1
    }
    
    # Deploy to production
    log_info "Deploying to Firebase Production..."
    firebase deploy || {
        log_error "Deployment to production FAILED"
        exit 1
    }
    
    log_success "🎉 Deployed to production: https://assiduous-prod.web.app"
    
    # Update pipeline state
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    state=$(echo "$state" | jq --arg commit "$staging_commit" '.productionDeployment.commit = $commit')
    state=$(echo "$state" | jq --arg ts "$timestamp" '.productionDeployment.timestamp = $ts')
    state=$(echo "$state" | jq --arg src "$staging_commit" '.productionDeployment.sourceCommit = $src')
    state=$(echo "$state" | jq '.pipeline.currentStage = "production"')
    
    # Reset staging state for next deployment
    state=$(echo "$state" | jq '.stagingDeployment.tested = false')
    state=$(echo "$state" | jq '.stagingDeployment.qaApproved = false')
    
    save_state "$state"
    
    log_success "Production deployment complete!"
    log_info "Verify at: https://assiduous-prod.web.app/test-enhanced-auth.html"
}

# Show current pipeline status
show_status() {
    log_header "PIPELINE STATUS"
    
    local state=$(load_state)
    
    echo "Current Stage: $(echo "$state" | jq -r '.pipeline.currentStage')"
    echo ""
    echo "Last Commit: $(echo "$state" | jq -r '.lastCommit')"
    echo ""
    echo "Staging Deployment:"
    echo "  Commit: $(echo "$state" | jq -r '.stagingDeployment.commit')"
    echo "  Timestamp: $(echo "$state" | jq -r '.stagingDeployment.timestamp')"
    echo "  Tested: $(echo "$state" | jq -r '.stagingDeployment.tested')"
    echo "  QA Approved: $(echo "$state" | jq -r '.stagingDeployment.qaApproved')"
    echo ""
    echo "Production Deployment:"
    echo "  Commit: $(echo "$state" | jq -r '.productionDeployment.commit')"
    echo "  Timestamp: $(echo "$state" | jq -r '.productionDeployment.timestamp')"
    echo ""
}

# Reset pipeline (emergency only)
reset_pipeline() {
    log_warning "⚠️  PIPELINE RESET"
    echo ""
    log_warning "This will reset the pipeline state to initial values."
    log_warning "Use this ONLY if the pipeline state is corrupted."
    echo ""
    read -p "Type 'RESET PIPELINE' to confirm: " confirmation
    
    if [[ "$confirmation" != "RESET PIPELINE" ]]; then
        log_error "Reset cancelled"
        exit 1
    fi
    
    cat > "$PIPELINE_STATE" <<EOF
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
    
    log_success "Pipeline reset to initial state"
}

##############################################################################
# MAIN COMMAND HANDLER
##############################################################################

case "$1" in
    "commit")
        enforce_local_to_github
        ;;
    "deploy-staging")
        enforce_local_to_github
        enforce_github_to_staging
        ;;
    "mark-tested")
        mark_staging_tested
        ;;
    "deploy-prod")
        enforce_staging_to_production
        ;;
    "owner-expedite-prod")
        # OWNER ONLY: Expedited production deployment
        log_warning "⚠️  OWNER EXPEDITED DEPLOYMENT"
        echo ""
        log_warning "You are using the OWNER EXPEDITE path."
        log_warning "This bypasses testing requirements."
        echo ""
        read -p "Type 'I AM THE OWNER' to confirm: " confirmation
        
        if [[ "$confirmation" != "I AM THE OWNER" ]]; then
            log_error "Owner confirmation failed"
            exit 1
        fi
        
        # Force stage to allow production deployment
        local state=$(load_state)
        state=$(echo "$state" | jq '.pipeline.currentStage = "staging"')
        state=$(echo "$state" | jq '.stagingDeployment.tested = true')
        state=$(echo "$state" | jq '.stagingDeployment.qaApproved = true')
        save_state "$state"
        
        log_warning "Deploying to production WITHOUT testing verification"
        enforce_staging_to_production
        ;;
    "status")
        show_status
        ;;
    "reset")
        reset_pipeline
        ;;
    *)
        echo "Usage: $0 {commit|deploy-staging|mark-tested|deploy-prod|owner-expedite-prod|status|reset}"
        echo ""
        echo "MANDATORY PIPELINE ENFORCEMENT"
        echo ""
        echo "Standard Commands:"
        echo "  commit           - Verify code is committed and pushed to GitHub"
        echo "  deploy-staging   - Deploy from GitHub to Staging (requires commit)"
        echo "  mark-tested      - Mark staging as tested (requires QA/QC completion)"
        echo "  deploy-prod      - Deploy from Staging to Production (requires testing)"
        echo "  status           - Show current pipeline status"
        echo ""
        echo "Owner-Only Commands:"
        echo "  owner-expedite-prod  - Expedited production deployment (bypasses testing)"
        echo "                         Requires: 'I AM THE OWNER' confirmation"
        echo ""
        echo "Emergency:"
        echo "  reset            - Reset pipeline state (EMERGENCY ONLY)"
        echo ""
        echo "Pipeline Flow:"
        echo "  LOCAL → GITHUB → STAGING → [OWNER GATE] → PRODUCTION"
        echo ""
        echo "Access Control:"
        echo "  ✅ AI Assistants: Can deploy to staging only"
        echo "  ✅ Project Owner: Can deploy to staging AND production"
        echo ""
        echo "Note: AI assistants should use ./scripts/ai-deploy.sh"
        exit 1
        ;;
esac
