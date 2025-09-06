#!/bin/bash

# Automated Version Bump Script
# Analyzes commits since last tag and automatically determines version bump
# Based on Conventional Commits specification

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get current version from VERSION file
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "0.0.0")
echo -e "${BLUE}Current version: $CURRENT_VERSION${NC}"

# Parse semantic version
IFS='.' read -r -a VERSION_PARTS <<< "${CURRENT_VERSION%-*}"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Get the last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# Determine commit range
if [ -z "$LAST_TAG" ]; then
    echo -e "${YELLOW}No previous tags found. Analyzing all commits...${NC}"
    COMMIT_RANGE=""
else
    echo -e "${BLUE}Last tag: $LAST_TAG${NC}"
    COMMIT_RANGE="$LAST_TAG..HEAD"
fi

# Analyze commits to determine version bump
BREAKING_CHANGES=false
NEW_FEATURES=false
BUG_FIXES=false
OTHER_CHANGES=false

echo ""
echo -e "${MAGENTA}Analyzing commits...${NC}"

# Get commits and analyze them
if [ -z "$COMMIT_RANGE" ]; then
    COMMITS=$(git log --pretty=format:"%s" 2>/dev/null)
else
    COMMITS=$(git log $COMMIT_RANGE --pretty=format:"%s" 2>/dev/null)
fi

# Count different types of changes
FEAT_COUNT=0
FIX_COUNT=0
BREAKING_COUNT=0
OTHER_COUNT=0

while IFS= read -r commit; do
    if [[ "$commit" == *"BREAKING CHANGE"* ]] || [[ "$commit" == *"!"* ]]; then
        BREAKING_CHANGES=true
        BREAKING_COUNT=$((BREAKING_COUNT + 1))
        echo -e "  ${RED}! Breaking: $commit${NC}"
    elif [[ "$commit" == feat* ]] || [[ "$commit" == feature* ]]; then
        NEW_FEATURES=true
        FEAT_COUNT=$((FEAT_COUNT + 1))
        echo -e "  ${GREEN}+ Feature: $commit${NC}"
    elif [[ "$commit" == fix* ]] || [[ "$commit" == bugfix* ]]; then
        BUG_FIXES=true
        FIX_COUNT=$((FIX_COUNT + 1))
        echo -e "  ${YELLOW}* Fix: $commit${NC}"
    else
        OTHER_CHANGES=true
        OTHER_COUNT=$((OTHER_COUNT + 1))
    fi
done <<< "$COMMITS"

# Determine version bump type
VERSION_BUMP="none"
if [ "$BREAKING_CHANGES" = true ]; then
    VERSION_BUMP="major"
    NEW_MAJOR=$((MAJOR + 1))
    NEW_MINOR=0
    NEW_PATCH=0
elif [ "$NEW_FEATURES" = true ]; then
    VERSION_BUMP="minor"
    NEW_MAJOR=$MAJOR
    NEW_MINOR=$((MINOR + 1))
    NEW_PATCH=0
elif [ "$BUG_FIXES" = true ] || [ "$OTHER_CHANGES" = true ]; then
    VERSION_BUMP="patch"
    NEW_MAJOR=$MAJOR
    NEW_MINOR=$MINOR
    NEW_PATCH=$((PATCH + 1))
fi

