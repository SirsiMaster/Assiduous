# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## ⚠️ CRITICAL DEVELOPMENT GOVERNANCE RULES (MUST FOLLOW)

### **RULE 0: CHALLENGE BAD IDEAS**
If my approach is flawed, tell me immediately. Product quality > accommodation.

---

### **RULE 1: CHECK SIRSI FIRST, THEN ASSIDUOUS**
Before building anything, check if it exists in Sirsi's universal library (`/Users/thekryptodragon/Development/sirsimaster-component-library`) or Assiduous codebase (`/docs/` canonical files). Everything we build flows back to Sirsi eventually - that's the virtuous cycle.

---

### **RULE 2: IMPLEMENT, DON'T INSTRUCT**
Build working code end-to-end. No "here's how to set it up" responses.

---

### **RULE 3: TEST IN BROWSER BEFORE CLAIMING COMPLETE**
Open DevTools, click through workflows, verify zero errors. If I haven't tested it in production, it's not done.

---

### **RULE 4: FOLLOW THE PIPELINE**
LOCAL → GITHUB → PROD. Never skip GitHub. Always test in production immediately.

---

### **RULE 5: MATCH EXISTING DESIGN**
Copy CSS from existing pages. If design doesn't match, it's incomplete.

---

### **RULE 6: MEASURE BY SPECS, NOT FILE COUNTS**
Completion comes from USER_STORIES.md and REQUIREMENTS_SPECIFICATION.md, not arbitrary metrics.

---

### **RULE 7: ENHANCE, DON'T DUPLICATE**
Improve existing pages rather than creating new ones. Link to `/docs/`, don't copy.

---

## THE META-RULE

**If any rule conflicts with delivering a world-class product, challenge the rule and propose a better approach.**

These rules exist to ensure quality and efficiency, not to create bureaucracy. If a rule is getting in the way of excellence, speak up and explain why a different approach would be better.

The goal is a world-class product. Everything else is negotiable.

---

## Architecture Overview

### Current Stack (Firebase Production)
- **Frontend:** Firebase Hosting (assiduous-prod.web.app)
- **Backend:** Firebase (Firestore DB, Authentication, Cloud Storage, Functions)
- **API:** Cloud Functions at `https://us-central1-assiduous-prod.cloudfunctions.net/app`
- **Security:** AES-256-GCM encryption + Firebase Security Rules
- **User Roles:** Unified "client" role (buyers/sellers) + "agent" role + "admin" role
- **State Management:** Client-side services (`public/assets/js/services/`)
- **Deployment:** GitHub (source of truth) → Firebase Hosting

### Business Model Priority
- **70% Focus:** Micro-Flipping Engine ($2-5K per deal)
- **30% Focus:** Traditional Real Estate (lead generation)

### Key Services
- `firebaseservice.js` - Core database operations with encryption
- `auth.js` - Authentication and session management
- `crm.js` - Client relationship management
- `encryptionservice.js` - Field-level encryption layer

### Firebase Collections
- `users` - Encrypted user profiles (email, phone, SSN)
- `properties` - Listings with investment scoring
- `transactions` - Deal pipeline management
- `messages` - Communication logs
- `notifications` - Real-time alerts
- `development_sessions` - Dev metrics tracking
- `development_metrics` - Daily aggregated metrics

---

## Universal Component System (UCS)

### Overview
Assiduous uses a **Universal Component System (UCS)** that provides role-based component rendering.
Write component HTML/CSS once, use everywhere with automatic role-based filtering.

### UCS Core Files
- `public/components/ucs-core.js` - Role detection, filtering, mounting engine
- `public/components/component-registry.js` - Component registration and configuration
- `public/components/sidebar-root.html` - Universal sidebar template with data-roles
- `public/components/universal-header.html` - Universal header template
- `public/components/admin-layout.css` - Shared styling (dark navy sidebar, professional header)

### How UCS Works
1. **Role Detection:** Automatically detects user role from URL path (`/admin/`, `/agent/`, `/client/`)
2. **Component Loading:** Fetches universal templates from root files
3. **Role Filtering:** Hides/shows elements based on `data-roles="admin,agent,client"` attributes
4. **Token Replacement:** Replaces `[[BASE]]` and `[[USER_*]]` tokens with actual values
5. **Event Binding:** Executes component-specific onLoad callbacks

