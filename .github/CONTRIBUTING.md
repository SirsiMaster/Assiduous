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
