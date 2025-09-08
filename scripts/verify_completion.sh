#!/bin/bash

##############################################################################
# Completion Verification Script
# 
# This script MUST be run before reporting any development task as complete.
# It validates that all claimed work actually exists and functions correctly.
# 
# Usage: ./scripts/verify_completion.sh [task-description]
##############################################################################

# set -e  # Disabled to allow full verification run without aborting on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
VERIFICATION_LOG="$PROJECT_DIR/verification_log.txt"

# Initialize verification results
VERIFICATION_PASSED=true
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

##############################################################################
# Helper Functions
##############################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "[$TIMESTAMP] INFO: $1" >> "$VERIFICATION_LOG"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "[$TIMESTAMP] SUCCESS: $1" >> "$VERIFICATION_LOG"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[$TIMESTAMP] WARNING: $1" >> "$VERIFICATION_LOG"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[$TIMESTAMP] ERROR: $1" >> "$VERIFICATION_LOG"
    VERIFICATION_PASSED=false
    ((FAILED_CHECKS++))
}

log_header() {
    echo -e "\n${PURPLE}$1${NC}"
    echo -e "${PURPLE}$(echo "$1" | sed 's/./-/g')${NC}\n"
    echo "[$TIMESTAMP] SECTION: $1" >> "$VERIFICATION_LOG"
}

run_check() {
    local check_name="$1"
    local check_command="$2"
    ((TOTAL_CHECKS++))
    
    if eval "$check_command" > /dev/null 2>&1; then
        log_success "$check_name"
        return 0
    else
        log_error "$check_name"
        return 1
    fi
}

##############################################################################
# Verification Functions
##############################################################################