### Using UCS in Pages
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Your Page</title>
    <link rel="stylesheet" href="../assiduous.css">
    <link rel="stylesheet" href="../components/admin-layout.css">
</head>
<body class="admin-wrapper" data-active="page-key">
    <!-- UCS Sidebar Component -->
    <aside class="sidebar" data-component="sidebar"></aside>
    
    <!-- Main Content Area -->
    <div class="main-content">
        <!-- UCS Header Component -->
        <header data-component="header"></header>
        
        <!-- Your Page Content -->
        <div class="dashboard-content">
            <h1>Your Page Content</h1>
        </div>
    </div>
    
    <!-- UCS Core Scripts -->
    <script src="../components/ucs-core.js"></script>
    <script src="../components/component-registry.js"></script>
</body>
</html>
```

### Adding Navigation Items to Sidebar
Edit `public/components/sidebar-root.html` and add `data-roles` attribute:

```html
<!-- Visible to all roles -->
<a href="dashboard.html" class="nav-item" data-key="dashboard" data-roles="admin,agent,client">
  <svg class="nav-icon">...</svg>
  Dashboard
</a>

<!-- Visible to admin only -->
<a href="analytics.html" class="nav-item" data-key="analytics" data-roles="admin">
  <svg class="nav-icon">...</svg>
  Analytics
</a>

<!-- Visible to agents and clients -->
<a href="market.html" class="nav-item" data-key="market" data-roles="agent,client">
  <svg class="nav-icon">...</svg>
  Market Analysis
