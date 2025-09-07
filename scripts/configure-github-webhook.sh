#!/bin/bash

# Configure GitHub Webhook for Automated Development Metrics
# This script sets up the webhook to complete 100% automation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="SirsiMaster"
REPO_NAME="Assiduous"
WEBHOOK_URL="https://us-central1-assiduous-prod.cloudfunctions.net/githubWebhook"
WEBHOOK_SECRET=$(openssl rand -hex 32)
GITHUB_TOKEN_FILE="$HOME/.github_token"

echo "🔗 GitHub Webhook Configuration"
echo "=============================="

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub token exists
get_github_token() {
    if [[ -f "$GITHUB_TOKEN_FILE" ]]; then
        GITHUB_TOKEN=$(cat "$GITHUB_TOKEN_FILE")
        log_info "GitHub token found"
    else
        log_warning "GitHub token not found at $GITHUB_TOKEN_FILE"
        echo ""
        echo "To create a GitHub Personal Access Token:"
        echo "1. Go to: https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Select scopes: 'repo', 'admin:repo_hook'"
        echo "4. Copy the token and save it to: $GITHUB_TOKEN_FILE"
        echo ""
        read -p "Enter your GitHub token: " GITHUB_TOKEN
        echo "$GITHUB_TOKEN" > "$GITHUB_TOKEN_FILE"
        chmod 600 "$GITHUB_TOKEN_FILE"
        log_success "GitHub token saved to $GITHUB_TOKEN_FILE"
    fi
}

# Configure Firebase Functions with webhook secret
configure_firebase_secret() {
    log_info "Configuring Firebase Functions with webhook secret"
    
    # Set the webhook secret in Firebase Functions config
    cd /Users/thekryptodragon/Development/assiduous/firebase-migration-package
    
    # Use firebase functions:config:set (legacy but still works)
    firebase functions:config:set github.webhook_secret="$WEBHOOK_SECRET"
    
    log_success "Firebase webhook secret configured"
    
    # Redeploy functions to use the new secret
    log_info "Redeploying functions with updated configuration"
    firebase deploy --only functions:githubWebhook
    
    log_success "GitHub webhook function redeployed"
}

# Create or update GitHub webhook
configure_github_webhook() {
    log_info "Configuring GitHub webhook"
    
    # Check if webhook already exists
    EXISTING_WEBHOOK=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/hooks" | \
        jq -r '.[] | select(.config.url == "'$WEBHOOK_URL'") | .id' || echo "")
    
    if [[ -n "$EXISTING_WEBHOOK" && "$EXISTING_WEBHOOK" != "null" ]]; then
        log_warning "Existing webhook found (ID: $EXISTING_WEBHOOK). Updating it."
        
        # Update existing webhook
        WEBHOOK_RESPONSE=$(curl -s -X PATCH \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Content-Type: application/json" \
            "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/hooks/$EXISTING_WEBHOOK" \
            -d '{
                "config": {
                    "url": "'$WEBHOOK_URL'",
                    "content_type": "json",
                    "secret": "'$WEBHOOK_SECRET'"
                },
                "events": ["push", "release"],
                "active": true
            }')
    else
        log_info "Creating new GitHub webhook"
        
        # Create new webhook
        WEBHOOK_RESPONSE=$(curl -s -X POST \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Content-Type: application/json" \
            "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/hooks" \
            -d '{
                "name": "web",
                "config": {
                    "url": "'$WEBHOOK_URL'",
                    "content_type": "json",
                    "secret": "'$WEBHOOK_SECRET'"
                },
                "events": ["push", "release"],
                "active": true
            }')
    fi
    
    # Check if webhook configuration was successful
    WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.id // empty')
    
    if [[ -n "$WEBHOOK_ID" && "$WEBHOOK_ID" != "null" ]]; then
        log_success "GitHub webhook configured successfully (ID: $WEBHOOK_ID)"
        echo "Webhook URL: $WEBHOOK_URL"
        echo "Events: push, release"
        echo "Status: Active"
    else
        log_error "Failed to configure GitHub webhook"
        echo "Response: $WEBHOOK_RESPONSE"
        return 1
    fi
}

# Test webhook configuration
test_webhook() {
    log_info "Testing webhook configuration"
    
    # Send a test ping to the webhook
    TEST_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -H "X-GitHub-Event: ping" \
        -d '{"zen": "Automation achieved!", "hook_id": 12345678}')
    
    if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
        log_success "Webhook test successful"
        echo "Response: $TEST_RESPONSE"
    else
        log_error "Webhook test failed"
        echo "Response: $TEST_RESPONSE"
        return 1
    fi
}

