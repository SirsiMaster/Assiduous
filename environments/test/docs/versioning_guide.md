# 📌 versionING GUIDE
## assiduousflip Platform Version Management

**Current Version:** 0.2.0  
**Released:** September 6, 2025  
**Next Release:** 0.3.0 (Target: Implementation Complete)

---

## 🏷️ version LOCATIONS

The version number must be updated in these files:

1. **version** - Single source of truth (root directory)
2. **package.json** - `"version": "0.2.0"`
3. **readme.md** - Version badge
4. **changelog.md** - Release notes
5. **docs/MASTER_IMPLEMENTATION_GUIDE.md** - Documentation version

---

## 📊 versionING SCHEME

We follow [Semantic Versioning](https://semver.org/) (SemVer):

### Format: MAJOR.MINOR.PATCH

- **MAJOR** (X.0.0): Breaking changes, complete overhauls
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, small improvements

### Pre-release Tags
- **Alpha**: `0.2.0-alpha.1` - Internal testing
- **Beta**: `0.2.0-beta.1` - External testing
- **RC**: `0.2.0-rc.1` - Release candidate

---

## 📅 version HISTORY

### Released Versions
- **0.2.0** (2025-09-06) - Firebase Integration & Admin Portal
- **0.1.1** (2025-08-29) - UI Enhancements
- **0.1.0** (2025-08-22) - Core Application
- **0.0.1** (2025-08-10) - Initial Setup

### Upcoming Versions
- **0.3.0** - Live Implementation Complete
- **0.4.0** - Payment & Communication Integration
- **0.5.0** - Analytics & Reporting
- **1.0.0** - Production Release

---

## 🚀 AUTOMATED RELEASE PROCESS

### Fully Automated (Recommended)
Versioning is **automatically handled** based on your commit messages:

1. **Write commits using conventional format:**
   - `feat: ...` → Bumps MINOR version (0.X.0)
   - `fix: ...` → Bumps PATCH version (0.0.X)
   - `BREAKING CHANGE: ...` → Bumps MAJOR version (X.0.0)

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **GitHub Actions automatically:**
   - Analyzes commits since last tag
   - Determines version bump type
   - Updates version, package.json, readme.md
   - Updates changelog.md
   - Creates git tag
   - Creates GitHub release

### Manual Process (if needed)
```bash
# Run auto-version script
./scripts/auto-version.sh

# Or force specific version
./scripts/update-version.sh 0.3.0
```

### 2. Update changelog.md
```markdown
## [0.3.0] - 2025-XX-XX

### Added
- List new features

### Changed
- List changes

### Fixed
- List bug fixes
```

### 3. Create Git Tag
```bash
# Create annotated tag
git tag -a v0.3.0 -m "Release version 0.3.0: Brief description"

# Push tag to remote
git push origin v0.3.0
```

### 4. Update Documentation
```bash
# Update version in docs
./scripts/update-version.sh 0.3.0

# Commit changes
git add .
git commit -m "chore: Bump version to 0.3.0"
git push
```

---

## 🔄 version UPDATE SCRIPT

Create this helper script at `/scripts/update-version.sh`:

```bash
#!/bin/bash
NEW_version=$1

if [ -z "$NEW_version" ]; then
    echo "Usage: ./update-version.sh <version>"
    exit 1
fi

# Update version file
echo "$NEW_version" > version

# Update package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_version\"/" package.json

# Update README badge
sed -i '' "s/version-.*-blue/version-$NEW_version-blue/" readme.md

echo "✅ Version updated to $NEW_version"
echo "Don't forget to:"
echo "  1. Update changelog.md"
echo "  2. Create git tag: git tag -a v$NEW_version"
echo "  3. Push tag: git push origin v$NEW_version"
```

---

## 📋 CHANGELOG CATEGORIES

When updating changelog.md, use these categories:

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

---

## 🏷️ GIT TAGGING

### Create Release Tag
```bash
# Annotated tag (recommended)
git tag -a v0.3.0 -m "Release version 0.3.0: Implementation complete"

# Lightweight tag (not recommended)
git tag v0.3.0

# Push tag
git push origin v0.3.0

# Push all tags
git push origin --tags
```

### List Tags
```bash
# List all tags
git tag -l

# List with pattern
git tag -l "v0.3.*"

# Show tag details
git show v0.3.0
```

### Delete Tag
```bash
# Delete local tag
git tag -d v0.3.0

# Delete remote tag
git push origin :refs/tags/v0.3.0
```

---

## 📊 version MILESTONES

### 0.3.0 - Implementation Complete
- [ ] All admin pages functional
- [ ] Firebase fully integrated
- [ ] Authentication working
- [ ] Real-time data updates

### 0.4.0 - Integrations Complete
- [ ] Stripe payments
- [ ] DocuSign contracts
- [ ] Twilio SMS
- [ ] SendGrid email

### 0.5.0 - Analytics & Polish
- [ ] Analytics dashboard live
- [ ] Performance optimized
- [ ] Bug fixes complete
- [ ] Documentation updated

### 1.0.0 - Production Ready
- [ ] All features complete
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Full test coverage

---

## 🔍 version VERIFICATION

### Check Current Version
```bash
# From version file
cat version

# From package.json
grep version package.json

# From git tags
git describe --tags --abbrev=0
```

### Version Consistency Check
```bash
# Create this script at /scripts/check-version.sh
#!/bin/bash

version_FILE=$(cat version)
PACKAGE_version=$(grep -o '"version": "[^"]*' package.json | cut -d'"' -f4)
README_version=$(grep -o 'version-[^-]*' readme.md | cut -d'-' -f2)

echo "version file: $version_FILE"
echo "package.json: $PACKAGE_version"
echo "readme.md: $README_version"

if [ "$version_FILE" = "$PACKAGE_version" ] && [ "$version_FILE" = "$README_version" ]; then
    echo "✅ All versions match!"
else
    echo "❌ Version mismatch detected!"
fi
```

---

## 📝 COMMIT MESSAGES FOR versionS

### Version Bump Commit
```bash
git commit -m "chore: Bump version to 0.3.0"
```

### Release Commit
```bash
git commit -m "chore(release): Release version 0.3.0"
```

### Changelog Update
```bash
git commit -m "docs: Update CHANGELOG for v0.3.0"
```

---

## 🚨 IMPORTANT NOTES

1. **Always update version file first** - It's the source of truth
2. **Keep versions synchronized** - All files must match
3. **Use annotated tags** - They include metadata
4. **Update CHANGELOG immediately** - Don't forget release notes
5. **Test before tagging** - Tags are permanent*
6. **Follow SemVer strictly** - Consistency is key

---

## 📞 version SUPPORT

### Current Supported Versions
- **0.2.x** - Active development
- **0.1.x** - Security fixes only
- **0.0.x** - End of life

### Version Deprecation
- Minor versions: Supported for 3 months
- Major versions: Supported for 12 months
- Security patches: As needed

---

**Document Version:** 1.0  
**Last Updated:** September 6, 2025  
**Maintained By:** Development Team
