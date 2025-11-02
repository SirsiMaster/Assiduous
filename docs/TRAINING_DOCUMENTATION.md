# TRAINING DOCUMENTATION
**Version:** 2.0.0-canonical
**Last Updated:** 2025-11-02
**Status:** Canonical Document (1 of 19)
**Consolidation Date:** November 2, 2025

---

## Training Materials and User Guides

**Document Type:** Training Documentation  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Training Document
**Consolidation Note:** Merged from CLAUDE.md and user guides

---



---
# GitHub Contributing Guide
---

# CLAUDE.md

This file provides mandatory development rules for Claude AI when working with this repository.

**CRITICAL: These rules are synchronized with WARP.md and must remain identical.**

---

## 🚨 ABSOLUTE DEVELOPMENT RULES (NEVER VIOLATE)

### **RULE 0: CHECK SIRSIMASTER COMPONENT LIBRARY FIRST**
**Before creating ANY UI component, utility, or shared functionality:**
- **ALWAYS** check the SirsiMaster Component Library at `/Users/thekryptodragon/Development/sirsimaster-component-library`
- **USE** existing library components instead of creating new ones
- **REFERENCE** the library's WARP.md for component usage guidelines
- **CONTRIBUTE** new generic components to the library, not this project
- **Library GitHub**: https://github.com/SirsiMaster/sirsimaster-component-library

### **RULE 1: ALWAYS CHECK EXISTING DOCUMENTATION FIRST**
**Before starting ANY task, you MUST:**
- Read and understand ALL existing project documentation
- Verify what functionality already exists and is working
- Check against established project plans and architecture
- Ensure you're not duplicating work or breaking existing functionality
- Review similar implementations that already exist in the project
- **NEVER modify or break existing working files without explicit instruction**
- **NEVER recreate or simplify existing code**
- **ALWAYS build on top of existing UI/content**

### **RULE 2: MANDATORY COMPLETION VERIFICATION**
**Before reporting ANY task as complete, you MUST:**
- Run the completion verification script: `./scripts/verify_completion.sh`
- Test all functionality you claim to have implemented
- Verify that claimed changes actually exist in the files
- Confirm that all components/pages work as specified
- Check that nothing existing was broken by your changes
- **NEVER report completion without running verification**

### **RULE 3: VALIDATE GROUND TRUTH**
**After completing ANY development work, you MUST:**
- Test all implemented functionality against the project requirements
- Update development documentation to reflect current reality
- Ensure analytics and dashboards show accurate current status
- Report the true development status, not assumptions
- Validate that the project state matches what you report
- **The documentation and dashboards must reflect ground truth, always**

### **RULE 4: MANDATORY HARSH QA/QC ASSESSMENT BEFORE COMPLETION CLAIMS**
**Before claiming ANY feature/task is complete, you MUST perform this severe assessment:**

#### **A. Browser-Based End-to-End Testing (CRITICAL)**
1. **NEVER claim completion without actual browser testing**
2. **Open every page in a real browser** (not just HTTP status checks)
3. **Open browser DevTools Console** and check for JavaScript errors
4. **Click through EVERY user flow** from start to finish
5. **Test on mobile device or responsive view**
6. **Verify data actually loads** (not just loading spinners)
7. **Check that all buttons and links work**
8. **Confirm all API calls succeed** (check Network tab)

#### **B. Method/Function Verification**
1. **Verify ALL called methods exist** before using them
2. **Verify ALL imports are correct** and files exist at specified paths
3. **Check ALL event handlers** are properly bound
4. **Validate ALL data transformations** work with real data

#### **C. Complete User Workflow Validation**
For EVERY user role (client, agent, admin), verify:
1. User can access their dashboard - loads without errors
2. User can view list pages - data displays correctly
3. User can view detail pages - all fields populate
4. User can perform CRUD operations - create, read, update, delete all work
5. User can navigate between pages - all links work
6. User workflows are end-to-end complete

#### **D. Critical Self-Assessment Questions**
Before claiming completion, answer these questions HONESTLY:

1. ❓ **Did I test this in an actual browser?** - If NO → NOT COMPLETE
2. ❓ **Did I check the browser console for errors?** - If NO → NOT COMPLETE
3. ❓ **Did I click through the entire user workflow?** - If NO → NOT COMPLETE
4. ❓ **Did I verify all methods/functions exist?** - If NO → NOT COMPLETE
5. ❓ **Can a real user actually accomplish the intended task?** - If NO or UNSURE → NOT COMPLETE
6. ❓ **Would this work if deployed to production right now?** - If NO or UNSURE → NOT COMPLETE
7. ❓ **Have I verified backend AND frontend work together?** - If NO → NOT COMPLETE
8. ❓ **Are there any assumptions I haven't verified?** - If YES → NOT COMPLETE until verified