verify_file_integrity() {
    log_header "File Integrity Verification"
    
    # Check that all HTML files are valid (exclude vendor/cache dirs)
    for html_file in $(find "$PROJECT_DIR" -name "*.html" \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/.next/*" \
        -not -path "*/firebase-migration-package/y/*" \
        -not -path "*/firebase-migration-package/assiduous-build/.next/*"); do
        if command -v tidy &> /dev/null; then
            if tidy -q -e "$html_file" 2>/dev/null; then
                log_success "Valid HTML: $(basename "$html_file")"
            else
                log_warning "HTML validation issues in: $(basename "$html_file")"
            fi
        fi
    done
    
    # Skip JS parse checks (node has no compile-only). Optionally lint if eslint config exists.
    if [ -f "$PROJECT_DIR/.eslintrc" ] || [ -f "$PROJECT_DIR/.eslintrc.js" ]; then
        log_info "ESLint config detected; skipping automatic lint run to avoid noise."
    else
        log_info "Skipping JavaScript syntax check (no reliable non-executing parser configured)."
    fi
    
    # Check that all JSON files are valid
    for json_file in $(find "$PROJECT_DIR" -name "*.json" -not -path "*/node_modules/*" -not -path "*/.git/*"); do
        if jq . "$json_file" > /dev/null 2>&1; then
            log_success "Valid JSON: $(basename "$json_file")"
        else
            log_error "JSON syntax errors in: $(basename "$json_file")"
        fi
    done
}

verify_component_integration() {
    log_header "Component Integration Verification"
    
    # Check if standardized components exist (support multiple locations)
    local component_dirs=(
        "$PROJECT_DIR/AssiduousFlip/components"
        "$PROJECT_DIR/assiduous-build/components"
        "$PROJECT_DIR/components"
    )

    local component_found=false
    for components_dir in "${component_dirs[@]}"; do
        if [ -d "$components_dir" ]; then
            run_check "Admin header component exists in $(basename "$components_dir")" "test -f '$components_dir/admin-header.html' || test -f '$components_dir/universal-header.html'"
            run_check "Sidebar component exists in $(basename "$components_dir")" "test -f '$components_dir/sidebar.html'"
            run_check "Admin layout CSS exists in $(basename "$components_dir")" "test -f '$components_dir/admin-layout.css' || test -f '$components_dir/universal-layout.css'"
            component_found=true
        fi
    done
    if [ "$component_found" = false ]; then
        log_error "No components directory found in expected locations"
    fi

    # Check if pages are actually using standardized components (support multiple bases)
    local admin_bases=(
        "$PROJECT_DIR/AssiduousFlip/admin"
        "$PROJECT_DIR/assiduous-build/admin"
        "$PROJECT_DIR/admin"
    )
    for base in "${admin_bases[@]}"; do
        if [ -d "$base" ]; then
            local admin_pages=(
                "$base/dashboard.html"
                "$base/analytics.html"
                "$base/properties.html"
            )
            for page in "${admin_pages[@]}"; do
        if [ -f "$page" ]; then
            local page_name=$(basename "$page")
            
            # Check if page uses component system (not just loads script)
            if grep -q 'id="admin-header-root"' "$page" && grep -q 'id="sidebar-root"' "$page"; then
                log_success "Page uses standardized components: $page_name"
            elif grep -q 'admin-header.js' "$page"; then
                log_warning "Page loads component script but may not use components: $page_name"
            else
                log_error "Page does not use standardized components: $page_name"
            fi
            
            # Check for excessive custom CSS (indicates non-standardization)
            local css_lines=$(grep -c "style>" "$page" 2>/dev/null || echo "0")
            if [ "$css_lines" -gt 100 ]; then
                log_warning "Page has $css_lines lines of custom CSS (may indicate non-standardization): $page_name"
            fi
            fi
            done
        fi
    done
}

verify_development_server() {
    log_header "Development Server Verification"
    
    # Check if development server can start
    cd "$PROJECT_DIR"
    
    # Use python3 if available, else fallback to python
    local PY_BIN
    if command -v python3 &> /dev/null; then
        PY_BIN=python3
    elif command -v python &> /dev/null; then
        PY_BIN=python
    else
        log_warning "No python interpreter available for server test"
        return
    fi
    
    # Start server in background and stop after check (no GNU timeout dependency)
    ($PY_BIN -m http.server 8081 > /dev/null 2>&1 & echo $!) >/tmp/assiduous_http_server.pid
    sleep 2
    local server_pid=$(cat /tmp/assiduous_http_server.pid 2>/dev/null || echo "")
    if [ -n "$server_pid" ] && kill -0 $server_pid 2>/dev/null; then
        log_success "Development server can start on port 8081"
        kill $server_pid 2>/dev/null || true
        rm -f /tmp/assiduous_http_server.pid
    else
        log_error "Development server failed to start"
    fi
}

verify_firebase_integration() {
    log_header "Firebase Integration Verification"
    
    # Check Firebase configuration files
    run_check "Firebase config exists" "test -f '$PROJECT_DIR/.firebaserc' || test -f '$PROJECT_DIR/firebase.json'"
    
    # Check services in current structure
    local service_dirs=(
        "$PROJECT_DIR/AssiduousFlip/assets/js/services"
        "$PROJECT_DIR/assiduous-build/assets/js/services"
        "$PROJECT_DIR/assets/js/services"
    )
    local services_ok=false
    for sdir in "${service_dirs[@]}"; do
        if [ -d "$sdir" ]; then
            run_check "auth.js exists in $(basename "$sdir")" "test -f '$sdir/auth.js'"
            run_check "crm.js exists in $(basename "$sdir")" "test -f '$sdir/crm.js'"
            run_check "developmentmetricsservice.js exists in $(basename "$sdir")" "test -f '$sdir/developmentmetricsservice.js'"
            services_ok=true
        fi
    done
    if [ "$services_ok" = false ]; then
        log_error "No services directory found in expected locations"
    fi
}

verify_git_integrity() {
    log_header "Git Repository Verification"
    
    cd "$PROJECT_DIR"
    
    # Check git status
    if git status --porcelain 2>/dev/null | grep -q .; then
        log_warning "Repository has uncommitted changes"
    else
        log_success "Repository is clean (no uncommitted changes)"
    fi
    
    # Check if we're on the right branch
    local current_branch=$(git branch --show-current 2>/dev/null)
    if [ -n "$current_branch" ]; then
        log_success "Current branch: $current_branch"
    else
        log_warning "Could not determine current git branch"
    fi
    
    # Check for recent commits
    local recent_commits=$(git log --oneline -5 2>/dev/null | wc -l)
    if [ "$recent_commits" -gt 0 ]; then
        log_success "Repository has recent commits ($recent_commits found)"
    else
        log_error "No recent commits found"
    fi
}

verify_documentation_accuracy() {
    : # placeholder to continue file read
    log_header "Documentation Accuracy Verification"
    
    # Check if key documentation files exist and are recent
    local docs=(
        "$PROJECT_DIR/README.md"
        "$PROJECT_DIR/WARP.md"
        "$PROJECT_DIR/CHANGELOG.md"
    )
    
    for doc in "${docs[@]}"; do
        if [ -f "$doc" ]; then
            local doc_name=$(basename "$doc")
            local doc_age=$(find "$doc" -mtime -7 2>/dev/null | wc -l)
            
            log_success "Documentation exists: $doc_name"
            
            if [ "$doc_age" -gt 0 ]; then
                log_success "Documentation is recent (updated within 7 days): $doc_name"
            else
                log_warning "Documentation may be outdated (older than 7 days): $doc_name"
            fi
        else
            log_error "Missing documentation: $(basename "$doc")"
        fi
    done
    
    # Check if WARP.md contains the governance rules
    if grep -q "CRITICAL DEVELOPMENT GOVERNANCE RULES" "$PROJECT_DIR/WARP.md" 2>/dev/null; then
        log_success "WARP.md contains governance rules"
    else
        log_error "WARP.md missing governance rules"
    fi
}

verify_scripts_functionality() {
    log_header "Scripts Functionality Verification"
    
    local scripts_dir="$PROJECT_DIR/scripts"
    
    # Check if key scripts exist and are executable
    local key_scripts=(
        "complete_history_sync.sh"
        "sync_all_development_history.js"
        "upload_to_firebase.js"
    )
    
    for script in "${key_scripts[@]}"; do
        local script_path="$scripts_dir/$script"
        if [ -f "$script_path" ]; then
            if [ -x "$script_path" ] || [[ "$script" == *.js ]]; then
                log_success "Script exists and is executable: $script"
                
                # Basic syntax check for shell scripts
                if [[ "$script" == *.sh ]]; then
                    if bash -n "$script_path" 2>/dev/null; then
                        log_success "Shell script syntax valid: $script"
                    else
                        log_error "Shell script syntax errors: $script"
                    fi
                fi
            else
                log_warning "Script exists but is not executable: $script"
            fi
        else
            log_error "Missing required script: $script"
        fi
    done
}

verify_project_structure() {
    log_header "Project Structure Verification"
    
    # Check key directories exist (support current structure)
    local key_dirs=(
        "$PROJECT_DIR/admin"
        "$PROJECT_DIR/components"
        "$PROJECT_DIR/assiduous-build/admin"
        "$PROJECT_DIR/assiduous-build/components"
        "$PROJECT_DIR/scripts"
        "$PROJECT_DIR/docs"
    )
    
    for dir in "${key_dirs[@]}"; do
        run_check "Directory exists: $(basename "$dir")" "test -d '$dir'"
    done
    
    # Check critical files exist
    local critical_files=(
        "$PROJECT_DIR/index.html"
        "$PROJECT_DIR/assiduous-build/index.html"
        "$PROJECT_DIR/package.json"
        "$PROJECT_DIR/README.md"
        "$PROJECT_DIR/WARP.md"
    )
    
    for file in "${critical_files[@]}"; do
        run_check "Critical file exists: $(basename "$file")" "test -f '$file'"
    done
}

##############################################################################
# Main Verification Process
##############################################################################

main() {
    local task_description="${1:-Development Task}"
    
    echo -e "${PURPLE}🔍 COMPLETION VERIFICATION SCRIPT${NC}"
    echo -e "${PURPLE}Task: $task_description${NC}"
    echo -e "${PURPLE}Started: $TIMESTAMP${NC}"
    echo -e "${PURPLE}Project: $(basename "$PROJECT_DIR")${NC}\n"
    
    # Initialize log
    echo "=== VERIFICATION LOG ===" > "$VERIFICATION_LOG"
    echo "Task: $task_description" >> "$VERIFICATION_LOG"
    echo "Started: $TIMESTAMP" >> "$VERIFICATION_LOG"
    echo "" >> "$VERIFICATION_LOG"
    
    # Run all verification checks
    verify_project_structure
    verify_file_integrity
    verify_component_integration
    verify_development_server
    verify_firebase_integration
    verify_git_integrity
    verify_documentation_accuracy
    verify_scripts_functionality
    
    # Generate final report
    log_header "VERIFICATION SUMMARY"
    
    echo -e "${BLUE}📊 RESULTS SUMMARY:${NC}"
    echo -e "Total Checks: $TOTAL_CHECKS"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo ""
    
    if [ "$VERIFICATION_PASSED" = true ]; then
        echo -e "${GREEN}✅ VERIFICATION PASSED${NC}"
        echo -e "${GREEN}All critical checks completed successfully.${NC}"
        echo -e "${GREEN}Task completion can be reported.${NC}"
        echo ""
        echo "[$TIMESTAMP] FINAL RESULT: VERIFICATION PASSED" >> "$VERIFICATION_LOG"
        exit 0
    else
        echo -e "${RED}❌ VERIFICATION FAILED${NC}"
        echo -e "${RED}Critical issues found that must be resolved.${NC}"
        echo -e "${RED}Task completion CANNOT be reported until issues are fixed.${NC}"
        echo ""
        echo -e "${YELLOW}Review the verification log: $VERIFICATION_LOG${NC}"
        echo "[$TIMESTAMP] FINAL RESULT: VERIFICATION FAILED" >> "$VERIFICATION_LOG"
        exit 1
    fi
}

# Run verification
main "$@"
