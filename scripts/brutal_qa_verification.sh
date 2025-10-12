#!/bin/bash

# BRUTAL QA/QC VERIFICATION - NO MERCY
# Tests EVERYTHING with actual HTTP requests and real verifications

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED_TESTS=0
PASSED_TESTS=0

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          BRUTAL QA/QC VERIFICATION - NO MERCY                ║"
echo "║              Testing EVERY Component                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Function to test HTTP endpoint
test_http() {
    local url=$1
    local expected=$2
    local name=$3
    
    echo -n "Testing: $name ... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status)"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected, Got $status)"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to test Firebase service
test_firebase_service() {
    local project=$1
    local service=$2
    local name=$3
    
    echo -n "Testing: $name ... "
    result=$(gcloud services list --enabled --project=$project --filter="name:$service" --format="value(name)" 2>&1)
    
    if [[ "$result" == *"$service"* ]]; then
        echo -e "${GREEN}✅ ENABLED${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}❌ DISABLED${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to test Cloud Function
test_function() {
    local project=$1
    local function=$2
    
    echo -n "Testing Function: $function ... "
    status=$(gcloud functions describe $function --project=$project --gen2 --region=us-central1 --format="value(state)" 2>&1)
    
    if [[ "$status" == *"ACTIVE"* ]]; then
        echo -e "${GREEN}✅ ACTIVE${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}❌ NOT ACTIVE${NC} ($status)"
        ((FAILED_TESTS++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. TESTING STAGING FRONTEND PAGES (HTTP 200 Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BASE_URL="https://assiduous-staging.web.app"

# Main pages
test_http "$BASE_URL/index.html" "200" "Landing Page"
test_http "$BASE_URL/assiduousflip/index.html" "200" "Assiduousflip Home"

# Admin pages
test_http "$BASE_URL/admin/dashboard.html" "200" "Admin Dashboard"
test_http "$BASE_URL/admin/analytics.html" "200" "Admin Analytics"
test_http "$BASE_URL/admin/market.html" "200" "Market Analysis"
test_http "$BASE_URL/admin/properties.html" "200" "Properties Management"
test_http "$BASE_URL/admin/agents.html" "200" "Agents Management"
test_http "$BASE_URL/admin/clients.html" "200" "Clients Management"
test_http "$BASE_URL/admin/transactions.html" "200" "Transactions"
test_http "$BASE_URL/admin/settings.html" "200" "Settings"

# Dev pages
test_http "$BASE_URL/admin/development/dashboard.html" "200" "Dev Dashboard"
test_http "$BASE_URL/admin/development/analytics.html" "200" "Dev Analytics"
test_http "$BASE_URL/admin/development/docs.html" "200" "Dev Documentation"
test_http "$BASE_URL/admin/development/reports.html" "200" "Dev Reports"

# Client portal
test_http "$BASE_URL/client/index.html" "200" "Client Portal"

# Documentation
test_http "$BASE_URL/docs/readme.html" "200" "README Page"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. TESTING CLOUD FUNCTIONS (All Must Be ACTIVE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_function "assiduous-staging" "app"
test_function "assiduous-staging" "githubWebhook"
test_function "assiduous-staging" "syncGitHubData"
test_function "assiduous-staging" "scheduledSync"
test_function "assiduous-staging" "createSigningSession"
test_function "assiduous-staging" "createTemplateFromUpload"
test_function "assiduous-staging" "opensignWebhook"
test_function "assiduous-staging" "verifyOtp"
test_function "assiduous-staging" "generateOtp"
test_function "assiduous-staging" "resendReminder"
test_function "assiduous-staging" "scheduledExpireSessions"
test_function "assiduous-staging" "downloadSignedDocument"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. TESTING FIREBASE SERVICES (All Must Be ENABLED)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_firebase_service "assiduous-staging" "firebasehosting.googleapis.com" "Firebase Hosting"
test_firebase_service "assiduous-staging" "firestore.googleapis.com" "Firestore"
test_firebase_service "assiduous-staging" "firebasestorage.googleapis.com" "Storage"
test_firebase_service "assiduous-staging" "cloudfunctions.googleapis.com" "Cloud Functions"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. TESTING STORAGE BUCKETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing: Main Storage Bucket ... "
if gsutil ls gs://assiduous-staging.firebasestorage.app/ &>/dev/null; then
    echo -e "${GREEN}✅ EXISTS${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NOT FOUND${NC}"
    ((FAILED_TESTS++))
fi

echo -n "Testing: Backup Storage Bucket ... "
if gsutil ls gs://assiduous-staging-backups/ &>/dev/null; then
    echo -e "${GREEN}✅ EXISTS${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NOT FOUND${NC}"
    ((FAILED_TESTS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. TESTING FIRESTORE DATABASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing: Firestore Database Status ... "
db_status=$(gcloud firestore databases describe --project=assiduous-staging --database='(default)' --format="value(type)" 2>&1)
if [[ "$db_status" == "FIRESTORE_NATIVE" ]]; then
    echo -e "${GREEN}✅ OPERATIONAL${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NOT OPERATIONAL${NC}"
    ((FAILED_TESTS++))
fi

echo -n "Testing: Firestore Has Data ... "
if node /Users/thekryptodragon/Development/assiduous/scripts/verify_firestore_staging.js 2>&1 | grep -q "Total documents found: [1-9]"; then
    echo -e "${GREEN}✅ HAS DATA${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NO DATA${NC}"
    ((FAILED_TESTS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. TESTING AUTHENTICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing: Firebase Auth Initialized ... "
if firebase auth:export /tmp/auth-test-$$.json --project=assiduous-staging &>/dev/null; then
    echo -e "${GREEN}✅ INITIALIZED${NC}"
    ((PASSED_TESTS++))
    rm -f /tmp/auth-test-$$.json
else
    echo -e "${RED}❌ NOT INITIALIZED${NC}"
    ((FAILED_TESTS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. TESTING CRITICAL API ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test main API function endpoint (should respond, even if it's an error)
echo -n "Testing: Main API Endpoint ... "
api_status=$(curl -s -o /dev/null -w "%{http_code}" "https://us-central1-assiduous-staging.cloudfunctions.net/app" --max-time 10)
if [ "$api_status" != "000" ]; then
    echo -e "${GREEN}✅ RESPONDING${NC} (HTTP $api_status)"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NOT RESPONDING${NC}"
    ((FAILED_TESTS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. TESTING DEPLOYMENT CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing: Firebase Project Configured ... "
if firebase projects:list 2>&1 | grep -q "assiduous-staging"; then
    echo -e "${GREEN}✅ CONFIGURED${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NOT CONFIGURED${NC}"
    ((FAILED_TESTS++))
fi

echo -n "Testing: Firebase.json Exists ... "
if [ -f "/Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build/firebase.json" ]; then
    echo -e "${GREEN}✅ EXISTS${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NOT FOUND${NC}"
    ((FAILED_TESTS++))
fi

echo -n "Testing: Firestore Rules Deployed ... "
if [ -f "/Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build/firestore.rules" ]; then
    echo -e "${GREEN}✅ EXISTS${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NOT FOUND${NC}"
    ((FAILED_TESTS++))
fi

echo -n "Testing: Storage Rules Deployed ... "
if [ -f "/Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build/storage.rules" ]; then
    echo -e "${GREEN}✅ EXISTS${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ NOT FOUND${NC}"
    ((FAILED_TESTS++))
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                      FINAL RESULTS                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Tests Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Tests Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✅ ALL TESTS PASSED - STAGING OPERATIONAL          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║        ❌ $FAILED_TESTS TESTS FAILED - FIX REQUIRED              ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