#### **E. Completion Criteria Checklist**
A task is ONLY complete when ALL of these are TRUE:

- [ ] ✅ All code written and committed
- [ ] ✅ All files deployed to appropriate environment
- [ ] ✅ Tested in actual browser with DevTools open
- [ ] ✅ Zero JavaScript console errors
- [ ] ✅ All user workflows tested end-to-end
- [ ] ✅ All methods/functions verified to exist
- [ ] ✅ All API calls return expected data
- [ ] ✅ All database operations work correctly
- [ ] ✅ All UI elements visible and functional
- [ ] ✅ All navigation links work correctly
- [ ] ✅ Can confidently demo to stakeholder right now
- [ ] ✅ Would recommend deploying to real users

---

### **RULE 5: MANDATORY DEVELOPMENT PIPELINE (NEVER SKIP)**
**ALL code changes MUST flow through this pipeline. NO EXCEPTIONS.**

#### **A. Pipeline Flow (STRICT ORDER)**
```
DEV → TEST → STAGING → GITHUB → FIREBASE PRODUCTION
```

**Each stage is a mandatory checkpoint. You CANNOT skip stages.**

#### **B. Environment Specifications**

| Environment | Port | Directory | Purpose | Server URL |
|-------------|------|-----------|---------|------------|
| **DEV** | 8081 | `environments/dev/` | Active development, frequent changes | http://localhost:8081 |
| **TEST** | 8082 | `environments/test/` | Testing and validation | http://localhost:8082 |
| **STAGING** | 8083 | `environments/staging/` | Final verification before production | http://localhost:8083 |
| **PROD** | N/A | `public/` | Live production site | https://assiduous-prod.web.app |

#### **C. Development Workflow (MANDATORY STEPS)**

**Step 1: DEV Environment**
1. Make ALL changes in `environments/dev/` directory ONLY
2. Start dev server: `./scripts/dev-server.sh start`
3. Test changes at http://localhost:8081
4. Run RULE 4 QA/QC assessment (full browser testing)
5. Fix ALL bugs found
6. Document changes

**Step 2: Promote DEV → TEST**
1. Run: `./scripts/promote.sh dev-to-test`
2. Review changes to be promoted
3. Type `yes` to confirm
4. Test at http://localhost:8082
5. Run RULE 4 QA/QC assessment again
6. Verify no regressions

**Step 3: Promote TEST → STAGING**
1. Run: `./scripts/promote.sh test-to-staging`
2. Review changes
3. Type `yes` to confirm
4. Test at http://localhost:8083
5. Run RULE 4 QA/QC final assessment
6. Verify production-ready

**Step 4: Promote STAGING → PROD**
1. Run: `./scripts/promote.sh staging-to-prod`
2. Review changes
3. Type `yes` to confirm
4. Changes copied to `public/`
5. Commit to GitHub: `git add . && git commit -m "..." && git push`

**Step 5: Deploy PROD → Firebase**
1. Run: `./scripts/promote.sh deploy`
2. Complete pre-deployment checklist
3. Type `DEPLOY TO PRODUCTION` (exact text)
4. Firebase deploys automatically
5. Verify at https://assiduous-prod.web.app
6. Run post-deployment smoke tests

#### **D. Pipeline Rules (ABSOLUTE)**

**NEVER:**
- ❌ Edit files directly in `test/`, `staging/`, or `assiduous-build/`
- ❌ Skip environments (DEV → PROD is FORBIDDEN)
- ❌ Deploy without testing in all environments
- ❌ Promote with known bugs
- ❌ Deploy without Git commit
- ❌ Make changes directly in production
- ❌ Bypass approval gates
- ❌ Create a `public/` directory (unauthorized architecture change)
- ❌ Recreate existing files from scratch
- ❌ Simplify or remove existing functionality

**ALWAYS:**
- ✅ Start in DEV environment
- ✅ Test in each environment before promoting
- ✅ Run QA/QC at each stage
- ✅ Document what changed
- ✅ Get approval before promoting
- ✅ Commit to GitHub before Firebase deploy
- ✅ Verify deployment succeeded
- ✅ Build on existing UI/content/structure
- ✅ Preserve all existing functionality

