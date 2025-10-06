# Canonical Documentation Structure

**Last Updated**: January 6, 2025  
**Purpose**: Define the authoritative documents that guide ALL development

---

## 🎯 Core Principle

**THESE DOCUMENTS ARE THE SINGLE SOURCE OF TRUTH**

All planning, tracking, and documentation MUST use these files. No additional planning documents should be created.

---

## 📚 The Canonical Five

### 1. **WARP.md** (Development Rules & Guidelines)
**Location**: `/WARP.md`  
**Purpose**: Development governance and rules  
**Contains**:
- RULE 0-4: Critical development governance rules
- Essential commands and workflows
- Architecture overview
- Component system guidelines
- Git conventions
- Branch strategy
- Deployment procedures

**When to Update**: When adding new rules, changing architecture, or modifying workflows

---

### 2. **Technical Blueprint** (Product Requirements)
**Location**: `/docs/assiduous_technical_blueprint.md`  
**Purpose**: Complete product vision and technical specifications  
**Contains**:
- Executive summary
- Product vision and objectives
- Target market and user personas
- Core features and functionality
- Technical architecture
- AI/ML components
- UI/UX specifications
- Data management
- Security and compliance
- Performance requirements
- Integration requirements
- Success metrics and KPIs
- Risk assessment
- **Development roadmap** (long-term vision)

**When to Update**: When adding new features to the product vision, changing architecture, or updating technical requirements

---

### 3. **10_DAY_MVP_PLAN.md** (Active Development Plan)
**Location**: `/docs/10_DAY_MVP_PLAN.md`  
**Purpose**: Current development plan and phase tracking  
**Contains**:
- Current phase status
- Phase 1-2 completion (✅ DONE)
- **Phase 3: Agent Portal** (⚡ ACTIVE)
- Phase 4: Authentication (📋 PLANNED)
- Phase 5: Backend API (📋 PLANNED)
- Phase 6-9: Future phases
- Task breakdowns with time estimates
- Success criteria for each phase
- Firestore schema
- API endpoint specifications

**When to Update**:
- Mark phases complete as they finish
- Update current phase status
- Add new tasks as they're identified
- Track progress on active phase

---

### 4. **CHANGELOG.md** (Version History)
**Location**: `/CHANGELOG.md`  
**Purpose**: Record ALL accomplishments and version increments  
**Contains**:
- Version numbers (semantic versioning)
- Release dates
- Added features
- Changed functionality
- Fixed bugs
- Deprecated features
- Removed features
- Security updates

**When to Update**: After EVERY significant change, feature completion, or bug fix

**Format**:
```markdown
## [VERSION] - DATE

### Added
- New features

### Changed
- Modified functionality

### Fixed
- Bug fixes

### Deprecated
- Features being phased out

### Removed
- Deleted features

### Security
- Security updates
```

---

### 5. **README.md** (Project Overview)
**Location**: `/README.md`  
**Purpose**: Project introduction and quick reference  
**Contains**:
- Project description
- Quick start guide
- Installation instructions
- Key features overview
- Technology stack
- Links to other canonical documents
- Contact information

**When to Update**: When project fundamentals change or major features are added

---

## 🚫 What NOT to Create

### ❌ NEVER Create These:
- "Next Steps" documents
- "Action Plan" documents
- "Implementation Guide" documents (unless required by Technical Blueprint)
- "Completion Summary" documents
- "Assessment Report" documents
- "Status Update" documents
- Duplicate planning documents

### ✅ Instead:
- Update the **10_DAY_MVP_PLAN.md** with current phase
- Update the **CHANGELOG.md** with accomplishments
- Add rules to **WARP.md** if needed
- Expand **Technical Blueprint** for new features

---

## 📋 Decision Matrix: Where Does This Belong?

| Information Type | Canonical Document |
|------------------|-------------------|
| Development rules and governance | WARP.md |
| New product feature specs | Technical Blueprint |
| Current phase status | 10_DAY_MVP_PLAN.md |
| Task breakdown for active phase | 10_DAY_MVP_PLAN.md |
| Completed work | CHANGELOG.md |
| Bug fixes | CHANGELOG.md |
| Version increments | CHANGELOG.md |
| Project overview | README.md |
| Quick start | README.md |

