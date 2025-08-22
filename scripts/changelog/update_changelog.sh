#!/bin/bash

# Assiduous Automated Changelog Update Script
# Generates changelog entries from git commits following Conventional Commits
# Usage: ./scripts/changelog/update_changelog.sh [version]
# If version is not provided, updates the Unreleased section

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CHANGELOG_FILE="CHANGELOG.md"
TEMP_FILE=".changelog_temp.md"

# Get project root
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$PROJECT_ROOT" ]; then
    echo -e "${RED}Error: Not in a Git repository${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

# Function to get the latest tag
get_latest_tag() {
    git describe --tags --abbrev=0 2>/dev/null || echo ""
}

# Function to format commit type to changelog category
format_type() {
    case $1 in
        feat) echo "Added" ;;
        fix) echo "Fixed" ;;
        docs) echo "Documentation" ;;
        style) echo "Style" ;;
        refactor) echo "Changed" ;;
        perf) echo "Performance" ;;
        test) echo "Tests" ;;
        build) echo "Build" ;;
        ci) echo "CI/CD" ;;
        chore) echo "Maintenance" ;;
        revert) echo "Reverted" ;;
        *) echo "Other" ;;
    esac
}

# Function to parse conventional commits
parse_commits() {
    local from_ref=$1
    local to_ref=$2
    
    declare -A categories
    
    # Get commits between references
    while IFS= read -r commit; do
        # Parse commit message
        if [[ $commit =~ ^([a-z]+)(\(([^)]+)\))?: (.+)$ ]]; then
            type="${BASH_REMATCH[1]}"
            scope="${BASH_REMATCH[3]}"
            subject="${BASH_REMATCH[4]}"
            
            category=$(format_type "$type")
            
            # Build entry
            entry="- "
            if [ -n "$scope" ]; then
                entry+="**$scope**: "
            fi
            entry+="$subject"
            
            # Add to category
            if [ -z "${categories[$category]}" ]; then
                categories[$category]="$entry"
            else
                categories[$category]+=$'\n'"$entry"
            fi
        fi
    done < <(git log --pretty=format:"%s" "$from_ref..$to_ref" 2>/dev/null)
    
    # Output categorized changes
    for category in "Added" "Changed" "Deprecated" "Removed" "Fixed" "Security" "Performance" "Documentation" "Style" "Tests" "Build" "CI/CD" "Maintenance" "Reverted" "Other"; do
        if [ -n "${categories[$category]}" ]; then
            echo "### $category"
            echo "${categories[$category]}"
            echo ""
        fi
    done
}

# Main script
echo -e "${BLUE}=== Assiduous Changelog Updater ===${NC}"
echo ""

# Check if changelog exists
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo -e "${RED}Error: $CHANGELOG_FILE not found${NC}"
    exit 1
fi

# Get version from argument or prompt
VERSION=$1
if [ -z "$VERSION" ]; then
    echo -e "${YELLOW}No version specified. Updating Unreleased section.${NC}"
    echo -e "${BLUE}Enter version number (or press Enter for Unreleased):${NC}"
    read -r VERSION
fi

# Get the latest tag
LATEST_TAG=$(get_latest_tag)
if [ -z "$LATEST_TAG" ]; then
    echo -e "${YELLOW}No tags found. Using initial commit.${NC}"
    LATEST_TAG=$(git rev-list --max-parents=0 HEAD)
fi

echo -e "${BLUE}Generating changelog from $LATEST_TAG to HEAD...${NC}"

# Generate changelog entries
CHANGES=$(parse_commits "$LATEST_TAG" "HEAD")

if [ -z "$CHANGES" ]; then
    echo -e "${YELLOW}No changes found using Conventional Commits format.${NC}"
    exit 0
fi

# Prepare the new section
if [ -n "$VERSION" ] && [ "$VERSION" != "Unreleased" ]; then
    DATE=$(date +%Y-%m-%d)
    NEW_SECTION="## [$VERSION] - $DATE"
else
    NEW_SECTION="## [Unreleased]"
fi

echo ""
echo -e "${GREEN}Generated changelog entries:${NC}"
echo "$NEW_SECTION"
echo ""
echo "$CHANGES"
echo ""

# Ask for confirmation
echo -e "${BLUE}Do you want to update $CHANGELOG_FILE? (y/n)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

# Update the changelog
echo -e "${BLUE}Updating $CHANGELOG_FILE...${NC}"

# Create temporary file with new content
{
    # Keep the header
    sed -n '1,/^## \[Unreleased\]/p' "$CHANGELOG_FILE"
    
    # Add new changes if updating Unreleased
    if [ -z "$VERSION" ] || [ "$VERSION" == "Unreleased" ]; then
        echo ""
        echo "$CHANGES"
    else
        # Add new version section
        echo ""
        echo "$NEW_SECTION"
        echo ""
        echo "$CHANGES"
        echo ""
        echo "## [Unreleased]"
    fi
    
    # Keep the rest of the file
    sed -n '/^## \[Unreleased\]/,$p' "$CHANGELOG_FILE" | tail -n +2
} > "$TEMP_FILE"

# Replace the original file
mv "$TEMP_FILE" "$CHANGELOG_FILE"

echo -e "${GREEN}✅ Changelog updated successfully!${NC}"

# Offer to create a tag if version was specified
if [ -n "$VERSION" ] && [ "$VERSION" != "Unreleased" ]; then
    echo ""
    echo -e "${BLUE}Do you want to create a git tag v$VERSION? (y/n)${NC}"
    read -r CREATE_TAG
    
    if [ "$CREATE_TAG" == "y" ]; then
        git add "$CHANGELOG_FILE"
        git commit -m "chore(release): version $VERSION"
        git tag -a "v$VERSION" -m "Release version $VERSION"
        echo -e "${GREEN}✅ Created tag v$VERSION${NC}"
        echo -e "${BLUE}Don't forget to push the tag: git push origin v$VERSION${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Done! 🎉${NC}"