</a>
```

### UCS Benefits
- **5,000+ lines of code removed** - No hardcoded sidebar/header HTML
- **ONE source of truth** - Edit sidebar-root.html once, updates everywhere
- **Automatic role filtering** - No manual role checks needed
- **Consistent design** - Same dark navy sidebar across all roles
- **Easy maintenance** - Add new nav items in one place

---

### Project Conventions

### OSS-First Components
For commodity UI widgets (QR codes, charts, date pickers, sliders, toasts, etc.), always prefer a small, well-maintained
open-source component over writing a bespoke implementation. Integrate the OSS widget behind the existing UCS/component
system so it can be reused and themed consistently. Only implement custom rendering logic when we truly need behavior
that is not covered by a vetted OSS option.

### Commit Messages
Follow Conventional Commits specification:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Rules:**
- Use imperative mood ("add" not "added")
- Capitalize subject first letter
- No period at subject end
- Subject max 50 chars
- Body wrapped at 72 chars

**Examples:**
```
feat(auth): Add Firebase authentication flow
fix(dashboard): Resolve metric calculation bug
docs(readme): Update installation instructions
```

### Branching Strategy
- `main` - Production code (protected)
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency production fixes
- `docs/*` - Documentation updates

Branch naming: `<type>/<issue-number>-<short-description>`

### Version Tags
Semantic versioning: `vMAJOR.MINOR.PATCH[-PRERELEASE]`
- Always create annotated tags
- Include release notes
- Update changelog.md

---

## Essential Commands

### Development Server
```bash
# Start local development server
cd /Users/thekryptodragon/Development/assiduous
python -m http.server 8080

# Access application locally
open http://localhost:8080/public/
```

### Git Operations
```bash
# View recent commits
git log --oneline -10

# Check current status
git status

# View available tags
git tag -l | sort -V

# Push tags to remote
git push origin --tags
```

### Firebase Deployment
```bash
# Install Firebase CLI (if needed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to production
firebase deploy --only hosting

# Deploy specific services
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage

# View deployment logs
firebase functions:log
```

### Git Hooks Setup
```bash
# Install git hooks (required after cloning)
./scripts/hooks/install.sh

# This configures:
# - Conventional commit message validation
# - Commit template from .gitmessage
# - Automatic metrics updates
```

---

## Important URLs

### Production (Firebase Hosting)
- **Primary:** https://assiduous-prod.web.app
- **API Endpoint:** https://us-central1-assiduous-prod.cloudfunctions.net/app

### Admin Portal
- **Dashboard:** https://assiduous-prod.web.app/admin/dashboard.html
- **Analytics:** https://assiduous-prod.web.app/admin/analytics.html
- **Properties:** https://assiduous-prod.web.app/admin/properties.html
- **Agents:** https://assiduous-prod.web.app/admin/agents.html
- **Clients:** https://assiduous-prod.web.app/admin/clients.html

### Development Portal
- **Dev Dashboard:** https://assiduous-prod.web.app/admin/development/dashboard.html
- **Dev Analytics:** https://assiduous-prod.web.app/admin/development/analytics.html
- **Dev Docs:** https://assiduous-prod.web.app/admin/development/docs.html
- **Dev Costs:** https://assiduous-prod.web.app/admin/development/costs.html

### GitHub
- **Repository:** https://github.com/SirsiMaster/Assiduous
- **Component Library:** https://github.com/SirsiMaster/sirsimaster-component-library
- **Actions:** https://github.com/SirsiMaster/Assiduous/actions

### Firebase Console
- **Project Overview:** https://console.firebase.google.com/project/assiduous-prod/overview
- **Hosting:** https://console.firebase.google.com/project/assiduous-prod/hosting
- **Firestore:** https://console.firebase.google.com/project/assiduous-prod/firestore
- **Functions:** https://console.firebase.google.com/project/assiduous-prod/functions

### Local Development
```bash
# After starting server: python -m http.server 8080
http://localhost:8080/public/
http://localhost:8080/public/admin/dashboard.html
http://localhost:8080/public/client/
```

---

## Directory Structure

```
assiduous/
├── public/
│   ├── components/         # Universal Component System
│   │   ├── sidebar-root.html
│   │   ├── universal-header.html
│   │   ├── ucs-core.js
│   │   └── admin-layout.css
│   ├── admin/              # Admin portal
│   │   ├── development/    # Development metrics dashboard
│   │   └── *.html          # Admin pages
│   ├── agent/              # Agent portal
│   ├── client/             # Client portal
│   ├── assets/
│   │   ├── js/services/    # Firebase services
│   │   └── css/            # Stylesheets
│   └── index.html          # Landing page
├── docs/                   # Canonical documentation
│   ├── USER_STORIES.md
│   ├── REQUIREMENTS_SPECIFICATION.md
│   ├── PROJECT_SCOPE.md
│   ├── METRICS_TAXONOMY.md
│   └── *.md
├── scripts/
│   ├── hooks/              # Git hooks
│   ├── changelog/          # Version management
│   └── rollback/           # Rollback utilities
├── .github/
│   └── workflows/          # GitHub Actions
├── firebase.json           # Firebase configuration
├── package.json            # Dependencies
├── WARP.md                 # This file
└── README.md               # Project overview
```

---

## Canonical Documentation Files

All canonical documentation lives in `/docs/`:

1. **USER_STORIES.md** - 27 user stories with acceptance criteria and story points
2. **REQUIREMENTS_SPECIFICATION.md** - 7 core features with detailed requirements
3. **PROJECT_SCOPE.md** - MVP plan, portal requirements, 10-day timeline
4. **METRICS_TAXONOMY.md** - How metrics are categorized and measured
5. **ARCHITECTURE.md** - System architecture and design decisions
6. **SECURITY.md** - Security implementation and best practices
7. **API_REFERENCE.md** - API endpoints and usage
8. **DEPLOYMENT_GUIDE.md** - Deployment procedures and environments
9. **TESTING_STRATEGY.md** - Testing approach and QA procedures
10. **CONTRIBUTING.md** - Contribution guidelines
11. **CHANGELOG.md** - Version history and release notes
12. **ROLLBACK_REGISTRY.md** - Rollback procedures and history

These documents define the ground truth for the project. When measuring completion, always reference these canonical sources.

---

## Final Note

These rules exist to help deliver a world-class product efficiently. They're based on hard-won lessons from building Assiduous and will continue to evolve as we learn more.

**Remember the virtuous cycle:**
Build → Learn → Abstract → Improve → Repeat

Every solution we create in Assiduous makes Sirsi stronger for the next app. Every app built with Sirsi makes building apps faster and better.

That's the goal. That's the assignment.
