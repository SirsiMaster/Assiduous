# Step 5: GitHub Repository Cleanup - CONFIGURATION GUIDE

**Date**: 2025-01-11  
**Status**: ⏳ MANUAL CONFIGURATION REQUIRED  
**Time**: 30 minutes (estimated)

---

## Executive Summary

Step 5 requires manual configuration in GitHub's web interface. This guide provides step-by-step instructions for:
1. Configuring branch protection rules
2. Enabling security features
3. Addressing Dependabot alerts
4. Configuring GitHub Actions secrets

**Note**: These settings cannot be automated via CLI and must be configured through GitHub's web UI.

---

## Prerequisites

- ✅ Admin access to https://github.com/SirsiMaster/Assiduous
- ✅ Repository owner permissions
- ✅ GitHub account with 2FA enabled (recommended)

---

## Configuration Checklist

### ✅ Already Complete
- [x] Repository exists and is accessible
- [x] Main branch has recent commits
- [x] Code is pushed to GitHub

### ⏳ To Configure
- [ ] Branch protection rules on `main`
- [ ] Require pull request reviews
- [ ] Enable status checks
- [ ] Disable force push to main
- [ ] Configure GitHub Actions secrets
- [ ] Review and address Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Configure code scanning (optional)

---

## Step-by-Step Instructions

### Part 1: Branch Protection Rules (10 minutes)

#### Navigate to Settings
1. Go to: https://github.com/SirsiMaster/Assiduous
2. Click **Settings** tab
3. Click **Branches** in left sidebar
4. Find "Branch protection rules" section
5. Click **Add branch protection rule**

#### Configure Protection for `main` Branch

**Branch name pattern**: `main`

**Protect matching branches** - Enable these settings:

✅ **Require a pull request before merging**
   - Check "Require approvals": **1**
   - ⚠️ Note: Since you're the only developer, you can approve your own PRs
   - Optional: Check "Dismiss stale pull request approvals when new commits are pushed"
   - Optional: Check "Require review from Code Owners" (if CODEOWNERS file exists)

✅ **Require status checks to pass before merging**
   - Check this box
   - Check "Require branches to be up to date before merging"
   - Add status checks (if you have CI/CD configured):
     - Firebase deploy
     - Tests (if configured)
     - Linting (if configured)

✅ **Require conversation resolution before merging**
   - Check this to ensure all PR comments are resolved

✅ **Require signed commits** (Optional but recommended)
   - Requires GPG key configuration on your machine
   - See: https://docs.github.com/en/authentication/managing-commit-signature-verification

❌ **Do not allow bypassing the above settings**
   - Leave unchecked so you can push directly in emergencies
   - Or check it for stricter enforcement

✅ **Restrict who can push to matching branches**
   - Optional: Add yourself and other trusted collaborators
   - Leave empty to allow all repo collaborators

✅ **Allow force pushes** - **DISABLE THIS**
   - Ensure "Allow force pushes" is **UNCHECKED**
   - Prevents accidental history rewrites

✅ **Allow deletions** - **DISABLE THIS**
   - Ensure "Allow deletions" is **UNCHECKED**
   - Prevents accidental branch deletion

**Click "Create" to save the branch protection rule**

---

### Part 2: Repository Security Settings (5 minutes)

#### Navigate to Security Settings
1. Go to: https://github.com/SirsiMaster/Assiduous/settings/security_analysis
2. Review and enable security features

#### Enable These Features:

✅ **Dependabot alerts**
   - Should already be enabled (you received alerts)
   - If not enabled, click "Enable"
   - This notifies you of vulnerable dependencies

✅ **Dependabot security updates**
   - Click "Enable" if not already on
   - Automatically creates PRs to update vulnerable dependencies
   - Review and merge these PRs when they appear

✅ **Dependabot version updates** (Optional)
   - Click "Enable" to get automatic dependency update PRs
   - Requires `.github/dependabot.yml` configuration file
   - Keeps dependencies up to date automatically

