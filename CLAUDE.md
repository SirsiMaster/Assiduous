# CLAUDE.md

This file provides mandatory development rules for Claude AI when working with this repository.

**CRITICAL: These rules are synchronized with WARP.md and must remain identical.**

---

## 🚨 ABSOLUTE DEVELOPMENT RULES (NEVER VIOLATE)

### **RULE 0: CHECK SIRSIMASTER COMPONENT LIBRARY FIRST**
**Before creating ANY UI component, utility, or shared functionality:**
- **ALWAYS** check the SirsiMaster Component Library at `/Users/thekryptodragon/Development/sirsimaster-component-library`
- **USE** existing library components instead of creating new ones
- **REFERENCE** the library's WARP.md for component usage guidelines
- **CONTRIBUTE** new generic components to the library, not this project
- **Library GitHub**: https://github.com/SirsiMaster/sirsimaster-component-library

### **RULE 1: ALWAYS CHECK EXISTING DOCUMENTATION FIRST**
**Before starting ANY task, you MUST:**
- Read and understand ALL existing project documentation
- Verify what functionality already exists and is working
- Check against established project plans and architecture
- Ensure you're not duplicating work or breaking existing functionality
- Review similar implementations that already exist in the project
- **NEVER modify or break existing working files without explicit instruction**
- **NEVER recreate or simplify existing code**
- **ALWAYS build on top of existing UI/content**

### **RULE 2: MANDATORY COMPLETION VERIFICATION**
**Before reporting ANY task as complete, you MUST:**
- Run the completion verification script: `./scripts/verify_completion.sh`
- Test all functionality you claim to have implemented
- Verify that claimed changes actually exist in the files
- Confirm that all components/pages work as specified
- Check that nothing existing was broken by your changes
- **NEVER report completion without running verification**

### **RULE 3: VALIDATE GROUND TRUTH**
**After completing ANY development work, you MUST:**
- Test all implemented functionality against the project requirements
- Update development documentation to reflect current reality
- Ensure analytics and dashboards show accurate current status
- Report the true development status, not assumptions
- Validate that the project state matches what you report
- **The documentation and dashboards must reflect ground truth, always**

### **RULE 4: MANDATORY HARSH QA/QC ASSESSMENT BEFORE COMPLETION CLAIMS**
**Before claiming ANY feature/task is complete, you MUST perform this severe assessment:**

#### **A. Browser-Based End-to-End Testing (CRITICAL)**
1. **NEVER claim completion without actual browser testing**
2. **Open every page in a real browser** (not just HTTP status checks)
3. **Open browser DevTools Console** and check for JavaScript errors
4. **Click through EVERY user flow** from start to finish
5. **Test on mobile device or responsive view**
6. **Verify data actually loads** (not just loading spinners)
7. **Check that all buttons and links work**
8. **Confirm all API calls succeed** (check Network tab)

#### **B. Method/Function Verification**
1. **Verify ALL called methods exist** before using them
2. **Verify ALL imports are correct** and files exist at specified paths
3. **Check ALL event handlers** are properly bound
4. **Validate ALL data transformations** work with real data

#### **C. Complete User Workflow Validation**
For EVERY user role (client, agent, admin), verify:
1. User can access their dashboard - loads without errors
2. User can view list pages - data displays correctly
3. User can view detail pages - all fields populate
4. User can perform CRUD operations - create, read, update, delete all work
5. User can navigate between pages - all links work
6. User workflows are end-to-end complete

#### **D. Critical Self-Assessment Questions**
Before claiming completion, answer these questions HONESTLY:

1. ❓ **Did I test this in an actual browser?** - If NO → NOT COMPLETE
2. ❓ **Did I check the browser console for errors?** - If NO → NOT COMPLETE
3. ❓ **Did I click through the entire user workflow?** - If NO → NOT COMPLETE
4. ❓ **Did I verify all methods/functions exist?** - If NO → NOT COMPLETE
5. ❓ **Can a real user actually accomplish the intended task?** - If NO or UNSURE → NOT COMPLETE
6. ❓ **Would this work if deployed to production right now?** - If NO or UNSURE → NOT COMPLETE
7. ❓ **Have I verified backend AND frontend work together?** - If NO → NOT COMPLETE
8. ❓ **Are there any assumptions I haven't verified?** - If YES → NOT COMPLETE until verified

#### **E. Completion Criteria Checklist**
A task is ONLY complete when ALL of these are TRUE:

- [ ] ✅ All code written and committed
- [ ] ✅ All files deployed to appropriate environment
- [ ] ✅ Tested in actual browser with DevTools open
- [ ] ✅ Zero JavaScript console errors
- [ ] ✅ All user workflows tested end-to-end
- [ ] ✅ All methods/functions verified to exist
- [ ] ✅ All API calls return expected data
- [ ] ✅ All database operations work correctly
- [ ] ✅ All UI elements visible and functional
- [ ] ✅ All navigation links work correctly
- [ ] ✅ Can confidently demo to stakeholder right now
- [ ] ✅ Would recommend deploying to real users

