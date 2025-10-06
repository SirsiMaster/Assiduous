#!/bin/bash

# Environment Promotion Workflow
# Promotes code through dev → test → staging → prod with approval gates

PROJECT_ROOT="/Users/thekryptodragon/Development/assiduous"
PROD_DIR="$PROJECT_ROOT/firebase-migration-package/assiduous-build"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show diff
show_diff() {
    local from=$1
    local to=$2
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Comparing: $from → $to${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Show file differences
    diff -rq "$PROJECT_ROOT/environments/$from" "$PROJECT_ROOT/environments/$to" | grep -v ".DS_Store" || echo "  No differences"
}

# Function to promote
promote() {
    local from=$1
    local to=$2
    local from_dir="$PROJECT_ROOT/environments/$from"
    local to_dir
    
    if [ "$to" = "prod" ]; then
        to_dir="$PROD_DIR"
    else
        to_dir="$PROJECT_ROOT/environments/$to"
    fi
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}PROMOTION: $from → $to${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Show what will be promoted
    echo ""
    echo "Changes to be promoted:"
    diff -rq "$from_dir" "$to_dir" | grep -v ".DS_Store" | head -20
    echo ""
    
    # Get approval
    echo -e "${YELLOW}Do you want to promote $from to $to? (yes/no)${NC}"
    read -r response
    
    if [ "$response" != "yes" ]; then
        echo -e "${RED}✗ Promotion cancelled${NC}"
        exit 1
    fi
    
    # Backup target first (if not prod)
    if [ "$to" != "prod" ]; then
        local backup_dir="$PROJECT_ROOT/.backups/${to}_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$PROJECT_ROOT/.backups"
        cp -R "$to_dir" "$backup_dir"
        echo -e "${GREEN}✓ Backed up $to to: $backup_dir${NC}"
    fi
    
    # Perform promotion
    rsync -av --delete "$from_dir/" "$to_dir/"
    echo -e "${GREEN}✓ Promoted $from → $to${NC}"
    
    # Show URLs
    case $to in
        test)
            echo -e "${BLUE}  View at: http://localhost:8082${NC}"
            ;;
        staging)
            echo -e "${BLUE}  View at: http://localhost:8083${NC}"
            ;;
        prod)
            echo -e "${BLUE}  Ready to deploy to: https://assiduousflip.web.app${NC}"
            echo -e "${YELLOW}  Run: cd $PROJECT_ROOT/firebase-migration-package && firebase deploy --only hosting${NC}"
            ;;
    esac
}

# Function to deploy to production
deploy_prod() {
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}PRODUCTION DEPLOYMENT${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}WARNING: This will deploy to live production site!${NC}"
    echo -e "${YELLOW}Have you:${NC}"
    echo "  [ ] Tested in staging (http://localhost:8083)"
    echo "  [ ] Verified all pages load correctly"
    echo "  [ ] Checked landing page has professional content"
    echo "  [ ] Taken screenshots for documentation"
    echo ""
    echo -e "${RED}Type 'DEPLOY TO PRODUCTION' to proceed:${NC}"
    read -r response
    
    if [ "$response" != "DEPLOY TO PRODUCTION" ]; then
        echo -e "${RED}✗ Deployment cancelled${NC}"
        exit 1
    fi
    
    # Deploy
    cd "$PROJECT_ROOT/firebase-migration-package"
    firebase deploy --only hosting
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Successfully deployed to production!${NC}"
        echo -e "${BLUE}  Live at: https://assiduousflip.web.app${NC}"
        echo ""
        echo -e "${YELLOW}Please verify:${NC}"
        echo "  1. Open https://assiduousflip.web.app in incognito"
        echo "  2. Check landing page loads correctly"
        echo "  3. Test all changed pages"
        echo "  4. Document with screenshots"
    else
        echo -e "${RED}✗ Deployment failed!${NC}"
        exit 1
    fi
}

# Main command handler
case "${1:-help}" in
    dev-to-test)
        promote "dev" "test"
        ;;
    test-to-staging)
        promote "test" "staging"
        ;;
    staging-to-prod)
        promote "staging" "prod"
        ;;
    deploy)
        deploy_prod
        ;;
    diff)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 diff <from> <to>"
            echo "Example: $0 diff dev test"
            exit 1
        fi
        show_diff "$2" "$3"
        ;;
    help|*)
        echo "Environment Promotion Workflow"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  dev-to-test        Promote dev to test"
        echo "  test-to-staging    Promote test to staging"
        echo "  staging-to-prod    Promote staging to prod (no deploy)"
        echo "  deploy             Deploy prod to Firebase"
        echo "  diff <from> <to>   Show differences between environments"
        echo ""
        echo "URLs:"
        echo "  Dev:     http://localhost:8081"
        echo "  Test:    http://localhost:8082"
        echo "  Staging: http://localhost:8083"
        echo "  Prod:    https://assiduousflip.web.app"
        echo ""
        echo "Workflow:"
        echo "  1. Make changes in environments/dev/"
        echo "  2. Test at http://localhost:8081"
        echo "  3. Run: ./scripts/promote.sh dev-to-test"
        echo "  4. Test at http://localhost:8082"
        echo "  5. Run: ./scripts/promote.sh test-to-staging"
        echo "  6. Test at http://localhost:8083"
        echo "  7. Run: ./scripts/promote.sh staging-to-prod"
        echo "  8. Run: ./scripts/promote.sh deploy"
        ;;
esac
