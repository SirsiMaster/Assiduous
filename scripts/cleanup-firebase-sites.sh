#!/bin/bash

# Firebase Sites Cleanup Script
# Removes redundant assiduousflip site and simplifies configuration

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Firebase Sites Cleanup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check we're in the right directory
if [ ! -f "firebase-migration-package/assiduous-build/.firebaserc" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

cd firebase-migration-package/assiduous-build

echo -e "${YELLOW}📋 Current Firebase Sites:${NC}"
firebase hosting:sites:list --project assiduous-prod
echo ""

echo -e "${YELLOW}🔍 Pre-Cleanup Checklist:${NC}"
echo ""
echo "The following will be removed:"
echo "  ❌ Firebase site: assiduousflip (assiduousflip.web.app)"
echo "  ❌ Hosting target: assiduousflip from .firebaserc"
echo "  ❌ Hosting config: assiduousflip from firebase.json"
echo ""
echo "The following will be kept:"
echo "  ✅ Firebase site: assiduous-prod (assiduous-prod.web.app)"
echo "  ✅ Custom domain: www.assiduousflip.com → assiduous-prod"
echo "  ✅ All deployment workflows"
echo ""

read -p "⚠️  This action is PERMANENT. Continue? (type 'DELETE' to confirm): " confirm

if [ "$confirm" != "DELETE" ]; then
    echo -e "${YELLOW}❌ Cleanup cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}━━━ Step 1: Backup Current Configuration ━━━${NC}"

# Create backup directory
BACKUP_DIR="../../backups/firebase-cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}✅ Backing up .firebaserc${NC}"
cp .firebaserc "$BACKUP_DIR/.firebaserc.backup"

echo -e "${GREEN}✅ Backing up firebase.json${NC}"
cp firebase.json "$BACKUP_DIR/firebase.json.backup"

echo -e "${GREEN}✅ Backups saved to: $BACKUP_DIR${NC}"
echo ""

echo -e "${BLUE}━━━ Step 2: Update .firebaserc ━━━${NC}"

# Create new .firebaserc without assiduousflip target
cat > .firebaserc << 'EOF_FIREBASERC'
{
  "projects": {
    "staging": "assiduous-staging",
    "production": "assiduous-prod"
  },
  "targets": {
    "assiduous-prod": {
      "hosting": {
        "prod": [
          "assiduous-prod"
        ]
      }
    },
    "assiduous-staging": {
      "hosting": {
        "prod": [
          "assiduous-staging"
        ]
      }
    }
  },
  "etags": {}
}
EOF_FIREBASERC

echo -e "${GREEN}✅ Removed assiduousflip target from .firebaserc${NC}"
echo ""

echo -e "${BLUE}━━━ Step 3: Update firebase.json ━━━${NC}"

# Create new firebase.json with only prod target
cat > firebase.json << 'EOF_FIREBASEJSON'
{
  "functions": {
    "source": "functions"
  },
  "hosting": {
    "target": "prod",
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://accounts.google.com"
          }
        ]
      }
    ],
    "redirects": [
      { "source": "/login.html", "destination": "/index.html", "type": 301 },
      { "source": "/signin.html", "destination": "/index.html", "type": 301 },
      { "source": "/signup.html", "destination": "/index.html", "type": 301 },
      { "source": "/sign-up.html", "destination": "/index.html", "type": 301 },
      { "source": "/sign-in.html", "destination": "/index.html", "type": 301 }
    ],
    "rewrites": [
      { "source": "/api/**", "function": "app" }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true }
  }
}
EOF_FIREBASEJSON

echo -e "${GREEN}✅ Simplified firebase.json to single hosting target${NC}"
echo ""

echo -e "${BLUE}━━━ Step 4: Delete assiduousflip Firebase Site ━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  About to delete assiduousflip site from Firebase...${NC}"
read -p "Final confirmation - type 'YES' to delete the site: " final_confirm

if [ "$final_confirm" != "YES" ]; then
    echo -e "${YELLOW}❌ Site deletion cancelled. Configuration files updated but site not deleted.${NC}"
    echo -e "${YELLOW}📝 You can manually delete the site later in Firebase Console${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🗑️  Deleting assiduousflip site...${NC}"

# Delete the site
firebase hosting:sites:delete assiduousflip --project assiduous-prod --force || {
    echo -e "${RED}❌ Failed to delete site. It may have custom domains attached.${NC}"
    echo -e "${YELLOW}📝 Go to Firebase Console to remove custom domains first:${NC}"
    echo -e "   https://console.firebase.google.com/project/assiduous-prod/hosting/sites"
    exit 1
}

echo -e "${GREEN}✅ assiduousflip site deleted${NC}"
echo ""

echo -e "${BLUE}━━━ Step 5: Verify Cleanup ━━━${NC}"
echo ""
echo -e "${YELLOW}📋 Remaining Firebase Sites:${NC}"
firebase hosting:sites:list --project assiduous-prod
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ CLEANUP COMPLETE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary of changes:"
echo "  ✅ Removed assiduousflip target from .firebaserc"
echo "  ✅ Simplified firebase.json to single hosting config"
echo "  ✅ Deleted redundant assiduousflip Firebase site"
echo "  ✅ Backups saved to: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "  1. Test deployment: firebase deploy --only hosting --project assiduous-prod"
echo "  2. Verify site: https://assiduous-prod.web.app"
echo "  3. Verify custom domain: https://www.assiduousflip.com"
echo "  4. Commit changes to Git"
echo ""
echo "If anything went wrong, restore from backup:"
echo "  cp $BACKUP_DIR/.firebaserc.backup .firebaserc"
echo "  cp $BACKUP_DIR/firebase.json.backup firebase.json"
echo ""
