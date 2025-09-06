#!/bin/bash

# Version Update Script for AssiduousFlip
# Usage: ./scripts/update-version.sh <version>

NEW_VERSION=$1

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$NEW_VERSION" ]; then
    echo -e "${RED}Error: Version number required${NC}"
    echo "Usage: ./scripts/update-version.sh <version>"
    echo "Example: ./scripts/update-version.sh 0.3.0"
    exit 1
fi

# Validate version format (basic check)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9\.]+)?$ ]]; then
    echo -e "${RED}Error: Invalid version format${NC}"
    echo "Version must follow semantic versioning (e.g., 1.2.3 or 1.2.3-beta.1)"
    exit 1
fi

echo -e "${YELLOW}Updating version to $NEW_VERSION...${NC}"

# Update VERSION file
echo "$NEW_VERSION" > VERSION
echo -e "${GREEN}✓${NC} Updated VERSION file"

# Update package.json
if [ -f "package.json" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
    else
        # Linux
        sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
    fi
    echo -e "${GREEN}✓${NC} Updated package.json"
fi

# Update README.md badge
if [ -f "README.md" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/version-[^-]*-blue/version-$NEW_VERSION-blue/" README.md
    else
        # Linux
        sed -i "s/version-[^-]*-blue/version-$NEW_VERSION-blue/" README.md
    fi
    echo -e "${GREEN}✓${NC} Updated README.md badge"
fi

echo ""
echo -e "${GREEN}✅ Version updated to $NEW_VERSION${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Update CHANGELOG.md with release notes"
echo "  2. Commit changes: git add . && git commit -m \"chore: Bump version to $NEW_VERSION\""
echo "  3. Create tag: git tag -a v$NEW_VERSION -m \"Release version $NEW_VERSION\""
echo "  4. Push changes: git push && git push origin v$NEW_VERSION"
echo ""
echo "To verify versions match, run: ./scripts/check-version.sh"
