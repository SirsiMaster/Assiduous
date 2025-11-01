#!/bin/bash

###############################################################################
# Assiduous Directory Reorganization Script
# 
# This script reorganizes the Assiduous project structure for better clarity
# and maintainability according to REORGANIZATION_PLAN.md
#
# IMPORTANT: Review REORGANIZATION_PLAN.md before running this script
#
# Usage: ./migrate-structure.sh [--dry-run]
#        --dry-run: Show what would be done without making changes
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Dry run mode
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}\n"
fi

# Project root
PROJECT_ROOT="/Users/thekryptodragon/Development/assiduous"
cd "$PROJECT_ROOT"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Assiduous Directory Reorganization                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

###############################################################################
# Helper Functions
###############################################################################

log_step() {
    echo -e "${GREEN}➜ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

run_cmd() {
    local cmd="$1"
    local description="$2"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} $description"
        echo -e "  Command: $cmd"
    else
        echo "  $description"
        eval "$cmd"
    fi
}

###############################################################################
# Phase 0: Pre-flight Checks
###############################################################################

log_step "Phase 0: Pre-flight checks"

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d ".git" ]]; then
    log_error "Not in project root directory. Please run from: $PROJECT_ROOT"
    exit 1
fi

# Check if backup exists
BACKUP_DIR="${PROJECT_ROOT}_backup_$(date +%Y%m%d_%H%M%S)"
echo "  Backup will be created at: $BACKUP_DIR"

# Check if firebase-migration-package exists
if [[ ! -d "firebase-migration-package/assiduous-build" ]]; then
    log_error "firebase-migration-package/assiduous-build not found"
    exit 1
fi

# Check if public/ already exists
if [[ -d "public" ]]; then
    log_warn "public/ directory already exists. Will merge contents."
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    log_warn "You have uncommitted changes. Consider committing or stashing them first."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

###############################################################################
# Phase 1: Backup
###############################################################################

log_step "Phase 1: Creating backup"

if [[ "$DRY_RUN" == false ]]; then
    echo "  Creating full backup to: $BACKUP_DIR"
    cp -r "$PROJECT_ROOT" "$BACKUP_DIR"
    echo -e "${GREEN}  ✓ Backup created successfully${NC}"
else
    echo -e "${YELLOW}[DRY RUN]${NC} Would create backup at: $BACKUP_DIR"
fi

echo ""

###############################################################################
# Phase 2: Restructure Directories
###############################################################################

log_step "Phase 2: Restructuring directories"

# 2.1: Move main build directory to public/
if [[ -d "firebase-migration-package/assiduous-build" ]]; then
    run_cmd "git mv firebase-migration-package/assiduous-build public" \
            "Moving firebase-migration-package/assiduous-build → public/"
fi

# 2.2: Create config directory structure
run_cmd "mkdir -p config/firebase config/environments" \
        "Creating config/ directory structure"

# 2.3: Move Firebase configs
if [[ -f ".firebaserc" ]]; then
    run_cmd "git mv .firebaserc config/firebase/.firebaserc" \
            "Moving .firebaserc → config/firebase/"
fi

if [[ -f "firebase.json" ]]; then
    run_cmd "git mv firebase.json config/firebase/firebase.json" \
            "Moving firebase.json → config/firebase/"
fi

if [[ -f "firebase-staging.json" ]]; then
    run_cmd "git mv firebase-staging.json config/firebase/firebase-staging.json" \
            "Moving firebase-staging.json → config/firebase/"
fi

# 2.4: Create firestore directory and move rules
run_cmd "mkdir -p firestore" \
        "Creating firestore/ directory"

if [[ -f "firestore.rules" ]]; then
    run_cmd "git mv firestore.rules firestore/firestore.rules" \
            "Moving firestore.rules → firestore/"
fi

if [[ -f "firestore.indexes.json" ]]; then
    run_cmd "git mv firestore.indexes.json firestore/firestore.indexes.json" \
            "Moving firestore.indexes.json → firestore/"
fi

if [[ -f "storage.rules" ]]; then
    run_cmd "git mv storage.rules firestore/storage.rules" \
            "Moving storage.rules → firestore/"
fi

# 2.5: Organize scripts directory
run_cmd "mkdir -p scripts/deployment scripts/database scripts/testing" \
        "Creating scripts/ subdirectories"

# 2.6: Create tests directory structure
run_cmd "mkdir -p tests/unit tests/integration tests/e2e" \
        "Creating tests/ directory structure"

# 2.7: Organize data directory
run_cmd "mkdir -p data/seeds data/fixtures" \
        "Creating data/ subdirectories"

# 2.8: Remove symlink if exists
if [[ -L "assiduous-build" ]]; then
    run_cmd "rm -f assiduous-build" \
            "Removing assiduous-build symlink"
fi

# 2.9: Clean up firebase-migration-package if empty
if [[ -d "firebase-migration-package" ]]; then
    # Check if directory is empty or only contains hidden files
    if [[ -z $(ls -A firebase-migration-package 2>/dev/null | grep -v '^\\.') ]]; then
        run_cmd "rmdir firebase-migration-package" \
                "Removing empty firebase-migration-package directory"
    else
        log_warn "firebase-migration-package still contains files. Review and remove manually."
    fi
