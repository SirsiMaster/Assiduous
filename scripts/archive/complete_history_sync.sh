#!/bin/bash

##############################################################################
# Assiduous Complete Development History Sync & Upload
# 
# This master script orchestrates the complete process of capturing every
# single development action from project inception and uploading it to Firebase
# 
# Usage:
#   ./scripts/complete_history_sync.sh [--dry-run] [--github-token TOKEN] [--upload-to-firebase]
##############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/data/development_history"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Parse command line arguments
DRY_RUN=false
GITHUB_TOKEN=""
UPLOAD_TO_FIREBASE=false
BATCH_SIZE=50

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --github-token)
            GITHUB_TOKEN="$2"
            shift 2
            ;;
        --upload-to-firebase)
            UPLOAD_TO_FIREBASE=true
            shift
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run              Run without making changes to Firebase"
            echo "  --github-token TOKEN   GitHub API token for enhanced data"
            echo "  --upload-to-firebase   Upload data to Firebase after analysis"
            echo "  --batch-size N         Firebase upload batch size (default: 50)"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

##############################################################################
# Helper Functions
##############################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "\n${PURPLE}$1${NC}"
    echo -e "${PURPLE}$(echo "$1" | sed 's/./-/g')${NC}\n"
}

check_prerequisites() {
    log_header "Checking Prerequisites"
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        log_error "Not in a git repository. Please run from the project root."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js to continue."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm to continue."
        exit 1
    fi
    
    # Check if we have firebase-admin dependency (for upload)
    if [ "$UPLOAD_TO_FIREBASE" = true ]; then
        if [ ! -f "package.json" ] || ! npm list firebase-admin &> /dev/null; then
            log_warning "firebase-admin not found. Installing..."
            npm install firebase-admin
        fi
    fi
    
    log_success "All prerequisites met"
}