#### **E. Validation Requirements Per Stage**

**DEV Stage Validation:**
- ✅ Code compiles/runs without errors
- ✅ All new features work as expected
- ✅ No console errors in browser DevTools
- ✅ All links and navigation work
- ✅ Mobile responsive design works
- ✅ Builds on existing structure (no recreations)

**TEST Stage Validation:**
- ✅ All DEV features still work
- ✅ No regressions in existing features
- ✅ Integration with existing code works
- ✅ API calls succeed
- ✅ Data persists correctly

**STAGING Stage Validation:**
- ✅ Production-ready quality
- ✅ All user workflows complete end-to-end
- ✅ Performance acceptable (page load < 3s)
- ✅ No known bugs
- ✅ Ready to show stakeholders

**PROD Stage Validation:**
- ✅ Deployed successfully to Firebase
- ✅ All pages accessible at production URL
- ✅ All functionality works in production
- ✅ No errors in production logs
- ✅ Analytics tracking works

#### **F. Server Management Commands**

```bash
# Start all servers
./scripts/dev-server.sh start

# Check server status
./scripts/dev-server.sh status

# Stop all servers
./scripts/dev-server.sh stop

# Restart servers
./scripts/dev-server.sh restart
```

#### **G. GitHub as Source of Truth**

**CRITICAL: GitHub is the single source of truth**

- All code in `environments/dev/` is work-in-progress
- All code in `public/` is committed to GitHub
- GitHub main branch = what's in production
- Never deploy to Firebase without pushing to GitHub first

**Deployment flow:**
```
DEV → TEST → STAGING → assiduous-build → GitHub → Firebase
```

---

## 📋 DEVELOPMENT BEST PRACTICES

### **When Making Changes:**
1. **Read existing code first** - understand what's already there
2. **Build incrementally** - add to existing structure, don't replace
3. **Preserve existing patterns** - follow established conventions
4. **Test frequently** - don't write large amounts of untested code
5. **Document as you go** - update docs when changing functionality

### **When Creating New Features:**
1. **Check if similar feature exists** - learn from existing implementations
2. **Use existing components** - especially from SirsiMaster Component Library
3. **Follow existing UI patterns** - maintain consistency
4. **Use existing services** - don't duplicate API calls or data handling
5. **Add to existing pages** - don't create parallel structures

### **When Fixing Bugs:**
1. **Understand the root cause** - don't just patch symptoms
2. **Test the fix thoroughly** - ensure it actually resolves the issue
3. **Check for regressions** - make sure fix doesn't break other things
4. **Update tests if applicable** - prevent regression in future
5. **Document the fix** - explain what was wrong and how it's fixed

### **When Working with UI:**
1. **Never use emojis as icons** - use proper SVG icons
2. **Never use inline styles** - use CSS classes and variables
3. **Always use existing CSS variables** - maintain design consistency
4. **Always test mobile responsive** - ensure works on all screen sizes
5. **Always check browser console** - verify no JavaScript errors

---

## 🎯 HONESTY AND TRANSPARENCY

### **When Reporting Status:**

**NEVER say:**
- ❌ "100% complete" without browser testing
- ❌ "Everything works" without clicking through workflows
- ❌ "Ready for production" without end-to-end testing
- ❌ "Feature implemented" if only code is written but not tested

**ALWAYS say:**
- ✅ "Tested in browser, all workflows verified working"
- ✅ "End-to-end testing complete, found and fixed X bugs"
- ✅ "Browser console clean, no JavaScript errors"
- ✅ "Can confidently demo all features to stakeholder"
- ✅ "Ready for production deployment" (only after ALL checks pass)

### **When Issues Are Found:**
1. **Report immediately** - don't hide problems
2. **Assess severity** - critical vs. minor issues
3. **Provide honest timeline** - for fixing issues
4. **Update status** - reflect true completion percentage
5. **Document lessons learned** - prevent repeat issues

---

## 📚 REFERENCE

### **Key Documentation Files:**
- `WARP.md` - This file's twin (must stay synchronized)
- `docs/DEVELOPMENT_PIPELINE.md` - Detailed pipeline documentation
- `docs/AGENT_PORTAL_QA_FAILURE_REPORT.md` - Example of what NOT to do
- `PROJECT_STATUS.md` - Current project status
- `changelog.md` - Version history

