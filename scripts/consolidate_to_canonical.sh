#!/bin/bash

# Document Consolidation Script
# Consolidates all non-canonical docs into the 19 canonical documents
# Created: November 2, 2025

set -e

DOCS_DIR="/Users/thekryptodragon/Development/assiduous/docs"
ARCHIVE_DIR="/Users/thekryptodragon/Development/assiduous/docs/.archive_$(date +%Y%m%d)"

echo "🗂️  Document Consolidation Script"
echo "=================================="
echo ""

# Create archive directory
mkdir -p "$ARCHIVE_DIR"
echo "✅ Created archive directory: $ARCHIVE_DIR"
echo ""

# Define the 19 canonical documents
CANONICAL_DOCS=(
    "CHANGELOG.md"
    "REQUIREMENTS_SPECIFICATION.md"
    "PROJECT_SCOPE.md"
    "USER_STORIES.md"
    "PROJECT_MANAGEMENT.md"
    "RISK_MANAGEMENT.md"
    "ARCHITECTURE_DESIGN.md"
    "TECHNICAL_DESIGN.md"
    "DATA_MODEL.md"
    "API_SPECIFICATION.md"
    "DEPLOYMENT_GUIDE.md"
    "TEST_PLAN.md"
    "QA_PLAN.md"
    "SECURITY_COMPLIANCE.md"
    "MAINTENANCE_SUPPORT.md"
    "CHANGE_MANAGEMENT.md"
    "COMMUNICATION_PLAN.md"
    "TRAINING_DOCUMENTATION.md"
    "POST_IMPLEMENTATION_REVIEW.md"
)

echo "📚 The 19 Canonical Documents:"
for doc in "${CANONICAL_DOCS[@]}"; do
    echo "  - $doc"
done
echo ""

# Function to append document with header
append_doc() {
    local source=$1
    local target=$2
    local section_title=$3
    
    if [ -f "$DOCS_DIR/$source" ]; then
        echo "---" >> "$DOCS_DIR/$target"
        echo "" >> "$DOCS_DIR/$target"
        echo "# $section_title" >> "$DOCS_DIR/$target"
        echo "**Consolidated From:** $source" >> "$DOCS_DIR/$target"
        echo "**Date Merged:** $(date +%Y-%m-%d)" >> "$DOCS_DIR/$target"
        echo "" >> "$DOCS_DIR/$target"
        cat "$DOCS_DIR/$source" >> "$DOCS_DIR/$target"
        echo "" >> "$DOCS_DIR/$target"
        
        # Move to archive
        mv "$DOCS_DIR/$source" "$ARCHIVE_DIR/"
        echo "  ✅ Merged $source → $target"
    fi
}

# Consolidation Plan

echo "📦 Starting consolidation..."
echo ""

