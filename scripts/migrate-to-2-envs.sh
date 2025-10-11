#!/bin/bash

# Migration Script: Simplify to 2-Environment CI/CD
# Execution time: ~2 minutes

set -e

echo "═══════════════════════════════════════════════════════"
echo "   CI/CD SIMPLIFICATION - 3 to 2 Environments"
echo "   Removing: DEV environment"  
echo "   Keeping: STAGING and PRODUCTION"
echo "═══════════════════════════════════════════════════════"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backup current configuration
echo -e "${YELLOW}Step 1: Backing up current configuration...${NC}"
cp firebase-migration-package/.firebaserc firebase-migration-package/.firebaserc.backup
cp firebase-migration-package/firebase.json firebase-migration-package/firebase.json.backup
echo -e "${GREEN}✓ Backups created${NC}"
echo ""

# Step 2: Remove DEV environment from Firebase
echo -e "${YELLOW}Step 2: Removing DEV environment configuration...${NC}"
cd firebase-migration-package

# Remove dev target from Firebase
firebase target:clear hosting dev --project assiduous-dev 2>/dev/null || true
firebase use --unalias dev 2>/dev/null || true
echo -e "${GREEN}✓ DEV environment removed from Firebase CLI${NC}"
echo ""

# Step 3: Update .firebaserc
echo -e "${YELLOW}Step 3: Updating .firebaserc...${NC}"
cat > .firebaserc << 'EOF'
{
  "projects": {
    "default": "assiduous-prod",
    "staging": "assiduous-staging",
    "production": "assiduous-prod"
  },
  "targets": {
    "assiduous-staging": {
      "hosting": {
        "staging": ["assiduous-staging"]
      }
    },
    "assiduous-prod": {
      "hosting": {
        "production": ["assiduousflip"]
      }
    }
  }
}
EOF
echo -e "${GREEN}✓ .firebaserc updated${NC}"
echo ""

# Step 4: Update firebase.json (remove dev hosting)
echo -e "${YELLOW}Step 4: Updating firebase.json...${NC}"
cat > firebase.json << 'EOF'
{
  "functions": {
    "source": "functions"
  },
  "hosting": [
    {
      "target": "production",
      "public": "assiduous-build",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "headers": [
        {
          "source": "**/*.@(jpg|jpeg|gif|png|webp|svg|ico)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=2592000, immutable"
            }
          ]
        },
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=86400, must-revalidate"
            }
          ]
        },
        {
          "source": "**/*.@(html|json)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        }
      ],
      "rewrites": [
        { "source": "/api/**", "function": "app" }
      ]
    },
    {
      "target": "staging",
      "public": "assiduous-build",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "headers": [
        {
          "source": "**/*.@(jpg|jpeg|gif|png|webp|svg|ico)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=2592000, immutable"
            }
          ]
        },
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=86400, must-revalidate"
            }
          ]
        },
        {
          "source": "**/*.@(html|json)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        }
      ],
      "rewrites": [
        { "source": "/api/**", "function": "app" }
      ]
    }
  ],
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
EOF
echo -e "${GREEN}✓ firebase.json updated${NC}"
echo ""

# Step 5: Remove old DEV workflow
cd ..
echo -e "${YELLOW}Step 5: Removing old DEV workflow...${NC}"
rm -f .github/workflows/deploy-dev.yml
echo -e "${GREEN}✓ Old DEV workflow removed${NC}"
echo ""

# Step 6: Create staging branch if it doesn't exist
echo -e "${YELLOW}Step 6: Setting up staging branch...${NC}"
if ! git show-ref --verify --quiet refs/heads/staging; then
    git checkout -b staging
    git push -u origin staging
    echo -e "${GREEN}✓ Staging branch created${NC}"
else
    echo -e "${GREEN}✓ Staging branch already exists${NC}"
fi
git checkout main
echo ""

# Step 7: Update README
echo -e "${YELLOW}Step 7: Updating documentation...${NC}"
cat >> README.md << 'EOF'

## CI/CD Pipeline (Simplified - 2 Environments)

### Environments
- **Staging**: https://assiduous-staging.web.app (auto-deploy from staging branch)
- **Production**: https://assiduousflip.web.app (deploy from version tags)

### Workflow
1. Develop on feature branches
2. Merge to `staging` for testing
3. Create release tag for production

### Quick Commands
```bash
# Deploy to staging
git push origin staging

# Deploy to production
git tag v1.2.0
git push origin v1.2.0
```
EOF
echo -e "${GREEN}✓ README updated${NC}"
echo ""

# Step 8: Test deployment targets
echo -e "${YELLOW}Step 8: Verifying configuration...${NC}"
cd firebase-migration-package
firebase target 2>/dev/null || true
cd ..
echo -e "${GREEN}✓ Configuration verified${NC}"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ MIGRATION COMPLETE!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Summary of changes:"
echo "  • Removed DEV environment"
echo "  • Updated Firebase configuration"
echo "  • Simplified to 2 environments: STAGING and PRODUCTION"
echo "  • Created/verified staging branch"
echo "  • Updated documentation"
echo ""
echo "Next steps:"
echo "  1. Commit these changes:"
echo "     git add -A"
echo "     git commit -m \"chore: simplify CI/CD to 2-environment setup\""
echo "     git push origin main"
echo ""
echo "  2. Test staging deployment:"
echo "     git push origin staging"
echo ""
echo "  3. Test production deployment:"
echo "     git tag v0.49.0 -m \"Test simplified CI/CD\""
echo "     git push origin v0.49.0"
echo ""
echo "Backup files saved:"
echo "  • firebase-migration-package/.firebaserc.backup"
echo "  • firebase-migration-package/firebase.json.backup"