#!/bin/bash

# Assiduous Rollback Script
# Safely rollback to a previous version tag
# Usage: ./scripts/rollback/rollback_to_tag.sh <tag>

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get project root
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$PROJECT_ROOT" ]; then
    echo -e "${RED}Error: Not in a Git repository${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Tag name required${NC}"
    echo "Usage: $0 <tag>"
    echo "Example: $0 v0.1.0"
    echo ""
    echo "Available tags:"
    git tag -l | sort -V
    exit 1
fi

TARGET_TAG=$1

echo -e "${BLUE}=== Assiduous Rollback Tool ===${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will rollback your codebase to $TARGET_TAG${NC}"
echo ""

# Verify tag exists
if ! git rev-parse "$TARGET_TAG" >/dev/null 2>&1; then
    echo -e "${RED}Error: Tag $TARGET_TAG does not exist${NC}"
    echo ""
    echo "Available tags:"
    git tag -l | sort -V
    exit 1
fi

# Get current state information
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")

echo -e "${BLUE}Current State:${NC}"
echo "  Branch: $CURRENT_BRANCH"
echo "  Commit: $CURRENT_COMMIT"
if [ -n "$CURRENT_TAG" ]; then
    echo "  Tag: $CURRENT_TAG"
fi
echo ""

# Get target information
TARGET_COMMIT=$(git rev-parse --short "$TARGET_TAG")
TARGET_DATE=$(git log -1 --format=%ci "$TARGET_TAG")

echo -e "${BLUE}Target State:${NC}"
echo "  Tag: $TARGET_TAG"
echo "  Commit: $TARGET_COMMIT"
echo "  Date: $TARGET_DATE"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}You have uncommitted changes:${NC}"
    git status --short
    echo ""
    echo -e "${BLUE}Do you want to:${NC}"
    echo "  1) Stash changes and continue"
    echo "  2) Discard changes and continue"
    echo "  3) Cancel rollback"
    echo ""
    echo -e "${BLUE}Enter choice (1/2/3):${NC}"
    read -r CHOICE
    
    case $CHOICE in
        1)
            STASH_NAME="rollback-stash-$(date +%Y%m%d-%H%M%S)"
            git stash save "$STASH_NAME"
            echo -e "${GREEN}Changes stashed as: $STASH_NAME${NC}"
            ;;
        2)
            echo -e "${YELLOW}Discarding changes...${NC}"
            git reset --hard
            git clean -fd
            echo -e "${GREEN}Changes discarded${NC}"
            ;;
        3)
            echo -e "${YELLOW}Rollback cancelled${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Rollback cancelled${NC}"
            exit 1
            ;;
    esac
fi

# Check if we're on a protected branch
PROTECTED_BRANCHES=("main" "master" "production")
if [[ " ${PROTECTED_BRANCHES[@]} " =~ " ${CURRENT_BRANCH} " ]]; then
    echo -e "${YELLOW}Warning: You're on a protected branch ($CURRENT_BRANCH)${NC}"
    echo -e "${BLUE}It's recommended to create a rollback branch. Continue anyway? (y/n)${NC}"
    read -r CONTINUE_ON_PROTECTED
    
    if [ "$CONTINUE_ON_PROTECTED" != "y" ]; then
        ROLLBACK_BRANCH="rollback-to-$TARGET_TAG-$(date +%Y%m%d-%H%M%S)"
        echo -e "${BLUE}Creating rollback branch: $ROLLBACK_BRANCH${NC}"
        git checkout -b "$ROLLBACK_BRANCH"
        CURRENT_BRANCH="$ROLLBACK_BRANCH"
    fi
fi

# Create backup tag
BACKUP_TAG="backup-before-rollback-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}Creating backup tag: $BACKUP_TAG${NC}"
git tag "$BACKUP_TAG"

# Show changes that will be rolled back
echo ""
echo -e "${BLUE}Changes that will be rolled back:${NC}"
echo "---"
git log --oneline "$TARGET_TAG..$CURRENT_COMMIT" | head -20
TOTAL_COMMITS=$(git rev-list --count "$TARGET_TAG..$CURRENT_COMMIT")
if [ "$TOTAL_COMMITS" -gt 20 ]; then
    echo "... and $((TOTAL_COMMITS - 20)) more commits"
fi
echo "---"
echo ""

# Confirm rollback
echo -e "${RED}This action will reset your branch to $TARGET_TAG${NC}"
echo -e "${BLUE}Are you sure you want to continue? (yes/no)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    git tag -d "$BACKUP_TAG"
    exit 0
fi

# Perform rollback
echo ""
echo -e "${BLUE}Performing rollback...${NC}"

# Reset to target tag
git reset --hard "$TARGET_TAG"

echo -e "${GREEN}✅ Successfully rolled back to $TARGET_TAG${NC}"
echo ""

# Post-rollback information
echo -e "${BLUE}Post-Rollback Information:${NC}"
echo "  Current commit: $(git rev-parse --short HEAD)"
echo "  Backup tag: $BACKUP_TAG"
echo ""

echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test the application thoroughly"
echo "  2. If rollback is successful:"
echo "     - Push changes: git push --force-with-lease origin $CURRENT_BRANCH"
echo "     - Update deployment"
echo "     - Notify team"
echo "  3. If rollback failed:"
echo "     - Restore from backup: git reset --hard $BACKUP_TAG"
echo ""

# Update rollback registry
if [ -f "ROLLBACK_REGISTRY.md" ]; then
    echo -e "${YELLOW}Remember to update ROLLBACK_REGISTRY.md with:${NC}"
    echo "  - Rollback date: $(date +%Y-%m-%d)"
    echo "  - From version: $CURRENT_COMMIT"
    echo "  - To version: $TARGET_TAG"
    echo "  - Reason for rollback"
fi

echo ""
echo -e "${GREEN}Rollback complete! 🔄${NC}"
