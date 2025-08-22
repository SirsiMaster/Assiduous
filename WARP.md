# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential Commands

### Development Server
```bash
# Start local development server (choose one)
python -m http.server 8080           # Basic Python server
python serve.py                      # If serve.py exists

# Access application
open http://localhost:8080/src/
```

### Git Hooks Setup
```bash
# Install git hooks (required after cloning)
./scripts/hooks/install.sh

# This configures:
# - Conventional commit message validation
# - Commit template from .gitmessage
```

### Version Management
```bash
# Create a new release tag
./scripts/rollback/create_tag.sh 0.2.0 "AI integration release"

# Update changelog (prompts for version)
./scripts/changelog/update_changelog.sh [version]

# Rollback to previous version
./scripts/rollback/rollback_to_tag.sh v0.1.0
```

### Git Operations
```bash
# View available tags
git tag -l | sort -V

# Push tags to remote
git push origin --tags

# Emergency commit bypass (use sparingly)
git commit --no-verify
```

## Architecture Overview

Assiduous is an AI-powered real estate platform built as a progressive web application:

- **Frontend**: Static HTML5/CSS3/JavaScript (ES6+) application served from `src/index.html`
- **State Management**: Global AppState object in `assets/js/main.js` manages UI state and data flow
- **AI Integration Points**: JavaScript modules prepared for ML model integration via REST APIs
- **Internationalization**: Full i18n support with English/Spanish translations in main.js
- **Responsive Design**: Mobile-first CSS framework in `assets/css/styles.css`
- **Backend Ready**: Structure supports future API endpoints for property data, valuations, and AI services

The application uses client-side rendering with vanilla JavaScript, avoiding framework dependencies while maintaining modern development patterns. AI features currently display demo data but are architected for seamless integration with backend ML services.

## Project Conventions

### Commit Messages
Follow Conventional Commits specification:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Rules**:
- Use imperative mood ("add" not "added")
- Capitalize subject first letter
- No period at subject end
- Subject max 50 chars
- Body wrapped at 72 chars

### Branching Strategy
GitFlow-inspired model:
- `main` - Production code
- `develop` - Integration branch
- `staging` - Pre-production testing
- `feature/*` - New features
- `bugfix/*` - Bug fixes for develop
- `hotfix/*` - Emergency production fixes
- `release/*` - Release preparation
- `docs/*` - Documentation updates

Branch naming: `<type>/<issue-number>-<short-description>`

### Version Tags
Semantic versioning: `vMAJOR.MINOR.PATCH[-PRERELEASE]`
- Always create annotated tags
- Include release notes
- Update ROLLBACK_REGISTRY.md

## Directory Structure

```
assiduous/
├── src/
│   └── index.html          # Main application entry point
├── assets/
│   ├── css/
│   │   └── styles.css      # Responsive design system
│   ├── js/
│   │   └── main.js         # Core application logic & AI features
│   └── images/             # Visual assets
├── docs/
│   ├── ASSIDUOUS_TECHNICAL_BLUEPRINT.md  # Product requirements document
│   └── BRANCH_PROTECTION_RULES.md        # Git workflow rules
├── scripts/
│   ├── hooks/              # Git hooks for commit validation
│   ├── changelog/          # Automated changelog generation
│   └── rollback/           # Version rollback utilities
├── .github/
│   ├── CONTRIBUTING.md     # Contribution guidelines
│   └── ISSUE_TEMPLATE/     # Issue templates
├── CHANGELOG.md            # Version history
├── ROLLBACK_REGISTRY.md    # Rollback procedures & history
└── .gitmessage             # Commit message template
```

## Development Workflow

### Initial Setup
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/Assiduous.git
cd assiduous

# Add upstream
git remote add upstream https://github.com/SirsiMaster/Assiduous.git

# Install git hooks
./scripts/hooks/install.sh
```

### Feature Development
```bash
# Update local develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/123-property-search

# Make changes and commit
git add .
git commit  # Uses template, follows conventions

# Keep branch updated
git fetch upstream
git rebase upstream/develop

# Push to fork
git push origin feature/123-property-search
```

### Release Process
```bash
# Update changelog
./scripts/changelog/update_changelog.sh 0.2.0

# Create and push tag
./scripts/rollback/create_tag.sh 0.2.0 "Feature release"
git push origin v0.2.0

# Update ROLLBACK_REGISTRY.md manually
```

### Emergency Rollback
```bash
# Quick rollback to stable version
./scripts/rollback/rollback_to_tag.sh v0.1.0

# Push rollback (after testing)
git push --force-with-lease origin main
```

## Key Development Tasks

### Adding New Features
1. Create feature branch from `develop`
2. Implement in appropriate directory (`src/` for HTML, `assets/js/` for logic)
3. Update internationalization strings in `main.js`
4. Test responsive design on mobile/desktop
5. Update documentation if needed
6. Submit PR against `develop` branch

### Debugging
```bash
# Check git hooks are working
git commit -m "bad message"  # Should fail

# View recent commits
git log --oneline -10

# Check current branch and status
git status
git branch --show-current
```

### Testing Changes
1. Start local server: `python -m http.server 8080`
2. Test in multiple browsers
3. Verify mobile responsiveness
4. Check both English and Spanish translations
5. Test AI features with demo data

## AI Integration Points

The codebase is prepared for AI model integration at these key points:

- **Property Matching**: `AppState.propertyData` in main.js ready for ML-ranked results
- **Market Analysis**: Metrics dashboard configured for real-time data feeds
- **Chatbot**: UI and state management ready for NLP backend connection
- **Valuations**: Form handlers prepared for API calls to valuation models
- **Image Analysis**: Property cards support computer vision metadata

Backend services should expose REST endpoints that the frontend JavaScript can consume via fetch API.

## Important Notes

- No package.json or build process - pure static files
- No node_modules or npm dependencies
- Python server for local development only
- All JavaScript is vanilla ES6+ (no frameworks)
- CSS is custom (no Bootstrap/Tailwind)
- Git hooks enforce commit message format
- Protected branches require PR reviews

## Quick Reference

| Task | Command |
|------|---------|
| Start server | `python -m http.server 8080` |
| Install hooks | `./scripts/hooks/install.sh` |
| Create tag | `./scripts/rollback/create_tag.sh X.Y.Z "desc"` |
| Update changelog | `./scripts/changelog/update_changelog.sh` |
| Rollback | `./scripts/rollback/rollback_to_tag.sh vX.Y.Z` |
| View logs | `git log --oneline -10` |
| Check branch | `git branch --show-current` |
