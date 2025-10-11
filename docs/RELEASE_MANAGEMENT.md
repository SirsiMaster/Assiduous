# Release Management Guide

## Release in 3 Minutes

```bash
# 1. Ensure staging is tested (https://assiduous-staging.web.app)
# 2. Create and push tag
git tag -a v1.2.0 -m "Release: Feature Name"
git push origin v1.2.0
# 3. Automatic production deployment triggered
# 4. Monitor: https://assiduousflip.com (or assiduousflip.web.app)
```

## Release Types

### Standard Release (Weekly)
- **When**: Every Friday at 2 PM EST
- **What**: All tested features from staging
- **Who**: Lead developer creates tag
- **Version**: Minor bump (v1.X.0)

### Hotfix Release (As Needed)
- **When**: Critical bug in production
- **What**: Minimal fix only
- **Who**: Any developer with approval
- **Version**: Patch bump (v1.2.X)

### Major Release (Monthly)
- **When**: First Friday of month
- **What**: Breaking changes, major features
- **Who**: Team lead with stakeholder approval
- **Version**: Major bump (vX.0.0)

## Pre-Release Checklist (5 minutes)

```markdown
## Release v1.2.0 Checklist
- [ ] All PR reviews complete
- [ ] Staging tested for 24+ hours
- [ ] No critical bugs in staging
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Stakeholders notified
- [ ] Rollback plan ready
```

## Release Process

### 1. Prepare Release (2 minutes)

```bash
# Update CHANGELOG
echo "## [1.2.0] - $(date +%Y-%m-%d)

### Added
- Payment integration
- Email notifications

### Fixed
- Cart calculation bug
- Mobile responsive issues

### Changed
- Improved checkout flow" >> CHANGELOG.md

git add CHANGELOG.md
git commit -m "chore: update CHANGELOG for v1.2.0"
git push origin main
```

### 2. Create Release (1 minute)

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release v1.2.0

Features:
- Payment integration with Stripe
- Automated email notifications
- Improved checkout UX

Bug Fixes:
- Fixed cart calculation errors
- Resolved mobile display issues

Testing:
- Tested on staging for 48 hours
- All automated tests passing
- Manual QA completed"

# Push tag to trigger deployment
git push origin v1.2.0
```

### 3. Monitor Deployment (5 minutes)

```bash
# Watch GitHub Actions
gh run watch

# Monitor production
curl -I https://assiduousflip.web.app

# Check for errors
firebase functions:log --project assiduous-prod
```

## Version Numbering

### Semantic Versioning: MAJOR.MINOR.PATCH

| Version | When to Use | Example |
|---------|-------------|---------|
| MAJOR (2.0.0) | Breaking API changes | Database migration |
| MINOR (1.2.0) | New features | Add payment system |
| PATCH (1.1.1) | Bug fixes | Fix login error |

### Version Examples
```bash
v1.0.0  # Initial release
v1.1.0  # Add user profiles
v1.1.1  # Fix profile photo upload
v1.2.0  # Add payment integration
v2.0.0  # New architecture
```

## Release Notes Template

```markdown
# Release v1.2.0 - Payment Integration

**Release Date**: October 11, 2025
**Environment**: Production
**Risk Level**: Medium

## What's New
- 💳 Stripe payment integration
- 📧 Automated email notifications
- 🎨 Improved checkout UI

## Bug Fixes
- Fixed cart calculation errors (#123)
- Resolved mobile responsive issues (#124)

## Breaking Changes
None

## Migration Guide
No action required

## Known Issues
- Email may be delayed 1-2 minutes on first send

## Rollback Plan
```bash
firebase hosting:rollback --project assiduous-prod
```
```

## Rollback Procedures

### Immediate Rollback (30 seconds)
```bash
# Firebase instant rollback
firebase hosting:rollback --project assiduous-prod
```

### Version Rollback (2 minutes)
```bash
# Checkout previous version
git checkout tags/v1.1.9

# Deploy specific version
cd firebase-migration-package
firebase deploy --only hosting:production --project assiduous-prod
```

### Data Rollback
```bash
# Restore Firestore backup (if needed)
gcloud firestore import gs://assiduous-backups/2025-10-11

# Restore specific collections
firebase firestore:delete --project assiduous-prod --recursive users
firebase firestore:import backup.json --project assiduous-prod
```

## Post-Release Tasks

### Immediate (First 15 minutes)
- [ ] Verify site loads (HTTP 200)
- [ ] Test critical user paths
- [ ] Check error logs
- [ ] Monitor performance

### First Hour
- [ ] Review user feedback
- [ ] Check analytics for anomalies
- [ ] Verify all features working
- [ ] Update status page

### First Day
- [ ] Analyze metrics vs previous version
- [ ] Document any issues found
- [ ] Plan fixes for next release
- [ ] Thank the team!

## Emergency Contacts

| Role | Name | Contact | When to Contact |
|------|------|---------|----------------|
| Lead Dev | You | Primary | Any technical issues |
| Product Owner | TBD | Backup | Major failures |
| DevOps | Firebase Support | Last Resort | Infrastructure issues |

## Automation Scripts

### Auto-Release Script
```bash
#!/bin/bash
# save as: scripts/release.sh

VERSION=$1
MESSAGE=$2

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh v1.2.0 'Feature description'"
  exit 1
fi

echo "🚀 Creating release $VERSION..."

# Update CHANGELOG
echo "## [$VERSION] - $(date +%Y-%m-%d)" >> CHANGELOG.md
echo "$MESSAGE" >> CHANGELOG.md
git add CHANGELOG.md
git commit -m "chore: prepare release $VERSION"

# Create tag
git tag -a $VERSION -m "Release $VERSION: $MESSAGE"

# Push everything
git push origin main
git push origin $VERSION

echo "✅ Release $VERSION created and deployed!"
```

## Release Calendar

| Week | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 1 | Feature Dev | Feature Dev | Testing | Testing | **RELEASE** |
| 2 | Feature Dev | Feature Dev | Testing | Testing | **RELEASE** |
| 3 | Feature Dev | Feature Dev | Testing | Testing | **RELEASE** |
| 4 | Feature Dev | Feature Dev | Testing | Testing | **MAJOR RELEASE** |

## Success Metrics

Track these after each release:
- Deployment time: < 5 minutes
- Rollback time: < 1 minute
- Error rate: < 0.1%
- User complaints: 0
- Uptime: 99.9%