# Documentation Cleanup Plan

## 🎯 Goal
Reduce to 5 CANONICAL files + essential technical references only

---

## ✅ 5 CANONICAL DOCS (KEEP - Root Level)

1. `WARP.md` - Development governance
2. `README.md` - Project overview  
3. `CHANGELOG.md` - Version history
4. `CANONICAL_DOCS.md` - Documentation index
5. `rollback_registry.md` - Rollback history

**In docs/:**
- `docs/assiduous_technical_blueprint.md` - Product vision (PRD)
- `docs/10_DAY_MVP_PLAN.md` - Active development plan

---

## 📋 RESTRUCTURE DOCS (CONSOLIDATE → ARCHIVE)

These 3 docs describe the SAME thing (directory restructure):
- `RESTRUCTURE_SUMMARY.md` → Consolidate into CHANGELOG
- `RESTRUCTURE_COMPLETE.md` → Consolidate into CHANGELOG  
- `FINAL_VERIFICATION.md` → Consolidate into CHANGELOG
- `docs/DIRECTORY_RESTRUCTURE_PLAN.md` → Archive (historical reference)

**Action**: Add summary to CHANGELOG.md, move details to .archive/

---

## 📚 TECHNICAL REFERENCE DOCS (KEEP in docs/)

Essential implementation guides:
- `docs/api_docs.md` - API reference
- `docs/GOOGLE_KMS_IMPLEMENTATION.md` - KMS setup
- `docs/GITHUB_SECRETS_SETUP.md` - Secrets config
- `docs/SIRSIMASTER_UI_IMPLEMENTATION.md` - UI library
- `docs/COMPONENT_LIBRARY_MIGRATION.md` - Component migration
- `docs/OPENSIGN_INTEGRATION.md` - Contract signing
- `docs/SECURITY_AUDIT_REPORT.md` - Security audit
- `docs/SECURITY_IMPLEMENTATION_SUMMARY.md` - Security summary

---

## 🗂️ WORKFLOW DOCS (CONSOLIDATE → 1 FILE)

Merge these into ONE: `docs/DEVELOPMENT_GUIDE.md`
- `docs/development_workflow.md`
- `docs/workflow_documentation.md`
- `docs/automated_versioning.md`
- `docs/versioning_guide.md`
- `docs/branch_protection_rules.md`
- `docs/github_setup.md`
- `docs/automation_deployment_guide.md`
- `docs/quick_reference.md`
- `docs/master_implementation_guide.md`
- `docs/project_documentation.md`

---

## 🔒 SECURITY DOCS (CONSOLIDATE → 1 FILE)

Merge these into: `docs/SECURITY_GUIDE.md`
- `docs/security.md`
- `docs/security_implementation.md`
- `docs/security_quickstart.md`

---

## 🗄️ STATUS/PLANNING DOCS (DELETE/ARCHIVE)

Already tracked in CHANGELOG/MVP_PLAN:
- `PROJECT_STATUS.md` → DELETE (redundant with CHANGELOG)
- `docs/financial_verification.md` → Archive

---

## 📁 ADMIN DEV DOCS (MOVE TO .archive/)

These are in public/ (shouldn't be deployed):
- `public/admin/readme.md`
- `public/admin/development/development_log_20250907.md`
- `public/admin/development/firebase_schema.md`
- `public/admin/development/test_verification.md`
- `public/admin/development/backups/rollback_instructions.md`

---

## 📊 DATA DOCS (KEEP as Historical Reference)

Keep in data/:
- `data/development_history/*.md` - Historical snapshots

---

## 🛠️ SCRIPTS DOCS (KEEP - Necessary)

Keep in scripts/:
- `scripts/README.md` - Scripts documentation
- `scripts/METRICS_AUTOMATION.md` - Metrics guide
- `scripts/hooks/readme.md` - Git hooks guide

---

## 📝 GITHUB TEMPLATES (KEEP - Necessary)

Keep in .github/:
- `.github/CONTRIBUTING.md`
- `.github/ISSUE_TEMPLATE/*.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

---

## 🎯 FINAL STRUCTURE

```
Root (5 Canonical):
├── WARP.md
├── README.md
├── CHANGELOG.md (with restructure summary)
├── CANONICAL_DOCS.md (updated index)
└── rollback_registry.md

docs/ (Essentials Only):
├── assiduous_technical_blueprint.md (PRD)
├── 10_DAY_MVP_PLAN.md (Active Plan)
├── DEVELOPMENT_GUIDE.md (NEW - consolidated workflows)
├── SECURITY_GUIDE.md (NEW - consolidated security)
├── api_docs.md
├── GOOGLE_KMS_IMPLEMENTATION.md
├── GITHUB_SECRETS_SETUP.md
├── SIRSIMASTER_UI_IMPLEMENTATION.md
├── COMPONENT_LIBRARY_MIGRATION.md
├── OPENSIGN_INTEGRATION.md
├── SECURITY_AUDIT_REPORT.md
└── SECURITY_IMPLEMENTATION_SUMMARY.md

.archive/restructure/:
├── RESTRUCTURE_SUMMARY.md
├── RESTRUCTURE_COMPLETE.md
├── FINAL_VERIFICATION.md
└── DIRECTORY_RESTRUCTURE_PLAN.md
```

**Total Root Docs**: 5 canonical files
**Total docs/ Files**: ~15 (down from 35+)
**Reduction**: ~60% fewer docs

---

## ✅ EXECUTION ORDER

1. Update CHANGELOG with restructure summary
2. Create docs/DEVELOPMENT_GUIDE.md (consolidate workflows)
3. Create docs/SECURITY_GUIDE.md (consolidate security)
4. Move restructure docs to .archive/
5. Delete redundant docs
6. Move admin dev docs to .archive/
7. Update CANONICAL_DOCS.md with new index
8. Commit and push
