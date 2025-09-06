#!/bin/bash

# Version Consistency Check Script
# Ensures version numbers are synchronized across all files

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    AssiduousFlip Version Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get versions from different sources
VERSION_FILE=$(cat VERSION 2>/dev/null || echo "FILE NOT FOUND")
PACKAGE_VERSION=$(grep -o '"version": "[^"]*' package.json 2>/dev/null | cut -d'"' -f4 || echo "NOT FOUND")
README_VERSION=$(grep -o 'version-[^-]*' README.md 2>/dev/null | head -1 | cut -d'-' -f2 || echo "NOT FOUND")

# Get latest git tag
GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "No tags")
if [ "$GIT_TAG" != "No tags" ]; then
    GIT_TAG="${GIT_TAG#v}" # Remove 'v' prefix if present
fi

# Display current versions
echo -e "${YELLOW}Current Versions:${NC}"
echo -e "  VERSION file:  ${BLUE}$VERSION_FILE${NC}"
echo -e "  package.json:  ${BLUE}$PACKAGE_VERSION${NC}"
echo -e "  README.md:     ${BLUE}$README_VERSION${NC}"
echo -e "  Latest tag:    ${BLUE}$GIT_TAG${NC}"
echo ""

# Check if all versions match
if [ "$VERSION_FILE" = "$PACKAGE_VERSION" ] && [ "$VERSION_FILE" = "$README_VERSION" ]; then
    echo -e "${GREEN}✅ All version numbers match!${NC}"
    VERSION_OK=true
else
    echo -e "${RED}❌ Version mismatch detected!${NC}"
    VERSION_OK=false
    
    # Show specific mismatches
    if [ "$VERSION_FILE" != "$PACKAGE_VERSION" ]; then
        echo -e "${RED}  - VERSION file and package.json don't match${NC}"
    fi
    if [ "$VERSION_FILE" != "$README_VERSION" ]; then
        echo -e "${RED}  - VERSION file and README.md don't match${NC}"
    fi
fi

# Check if git tag matches
if [ "$GIT_TAG" != "No tags" ] && [ "$VERSION_FILE" != "$GIT_TAG" ]; then
    echo -e "${YELLOW}⚠️  Current version ($VERSION_FILE) is ahead of latest tag (v$GIT_TAG)${NC}"
    echo -e "${YELLOW}   Consider creating a new tag when ready to release${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    echo -e "   Remember to commit before creating a release tag"
fi

# Provide fix command if versions don't match
if [ "$VERSION_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}To fix version mismatch, run:${NC}"
    echo -e "  ./scripts/update-version.sh $VERSION_FILE"
fi

# Exit with appropriate code
if [ "$VERSION_OK" = true ]; then
    exit 0
else
    exit 1
fi
