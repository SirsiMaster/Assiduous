#!/usr/bin/env bash

###############################################################################
# Multi-Environment Firebase Deployment Script
# 
# Usage:
#   ./deploy.sh dev        # Deploy to development (assiduous-dev)
#   ./deploy.sh staging    # Deploy to staging (assiduous-staging)
#   ./deploy.sh production # Deploy to production (assiduous-prod)
#
# Prerequisites:
#   - Firebase CLI installed
#   - Authenticated with Firebase (firebase login)
#   - Proper permissions for target projects
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment parameter
ENVIRONMENT=${1:-}

# Valid environments
VALID_ENVS=("dev" "staging" "production")

# Helper function to get project ID
get_project_id() {
    case $1 in
        dev) echo "assiduous-dev" ;;
        staging) echo "assiduous-staging" ;;
        production) echo "assiduous-prod" ;;
    esac
}

# Helper function to get deployment URL
get_deployment_url() {
    case $1 in
        dev) echo "https://assiduous-dev.web.app" ;;
        staging) echo "https://assiduous-staging.web.app" ;;
        production) echo "https://assiduousflip.web.app" ;;
    esac
}

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

###############################################################################
# Validation
###############################################################################

validate_environment() {
    if [[ " ${VALID_ENVS[@]} " =~ " ${ENVIRONMENT} " ]]; then
        return 0
    else
        return 1
    fi
}

show_usage() {
    echo "Usage: $0 <environment>"
    echo ""
    echo "Environments:"
    echo "  dev        - Deploy to development (assiduous-dev.web.app)"
    echo "  staging    - Deploy to staging (assiduous-staging.web.app)"
    echo "  production - Deploy to production (assiduousflip.web.app)"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  $0 production"
}

###############################################################################
# Pre-deployment Checks
###############################################################################

run_predeploy_checks() {
    print_header "Pre-Deployment Checks"
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI not installed"
        print_info "Install with: npm install -g firebase-tools"
        exit 1
    fi
    print_success "Firebase CLI installed"
    
    # Check if user is logged in
    if ! firebase projects:list &> /dev/null; then
        print_error "Not logged in to Firebase"
        print_info "Run: firebase login"
        exit 1
    fi
    print_success "Authenticated with Firebase"
    
    # Check if build directory exists
    if [ ! -d "assiduous-build" ]; then
        print_error "Build directory 'assiduous-build' not found"
        exit 1
    fi
    print_success "Build directory exists"
    
    # Check Git status
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ -n "$(git status --porcelain)" ]; then
            print_warning "Uncommitted changes detected"
            read -p "Continue anyway? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_error "Deployment cancelled"
                exit 1
            fi
        else
            print_success "Git working directory clean"
        fi
    fi
    
    echo ""
}

###############################################################################
# Environment-Specific Checks
###############################################################################

check_environment_specific() {
    local env=$1
    local url=$(get_deployment_url "$env")
    local project_id=$(get_project_id "$env")
    
    local env_upper=$(echo "$env" | tr '[:lower:]' '[:upper:]')
    print_header "Environment: $env_upper"
    
    case $env in
        dev)
            print_info "Target: Development Environment"
            print_info "URL: $url"
            print_info "Project: $project_id"
            print_info "Safety: High (isolated backend)"
            ;;
        staging)
            print_info "Target: Staging Environment"
            print_info "URL: $url"
            print_info "Project: $project_id"
            print_info "Safety: Medium (pre-production)"
            print_warning "This deploys to pre-production environment"
            ;;
        production)
            print_info "Target: Production Environment"
            print_info "URL: $url"
            print_info "Project: $project_id"
            print_error "Safety: LOW (LIVE USER DATA)"
            print_warning "This deploys to LIVE PRODUCTION!"
            
            echo ""
            read -p "Type 'DEPLOY TO PRODUCTION' to confirm: " confirm
            if [ "$confirm" != "DEPLOY TO PRODUCTION" ]; then
                print_error "Deployment cancelled"
                exit 1
            fi
            ;;
    esac
    
    echo ""
}

###############################################################################
# Deployment
###############################################################################

deploy_to_environment() {
    local env=$1
    local project_id=$(get_project_id "$env")
    local url=$(get_deployment_url "$env")
    
    local env_upper=$(echo "$env" | tr '[:lower:]' '[:upper:]')
    print_header "Deploying to $env_upper"
    
    # Deploy using Firebase CLI with hosting targets
    print_info "Deploying to project: $project_id"
    print_info "Hosting target: $env"
    
    if firebase deploy --project "$env" --only hosting:$env; then
        print_success "Deployment successful!"
        echo ""
        print_header "Deployment Complete"
        print_success "Environment: $env_upper"
        print_success "URL: $url"
        print_success "Project: $project_id"
        
        # Post-deployment verification
        echo ""
        print_info "Verifying deployment..."
        sleep 3
        
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
            print_success "Site is responding (HTTP 200)"
        else
            print_warning "Site response check failed (might need a moment to propagate)"
        fi
    else
        print_error "Deployment failed"
        exit 1
    fi
}

###############################################################################
# Main Script
###############################################################################

main() {
    # Show header
    print_header "Assiduous Multi-Environment Deployment"
    echo ""
    
    # Validate input
    if [ -z "$ENVIRONMENT" ]; then
        print_error "No environment specified"
        echo ""
        show_usage
        exit 1
    fi
    
    if ! validate_environment; then
        print_error "Invalid environment: $ENVIRONMENT"
        echo ""
        show_usage
        exit 1
    fi
    
    # Run checks
    run_predeploy_checks
    check_environment_specific "$ENVIRONMENT"
    
    # Deploy
    deploy_to_environment "$ENVIRONMENT"
    
    # Success
    echo ""
    print_header "🎉 Deployment Complete 🎉"
    local env_upper=$(echo "$ENVIRONMENT" | tr '[:lower:]' '[:upper:]')
    print_success "Successfully deployed to $env_upper"
    print_info "Visit: $(get_deployment_url "$ENVIRONMENT")"
}

# Run main function
main
