# Scripts Directory

This directory contains utility scripts for the Assiduous project. Scripts are organized by purpose and frequency of use.

## 📁 Directory Structure

```
scripts/
├── archive/           # Historical/one-time scripts (37 archived)
├── changelog/         # Changelog management utilities
├── hooks/            # Git hooks for commit validation
├── rollback/         # Version rollback utilities
└── *.sh              # Active operational scripts
```

## ✅ Active Scripts

These scripts are regularly used and maintained:

### Essential Operations
- **`verify_completion.sh`** - Mandatory completion verification (WARP Rule #2)
  - Validates task completion before reporting
  - Tests all claimed functionality
  - Required before any "task complete" report

### Version Control
- **`git-sync.sh`** - Git synchronization operations
- **`auto-version.sh`** - Automated version management
- **`check-version.sh`** - Version verification utility
- **`update-version.sh`** - Version update script

### Subdirectories
- **`hooks/`** - Git commit message validation (enforces Conventional Commits)
- **`rollback/`** - Version rollback utilities for emergency recovery
- **`changelog/`** - Automated changelog generation tools

## 📦 Archived Scripts (37 files)

Located in `scripts/archive/` - these were used for historical migrations or one-time setup tasks:

### Migration & Setup (10 scripts)
- Firebase initial uploads and data population
- Historical metrics calculations
- Development history synchronization
- OpenSign integration deployment

### UI Modernization (11 scripts)
- Path fixing and duplicate resolution
- Button and sidebar modernization
- Admin UI upgrades
- Branding sweeps
- SirsiMaster UI implementation

### Automation (4 scripts)
- Old metrics auto-updater system (replaced by GitHub Actions)
- Service installation and control scripts

### GitHub Webhook & CI (12 scripts)
- Old automation testing and configuration
- Manual webhook testing
- Legacy CI setup (replaced by `.github/workflows/`)

## 🚀 Usage Examples

### Verify Task Completion (REQUIRED)
```bash
./scripts/verify_completion.sh
```

### Version Management
```bash
# Check current version
./scripts/check-version.sh

# Update version
./scripts/update-version.sh 0.3.0

# Auto-version with git tag
./scripts/auto-version.sh
```

### Git Operations
```bash
# Sync with remote
./scripts/git-sync.sh
```

### Changelog Management
```bash
# Update changelog for new release
./scripts/changelog/update_changelog.sh 0.3.0
```

## 🔧 Maintenance Notes

### Archive Policy
Scripts are archived when they:
- Were used for one-time setup/migration tasks
- Have been replaced by automated CI/CD pipelines
- Are no longer compatible with current architecture
- Serve only as historical reference

### Restoring Archived Scripts
If an archived script is needed:
```bash
# Copy from archive back to scripts/
cp scripts/archive/script-name.js scripts/

# Make executable if needed
chmod +x scripts/script-name.js
```

## 📊 Current Statistics
- **Active Scripts**: 5 shell scripts + 3 subdirectories
- **Archived Scripts**: 37 historical scripts
- **Total Scripts**: 42 scripts (88% archived, 12% active)

## 🔗 Related Documentation
- [WARP Rules](../WARP.md) - Development governance and rules
- [Git Hooks](./.github/CONTRIBUTING.md) - Commit message conventions
- [Rollback Registry](../ROLLBACK_REGISTRY.md) - Version rollback procedures
- [Changelog](../CHANGELOG.md) - Version history

## 🛡️ Critical Rules

Per WARP Rule #2:
> **Before reporting ANY task as complete, you MUST:**
> - Run the completion verification script: `./scripts/verify_completion.sh`
> - This is non-negotiable for all development work

---

**Last Updated**: September 2025  
**Maintained By**: Assiduous Development Team