### **Critical Scripts:**
- `./scripts/dev-server.sh` - Server management
- `./scripts/promote.sh` - Environment promotion
- `./scripts/verify_completion.sh` - Completion verification

### **Production URLs:**
- Dev: http://localhost:8081
- Test: http://localhost:8082
- Staging: http://localhost:8083
- Production: https://assiduous-prod.web.app

---

## 🔄 RULE SYNCHRONIZATION

**CRITICAL: WARP.md and CLAUDE.md must remain synchronized**

When updating rules:
1. Update BOTH files identically
2. Verify both have same rule numbers
3. Verify both have same content
4. Commit both files together
5. Document what changed in commit message

**If rules differ between files:**
1. Identify which is newer
2. Update older file to match
3. Commit synchronization
4. Add note explaining discrepancy

---

## ✅ FINAL REMINDERS

**Every time you work on this project:**
1. ✅ Read these rules before starting
2. ✅ Work in DEV environment first
3. ✅ Test thoroughly at each stage
4. ✅ Use the promotion scripts
5. ✅ Never skip the pipeline
6. ✅ Run QA/QC before claiming completion
7. ✅ Be honest about status
8. ✅ Build on existing code, never recreate
9. ✅ Commit to GitHub before deploying
10. ✅ Verify production works after deployment

**These rules exist to:**
- Prevent production breaks
- Ensure code quality
- Maintain stakeholder trust
- Create reliable deployments
- Build sustainable development practices

**Follow them without exception.**

---

**Last Updated**: 2025-10-06  
**Version**: 1.0.0  
**Status**: Active - Mandatory Compliance
# Contributing to Assiduous

