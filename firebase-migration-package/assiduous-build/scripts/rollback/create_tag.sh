#!/bin/bash

# Assiduous Tag Creation Script
# Creates version tags with validation and documentation
# Usage: ./scripts/rollback/create_tag.sh <version> ["description"]

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
    echo -e "${RED}Error: Version number required${NC}"
    echo "Usage: $0 <version> [\"description\"]"
    echo "Example: $0 0.2.0 \"AI integration release\""
    exit 1
fi

VERSION=$1
DESCRIPTION=${2:-"Release version $VERSION"}

# Validate version format (semantic versioning)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
    echo -e "${RED}Error: Invalid version format${NC}"
    echo "Version must follow semantic versioning: MAJOR.MINOR.PATCH[-PRERELEASE]"
    echo "Examples: 1.0.0, 2.1.3, 1.0.0-alpha.1"
    exit 1
fi

TAG_NAME="v$VERSION"

echo -e "${BLUE}=== Assiduous Tag Creator ===${NC}"
echo ""
echo -e "${BLUE}Version:${NC} $VERSION"
echo -e "${BLUE}Tag:${NC} $TAG_NAME"
echo -e "${BLUE}Description:${NC} $DESCRIPTION"
echo ""

# Check if tag already exists
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo -e "${RED}Error: Tag $TAG_NAME already exists${NC}"
    echo "Existing tag points to: $(git rev-parse --short "$TAG_NAME")"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    git status --short
    echo ""
    echo -e "${BLUE}Do you want to stash these changes? (y/n)${NC}"
    read -r STASH_CHANGES
    
    if [ "$STASH_CHANGES" == "y" ]; then
        git stash save "Auto-stash before tagging $TAG_NAME"
        echo -e "${GREEN}Changes stashed${NC}"
    else
        echo -e "${RED}Cannot create tag with uncommitted changes${NC}"
        exit 1
    fi
fi

# Verify we're on a branch
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    echo -e "${RED}Error: Not on a branch (detached HEAD state)${NC}"
    echo "Please checkout a branch before creating a tag"
    exit 1
fi

echo -e "${BLUE}Current branch:${NC} $CURRENT_BRANCH"
echo -e "${BLUE}Current commit:${NC} $(git rev-parse --short HEAD)"
echo ""

# Update CHANGELOG if it exists
if [ -f "CHANGELOG.md" ]; then
    echo -e "${BLUE}Do you want to update CHANGELOG.md? (y/n)${NC}"
    read -r UPDATE_CHANGELOG
    
    if [ "$UPDATE_CHANGELOG" == "y" ]; then
        if [ -x "scripts/changelog/update_changelog.sh" ]; then
            ./scripts/changelog/update_changelog.sh "$VERSION"
        else
            echo -e "${YELLOW}Changelog update script not found or not executable${NC}"
        fi
    fi
fi

# Create release notes
RELEASE_NOTES_FILE=".release_notes_temp.md"
echo "# Release $VERSION" > "$RELEASE_NOTES_FILE"
echo "" >> "$RELEASE_NOTES_FILE"
echo "$DESCRIPTION" >> "$RELEASE_NOTES_FILE"
echo "" >> "$RELEASE_NOTES_FILE"
echo "## Changes" >> "$RELEASE_NOTES_FILE"
echo "" >> "$RELEASE_NOTES_FILE"

# Get commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
    echo "### Commits since $LAST_TAG" >> "$RELEASE_NOTES_FILE"
    git log --pretty=format:"- %s (%h)" "$LAST_TAG..HEAD" >> "$RELEASE_NOTES_FILE"
else
    echo "### All commits" >> "$RELEASE_NOTES_FILE"
    git log --pretty=format:"- %s (%h)" >> "$RELEASE_NOTES_FILE"
fi

echo "" >> "$RELEASE_NOTES_FILE"
echo "## Deployment" >> "$RELEASE_NOTES_FILE"
echo "" >> "$RELEASE_NOTES_FILE"
echo "- **Date:** $(date +%Y-%m-%d)" >> "$RELEASE_NOTES_FILE"
echo "- **Branch:** $CURRENT_BRANCH" >> "$RELEASE_NOTES_FILE"
echo "- **Commit:** $(git rev-parse HEAD)" >> "$RELEASE_NOTES_FILE"

# Show release notes
echo -e "${BLUE}Release notes:${NC}"
echo "---"
cat "$RELEASE_NOTES_FILE"
echo "---"
echo ""

# Confirm tag creation
echo -e "${BLUE}Do you want to create tag $TAG_NAME? (y/n)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo -e "${YELLOW}Tag creation cancelled${NC}"
    rm "$RELEASE_NOTES_FILE"
    exit 0
fi

# Create annotated tag
echo -e "${BLUE}Creating tag...${NC}"
git tag -a "$TAG_NAME" -F "$RELEASE_NOTES_FILE"
rm "$RELEASE_NOTES_FILE"

echo -e "${GREEN}✅ Tag $TAG_NAME created successfully!${NC}"

# Update rollback registry
if [ -f "ROLLBACK_REGISTRY.md" ]; then
    echo ""
    echo -e "${YELLOW}Don't forget to update ROLLBACK_REGISTRY.md with:${NC}"
    echo "- Version: $TAG_NAME"
    echo "- Date: $(date +%Y-%m-%d)"
    echo "- Commit: $(git rev-parse --short HEAD)"
    echo "- Features and rollback steps"
fi

# Push instructions
echo ""
echo -e "${BLUE}To push this tag to remote:${NC}"
echo "  git push origin $TAG_NAME"
echo ""
echo -e "${BLUE}To push all tags:${NC}"
echo "  git push origin --tags"
echo ""
echo -e "${BLUE}To delete this tag (if needed):${NC}"
echo "  git tag -d $TAG_NAME"
echo ""

echo -e "${GREEN}Done! 🎉${NC}"
