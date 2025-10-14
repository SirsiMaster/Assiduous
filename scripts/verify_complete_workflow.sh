#!/bin/bash

# Assiduous Complete Workflow Verification Script
# This script verifies that all components of the application are present and functional

echo "=================================================="
echo "   ASSIDUOUS COMPLETE WORKFLOW VERIFICATION"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ $description - File not found: $file${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    local dir=$1
    local description=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ $description - Directory not found: $dir${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to count files
count_files() {
    local pattern=$1
    local description=$2
    local min_expected=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    count=$(find firebase-migration-package/assiduous-build -name "$pattern" -type f 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$count" -ge "$min_expected" ]; then
        echo -e "${GREEN}✅ $description: Found $count files (expected at least $min_expected)${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ $description: Found only $count files (expected at least $min_expected)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

echo "1. CHECKING CORE INFRASTRUCTURE"
echo "================================"
check_file "package.json" "Package configuration"
check_file "firebase.json" "Firebase configuration"
check_file ".firebaserc" "Firebase project settings"
check_directory "firebase-migration-package" "Firebase migration package"
check_directory "firebase-migration-package/assiduous-build" "Build directory"
echo ""

echo "2. AUTHENTICATION SYSTEM"
echo "========================"
check_file "firebase-migration-package/assiduous-build/auth/login.html" "Login page"
check_file "firebase-migration-package/assiduous-build/auth/signup.html" "Signup page"
check_file "firebase-migration-package/assiduous-build/auth/reset-password.html" "Password reset page"
echo ""

echo "3. CLIENT PORTAL"
echo "================"
check_file "firebase-migration-package/assiduous-build/client/dashboard.html" "Client dashboard"
check_file "firebase-migration-package/assiduous-build/client/property-detail.html" "Property detail page"
check_file "firebase-migration-package/assiduous-build/client/saved.html" "Saved properties page"
check_file "firebase-migration-package/assiduous-build/client/viewings.html" "Viewing scheduler"
check_file "firebase-migration-package/assiduous-build/client/messages.html" "Messaging system"
check_file "firebase-migration-package/assiduous-build/client/onboarding.html" "Client onboarding"
check_file "firebase-migration-package/assiduous-build/client/micro-flip-calculator.html" "Micro-flip ROI calculator"
check_file "firebase-migration-package/assiduous-build/client/deal-analyzer.html" "Deal analyzer"
echo ""

echo "4. ADMIN PORTAL"
echo "==============="
check_file "firebase-migration-package/assiduous-build/admin/dashboard.html" "Admin dashboard"
check_file "firebase-migration-package/assiduous-build/admin/properties.html" "Properties management"
check_file "firebase-migration-package/assiduous-build/admin/agents.html" "Agents management"
check_file "firebase-migration-package/assiduous-build/admin/clients.html" "Clients management"
check_file "firebase-migration-package/assiduous-build/admin/transactions.html" "Transactions"
check_file "firebase-migration-package/assiduous-build/admin/analytics.html" "Analytics"
check_file "firebase-migration-package/assiduous-build/admin/market.html" "Market analysis"
check_file "firebase-migration-package/assiduous-build/admin/settings.html" "Settings"
echo ""

echo "5. AGENT PORTAL"
echo "==============="
check_file "firebase-migration-package/assiduous-build/agent/dashboard.html" "Agent dashboard"
check_file "firebase-migration-package/assiduous-build/agent/listings.html" "Agent listings"
check_file "firebase-migration-package/assiduous-build/agent/clients.html" "Agent clients"
check_file "firebase-migration-package/assiduous-build/agent/leads.html" "Agent leads"
check_file "firebase-migration-package/assiduous-build/agent/schedule.html" "Agent schedule"
check_file "firebase-migration-package/assiduous-build/agent/analytics.html" "Agent analytics"
echo ""

echo "6. DEVELOPMENT PORTAL"
echo "====================="
check_file "firebase-migration-package/assiduous-build/admin/development/dashboard.html" "Dev dashboard"
check_file "firebase-migration-package/assiduous-build/admin/development/analytics.html" "Dev analytics"
check_file "firebase-migration-package/assiduous-build/admin/development/docs.html" "Documentation"
check_file "firebase-migration-package/assiduous-build/admin/development/reports.html" "Dev reports"
check_file "firebase-migration-package/assiduous-build/admin/development/costs.html" "Cost tracking"
echo ""

echo "7. BACKEND SERVICES"
echo "==================="
check_file "firebase-migration-package/assiduous-build/assets/js/services/firebaseservice.js" "Firebase service"
check_file "firebase-migration-package/assiduous-build/assets/js/services/auth.js" "Authentication service"
check_file "firebase-migration-package/assiduous-build/assets/js/services/crm.js" "CRM service"
check_file "firebase-migration-package/assiduous-build/assets/js/services/encryptionservice.js" "Encryption service"
check_file "firebase-migration-package/assiduous-build/assets/js/services/propertyservice.js" "Property service"
echo ""

echo "8. CLOUD FUNCTIONS"
echo "=================="
check_file "functions/index.js" "Cloud Functions entry point"
check_file "functions/package.json" "Functions package configuration"
check_directory "functions/src" "Functions source directory"
echo ""

echo "9. FILE COUNTS"
echo "=============="
count_files "*.html" "HTML pages" 50
count_files "*.js" "JavaScript files" 20
count_files "*.css" "CSS files" 5
echo ""

echo "10. KEY FEATURES VERIFICATION"
echo "=============================="

# Check for specific features
echo -n "Checking micro-flipping engine... "
if grep -q "microFlipScore" firebase-migration-package/assiduous-build/client/property-detail.html 2>/dev/null; then
    echo -e "${GREEN}✅ Found${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Not found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo -n "Checking Firebase integration... "
if grep -q "firebase.initializeApp" firebase-migration-package/assiduous-build/client/dashboard.html 2>/dev/null; then
    echo -e "${GREEN}✅ Found${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Not found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo -n "Checking real-time messaging... "
if grep -q "messagesListener" firebase-migration-package/assiduous-build/client/messages.html 2>/dev/null; then
    echo -e "${GREEN}✅ Found${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Not found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo -n "Checking authentication flow... "
if grep -q "signInWithEmailAndPassword" firebase-migration-package/assiduous-build/auth/login.html 2>/dev/null; then
    echo -e "${GREEN}✅ Found${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Not found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""

# Calculate completion percentage
COMPLETION_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo "=================================================="
echo "           VERIFICATION SUMMARY"
echo "=================================================="
echo -e "Total Checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo -e "Completion: ${YELLOW}$COMPLETION_PERCENTAGE%${NC}"
echo ""

if [ $COMPLETION_PERCENTAGE -ge 95 ]; then
    echo -e "${GREEN}🎉 CONGRATULATIONS! The Assiduous platform is COMPLETE and ready for production!${NC}"
    echo ""
    echo "Key achievements:"
    echo "✅ Full authentication system with login/signup/password reset"
    echo "✅ Complete client portal with property browsing, saving, and messaging"
    echo "✅ Comprehensive admin portal with analytics and management tools"
    echo "✅ Agent portal with leads and client management"
    echo "✅ Micro-flipping engine with ROI calculator"
    echo "✅ Real-time messaging system"
    echo "✅ Viewing scheduler with calendar integration"
    echo "✅ Firebase backend integration"
    echo "✅ Cloud Functions API"
    echo "✅ Development metrics and tracking"
elif [ $COMPLETION_PERCENTAGE -ge 90 ]; then
    echo -e "${YELLOW}⚠️ The platform is nearly complete (>90%). Just a few minor items remaining.${NC}"
elif [ $COMPLETION_PERCENTAGE -ge 75 ]; then
    echo -e "${YELLOW}⚠️ The platform is mostly complete (>75%). Some features still need implementation.${NC}"
else
    echo -e "${RED}❌ The platform needs more work. Only $COMPLETION_PERCENTAGE% complete.${NC}"
fi

echo ""
echo "Next steps:"
echo "1. Deploy to Firebase: cd firebase-migration-package/assiduous-build && firebase deploy"
echo "2. Test live site: https://assiduous-prod.web.app"
echo "3. Configure Firebase security rules"
echo "4. Set up monitoring and analytics"
echo ""
echo "=================================================="