setup_environment() {
    log_header "Setting Up Environment"
    
    # Create data directory
    mkdir -p "$DATA_DIR"
    log_info "Data directory: $DATA_DIR"
    
    # Backup any existing data
    if [ "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
        BACKUP_DIR="$DATA_DIR/backup_$TIMESTAMP"
        mkdir -p "$BACKUP_DIR"
        mv "$DATA_DIR"/*.json "$BACKUP_DIR/" 2>/dev/null || true
        mv "$DATA_DIR"/*.md "$BACKUP_DIR/" 2>/dev/null || true
        log_info "Existing data backed up to: $BACKUP_DIR"
    fi
    
    log_success "Environment ready"
}

run_history_analysis() {
    log_header "Running Complete Development History Analysis"
    
    local node_args=()
    
    if [ "$DRY_RUN" = true ]; then
        node_args+=("--dry-run")
    fi
    
    if [ -n "$GITHUB_TOKEN" ]; then
        node_args+=("--github-token" "$GITHUB_TOKEN")
    fi
    
    log_info "Executing: node $SCRIPT_DIR/sync_all_development_history.js ${node_args[*]}"
    
    # Run the comprehensive history sync
    cd "$PROJECT_DIR"
    if node "$SCRIPT_DIR/sync_all_development_history.js" "${node_args[@]}"; then
        log_success "Development history analysis completed successfully"
    else
        log_error "History analysis failed"
        exit 1
    fi
}

upload_to_firebase() {
    if [ "$UPLOAD_TO_FIREBASE" = false ]; then
        log_info "Skipping Firebase upload (use --upload-to-firebase to enable)"
        return 0
    fi
    
    log_header "Uploading Data to Firebase"
    
    local upload_args=("--data-dir" "$DATA_DIR" "--batch-size" "$BATCH_SIZE")
    
    if [ "$DRY_RUN" = true ]; then
        upload_args+=("--dry-run")
    fi
    
    log_info "Executing: node $SCRIPT_DIR/upload_to_firebase.js ${upload_args[*]}"
    
    # Run the Firebase upload
    if node "$SCRIPT_DIR/upload_to_firebase.js" "${upload_args[@]}"; then
        log_success "Firebase upload completed successfully"
    else
        log_error "Firebase upload failed"
        exit 1
    fi
}

generate_reports() {
    log_header "Generating Summary Reports"
    
    # Find the latest summary file
    LATEST_SUMMARY=$(find "$DATA_DIR" -name "project_summary_*.md" -type f | sort | tail -1)
    
    if [ -n "$LATEST_SUMMARY" ]; then
        log_info "Latest project summary:"
        echo -e "${CYAN}"
        head -20 "$LATEST_SUMMARY"
        echo -e "${NC}"
        
        # Copy to a standard location for easy access
        cp "$LATEST_SUMMARY" "$PROJECT_DIR/DEVELOPMENT_HISTORY_SUMMARY.md"
        log_success "Summary copied to: DEVELOPMENT_HISTORY_SUMMARY.md"
    else
        log_warning "No summary file found"
    fi
}

validate_data() {
    log_header "Validating Generated Data"
    
    local validation_passed=true
    
    # Check if data files exist
    local required_files=("sessions_*.json" "daily_metrics_*.json")
    
    for pattern in "${required_files[@]}"; do
        if ! ls "$DATA_DIR"/$pattern 1> /dev/null 2>&1; then
            log_error "Missing required data file matching: $pattern"
            validation_passed=false
        else
            local file=$(ls "$DATA_DIR"/$pattern | head -1)
            local size=$(wc -l < "$file")
            log_info "Found $(basename "$file") with $size lines"
        fi
    done
    
    # Validate JSON files
    for json_file in "$DATA_DIR"/*.json; do
        if [ -f "$json_file" ]; then
            if ! node -e "JSON.parse(require('fs').readFileSync('$json_file', 'utf8'))" 2>/dev/null; then
                log_error "Invalid JSON file: $(basename "$json_file")"
                validation_passed=false
            fi
        fi
    done
    
    if [ "$validation_passed" = true ]; then
        log_success "All data validation passed"
    else
        log_error "Data validation failed"
        exit 1
    fi
}

cleanup() {
    log_header "Cleanup"
    
    # Compress old data if not dry run
    if [ "$DRY_RUN" = false ]; then
        cd "$DATA_DIR"
        if [ "$(ls *.json *.md 2>/dev/null | wc -l)" -gt 0 ]; then
            tar -czf "development_history_$TIMESTAMP.tar.gz" *.json *.md 2>/dev/null || true
            log_info "Data compressed to: development_history_$TIMESTAMP.tar.gz"
        fi
    fi
    
    log_success "Cleanup completed"
}

show_final_summary() {
    log_header "🎉 COMPLETE DEVELOPMENT HISTORY SYNC FINISHED"
    
    echo -e "${GREEN}"
    echo "🚀 Process completed successfully!"
    echo ""
    echo "📁 Data Location: $DATA_DIR"
    echo "📊 Summary Report: $PROJECT_DIR/DEVELOPMENT_HISTORY_SUMMARY.md"
    echo ""
    
    if [ "$DRY_RUN" = true ]; then
        echo "🧪 DRY RUN MODE - No changes were made to Firebase"
    fi
    
    if [ "$UPLOAD_TO_FIREBASE" = true ] && [ "$DRY_RUN" = false ]; then
        echo "🔥 Data has been uploaded to Firebase"
        echo "📈 Check your Firebase console for development metrics"
    fi
    
    echo ""
    echo "Next steps:"
    echo "- Review the generated summary report"
    echo "- Check the development tracking dashboard"
    echo "- Verify all metrics are accurately reflected in Firebase"
    echo -e "${NC}"
}

##############################################################################
# Main Execution
##############################################################################

main() {
    log_header "🚀 Assiduous Complete Development History Sync"
    
    echo -e "${CYAN}"
    echo "This script will:"
    echo "1. ✅ Analyze every commit in your git history"
    echo "2. 📊 Calculate development metrics and costs"
    echo "3. 📁 Generate comprehensive data files"
    echo "4. 🔥 Upload to Firebase (if requested)"
    echo "5. 📈 Create summary reports"
    echo ""
    echo "Configuration:"
    echo "  - Dry Run: $DRY_RUN"
    echo "  - Upload to Firebase: $UPLOAD_TO_FIREBASE"
    echo "  - GitHub Token: $([ -n "$GITHUB_TOKEN" ] && echo "Provided" || echo "Not provided")"
    echo "  - Batch Size: $BATCH_SIZE"
    echo -e "${NC}"
    
    # Confirmation prompt (skip in dry run mode)
    if [ "$DRY_RUN" = false ]; then
        echo -n "Do you want to continue? [y/N] "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "Operation cancelled."
            exit 0
        fi
    fi
    
    echo ""
    
    # Execute all steps
    check_prerequisites
    setup_environment
    run_history_analysis
    validate_data
    upload_to_firebase
    generate_reports
    cleanup
    show_final_summary
}

# Execute main function
main "$@"