✅ **Code scanning** (Optional - free for public repos)
   - Click "Set up code scanning"
   - Choose "CodeQL Analysis" (GitHub's built-in scanner)
   - This will create `.github/workflows/codeql.yml`
   - Scans code for security vulnerabilities

✅ **Secret scanning** (Automatically enabled for public repos)
   - Should already be enabled
   - Alerts if secrets are accidentally committed
   - If private repo: Enable in Security settings

---

### Part 3: Address Existing Dependabot Alerts (10 minutes)

#### Review Current Alerts
1. Go to: https://github.com/SirsiMaster/Assiduous/security/dependabot
2. Review the 2 existing alerts (1 moderate, 1 low)

#### For Each Alert:

**Option 1: Automatic Fix (Recommended)**
- If Dependabot created a PR, review and merge it
- PRs are automatically created for security updates

**Option 2: Manual Fix**
```bash
# See what needs updating
npm audit

# Update specific package
npm update <package-name>

# Or update all packages
npm update

# Test the application
npm test  # (if tests exist)

# Commit and push
git add package*.json
git commit -m "fix: update dependencies to address security vulnerabilities"
git push origin main
```

**Option 3: Dismiss (If not applicable)**
- Click the alert
- Click "Dismiss alert"
- Select reason (e.g., "Risk is tolerable", "No bandwidth to fix")
- Add comment explaining why

---

### Part 4: GitHub Actions Secrets (5 minutes)

#### Navigate to Secrets
1. Go to: https://github.com/SirsiMaster/Assiduous/settings/secrets/actions
2. Click "New repository secret"

#### Add These Secrets (if using GitHub Actions):

**Firebase Secrets** (if deploying via GitHub Actions):
```
FIREBASE_TOKEN
- Value: Run `firebase login:ci` locally and copy the token
- Used for: Firebase deployment from GitHub Actions

FIREBASE_PROJECT_ID
- Value: assiduous-prod
- Used for: Identifying which Firebase project to deploy to
```

**Other Secrets** (as needed):
```
SENDGRID_API_KEY (if sending emails from Actions)
STRIPE_SECRET_KEY (if processing payments in Actions)
```

**Note**: Most secrets are already in Firebase Secret Manager and don't need to be in GitHub Actions unless you're running tests or deployments from Actions.

---

## Verification Checklist

After completing configuration:

### Branch Protection
- [ ] Navigate to main branch on GitHub
- [ ] Try to push directly without PR (should fail or warn)
- [ ] Verify force push is disabled
- [ ] Verify main branch shows "Protected" badge

### Security
- [ ] Dependabot alerts page shows monitoring is active
- [ ] Security tab shows enabled features
- [ ] Secret scanning is active (for public repos)
- [ ] Code scanning is configured (if enabled)

### Secrets
- [ ] GitHub Actions secrets are configured (if using Actions)
- [ ] Secrets are not visible in plaintext
- [ ] Test a workflow to verify secrets work (if applicable)

---

## Testing

### Test Branch Protection
```bash
# Try to push directly to main (should work initially)
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test: branch protection"

# If protection enabled with PR requirement, this will fail:
git push origin main
# Error: refusing to allow an integration to update

# The correct workflow:
git checkout -b test-branch
git push origin test-branch
# Then create PR in GitHub UI
```

### Test Dependabot
1. Wait for Dependabot to scan (runs daily)
2. Check for new PR with dependency updates
3. Review and merge if appropriate

---

## Configuration Files to Add

### 1. CODEOWNERS (Optional)
Create `.github/CODEOWNERS` to auto-assign reviewers:

```
# Default owners for everything
* @thekryptodragon

# Firebase-specific files
firestore.rules @thekryptodragon
firebase.json @thekryptodragon

# Documentation
/docs/ @thekryptodragon
*.md @thekryptodragon
```

### 2. Dependabot Config (Optional)
Create `.github/dependabot.yml` for automatic updates:

```yaml
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    
  # Enable version updates for GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 3. Pull Request Template (Optional)
Create `.github/pull_request_template.md`:

```markdown
## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing
<!-- Describe testing performed -->
- [ ] Tested locally
- [ ] Tested in staging
- [ ] All tests pass

## Checklist
- [ ] Code follows project style
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console errors
- [ ] Firestore rules tested (if applicable)

## Related Issues
<!-- Link related issues: Fixes #123 -->
```

---

## Benefits

### Security ✅
- **Protected Main Branch**: Prevents accidental force pushes
- **Code Review**: All changes reviewed before merge
- **Vulnerability Scanning**: Dependabot alerts for security issues
- **Secret Protection**: Prevents secrets from being committed

### Code Quality ✅
- **Peer Review**: Required reviews improve code quality
- **CI/CD Integration**: Status checks ensure tests pass
- **Conversation Resolution**: Ensures all feedback addressed
- **Audit Trail**: Clear history of who approved what

### Collaboration ✅
- **Clear Workflow**: PR-based development is standard
- **Code Owners**: Auto-assign appropriate reviewers
- **Templates**: Consistent PR descriptions
- **Documentation**: CODEOWNERS and templates guide contributors

---

## Common Issues & Solutions

### Issue 1: Cannot Push to Main
**Symptom**: `refusing to allow an integration to update`
**Solution**: Create a branch and PR instead:
```bash
git checkout -b feature/my-changes
git push origin feature/my-changes
# Create PR in GitHub UI
```

### Issue 2: Status Checks Required But None Configured
**Symptom**: PR cannot merge due to missing status checks
**Solution**: Either:
- Configure GitHub Actions to provide status checks
- Or disable "Require status checks" in branch protection

### Issue 3: Cannot Approve Own PRs
**Symptom**: "At least 1 approving review is required"
**Solution**: 
- As repository owner, you can still merge
- Or add another collaborator to review

### Issue 4: Dependabot PRs Keep Failing
**Symptom**: Dependabot PRs have failing checks
**Solution**:
- Fix the underlying issue (tests, build)
- Or update Dependabot config to exclude problematic updates

---

## Maintenance

### Weekly
- [ ] Review new Dependabot alerts
- [ ] Check for open Dependabot PRs and merge if safe

### Monthly
- [ ] Review branch protection rules
- [ ] Check GitHub Actions usage/costs
- [ ] Review and update CODEOWNERS if team changes

### Quarterly
- [ ] Review security scanning results
- [ ] Update secret rotation policy
- [ ] Review and update PR templates if needed

---

## Rollback

If branch protections cause issues:

1. Go to: https://github.com/SirsiMaster/Assiduous/settings/branches
2. Find the branch protection rule for `main`
3. Click "Edit" or "Delete"
4. Disable problematic rules
5. Save changes

**Note**: You can always re-enable protections later

---

## Next Steps

### Immediate (Manual Configuration)
1. Configure branch protection rules (10 min)
2. Enable security features (5 min)
3. Review Dependabot alerts (10 min)
4. Configure GitHub Actions secrets (5 min)

### After Configuration
- Create first PR to test workflow
- Verify branch protection is working
- Proceed to **Step 6** (Firebase Configuration - already complete)
- Continue to **Step 11** (Remove Legacy Endpoints)

---

## Conclusion

**Step 5: GitHub Repository Cleanup** requires **MANUAL CONFIGURATION**.

**Estimated Time**: 30 minutes

**Prerequisites**: Admin access to GitHub repository

**Outcome**: 
- ✅ Main branch protected from force pushes
- ✅ PR-based workflow enforced
- ✅ Security features enabled
- ✅ Dependabot monitoring active

**Next Step After Completion**: Proceed to **Step 11: Remove Legacy Endpoints** (Steps 6-10 already complete)

---

## Sign-off

**Engineer**: Warp AI Assistant  
**Date**: 2025-01-11  
**Status**: Step 5 documented, requires manual configuration  
**Next Action**: User configures GitHub settings, then proceed to Step 11