# 1. POST_IMPLEMENTATION_REVIEW.md consolidations
echo "1️⃣  Consolidating into POST_IMPLEMENTATION_REVIEW.md..."
append_doc "PROJECT_STATUS_REALTIME_COMPLETE.md" "POST_IMPLEMENTATION_REVIEW.md" "MILESTONE: Real-Time Firebase Integration Complete (Nov 2, 2025)"
append_doc "SESSION_CHECKPOINT_2025-11-02.md" "POST_IMPLEMENTATION_REVIEW.md" "Session Checkpoint - November 2, 2025"
append_doc "SESSION_FINAL_SUMMARY_2025-11-02.md" "POST_IMPLEMENTATION_REVIEW.md" "Session Final Summary - November 2, 2025"
append_doc "DAY3_AUTH_IMPLEMENTATION.md" "POST_IMPLEMENTATION_REVIEW.md" "Day 3: Authentication Implementation"
append_doc "DAY4_IMPLEMENTATION_PLAN.md" "POST_IMPLEMENTATION_REVIEW.md" "Day 4: Implementation Plan"
append_doc "DAY4_COMPLETION_SUMMARY.md" "POST_IMPLEMENTATION_REVIEW.md" "Day 4: Completion Summary"
append_doc "COMPLETION_REPORT_20251101.md" "POST_IMPLEMENTATION_REVIEW.md" "Completion Report - November 1, 2025"
append_doc "STEP12_COMPLETE.md" "POST_IMPLEMENTATION_REVIEW.md" "Step 12: Authentication Testing Complete"
append_doc "step12_auth_testing_report.md" "POST_IMPLEMENTATION_REVIEW.md" "Step 12: Auth Testing Report"
append_doc "step12_issues_and_fixes.md" "POST_IMPLEMENTATION_REVIEW.md" "Step 12: Issues and Fixes"
append_doc "step12_final_status.md" "POST_IMPLEMENTATION_REVIEW.md" "Step 12: Final Status"
append_doc "FIREBASE_USERS_COMPLETE.md" "POST_IMPLEMENTATION_REVIEW.md" "Firebase Users Collection Complete"
append_doc "PARITY_PROGRESS_REPORT.md" "POST_IMPLEMENTATION_REVIEW.md" "Infrastructure Parity Progress Report"
append_doc "QA_VALIDATION_REPORT_DAY3.md" "POST_IMPLEMENTATION_REVIEW.md" "QA Validation Report - Day 3"
append_doc "INFRASTRUCTURE_PARITY_AUDIT.md" "POST_IMPLEMENTATION_REVIEW.md" "Infrastructure Parity Audit"
echo ""

# 2. TECHNICAL_DESIGN.md consolidations
echo "2️⃣  Consolidating into TECHNICAL_DESIGN.md..."
append_doc "ANALYTICS_INTEGRATION.md" "TECHNICAL_DESIGN.md" "Analytics Implementation - Real-Time Dashboard"
append_doc "AUTOMATED_METRICS_GUIDE.md" "TECHNICAL_DESIGN.md" "Automated Metrics Pipeline"
append_doc "METRICS_PIPELINE.md" "TECHNICAL_DESIGN.md" "Development Metrics Pipeline"
append_doc "IMAGE_UPLOAD_INTEGRATION.md" "TECHNICAL_DESIGN.md" "Image Upload Integration Guide"
append_doc "STRIPE_QUICK_START.md" "TECHNICAL_DESIGN.md" "Stripe Payment Integration - Quick Start"
append_doc "STRIPE_SETUP.md" "TECHNICAL_DESIGN.md" "Stripe Setup Guide"
echo ""

# 3. SECURITY_COMPLIANCE.md consolidations
echo "3️⃣  Consolidating into SECURITY_COMPLIANCE.md..."
append_doc "RBAC_UI_ENFORCEMENT.md" "SECURITY_COMPLIANCE.md" "Role-Based Access Control - UI Enforcement"
append_doc "SECURITY_PASSWORDS.md" "SECURITY_COMPLIANCE.md" "Password Management and Security"
echo ""

# 4. CHANGE_MANAGEMENT.md consolidations
echo "4️⃣  Consolidating into CHANGE_MANAGEMENT.md..."
append_doc "COMPAT_SDK_REMEDIATION.md" "CHANGE_MANAGEMENT.md" "Firebase Compat SDK Remediation"
append_doc "CONFLICT_RESOLUTION_PLAN.md" "CHANGE_MANAGEMENT.md" "Conflict Resolution Procedures"
echo ""

# 5. TRAINING_DOCUMENTATION.md consolidations
echo "5️⃣  Consolidating into TRAINING_DOCUMENTATION.md..."
append_doc "FEATURE_DEVELOPMENT_PROCESS.md" "TRAINING_DOCUMENTATION.md" "Feature Development Process"
echo ""

# 6. DEPLOYMENT_GUIDE.md consolidations
echo "6️⃣  Consolidating into DEPLOYMENT_GUIDE.md..."
append_doc "STAGING_ENVIRONMENT_SETUP.md" "DEPLOYMENT_GUIDE.md" "Staging Environment Setup"
append_doc "SETUP_FULL_AUTOMATION.md" "DEPLOYMENT_GUIDE.md" "Full Automation Setup Guide"
echo ""