---

## 🔄 Update Workflow

### When Completing a Phase:
1. ✅ Mark phase complete in **10_DAY_MVP_PLAN.md**
2. ✅ Add entry to **CHANGELOG.md** with version bump
3. ✅ Update **README.md** if major features added
4. ✅ Commit with proper conventional commit message

### When Starting a New Phase:
1. ✅ Review **10_DAY_MVP_PLAN.md** for current phase details
2. ✅ Check **WARP.md** for rules and guidelines
3. ✅ Reference **Technical Blueprint** for feature specs
4. ✅ Follow RULE 4 QA/QC before claiming complete

### When Adding New Features:
1. ✅ Add to **Technical Blueprint** (product vision)
2. ✅ Add tasks to **10_DAY_MVP_PLAN.md** (implementation)
3. ✅ After completion, log in **CHANGELOG.md**

---

## 🎯 Current State (January 6, 2025)

### Phase 1-2: COMPLETE ✅
- Documented in: CHANGELOG.md v0.28.0
- Status in: 10_DAY_MVP_PLAN.md (marked complete)

### Phase 3: ACTIVE ⚡
- Documented in: 10_DAY_MVP_PLAN.md (Agent Portal section)
- Next: Build /agent/dashboard.html

### Phase 4-9: PLANNED 📋
- Documented in: 10_DAY_MVP_PLAN.md (future phases)

---

## ⚖️ Document Hierarchy

```
WARP.md                           (HOW we develop)
    ↓
Technical Blueprint               (WHAT we're building)
    ↓
10_DAY_MVP_PLAN.md               (WHEN/HOW we build it)
    ↓
CHANGELOG.md                      (WHAT we've built)
    ↓
README.md                         (OVERVIEW for everyone)
```

---

## 🔒 Commitment

**AI Assistant Pledge**:
> I commit to ONLY using these five canonical documents for all planning, tracking, and documentation. I will NOT create additional planning documents. All status updates, phase tracking, and accomplishment recording will be done in these established documents.

**When in Doubt**:
- Check **10_DAY_MVP_PLAN.md** for current phase
- Check **WARP.md** for rules
- Check **Technical Blueprint** for feature specs
- Update **CHANGELOG.md** when done
- ASK before creating ANY new document

---

## 📖 Document Locations

### Core Canonical Documents (USE THESE)
```
/WARP.md                                          (Development rules)
/README.md                                        (Project overview)
/CHANGELOG.md                                     (Version history)
/docs/assiduous_technical_blueprint.md           (Product vision)
/docs/10_DAY_MVP_PLAN.md                         (Active development)
```

### Technical Reference Docs (Implementation Guides)
```
/docs/api_docs.md                                (API reference)
/docs/GOOGLE_KMS_IMPLEMENTATION.md               (KMS setup)
/docs/GITHUB_SECRETS_SETUP.md                    (Secrets config)
/docs/SIRSIMASTER_UI_IMPLEMENTATION.md           (UI library)
/docs/COMPONENT_LIBRARY_MIGRATION.md             (Component migration)
/docs/OPENSIGN_INTEGRATION.md                    (Contract signing)
/docs/SECURITY_AUDIT_REPORT.md                   (Security audit)
/docs/SECURITY_IMPLEMENTATION_SUMMARY.md         (Security summary)
/docs/sirsi_contract_amendment.md                (Contract amendment)
```

### Archive (Historical/Redundant docs moved)
```
/.archive/restructure/                           (Directory restructure docs)
/.archive/redundant-workflow-docs/               (Consolidated into WARP.md)
/.archive/redundant-security-docs/               (Consolidated into security docs)
/.archive/admin-dev-docs/                        (Admin development logs)
```

---

**Version**: 1.0  
**Status**: ACTIVE  
**Review**: This document itself should be reviewed quarterly
