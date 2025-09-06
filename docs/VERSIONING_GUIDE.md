# 📌 VERSIONING GUIDE
## AssiduousFlip Platform Version Management

**Current Version:** 0.2.0  
**Released:** September 6, 2025  
**Next Release:** 0.3.0 (Target: Implementation Complete)

---

## 🏷️ VERSION LOCATIONS

The version number must be updated in these files:

1. **VERSION** - Single source of truth (root directory)
2. **package.json** - `"version": "0.2.0"`
3. **README.md** - Version badge
4. **CHANGELOG.md** - Release notes
5. **docs/MASTER_IMPLEMENTATION_GUIDE.md** - Documentation version

---

## 📊 VERSIONING SCHEME

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

## 📅 VERSION HISTORY

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

## 🚀 RELEASE PROCESS

### 1. Pre-Release Checklist
```bash
# Ensure all tests pass
npm test

# Update VERSION file
echo "0.3.0" > VERSION

# Update package.json
# Edit "version": "0.3.0"

# Update README.md badge
# Change version-0.2.0 to version-0.3.0
```

### 2. Update CHANGELOG.md
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

## 🔄 VERSION UPDATE SCRIPT

Create this helper script at `/scripts/update-version.sh`:

```bash
#!/bin/bash
NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
    echo "Usage: ./update-version.sh <version>"
    exit 1
fi

# Update VERSION file
echo "$NEW_VERSION" > VERSION

# Update package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update README badge
sed -i '' "s/version-.*-blue/version-$NEW_VERSION-blue/" README.md

echo "✅ Version updated to $NEW_VERSION"
echo "Don't forget to:"
echo "  1. Update CHANGELOG.md"
echo "  2. Create git tag: git tag -a v$NEW_VERSION"
echo "  3. Push tag: git push origin v$NEW_VERSION"
```

---

## 📋 CHANGELOG CATEGORIES

When updating CHANGELOG.md, use these categories:

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

## 📊 VERSION MILESTONES

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

## 🔍 VERSION VERIFICATION

### Check Current Version
```bash
# From VERSION file
cat VERSION

# From package.json
grep version package.json

# From git tags
git describe --tags --abbrev=0
```

### Version Consistency Check
```bash
# Create this script at /scripts/check-version.sh
#!/bin/bash

VERSION_FILE=$(cat VERSION)
PACKAGE_VERSION=$(grep -o '"version": "[^"]*' package.json | cut -d'"' -f4)
README_VERSION=$(grep -o 'version-[^-]*' README.md | cut -d'-' -f2)

echo "VERSION file: $VERSION_FILE"
echo "package.json: $PACKAGE_VERSION"
echo "README.md: $README_VERSION"

if [ "$VERSION_FILE" = "$PACKAGE_VERSION" ] && [ "$VERSION_FILE" = "$README_VERSION" ]; then
    echo "✅ All versions match!"
else
    echo "❌ Version mismatch detected!"
fi
```

---

## 📝 COMMIT MESSAGES FOR VERSIONS

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

1. **Always update VERSION file first** - It's the source of truth
2. **Keep versions synchronized** - All files must match
3. **Use annotated tags** - They include metadata
4. **Update CHANGELOG immediately** - Don't forget release notes
5. **Test before tagging** - Tags are permanent*
6. **Follow SemVer strictly** - Consistency is key

---

## 📞 VERSION SUPPORT

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