# 7. PROJECT_MANAGEMENT.md - consolidate ops folder
echo "7️⃣  Consolidating ops/ reports..."
if [ -d "$DOCS_DIR/ops" ]; then
    for ops_file in "$DOCS_DIR/ops"/*.md; do
        if [ -f "$ops_file" ]; then
            filename=$(basename "$ops_file")
            append_doc "ops/$filename" "PROJECT_MANAGEMENT.md" "Operations Report: $filename"
        fi
    done
fi
echo ""

# 8. Delete template and mapping docs (no longer needed)
echo "8️⃣  Archiving meta-documents..."
[ -f "$DOCS_DIR/DOCUMENT_TEMPLATE.md" ] && mv "$DOCS_DIR/DOCUMENT_TEMPLATE.md" "$ARCHIVE_DIR/" && echo "  ✅ Archived DOCUMENT_TEMPLATE.md"
[ -f "$DOCS_DIR/CONSOLIDATION_MAPPING.md" ] && mv "$DOCS_DIR/CONSOLIDATION_MAPPING.md" "$ARCHIVE_DIR/" && echo "  ✅ Archived CONSOLIDATION_MAPPING.md"
[ -f "$DOCS_DIR/ASSIDUOUSFLIP_BRANDING_AND_AUTH_PLAN.md" ] && mv "$DOCS_DIR/ASSIDUOUSFLIP_BRANDING_AND_AUTH_PLAN.md" "$ARCHIVE_DIR/" && echo "  ✅ Archived ASSIDUOUSFLIP_BRANDING_AND_AUTH_PLAN.md"
echo ""

# 9. Archive any remaining non-canonical docs
echo "9️⃣  Archiving remaining non-canonical documents..."
for file in "$DOCS_DIR"/*.md; do
    filename=$(basename "$file")
    is_canonical=false
    
    for canonical in "${CANONICAL_DOCS[@]}"; do
        if [ "$filename" == "$canonical" ]; then
            is_canonical=true
            break
        fi
    done
    
    if [ "$is_canonical" = false ] && [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo "  📦 Archived: $filename"
    fi
done
echo ""

# 10. Update header on all canonical docs
echo "🔟  Updating canonical document headers..."
for doc in "${CANONICAL_DOCS[@]}"; do
    if [ -f "$DOCS_DIR/$doc" ]; then
        # Create temp file with consolidation note
        {
            echo "# $(basename "$doc" .md | tr '_' ' ' | tr '[:lower:]' '[:upper:]')"
            echo "**Version:** 2.0.0-canonical"
            echo "**Last Updated:** $(date +%Y-%m-%d)"
            echo "**Status:** Canonical Document (1 of 19)"
            echo "**Consolidation Date:** November 2, 2025"
            echo ""
            echo "---"
            echo ""
            tail -n +2 "$DOCS_DIR/$doc"
        } > "$DOCS_DIR/${doc}.tmp"
        
        mv "$DOCS_DIR/${doc}.tmp" "$DOCS_DIR/$doc"
        echo "  ✅ Updated: $doc"
    fi
done
echo ""

# Summary
echo "✅ CONSOLIDATION COMPLETE!"
echo ""
echo "📊 Summary:"
echo "  - 19 canonical documents preserved"
echo "  - Non-canonical docs merged and archived"
echo "  - Archive location: $ARCHIVE_DIR"
echo ""
echo "📁 Canonical documents in docs/:"
ls -1 "$DOCS_DIR"/*.md 2>/dev/null || echo "  (none found)"
echo ""
echo "📦 Archived documents:"
ls -1 "$ARCHIVE_DIR" | wc -l | xargs echo "  Total archived:"
echo ""
echo "🎯 Next steps:"
echo "  1. Review the canonical documents"
echo "  2. Update README.md with new version (2.0.0-canonical)"
echo "  3. Commit changes to git"
echo "  4. Deploy to production"
echo ""