Thank you for your interest in contributing to the Assiduous AI-Powered Real Estate Platform! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Development Setup](#development-setup)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences
- Accept responsibility for mistakes

## Getting Started

1. **Fork the Repository**
   ```bash
   # Fork via GitHub UI, then:
   git clone https://github.com/YOUR_USERNAME/Assiduous.git
   cd assiduous
   git remote add upstream https://github.com/SirsiMaster/Assiduous.git
   ```

2. **Install Git Hooks**
   ```bash
   ./scripts/hooks/install.sh
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

We follow the GitFlow branching model with some modifications:

### Main Branches

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features
- **`staging`** - Pre-production testing

### Supporting Branches

- **`feature/*`** - New features
- **`bugfix/*`** - Bug fixes for develop
- **`hotfix/*`** - Emergency fixes for production
- **`release/*`** - Release preparation
- **`docs/*`** - Documentation updates

### Branch Naming Convention

```
<type>/<issue-number>-<short-description>

Examples:
feature/123-property-search
bugfix/456-auth-token-expiry
hotfix/789-critical-security-fix
docs/321-api-documentation
```

## Branching Strategy

### Feature Development

```bash
# Start from develop
git checkout develop
git pull upstream develop
git checkout -b feature/123-new-feature

# Work on your feature
git add .
git commit -m "feat(component): add new functionality"

# Keep up to date with develop
git fetch upstream
git rebase upstream/develop

# Push to your fork
git push origin feature/123-new-feature
```

### Bug Fixes

```bash
# For development bugs
git checkout -b bugfix/456-fix-issue develop

# For production bugs (hotfix)
git checkout -b hotfix/789-critical-fix main
```

### Release Process

```bash
# Create release branch
git checkout -b release/1.0.0 develop

# Finish release
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git checkout develop
git merge --no-ff release/1.0.0
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI/CD changes
- **chore**: Maintenance tasks
- **revert**: Reverting a previous commit

### Examples

```bash
# Feature
git commit -m "feat(search): add advanced property filters"

# Bug fix with issue reference
git commit -m "fix(auth): resolve token refresh issue

Fixes #123"

# Breaking change
git commit -m "feat(api): change response format

BREAKING CHANGE: API response structure has changed.
Migration guide: docs/migration/v2.md"
```

### Commit Message Rules

1. Use imperative mood ("add" not "added")
2. Capitalize the first letter of the subject
3. Don't end the subject with a period
4. Limit subject to 50 characters
5. Wrap body at 72 characters
6. Reference issues and PRs in the footer

## Pull Request Process

### Before Creating a PR

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Run tests**
   ```bash
   npm test
   npm run lint
   ```

3. **Update documentation**
   - Update README if needed
   - Add/update code comments
   - Update API documentation

4. **Update CHANGELOG**
   ```bash
   ./scripts/changelog/update_changelog.sh
   ```

### Creating a Pull Request

1. Push your branch to your fork
2. Create PR via GitHub UI
3. Fill out the PR template completely
4. Link related issues
5. Request reviewers

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Commit messages follow conventions
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] No merge conflicts
- [ ] Approved by at least 2 reviewers

### After PR Approval

1. Squash commits if requested
2. Ensure branch is up to date
3. Merge will be performed by maintainers

## Development Setup

### Prerequisites

- Git 2.x+
- Node.js 18+ (for future backend)
- Python 3.x (for local server)
- Modern web browser

### Local Development

```bash
# Install dependencies (when package.json exists)
npm install

# Start development server
python -m http.server 8080

# Or use the npm script (when configured)
npm run dev
```

### Environment Variables

Create `.env.local` for local development:

```env
# API Configuration
API_URL=http://localhost:3000
API_KEY=development-key

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_ANALYTICS=false
```

## Testing Guidelines

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

### Writing Tests

```javascript
// Example test
describe('PropertySearch', () => {
  it('should return filtered properties', () => {
    const result = searchProperties({ city: 'San Francisco' });
    expect(result).toHaveLength(10);
    expect(result[0]).toHaveProperty('city', 'San Francisco');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "PropertySearch"

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Documentation

### Code Documentation

- Use JSDoc for JavaScript functions
- Include examples in complex functions
- Document all public APIs
- Keep README up to date

### API Documentation

```javascript
/**
 * Search for properties based on criteria
 * @param {Object} criteria - Search criteria
 * @param {string} criteria.city - City name
 * @param {number} criteria.minPrice - Minimum price
 * @param {number} criteria.maxPrice - Maximum price
 * @returns {Promise<Property[]>} Array of matching properties
 * @example
 * const properties = await searchProperties({
 *   city: 'San Francisco',
 *   minPrice: 500000,
 *   maxPrice: 1000000
 * });
 */
async function searchProperties(criteria) {
  // Implementation
}
```

### Documentation Updates

When adding new features:

1. Update relevant README sections
2. Add inline code comments
3. Update API documentation
4. Create user guides if needed
5. Update the PRD if applicable

## Version Control Best Practices

### DO

- Keep commits atomic and focused
- Write descriptive commit messages
- Rebase feature branches on develop
- Tag releases with semantic versioning
- Keep branch history clean
- Update changelog for notable changes

### DON'T

- Commit directly to main or develop
- Force push to shared branches
- Mix feature and fix commits
- Leave commented-out code
- Commit sensitive information
- Create huge pull requests

## Review Process

### As a Reviewer

- Test the changes locally
- Check for code quality
- Verify tests are adequate
- Ensure documentation is updated
- Provide constructive feedback
- Approve only when satisfied

### Review Checklist

- [ ] Code follows project style
- [ ] Tests cover new functionality
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Documentation updated
- [ ] Commits are well-structured

## Release Process

### Creating a Release

1. **Update version**
   ```bash
   npm version minor  # or major, patch
   ```

2. **Update CHANGELOG**
   ```bash
   ./scripts/changelog/update_changelog.sh 1.1.0
   ```

3. **Create release tag**
   ```bash
   ./scripts/rollback/create_tag.sh 1.1.0 "Feature release"
   ```

4. **Push to repository**
   ```bash
   git push origin main --tags
   ```

### Release Checklist

- [ ] All tests pass
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Tag created
- [ ] Documentation updated
- [ ] Release notes written
- [ ] Rollback plan documented

## Community

### Getting Help

- Check existing issues
- Read the documentation
- Ask in discussions
- Join our Discord/Slack

### Reporting Issues

Use issue templates for:
- Bug reports
- Feature requests
- Documentation improvements

### Communication Channels

- GitHub Issues - Bug reports and features
- GitHub Discussions - General discussions
- Email - security@assiduous.ai
- Discord - Real-time chat

## Recognition

Contributors will be recognized in:
- changelog.md
- Contributors section in README
- Release notes
- Annual contributor report

## Questions?

Feel free to:
- Open an issue
- Start a discussion
- Contact maintainers
- Check the FAQ

---

Thank you for contributing to Assiduous! Your efforts help make real estate technology more accessible to everyone. 🏠🚀
---

# Feature Development Process
**Consolidated From:** FEATURE_DEVELOPMENT_PROCESS.md
**Date Merged:** 2025-11-02

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