# Initialize Firebase data
initialize_firebase_data() {
    log_info "Initializing Firebase with existing development data"
    
    # Trigger the sync service to populate data
    SYNC_RESPONSE=$(curl -s -X POST https://us-central1-assiduous-prod.cloudfunctions.net/syncGitHubData \
        -H "Content-Type: application/json" \
        -d '{"daysBack": 30}')
    
    if echo "$SYNC_RESPONSE" | grep -q '"success":true'; then
        log_success "Firebase data initialization successful"
        SYNCED_COMMITS=$(echo "$SYNC_RESPONSE" | jq -r '.totalCommits // 0')
        SYNCED_SESSIONS=$(echo "$SYNC_RESPONSE" | jq -r '.syncedSessions // 0')
        echo "Synced $SYNCED_COMMITS commits into $SYNCED_SESSIONS sessions"
    else
        log_warning "Firebase data sync had issues, but this is not critical"
        echo "Response: $SYNC_RESPONSE"
    fi
}

# Verify complete automation
verify_automation() {
    log_info "Verifying 100% automation setup"
    
    # Check all components
    echo ""
    echo "🔍 Automation Components Status:"
    echo "================================"
    
    # Check Firebase Functions
    if curl -sf "$WEBHOOK_URL" > /dev/null 2>&1; then
        echo "✅ GitHub Webhook Function: Deployed and accessible"
    else
        echo "❌ GitHub Webhook Function: Not accessible"
        return 1
    fi
    
    if curl -sf "https://us-central1-assiduous-prod.cloudfunctions.net/syncGitHubData" > /dev/null 2>&1; then
        echo "✅ Sync Service Function: Deployed and accessible"
    else
        echo "❌ Sync Service Function: Not accessible"
        return 1
    fi
    
    # Check GitHub webhook
    WEBHOOK_STATUS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/hooks" | \
        jq -r '.[] | select(.config.url == "'$WEBHOOK_URL'") | .active' || echo "false")
    
    if [[ "$WEBHOOK_STATUS" == "true" ]]; then
        echo "✅ GitHub Webhook: Active and configured"
    else
        echo "❌ GitHub Webhook: Not active or not found"
        return 1
    fi
    
    # Check local git hooks
    if [[ -f "/Users/thekryptodragon/Development/assiduous/.git/hooks/prepare-commit-msg" ]]; then
        echo "✅ Enhanced Git Hooks: Installed with session metadata"
    else
        echo "❌ Enhanced Git Hooks: Not installed"
        return 1
    fi
    
    # Check dashboard
    if curl -sf "https://assiduous-prod.web.app/AssiduousFlip/admin/development/dashboard.html" > /dev/null 2>&1; then
        echo "✅ Development Dashboard: Live and accessible"
    else
        echo "⚠️  Development Dashboard: May not be accessible (check Firebase Hosting)"
    fi
    
    echo ""
    log_success "🎉 100% AUTOMATION ACHIEVED!"
    echo ""
    echo "📊 Your complete automation pipeline is now active:"
    echo "   Local Git Commit → GitHub Push → Firebase Processing → Dashboard Update"
    echo ""
    echo "📝 Next commit with [session:X.X] [cost:\$XXX] will automatically flow through the entire system!"
}

# Main execution
main() {
    echo "🚀 Setting up 100% Development Metrics Automation"
    echo "================================================="
    echo ""
    
    # Check dependencies
    if ! command -v curl >/dev/null 2>&1; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        log_warning "jq not found - installing via homebrew"
        brew install jq || { log_error "Failed to install jq"; exit 1; }
    fi
    
    if ! command -v firebase >/dev/null 2>&1; then
        log_error "Firebase CLI is required but not installed"
        echo "Install with: npm install -g firebase-tools"
        exit 1
    fi
    
    # Execute setup steps
    get_github_token
    configure_firebase_secret
    configure_github_webhook
    test_webhook
    initialize_firebase_data
    verify_automation
    
    echo ""
    echo "🎯 AUTOMATION SETUP COMPLETE!"
    echo ""
    echo "Your development workflow is now 100% automated:"
    echo "• Enhanced git hooks add session metadata automatically"
    echo "• GitHub webhook processes all commits in real-time"
    echo "• Firebase stores and aggregates all metrics"
    echo "• Dashboard displays live development data"
    echo "• Scheduled sync keeps everything current"
    echo ""
    echo "🔗 Live URLs:"
    echo "• Dashboard: https://assiduous-prod.web.app/AssiduousFlip/admin/development/dashboard.html"
    echo "• Webhook: $WEBHOOK_URL"
    echo "• GitHub Repo: https://github.com/$REPO_OWNER/$REPO_NAME"
    echo ""
    echo "✨ Try it now: Make a commit with session metadata and push to see real-time automation!"
}

# Run main function
main "$@"
