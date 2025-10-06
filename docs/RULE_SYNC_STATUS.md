# Rule Synchronization Status

**Last Updated**: 2025-10-06  
**Status**: ✅ SYNCHRONIZED

## Overview

This document tracks the synchronization status between WARP.md and CLAUDE.md to ensure both AI assistants (Warp and Claude) follow identical development rules.

## Current Synchronization

| File | Version | Last Updated | Rules Count | Status |
|------|---------|--------------|-------------|--------|
| `WARP.md` | 1.0.0 | 2025-10-06 | 5 (0-5) | ✅ Active |
| `CLAUDE.md` | 1.0.0 | 2025-10-06 | 5 (0-5) | ✅ Active |

## Rule Comparison

| Rule | WARP.md | CLAUDE.md | Synchronized |
|------|---------|-----------|--------------|
| **RULE 0** | Check SirsiMaster Component Library First | ✅ Identical | ✅ Yes |
| **RULE 1** | Always Check Existing Documentation First | ✅ Identical | ✅ Yes |
| **RULE 2** | Mandatory Completion Verification | ✅ Identical | ✅ Yes |
| **RULE 3** | Validate Ground Truth | ✅ Identical | ✅ Yes |
| **RULE 4** | Mandatory Harsh QA/QC Assessment | ✅ Identical | ✅ Yes |
| **RULE 5** | Mandatory Development Pipeline | ✅ Identical | ✅ Yes |

## Key Requirements

### Development Pipeline (RULE 5)
```
DEV (8081) → TEST (8082) → STAGING (8083) → GitHub → Firebase Production
```

**Mandatory at each stage:**
1. Full browser testing with DevTools
2. QA/QC assessment (RULE 4)
3. Approval gate confirmation
4. Documentation of changes
5. Verification of no regressions

### Prohibited Actions
- ❌ Skipping pipeline stages
- ❌ Editing files directly in test/staging/production
- ❌ Creating unauthorized directories (e.g., `public/`)
- ❌ Recreating existing files from scratch
- ❌ Deploying without GitHub commit
- ❌ Bypassing approval gates

### Required Actions
- ✅ All work starts in `environments/dev/`
- ✅ Use promotion scripts for stage transitions
- ✅ Build on existing UI/content
- ✅ Preserve all existing functionality
- ✅ Test in browser at each stage
- ✅ Commit to GitHub before Firebase deploy

## Synchronization Process

When updating rules:

1. **Update Both Files**
   ```bash
   nano WARP.md      # Make changes
   nano CLAUDE.md    # Make identical changes
   ```

2. **Verify Synchronization**
   ```bash
   # Compare rule sections
   diff <(grep "^### \*\*RULE" WARP.md) <(grep "^### \*\*RULE" CLAUDE.md)
   ```

3. **Commit Together**
   ```bash
   git add WARP.md CLAUDE.md docs/RULE_SYNC_STATUS.md
   git commit -m "docs: synchronize rules - [describe changes]"
   git push
   ```

4. **Update This Document**
   - Update "Last Updated" date
   - Update version numbers if needed
   - Document what changed

## Change History

### 2025-10-06 - Initial Synchronization
- Created CLAUDE.md from WARP.md
- Added RULE 5: Mandatory Development Pipeline
- Established synchronization protocol
- Both files now at version 1.0.0

## Verification Checklist

Before claiming synchronization complete:

- [ ] Both files have identical rule count
- [ ] Both files have identical rule numbers (0-5)
- [ ] Both files have identical rule titles
- [ ] Both files have identical rule content
- [ ] Both files have identical mandatory workflow steps
- [ ] Both files have identical prohibited actions
- [ ] Both files reference each other
- [ ] Both files committed together
- [ ] This status document updated

## Future Updates

When adding new rules:

1. **Assign next rule number** (RULE 6, RULE 7, etc.)
2. **Update WARP.md** with new rule
3. **Update CLAUDE.md** with identical rule
4. **Update this document** with new rule info
5. **Commit all three files together**
6. **Test that both AI assistants follow new rule**

## Contact

Questions about rule synchronization:
- Review `WARP.md` for Warp-specific guidance
- Review `CLAUDE.md` for Claude-specific guidance
- Both files should have identical rules
- Report discrepancies immediately

---

**Status**: ✅ SYNCHRONIZED  
**Confidence**: HIGH  
**Action Required**: None - maintain synchronization on future updates
