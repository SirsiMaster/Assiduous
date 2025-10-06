# Development Pipeline

**Created**: 2025-10-06  
**Purpose**: Prevent production breaks with controlled environment progression

## Overview

All code changes must flow through these environments before reaching production:

```
DEV → TEST → STAGING → PROD
```

Each environment has its own local server running continuously in the background.

---

## Environment URLs

| Environment | URL | Port | Purpose |
|------------|-----|------|---------|
| **Dev** | http://localhost:8081 | 8081 | Active development, frequent changes |
| **Test** | http://localhost:8082 | 8082 | Testing and validation |
| **Staging** | http://localhost:8083 | 8083 | Final verification before production |
| **Prod** | https://assiduousflip.web.app | N/A | Live production site |

---

## Directory Structure

```
assiduous/
├── environments/
│   ├── dev/          # Development environment
│   ├── test/         # Testing environment
│   └── staging/      # Staging environment
├── firebase-migration-package/
│   └── assiduous-build/  # Production source (deployed to Firebase)
├── scripts/
│   ├── dev-server.sh     # Server management
│   └── promote.sh        # Environment promotion
├── logs/                 # Server logs
│   ├── dev.log
│   ├── test.log
│   └── staging.log
└── .server-pids/         # Server process IDs
```

---

## Server Management

### Start All Servers
```bash
./scripts/dev-server.sh start
```

### Check Status
```bash
./scripts/dev-server.sh status
```

### Stop All Servers
```bash
./scripts/dev-server.sh stop
```

### Restart All Servers
```bash
./scripts/dev-server.sh restart
```

**Note**: Servers run in the background and don't interrupt the console.

---

## Development Workflow

### 1. Make Changes in Dev
```bash
# Edit files in environments/dev/
nano environments/dev/index.html

# View changes immediately at:
open http://localhost:8081
```

### 2. Promote Dev → Test
```bash
./scripts/promote.sh dev-to-test
```
- Shows what will be promoted
- Asks for confirmation
- Backs up test environment
- Copies dev to test

**Then test at**: http://localhost:8082

### 3. Promote Test → Staging
```bash
./scripts/promote.sh test-to-staging
```
- Shows what will be promoted
- Asks for confirmation
- Backs up staging environment
- Copies test to staging

**Then test at**: http://localhost:8083

### 4. Promote Staging → Prod
```bash
./scripts/promote.sh staging-to-prod
```
- Shows what will be promoted
- Asks for confirmation
- Copies staging to firebase-migration-package/assiduous-build/

**Then verify locally before deploying**

### 5. Deploy to Production
```bash
./scripts/promote.sh deploy
```
- Shows pre-deployment checklist
- Requires typing "DEPLOY TO PRODUCTION" to confirm
- Deploys to https://assiduousflip.web.app
- Shows post-deployment verification steps

---

## Approval Gates

Each promotion requires manual approval:

### Dev → Test
- Type `yes` to confirm

### Test → Staging
- Type `yes` to confirm

### Staging → Prod
- Type `yes` to confirm

### Prod → Firebase
- Must type `DEPLOY TO PRODUCTION` (exact text)
- Requires completing checklist:
  - [ ] Tested in staging
  - [ ] Verified all pages load
  - [ ] Landing page has professional content
  - [ ] Screenshots taken

---

## Compare Environments

```bash
# See differences between environments
./scripts/promote.sh diff dev test
./scripts/promote.sh diff test staging
./scripts/promote.sh diff staging prod
```

---

## Safety Features

### 1. Automatic Backups
Before each promotion, the target environment is backed up to:
```
.backups/<env>_<timestamp>/
```

### 2. Diff Preview
Shows exactly what will change before promotion

### 3. Manual Approval
Every promotion requires explicit approval

### 4. Production Safeguard
Requires typing full phrase to deploy to prod

### 5. Post-Deploy Checklist
Reminds you to verify production after deployment

---

## Example: Adding New Feature

```bash
# 1. Make changes
cd environments/dev
nano admin/new-feature.html

# 2. Test locally
open http://localhost:8081/admin/new-feature.html

# 3. Promote to test
cd ../..
./scripts/promote.sh dev-to-test

# 4. Test again
open http://localhost:8082/admin/new-feature.html

# 5. Promote to staging
./scripts/promote.sh test-to-staging

# 6. Final verification
open http://localhost:8083/admin/new-feature.html

# 7. Promote to prod (doesn't deploy yet)
./scripts/promote.sh staging-to-prod

# 8. Deploy to production
./scripts/promote.sh deploy
# (Type "DEPLOY TO PRODUCTION" when prompted)

# 9. Verify production
open -na "Google Chrome" --args --incognito "https://assiduousflip.web.app/admin/new-feature.html"
```

---

## Quick Reference

```bash
# Server commands
./scripts/dev-server.sh start|stop|restart|status

# Promotion commands
./scripts/promote.sh dev-to-test
./scripts/promote.sh test-to-staging
./scripts/promote.sh staging-to-prod
./scripts/promote.sh deploy

# Compare environments
./scripts/promote.sh diff <from> <to>
```

---

## Rollback

If production breaks, rollback by redeploying from firebase-migration-package:

```bash
cd firebase-migration-package
firebase deploy --only hosting
```

This deploys whatever is currently in `assiduous-build/`.

---

## Rules

1. **NEVER edit production directly** - always go through dev → test → staging → prod
2. **NEVER skip environments** - must test in each one
3. **NEVER deploy without staging verification** - always test staging first
4. **ALWAYS check in browser** - automated tests aren't enough
5. **ALWAYS take screenshots** - document before/after for each environment

---

## Troubleshooting

### Servers won't start
```bash
# Check what's using the ports
lsof -i:8081
lsof -i:8082
lsof -i:8083

# Kill stuck processes
./scripts/dev-server.sh stop
./scripts/dev-server.sh start
```

### Can't see changes
```bash
# Hard refresh browser (Cmd+Shift+R)
# Or restart the specific environment server
./scripts/dev-server.sh restart
```

### Promotion failed
```bash
# Check backups
ls -la .backups/

# Restore from backup if needed
cp -R .backups/<env>_<timestamp>/* environments/<env>/
```

---

**Last Updated**: 2025-10-06  
**Next Review**: After first production deployment using this pipeline