---

### **RULE 5: MANDATORY DEVELOPMENT PIPELINE (NEVER SKIP)**
**ALL code changes MUST flow through this pipeline. NO EXCEPTIONS.**

#### **A. Pipeline Flow (STRICT ORDER)**
```
DEV → TEST → STAGING → GITHUB → FIREBASE PRODUCTION
```

**Each stage is a mandatory checkpoint. You CANNOT skip stages.**

#### **B. Environment Specifications**

| Environment | Port | Directory | Purpose | Server URL |
|-------------|------|-----------|---------|------------|
| **DEV** | 8081 | `environments/dev/` | Active development, frequent changes | http://localhost:8081 |
| **TEST** | 8082 | `environments/test/` | Testing and validation | http://localhost:8082 |
| **STAGING** | 8083 | `environments/staging/` | Final verification before production | http://localhost:8083 |
| **PROD** | N/A | `firebase-migration-package/assiduous-build/` | Live production site | https://assiduousflip.web.app |

#### **C. Development Workflow (MANDATORY STEPS)**

**Step 1: DEV Environment**
1. Make ALL changes in `environments/dev/` directory ONLY
2. Start dev server: `./scripts/dev-server.sh start`
3. Test changes at http://localhost:8081
4. Run RULE 4 QA/QC assessment (full browser testing)
5. Fix ALL bugs found
6. Document changes

**Step 2: Promote DEV → TEST**
1. Run: `./scripts/promote.sh dev-to-test`
2. Review changes to be promoted
3. Type `yes` to confirm
4. Test at http://localhost:8082
5. Run RULE 4 QA/QC assessment again
6. Verify no regressions

**Step 3: Promote TEST → STAGING**
1. Run: `./scripts/promote.sh test-to-staging`
2. Review changes
3. Type `yes` to confirm
4. Test at http://localhost:8083
5. Run RULE 4 QA/QC final assessment
6. Verify production-ready

**Step 4: Promote STAGING → PROD**
1. Run: `./scripts/promote.sh staging-to-prod`
2. Review changes
3. Type `yes` to confirm
4. Changes copied to `firebase-migration-package/assiduous-build/`
5. Commit to GitHub: `git add . && git commit -m "..." && git push`

**Step 5: Deploy PROD → Firebase**
1. Run: `./scripts/promote.sh deploy`
2. Complete pre-deployment checklist
3. Type `DEPLOY TO PRODUCTION` (exact text)
4. Firebase deploys automatically
5. Verify at https://assiduousflip.web.app
6. Run post-deployment smoke tests

#### **D. Pipeline Rules (ABSOLUTE)**

**NEVER:**
- ❌ Edit files directly in `test/`, `staging/`, or `assiduous-build/`
- ❌ Skip environments (DEV → PROD is FORBIDDEN)
- ❌ Deploy without testing in all environments
- ❌ Promote with known bugs
- ❌ Deploy without Git commit
- ❌ Make changes directly in production
- ❌ Bypass approval gates
- ❌ Create a `public/` directory (unauthorized architecture change)
- ❌ Recreate existing files from scratch
- ❌ Simplify or remove existing functionality

**ALWAYS:**
- ✅ Start in DEV environment
- ✅ Test in each environment before promoting
- ✅ Run QA/QC at each stage
- ✅ Document what changed
- ✅ Get approval before promoting
- ✅ Commit to GitHub before Firebase deploy
- ✅ Verify deployment succeeded
- ✅ Build on existing UI/content/structure
- ✅ Preserve all existing functionality

#### **E. Validation Requirements Per Stage**

**DEV Stage Validation:**
- ✅ Code compiles/runs without errors
- ✅ All new features work as expected
- ✅ No console errors in browser DevTools
- ✅ All links and navigation work
- ✅ Mobile responsive design works
- ✅ Builds on existing structure (no recreations)

**TEST Stage Validation:**
- ✅ All DEV features still work
- ✅ No regressions in existing features
- ✅ Integration with existing code works
- ✅ API calls succeed
- ✅ Data persists correctly

**STAGING Stage Validation:**
- ✅ Production-ready quality
- ✅ All user workflows complete end-to-end
- ✅ Performance acceptable (page load < 3s)
- ✅ No known bugs
- ✅ Ready to show stakeholders

**PROD Stage Validation:**
- ✅ Deployed successfully to Firebase
- ✅ All pages accessible at production URL
- ✅ All functionality works in production
- ✅ No errors in production logs
- ✅ Analytics tracking works

#### **F. Server Management Commands**

