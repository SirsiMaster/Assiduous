#!/bin/bash

# Assiduous Git Hooks Installation Script
# This script installs all Git hooks for the project

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Assiduous Git Hooks Installer ===${NC}"
echo ""

# Get the project root directory
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"

if [ -z "$PROJECT_ROOT" ]; then
    echo -e "${RED}Error: Not in a Git repository${NC}"
    exit 1
fi

echo -e "${BLUE}Project root: ${NC}$PROJECT_ROOT"

# Check if hooks directory exists
HOOKS_DIR="$PROJECT_ROOT/scripts/hooks"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
    echo -e "${RED}Error: Hooks directory not found at $HOOKS_DIR${NC}"
    exit 1
fi

# Function to install a hook
install_hook() {
    local hook_name=$1
    local source_file="$HOOKS_DIR/$hook_name"
    local target_file="$GIT_HOOKS_DIR/$hook_name"
    
    if [ ! -f "$source_file" ]; then
        echo -e "${YELLOW}Skipping $hook_name (not found)${NC}"
        return
    fi
    
    # Backup existing hook if it exists
    if [ -f "$target_file" ]; then
        echo -e "${YELLOW}Backing up existing $hook_name to $hook_name.backup${NC}"
        cp "$target_file" "$target_file.backup"
    fi
    
    # Copy and make executable
    cp "$source_file" "$target_file"
    chmod +x "$target_file"
    echo -e "${GREEN}✓ Installed $hook_name${NC}"
}

# Install commit-msg hook
echo ""
echo -e "${BLUE}Installing Git hooks...${NC}"
install_hook "commit-msg"

# Configure commit template
echo ""
echo -e "${BLUE}Configuring commit template...${NC}"
if [ -f "$PROJECT_ROOT/.gitmessage" ]; then
    git config commit.template "$PROJECT_ROOT/.gitmessage"
    echo -e "${GREEN}✓ Commit template configured${NC}"
else
    echo -e "${YELLOW}⚠ Commit template not found${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo -e "${BLUE}Installed hooks will:${NC}"
echo "  • Validate commit messages against Conventional Commits"
echo "  • Ensure consistent code style"
echo "  • Run automated checks before commits"
echo ""
echo -e "${BLUE}To test the commit-msg hook:${NC}"
echo "  git commit -m \"test: this should pass\""
echo "  git commit -m \"bad message\" # This should fail"
echo ""
echo -e "${BLUE}To bypass hooks (emergency only):${NC}"
echo "  git commit --no-verify"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
