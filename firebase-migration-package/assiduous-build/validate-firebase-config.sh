#!/bin/bash

# Firebase Configuration Validator
# Ensures only ONE Firebase config exists and it's correct

echo "🔍 Validating Firebase Configuration..."
echo ""

# Check for duplicate config files
echo "📂 Checking for duplicate config files..."
CONFIGS=$(find . -name "*firebase*config*.js" -type f | grep -v node_modules | grep -v ".git")
COUNT=$(echo "$CONFIGS" | grep -v "^$" | wc -l | tr -d ' ')

if [ "$COUNT" -eq 1 ]; then
    echo "✅ Only ONE config file found (correct!)"
    echo "   Location: $(echo "$CONFIGS" | head -1)"
else
    echo "❌ ERROR: Found $COUNT Firebase config files!"
    echo "$CONFIGS"
    echo ""
    echo "⚠️  There should be ONLY ONE: ./firebase-config.js"
    exit 1
fi

echo ""

# Verify it's at the root level
if [ -f "./firebase-config.js" ]; then
    echo "✅ Config is at root level (./firebase-config.js)"
else
    echo "❌ ERROR: firebase-config.js not found at root level!"
    exit 1
fi

echo ""

# Check API keys are present
echo "🔑 Checking API keys..."
PROD_KEY=$(grep -A 10 "production:" ./firebase-config.js | grep "apiKey" | head -1 | cut -d'"' -f2)
STAGING_KEY=$(grep -A 10 "staging:" ./firebase-config.js | grep "apiKey" | head -1 | cut -d'"' -f2)

if [ ! -z "$PROD_KEY" ]; then
    echo "✅ Production API key found: ${PROD_KEY:0:20}..."
else
    echo "❌ ERROR: Production API key missing!"
    exit 1
fi

if [ ! -z "$STAGING_KEY" ]; then
    echo "✅ Staging API key found: ${STAGING_KEY:0:20}..."
else
    echo "❌ ERROR: Staging API key missing!"
    exit 1
fi

echo ""

# Check for hardcoded configs in HTML/JS files (excluding docs)
echo "🔍 Checking for hardcoded configs..."
HARDCODED=$(grep -r "apiKey.*AIzaSy" --include="*.js" --include="*.html" . 2>/dev/null | grep -v ".git" | grep -v "node_modules" | grep -v "docs/" | grep -v "firebase-config.js" | grep -v "validate-firebase-config" | grep -v "REMOVED:" | wc -l | tr -d ' ')

if [ "$HARDCODED" -eq 0 ]; then
    echo "✅ No hardcoded configs found (good!)"
else
    echo "⚠️  Warning: Found $HARDCODED potential hardcoded configs"
    echo "   Review these files:"
    grep -r "apiKey.*AIzaSy" --include="*.js" --include="*.html" . 2>/dev/null | grep -v ".git" | grep -v "node_modules" | grep -v "docs/" | grep -v "firebase-config.js" | grep -v "validate-firebase-config" | grep -v "REMOVED:"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Firebase Configuration Validation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Summary:"
echo "  - Config files: 1 (correct)"
echo "  - Location: ./firebase-config.js"
echo "  - Production key: Set"
echo "  - Staging key: Set"
echo ""
echo "✨ Your Firebase configuration is properly streamlined!"
