# Branch Protection Rules

This document outlines the branch protection rules for the Assiduous project. These rules must be configured in GitHub repository settings by repository administrators.

## Protected Branches

### main (Production)
**Purpose:** Production-ready code only

**Protection Rules:**
- ✅ Require pull request reviews before merging
  - Required approving reviews: 2
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from CODEOWNERS
- ✅ Require status checks to pass before merging
  - Require branches to be up to date before merging
  - Required status checks:
    - continuous-integration/build
    - continuous-integration/tests
    - security/scan
    - code-quality/lint
- ✅ Require conversation resolution before merging
- ✅ Require signed commits
- ✅ Require linear history
- ✅ Include administrators
- ✅ Restrict who can push to matching branches
  - Allowed users/teams: Release Team only
- 🚫 Do not allow force pushes
- 🚫 Do not allow deletions

### develop (Integration)
**Purpose:** Feature integration and testing

**Protection Rules:**
- ✅ Require pull request reviews before merging
  - Required approving reviews: 1
  - Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - Required status checks:
    - continuous-integration/build
    - continuous-integration/tests
- ✅ Require conversation resolution before merging
- ✅ Require branches to be up to date before merging
- 🚫 Do not allow force pushes
- 🚫 Do not allow deletions

### release/* (Release Candidates)
**Purpose:** Release preparation branches

**Protection Rules:**
- ✅ Require pull request reviews before merging
  - Required approving reviews: 2
- ✅ Require status checks to pass
- ✅ Restrict who can push
  - Allowed: Release Team
- 🚫 Do not allow force pushes
- 🚫 Do not allow deletions

## Status Checks Configuration

### Required Status Checks

#### CI/CD Pipeline
```yaml
name: CI/CD
required: true
contexts:
  - continuous-integration/build
  - continuous-integration/tests
  - continuous-integration/e2e-tests
```

#### Code Quality
```yaml
name: Code Quality
required: true
contexts:
  - code-quality/lint
  - code-quality/format
  - code-quality/complexity
```

#### Security
```yaml
name: Security
required: true
contexts:
  - security/dependency-scan
  - security/code-scan
  - security/secrets-scan
```

#### Documentation
```yaml
name: Documentation
required: false
contexts:
  - docs/build
  - docs/links-check
```

## Merge Settings

### Allowed Merge Types
- ✅ Squash merging (recommended for features)
- ✅ Merge commit (for release branches)
- 🚫 Rebase merging (disabled to maintain history)

### Auto-merge Settings
- Enabled for: Dependabot PRs (patch updates only)
- Requires: All checks passing
- Auto-delete head branches: Enabled

## Tag Protection

### Version Tags (v*)
**Pattern:** `v*`

**Rules:**
- Only Release Team can create
- Only Release Team can delete
- Must be signed

### Release Tags (release-*)
**Pattern:** `release-*`

**Rules:**
- Only administrators can create/delete

## Deployment Rules

### Production Environment
**Branch:** main
**Requirements:**
- Manual approval required
- Reviewers: Production Release Team
- Wait timer: 5 minutes

### Staging Environment
**Branch:** develop
**Requirements:**
- Automatic deployment on merge
- No manual approval required

## CODEOWNERS Configuration

Create `.github/CODEOWNERS` file:

```
# Global owners
* @SirsiMaster/core-team

# Frontend
/src/ @SirsiMaster/frontend-team
/assets/ @SirsiMaster/frontend-team
*.html @SirsiMaster/frontend-team
*.css @SirsiMaster/frontend-team
*.js @SirsiMaster/frontend-team

# Documentation
/docs/ @SirsiMaster/docs-team
*.md @SirsiMaster/docs-team

# DevOps
/scripts/ @SirsiMaster/devops-team
/.github/ @SirsiMaster/devops-team
Dockerfile @SirsiMaster/devops-team
*-compose.yml @SirsiMaster/devops-team

# Security
SECURITY.md @SirsiMaster/security-team
```

## Enforcement Exceptions

### Emergency Hotfixes
In case of critical production issues:

1. Create hotfix branch from main
2. Requires approval from:
   - 1 Senior Engineer
   - 1 Security Team member (if security-related)
3. Can bypass some status checks with:
   - Written justification
   - Post-mortem commitment
   - Immediate follow-up PR with full checks

### Break Glass Procedure
For extreme emergencies only:

1. Contact repository administrator
2. Document reason in incident report
3. Temporarily disable protection (max 1 hour)
4. Re-enable immediately after fix
5. Conduct mandatory post-mortem

## Implementation Checklist

For repository administrators to configure:

- [ ] Enable branch protection for main
- [ ] Enable branch protection for develop
- [ ] Configure status checks
- [ ] Set up CODEOWNERS file
- [ ] Configure tag protection rules
- [ ] Set up deployment environments
- [ ] Configure auto-merge settings
- [ ] Enable required signed commits
- [ ] Set up merge queue (if available)
- [ ] Configure security alerts
- [ ] Enable Dependabot
- [ ] Set up secret scanning
- [ ] Configure audit log streaming

## Monitoring & Compliance

### Weekly Review
- Check for protection rule violations
- Review bypass events
- Audit direct pushes

### Monthly Review
- Evaluate rule effectiveness
- Update based on team feedback
- Review and update CODEOWNERS

### Metrics to Track
- PR approval time
- Build success rate
- Bypass frequency
- Merge conflicts rate
- Failed status checks

## Support

For questions or issues with branch protection:

1. Check this documentation
2. Contact DevOps team
3. Create issue with `branch-protection` label
4. Emergency: Contact repository administrators

---

**Last Updated:** 2025-08-22  
**Maintained By:** DevOps Team  
**Review Schedule:** Quarterly
