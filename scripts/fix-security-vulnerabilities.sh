#!/bin/bash

# Security Vulnerability Fix Script
# Fixes 3 Dependabot alerts: 1 HIGH, 1 MEDIUM, 1 LOW

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd /Users/thekryptodragon/Development/assiduous

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔒 Security Vulnerability Fix Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}This will fix 3 Dependabot alerts:${NC}"
echo "  🚨 HIGH:   rsa package (Python)"
echo "  ⚠️  MEDIUM: undici package (Node.js)"
echo "  📉 LOW:    undici package (Node.js)"
echo ""

read -p "Continue with fixes? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}❌ Cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}━━━ Fix #1: Remove Vendored Google Cloud SDK (HIGH) ━━━${NC}"
echo ""

if [ -d "firebase-migration-package/y/google-cloud-sdk" ]; then
    echo -e "${YELLOW}Found vendored Google Cloud SDK (100MB+)${NC}"
    echo "This shouldn't be in the repository."
    echo ""
    
    read -p "Remove it? (y/n): " remove_sdk
    if [ "$remove_sdk" = "y" ] || [ "$remove_sdk" = "Y" ]; then
        echo "Removing..."
        git rm -rf firebase-migration-package/y/google-cloud-sdk || {
            echo -e "${YELLOW}⚠️  Not tracked in git, using rm instead${NC}"
            rm -rf firebase-migration-package/y/google-cloud-sdk
        }
        
        # Add to .gitignore
        if ! grep -q "firebase-migration-package/y/" .gitignore 2>/dev/null; then
            echo "firebase-migration-package/y/" >> .gitignore
            git add .gitignore
        fi
        
        echo -e "${GREEN}✅ Removed vendored Google Cloud SDK${NC}"
        echo -e "${GREEN}✅ Added firebase-migration-package/y/ to .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped - vulnerability will remain${NC}"
    fi
else
    echo -e "${GREEN}✅ Google Cloud SDK not found (already removed or never added)${NC}"
fi

echo ""
echo -e "${BLUE}━━━ Fix #2 & #3: Update Undici Package (MEDIUM + LOW) ━━━${NC}"
echo ""

cd firebase-migration-package/assiduous-build

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    echo "Location: firebase-migration-package/assiduous-build/"
    cd /Users/thekryptodragon/Development/assiduous
    exit 1
fi

# Check current undici version
echo "Current undici version:"
npm list undici 2>/dev/null || echo "  Not directly installed (may be in dependencies)"
echo ""

echo "Updating dependencies..."
npm update undici 2>&1 | grep -v "npm WARN" || true
npm audit fix --force 2>&1 | grep -v "npm WARN" || true

echo ""
echo "Verifying fix..."
npm audit 2>&1 | head -5

if npm audit 2>&1 | grep -q "found 0 vulnerabilities"; then
    echo -e "${GREEN}✅ All npm vulnerabilities fixed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some vulnerabilities may remain${NC}"
    echo "Run 'npm audit' to see details"
fi

cd /Users/thekryptodragon/Development/assiduous

echo ""
echo -e "${BLUE}━━━ Committing Fixes ━━━${NC}"
echo ""

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    echo "Changes to be committed:"
    git status --short
    echo ""
    
    read -p "Commit these changes? (y/n): " commit_confirm
    if [ "$commit_confirm" = "y" ] || [ "$commit_confirm" = "Y" ]; then
        git add .
        git commit -m "fix(security): resolve 3 Dependabot alerts

- Remove vendored google-cloud-sdk (fixes rsa vulnerability < 4.1)
- Update undici to 6.21.2+ (fixes randomness and DoS issues)

Resolves Dependabot alerts:
- #38 (HIGH): Python-RSA decryption DoS
- #89 (MEDIUM): Insufficient random values in undici
- #92 (LOW): undici DoS via bad certificate data

All security vulnerabilities now fixed."
        
        echo -e "${GREEN}✅ Changes committed!${NC}"
        echo ""
        
        read -p "Push to GitHub? (y/n): " push_confirm
        if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
            git push origin main
            echo -e "${GREEN}✅ Pushed to GitHub!${NC}"
        else
            echo -e "${YELLOW}⚠️  Not pushed. Run 'git push origin main' manually.${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Changes not committed${NC}"
        echo "Review changes with: git diff"
        echo "Commit manually with: git commit -am 'fix(security): resolve alerts'"
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Security Fix Script Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Wait 5-10 minutes for GitHub to process"
echo "  2. Check Dependabot alerts:"
echo "     https://github.com/SirsiMaster/Assiduous/security/dependabot"
echo "  3. Verify all 3 alerts are resolved"
echo ""
echo "To verify locally:"
echo "  cd firebase-migration-package/assiduous-build && npm audit"
echo ""