fi

echo ""

###############################################################################
# Phase 3: Update Configuration Files
###############################################################################

log_step "Phase 3: Updating configuration files"

# 3.1: Update firebase.json
if [[ "$DRY_RUN" == false ]] && [[ -f "config/firebase/firebase.json" ]]; then
    echo "  Updating firebase.json hosting.public path"
    # Use sed to update the public path
    sed -i '' 's|"public": "firebase-migration-package/assiduous-build"|"public": "public"|g' config/firebase/firebase.json
    sed -i '' 's|"public": "assiduous-build"|"public": "public"|g' config/firebase/firebase.json
    echo -e "${GREEN}  ✓ firebase.json updated${NC}"
else
    echo -e "${YELLOW}[DRY RUN]${NC} Would update firebase.json public path"
fi

# 3.2: Create symlinks for Firebase CLI compatibility
if [[ "$DRY_RUN" == false ]]; then
    echo "  Creating symlinks for Firebase CLI"
    ln -sf config/firebase/.firebaserc .firebaserc
    ln -sf config/firebase/firebase.json firebase.json
    ln -sf firestore/firestore.rules firestore.rules
    ln -sf firestore/firestore.indexes.json firestore.indexes.json
    ln -sf firestore/storage.rules storage.rules
    echo -e "${GREEN}  ✓ Symlinks created${NC}"
else
    echo -e "${YELLOW}[DRY RUN]${NC} Would create symlinks for Firebase CLI"
fi

# 3.3: Update GitHub Actions workflows
if [[ -d ".github/workflows" ]]; then
    echo "  Checking GitHub Actions workflows for path updates..."
    if [[ "$DRY_RUN" == false ]]; then
        find .github/workflows -type f -name "*.yml" -o -name "*.yaml" | while read file; do
            if grep -q "firebase-migration-package/assiduous-build" "$file"; then
                sed -i '' 's|firebase-migration-package/assiduous-build|public|g' "$file"
                echo "    Updated: $file"
            fi
        done
        echo -e "${GREEN}  ✓ GitHub Actions updated${NC}"
    else
        echo -e "${YELLOW}[DRY RUN]${NC} Would update GitHub Actions workflows"
    fi
fi

echo ""

###############################################################################
# Phase 4: Update Documentation
###############################################################################

log_step "Phase 4: Updating documentation"

# Update WARP.md
if [[ -f "WARP.md" ]] && [[ "$DRY_RUN" == false ]]; then
    echo "  Updating WARP.md with new directory structure"
    sed -i '' 's|firebase-migration-package/assiduous-build|public|g' WARP.md
    echo -e "${GREEN}  ✓ WARP.md updated${NC}"
else
    echo -e "${YELLOW}[DRY RUN]${NC} Would update WARP.md"
fi

# Update README.md
if [[ -f "README.md" ]] && [[ "$DRY_RUN" == false ]]; then
    echo "  Updating README.md with new directory structure"
    sed -i '' 's|firebase-migration-package/assiduous-build|public|g' README.md
    echo -e "${GREEN}  ✓ README.md updated${NC}"
else
    echo -e "${YELLOW}[DRY RUN]${NC} Would update README.md"
fi

echo ""

###############################################################################
# Phase 5: Verification
###############################################################################

log_step "Phase 5: Verification"

if [[ "$DRY_RUN" == false ]]; then
    echo "  Verifying new structure..."
    
    # Check critical directories exist
    REQUIRED_DIRS=("public" "functions" "config/firebase" "firestore")
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [[ -d "$dir" ]]; then
            echo -e "  ${GREEN}✓${NC} $dir exists"
        else
            echo -e "  ${RED}✗${NC} $dir missing"
        fi
    done
    
    # Check symlinks
    REQUIRED_LINKS=(".firebaserc" "firebase.json" "firestore.rules")
    for link in "${REQUIRED_LINKS[@]}"; do
        if [[ -L "$link" ]]; then
            echo -e "  ${GREEN}✓${NC} $link symlink exists"
        else
            echo -e "  ${YELLOW}⚠${NC} $link symlink missing"
        fi
    done
    
    echo ""
    echo -e "${GREEN}✓ Verification complete${NC}"
else
    echo -e "${YELLOW}[DRY RUN]${NC} Would verify new structure"
fi

echo ""

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Migration Summary                                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"

if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}This was a DRY RUN. No changes were made.${NC}"
    echo ""
    echo "To execute the migration, run:"
    echo "  ./migrate-structure.sh"
    echo ""
else
    echo -e "${GREEN}✓ Directory reorganization complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git status"
    echo "  2. Test deployment: cd public && firebase deploy --only hosting"
    echo "  3. Run tests: npm test"
    echo "  4. Commit changes: git add . && git commit -m 'refactor: reorganize directory structure'"
    echo "  5. Push to remote: git push origin main"
    echo ""
    echo "Backup location: $BACKUP_DIR"
    echo ""
    echo -e "${YELLOW}⚠️  Important: Test thoroughly before deploying to production${NC}"
fi

echo ""
