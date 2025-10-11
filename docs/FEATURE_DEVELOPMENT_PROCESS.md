# Feature Development Process

## Quick Start (5 minutes)

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Develop locally
npm run dev

# 3. Push to staging
git push origin feature/your-feature-name
gh pr create --base staging --title "Feature: Your Feature"

# 4. After testing, release to production
gh pr create --base main --title "Release: Your Feature v1.x.x"
git tag v1.x.x
git push origin v1.x.x
```

## Detailed Workflow

### 1. Start New Feature (2 minutes)

```bash
# Always start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/payment-integration

# Feature branch naming:
# - feature/name - New features
# - fix/name - Bug fixes  
# - hotfix/name - Critical production fixes
```

### 2. Local Development (X hours)

```bash
# Start local development server
cd firebase-migration-package
npm run dev

# Use Firebase emulators for backend
firebase emulators:start

# Make changes and test locally
# Commit frequently with clear messages
git add .
git commit -m "feat: add payment form validation"
```

### 3. Deploy to Staging (5 minutes)

```bash
# Push feature branch
git push origin feature/payment-integration

# Create PR to staging branch
gh pr create \
  --base staging \
  --title "Feature: Payment Integration" \
  --body "## Changes
- Added Stripe payment form
- Integrated with Firebase Functions
- Added payment confirmation email

## Testing
- [ ] Payment flow works
- [ ] Emails send correctly
- [ ] Error handling works"

# Merge PR (can be done in GitHub UI)
gh pr merge --merge

# Automatic deployment to staging happens
# Test at: https://assiduous-staging.web.app
```

### 4. Production Release (5 minutes)

```bash
# After staging tests pass, create release PR
gh pr create \
  --base main \
  --title "Release: Payment Integration v1.2.0" \
  --body "## Release v1.2.0

### Features
- Payment integration with Stripe
- Email notifications
- Payment history dashboard

### Testing
✅ Tested on staging
✅ All tests passing
✅ No known issues"

# Merge to main
gh pr merge --merge

# Create release tag
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0: Payment Integration"
git push origin v1.2.0

# Automatic deployment to production happens
# Live at: https://assiduous-prod.web.app
```

## Emergency Hotfix Process (10 minutes)

```bash
# For critical production bugs

# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/payment-bug

# 2. Fix the issue
# Make minimal changes only

# 3. Test locally
npm run dev

# 4. Deploy to staging first (even for hotfix)
git push origin hotfix/payment-bug
gh pr create --base staging --title "HOTFIX: Payment Bug"
gh pr merge --merge

# 5. Quick test on staging
# https://assiduous-staging.web.app

# 6. Deploy to production
gh pr create --base main --title "HOTFIX: Payment Bug v1.2.1"
gh pr merge --merge
git tag -a v1.2.1 -m "Hotfix v1.2.1: Payment bug"
git push origin v1.2.1
```

## Branch Management

### Active Branches
- `main` - Production code (protected)
- `staging` - Integration testing
- `feature/*` - Active features
- `hotfix/*` - Emergency fixes

### Branch Lifecycle
1. Feature branches created from main
2. Merged to staging for testing
3. Merged to main for production
4. Deleted after merge

### Cleanup Old Branches
```bash
# Delete local merged branches
git branch --merged | grep -v "\*\|main\|staging" | xargs -n 1 git branch -d

# Delete remote merged branches
git remote prune origin
```

## Commit Message Convention

```
feat: add payment integration
fix: resolve cart calculation error
docs: update API documentation
style: format code with prettier
refactor: simplify auth logic
test: add payment tests
chore: update dependencies
```

## Version Numbering

- **MAJOR (v2.0.0)**: Breaking changes
- **MINOR (v1.2.0)**: New features
- **PATCH (v1.2.1)**: Bug fixes

## Rollback Procedure

```bash
# If production deployment fails

# Option 1: Quick rollback in Firebase
firebase hosting:rollback --project assiduous-prod

# Option 2: Deploy previous tag
git checkout v1.1.9  # Previous version
cd firebase-migration-package
firebase deploy --only hosting:production --project assiduous-prod
```

## FAQ

**Q: How often should I merge to staging?**
A: As soon as a feature is ready for testing. Multiple features can be on staging simultaneously.

**Q: When to deploy to production?**
A: When staging tests pass and stakeholders approve. Usually daily or weekly releases.

**Q: Can I skip staging?**
A: Only for critical hotfixes, and even then, test on staging first if possible.

**Q: How to handle conflicts?**
A: Always pull latest staging/main before creating PRs. Resolve conflicts locally.

**Q: What if staging breaks?**
A: Fix forward quickly or revert the breaking commit. Staging can be unstable temporarily.