```bash
# Start all servers
./scripts/dev-server.sh start

# Check server status
./scripts/dev-server.sh status

# Stop all servers
./scripts/dev-server.sh stop

# Restart servers
./scripts/dev-server.sh restart
```

#### **G. GitHub as Source of Truth**

**CRITICAL: GitHub is the single source of truth**

- All code in `environments/dev/` is work-in-progress
- All code in `firebase-migration-package/assiduous-build/` is committed to GitHub
- GitHub main branch = what's in production
- Never deploy to Firebase without pushing to GitHub first

**Deployment flow:**
```
DEV → TEST → STAGING → assiduous-build → GitHub → Firebase
```

---

## 📋 DEVELOPMENT BEST PRACTICES

### **When Making Changes:**
1. **Read existing code first** - understand what's already there
2. **Build incrementally** - add to existing structure, don't replace
3. **Preserve existing patterns** - follow established conventions
4. **Test frequently** - don't write large amounts of untested code
5. **Document as you go** - update docs when changing functionality

### **When Creating New Features:**
1. **Check if similar feature exists** - learn from existing implementations
2. **Use existing components** - especially from SirsiMaster Component Library
3. **Follow existing UI patterns** - maintain consistency
4. **Use existing services** - don't duplicate API calls or data handling
5. **Add to existing pages** - don't create parallel structures

### **When Fixing Bugs:**
1. **Understand the root cause** - don't just patch symptoms
2. **Test the fix thoroughly** - ensure it actually resolves the issue
3. **Check for regressions** - make sure fix doesn't break other things
4. **Update tests if applicable** - prevent regression in future
5. **Document the fix** - explain what was wrong and how it's fixed

### **When Working with UI:**
1. **Never use emojis as icons** - use proper SVG icons
2. **Never use inline styles** - use CSS classes and variables
3. **Always use existing CSS variables** - maintain design consistency
4. **Always test mobile responsive** - ensure works on all screen sizes
5. **Always check browser console** - verify no JavaScript errors

---

## 🎯 HONESTY AND TRANSPARENCY

### **When Reporting Status:**

**NEVER say:**
- ❌ "100% complete" without browser testing
- ❌ "Everything works" without clicking through workflows
- ❌ "Ready for production" without end-to-end testing
- ❌ "Feature implemented" if only code is written but not tested

**ALWAYS say:**
- ✅ "Tested in browser, all workflows verified working"
- ✅ "End-to-end testing complete, found and fixed X bugs"
- ✅ "Browser console clean, no JavaScript errors"
- ✅ "Can confidently demo all features to stakeholder"
- ✅ "Ready for production deployment" (only after ALL checks pass)

### **When Issues Are Found:**
1. **Report immediately** - don't hide problems
2. **Assess severity** - critical vs. minor issues
3. **Provide honest timeline** - for fixing issues
4. **Update status** - reflect true completion percentage
5. **Document lessons learned** - prevent repeat issues

---

## 📚 REFERENCE

### **Key Documentation Files:**
- `WARP.md` - This file's twin (must stay synchronized)
- `docs/DEVELOPMENT_PIPELINE.md` - Detailed pipeline documentation
- `docs/AGENT_PORTAL_QA_FAILURE_REPORT.md` - Example of what NOT to do
- `PROJECT_STATUS.md` - Current project status
- `changelog.md` - Version history

### **Critical Scripts:**
- `./scripts/dev-server.sh` - Server management
- `./scripts/promote.sh` - Environment promotion
- `./scripts/verify_completion.sh` - Completion verification

### **Production URLs:**
- Dev: http://localhost:8081
- Test: http://localhost:8082
- Staging: http://localhost:8083
- Production: https://assiduousflip.web.app

---

## 🔄 RULE SYNCHRONIZATION

**CRITICAL: WARP.md and CLAUDE.md must remain synchronized**

When updating rules:
1. Update BOTH files identically
2. Verify both have same rule numbers
3. Verify both have same content
4. Commit both files together
5. Document what changed in commit message

**If rules differ between files:**
1. Identify which is newer
2. Update older file to match
3. Commit synchronization
4. Add note explaining discrepancy

---

## ✅ FINAL REMINDERS

**Every time you work on this project:**
1. ✅ Read these rules before starting
2. ✅ Work in DEV environment first
3. ✅ Test thoroughly at each stage
4. ✅ Use the promotion scripts
5. ✅ Never skip the pipeline
6. ✅ Run QA/QC before claiming completion
7. ✅ Be honest about status
8. ✅ Build on existing code, never recreate
9. ✅ Commit to GitHub before deploying
10. ✅ Verify production works after deployment

**These rules exist to:**
- Prevent production breaks
- Ensure code quality
- Maintain stakeholder trust
- Create reliable deployments
- Build sustainable development practices

**Follow them without exception.**

---

**Last Updated**: 2025-10-06  
**Version**: 1.0.0  
**Status**: Active - Mandatory Compliance