# Construct new version
NEW_VERSION="$NEW_MAJOR.$NEW_MINOR.$NEW_PATCH"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}         Version Bump Analysis${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Breaking changes:  ${BREAKING_COUNT}"
echo -e "New features:      ${FEAT_COUNT}"
echo -e "Bug fixes:         ${FIX_COUNT}"
echo -e "Other changes:     ${OTHER_COUNT}"
echo ""

if [ "$VERSION_BUMP" = "none" ]; then
    echo -e "${YELLOW}No version bump needed - no new commits${NC}"
    exit 0
fi

echo -e "${GREEN}Version bump type: ${VERSION_BUMP}${NC}"
echo -e "${GREEN}New version will be: $NEW_VERSION${NC}"
echo ""

# Ask for confirmation in interactive mode
if [ "$1" != "--auto" ]; then
    read -p "Do you want to bump version to $NEW_VERSION? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Version bump cancelled${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${YELLOW}Updating version to $NEW_VERSION...${NC}"

# Update VERSION file
echo "$NEW_VERSION" > VERSION

# Update package.json
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
else
    sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
fi

# Update README.md
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/version-[^-]*-blue/version-$NEW_VERSION-blue/" README.md
else
    sed -i "s/version-[^-]*-blue/version-$NEW_VERSION-blue/" README.md
fi

echo -e "${GREEN}✓ Version files updated${NC}"

# Generate changelog entry
echo ""
echo -e "${YELLOW}Generating CHANGELOG entry...${NC}"

# Create temporary changelog entry
TEMP_CHANGELOG=$(mktemp)
echo "## [$NEW_VERSION] - $(date +%Y-%m-%d)" > $TEMP_CHANGELOG
echo "" >> $TEMP_CHANGELOG

if [ "$BREAKING_COUNT" -gt 0 ]; then
    echo "### ⚠️ BREAKING CHANGES" >> $TEMP_CHANGELOG
    git log $COMMIT_RANGE --pretty=format:"- %s" --grep="BREAKING CHANGE" >> $TEMP_CHANGELOG 2>/dev/null
    echo "" >> $TEMP_CHANGELOG
    echo "" >> $TEMP_CHANGELOG
fi

if [ "$FEAT_COUNT" -gt 0 ]; then
    echo "### Added" >> $TEMP_CHANGELOG
    git log $COMMIT_RANGE --pretty=format:"- %s" --grep="^feat" >> $TEMP_CHANGELOG 2>/dev/null
    echo "" >> $TEMP_CHANGELOG
    echo "" >> $TEMP_CHANGELOG
fi

if [ "$FIX_COUNT" -gt 0 ]; then
    echo "### Fixed" >> $TEMP_CHANGELOG
    git log $COMMIT_RANGE --pretty=format:"- %s" --grep="^fix" >> $TEMP_CHANGELOG 2>/dev/null
    echo "" >> $TEMP_CHANGELOG
    echo "" >> $TEMP_CHANGELOG
fi

# Insert new changelog entry after [Unreleased] section
if grep -q "\[Unreleased\]" CHANGELOG.md; then
    # Find line with [Unreleased] and insert after it
    awk '/\[Unreleased\]/{print; print ""; getline; print; getline; while(getline line<"'$TEMP_CHANGELOG'") print line; print ""} 1' CHANGELOG.md > CHANGELOG.tmp
    mv CHANGELOG.tmp CHANGELOG.md
else
    # If no [Unreleased] section, add at the beginning
    cat $TEMP_CHANGELOG CHANGELOG.md > CHANGELOG.tmp
    mv CHANGELOG.tmp CHANGELOG.md
fi

# Update version links at bottom of CHANGELOG
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\[Unreleased\]:.*/[Unreleased]: https:\/\/github.com\/SirsiMaster\/Assiduous\/compare\/v$NEW_VERSION...HEAD/" CHANGELOG.md
    # Add new version comparison link
    echo "[${NEW_VERSION}]: https://github.com/SirsiMaster/Assiduous/compare/v${CURRENT_VERSION}...v${NEW_VERSION}" >> CHANGELOG.md
else
    sed -i "s/\[Unreleased\]:.*/[Unreleased]: https:\/\/github.com\/SirsiMaster\/Assiduous\/compare\/v$NEW_VERSION...HEAD/" CHANGELOG.md
    echo "[${NEW_VERSION}]: https://github.com/SirsiMaster/Assiduous/compare/v${CURRENT_VERSION}...v${NEW_VERSION}" >> CHANGELOG.md
fi

rm $TEMP_CHANGELOG

echo -e "${GREEN}✓ CHANGELOG.md updated${NC}"

# Commit version bump
echo ""
echo -e "${YELLOW}Committing version bump...${NC}"
git add VERSION package.json README.md CHANGELOG.md
git commit -m "chore(release): Bump version to $NEW_VERSION [skip ci]

Automated version bump based on conventional commits.
- Breaking changes: $BREAKING_COUNT
- New features: $FEAT_COUNT
- Bug fixes: $FIX_COUNT"

echo -e "${GREEN}✓ Changes committed${NC}"

# Create and push tag
echo ""
echo -e "${YELLOW}Creating tag v$NEW_VERSION...${NC}"

# Generate tag message with commit summary
TAG_MESSAGE="Release v$NEW_VERSION

Summary:
- Breaking changes: $BREAKING_COUNT
- New features: $FEAT_COUNT  
- Bug fixes: $FIX_COUNT
- Other changes: $OTHER_COUNT

Generated automatically based on conventional commits."

git tag -a "v$NEW_VERSION" -m "$TAG_MESSAGE"
echo -e "${GREEN}✓ Tag created${NC}"

# Push if requested
if [ "$1" = "--auto" ] || [ "$2" = "--push" ]; then
    echo ""
    echo -e "${YELLOW}Pushing to remote...${NC}"
    git push origin main
    git push origin "v$NEW_VERSION"
    echo -e "${GREEN}✓ Pushed to remote${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Version bumped to $NEW_VERSION! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"

if [ "$1" != "--auto" ] && [ "$2" != "--push" ]; then
    echo ""
    echo "To push changes, run:"
    echo "  git push origin main"
    echo "  git push origin v$NEW_VERSION"
fi
