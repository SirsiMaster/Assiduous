# QUALITY ASSURANCE PLAN
## QA Procedures and Standards

**Document Type:** QA Plan  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative QA Document
**Consolidation Note:** Extracted from WARP.md RULE 4

---

### **RULE 4: MANDATORY HARSH QA/QC ASSESSMENT BEFORE COMPLETION CLAIMS**
**Before claiming ANY feature/task is complete, you MUST perform this severe assessment:**

#### **A. Browser-Based End-to-End Testing (CRITICAL)**
1. **NEVER claim completion without actual browser testing**
2. **Open every page in a real browser** (not just HTTP status checks)
3. **Open browser DevTools Console** and check for JavaScript errors
4. **Click through EVERY user flow** from start to finish:
   - User authentication flows
   - Data entry and form submissions
   - Navigation between pages
   - Modal/dialog interactions
   - Save/edit/delete operations
   - Filter and search functionality
5. **Test on mobile device or responsive view**
6. **Verify data actually loads** (not just loading spinners)
7. **Check that all buttons and links work**
8. **Confirm all API calls succeed** (check Network tab)

#### **B. Method/Function Verification**
1. **Verify ALL called methods exist** before using them:
   - If page calls `service.getProperty()`, verify the service has this method
   - Check actual implementation, not assumptions
   - Test method signatures match usage
2. **Verify ALL imports are correct** and files exist at specified paths
3. **Check ALL event handlers** are properly bound
4. **Validate ALL data transformations** work with real data

#### **C. Complete User Workflow Validation**
For EVERY user role (client, agent, admin), verify:
1. **User can access their dashboard** - loads without errors
2. **User can view list pages** - data displays correctly
3. **User can view detail pages** - all fields populate
4. **User can perform CRUD operations** - create, read, update, delete all work
5. **User can navigate between pages** - all links work
6. **User workflows are end-to-end complete**:
   - Client: Browse → View → Save → Schedule → Contact
   - Admin: List → View → Edit → Delete → Status Change
   - Agent: Leads → Properties → Transactions → Communications

#### **D. Backend Functionality Verification**
1. **Test ALL API endpoints** actually return data
2. **Verify database operations** (create, read, update, delete)
3. **Check authentication/authorization** works correctly
4. **Validate data persistence** (localStorage, database)
5. **Confirm real-time updates** if applicable
6. **Test error handling** for failed requests

#### **E. Frontend Access Verification**
1. **Every feature is visible** on the correct page
2. **Every button/link is accessible** to the right user role
3. **Every form field is editable** and validates correctly
4. **Every modal/dialog opens and closes** properly
5. **Every navigation item works** and goes to correct page
6. **Every data display renders** correctly with real data

#### **F. Critical Self-Assessment Questions**
Before claiming completion, answer these questions HONESTLY:

1. ❓ **Did I test this in an actual browser?**
   - If NO → NOT COMPLETE
2. ❓ **Did I check the browser console for errors?**
   - If NO → NOT COMPLETE
3. ❓ **Did I click through the entire user workflow?**
   - If NO → NOT COMPLETE
4. ❓ **Did I verify all methods/functions exist?**
   - If NO → NOT COMPLETE
5. ❓ **Can a real user actually accomplish the intended task?**
   - If NO or UNSURE → NOT COMPLETE
6. ❓ **Would this work if deployed to production right now?**
   - If NO or UNSURE → NOT COMPLETE
7. ❓ **Have I verified backend AND frontend work together?**
   - If NO → NOT COMPLETE
8. ❓ **Are there any assumptions I haven't verified?**
   - If YES → NOT COMPLETE until verified

#### **G. Completion Criteria Checklist**
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
- [ ] ✅ All forms validate and submit correctly
- [ ] ✅ All modals/dialogs work correctly
- [ ] ✅ Mobile responsive design verified
- [ ] ✅ No broken images or missing resources
- [ ] ✅ Page loads in under 3 seconds
- [ ] ✅ Data persists correctly (localStorage/database)
- [ ] ✅ Error states display appropriately
- [ ] ✅ Loading states work correctly
- [ ] ✅ Can confidently demo to stakeholder right now
- [ ] ✅ Would recommend deploying to real users

#### **H. Reporting Standards**
When reporting completion status:

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

**If bugs found during QA/QC:**
- ✅ Document the bugs found
- ✅ Fix all critical bugs before claiming completion
- ✅ Report actual completion percentage honestly
- ✅ Provide timeline for remaining bug fixes

#### **I. Consequences of Skipping QA/QC**
If you skip these checks and claim completion:
- 🚨 Stakeholder loses confidence in assessments
- 🚨 Bugs reach production and affect real users
- 🚨 Time wasted on emergency fixes
- 🚨 Project timelines become unreliable
- 🚨 Your credibility as a development assistant is damaged

#### **J. Example QA/QC Documentation**
After completing QA/QC, provide a report like this:

```markdown
## QA/QC Assessment Report

### Testing Performed:
✅ Opened in Chrome browser
✅ Checked DevTools Console - 0 errors
✅ Tested complete user workflow:
   - User browses properties ✅
   - User clicks property card ✅
   - Property detail page loads ✅
   - User saves property ✅
   - User schedules viewing ✅
   - User returns to dashboard ✅
   - Dashboard shows saved property ✅

### Method Verification:
✅ All service methods exist and are callable
✅ All imports resolve correctly
✅ All event handlers bound properly

### API Testing:
✅ GET /api/properties - returns data
✅ GET /api/properties/:id - returns single property
✅ POST /api/viewings - creates viewing request

### Issues Found:
❌ BUG: getProperty() method didn't exist
✅ FIXED: Added alias method
✅ RE-TESTED: All workflows now working

### Final Status:
✅ OPERATIONAL - Ready for production
✅ All user workflows verified working
✅ Zero console errors
✅ Can confidently demo to stakeholder
```

**This QA/QC assessment is MANDATORY before any completion claim.**
**Perform it EVERY TIME without exception.**

### **RULE 5: MANDATORY DEVELOPMENT PIPELINE (NEVER SKIP)**
**ALL code changes MUST flow through this pipeline. NO EXCEPTIONS.**

#### **A. Pipeline Flow (STRICT ORDER)**
```
LOCAL DEV → FIREBASE DEV → FIREBASE STAGING → GITHUB → FIREBASE PRODUCTION
```

**Each stage is a mandatory checkpoint. You CANNOT skip stages.**

#### **B. Environment Specifications - Firebase Multi-Project Architecture**

| Environment | Firebase Project | Directory | Purpose | Deployment URL |
|-------------|-----------------|-----------|---------|----------------|
| **LOCAL** | N/A | `firebase-migration-package/assiduous-build/` | Local development & testing | http://localhost:8080 |
| **DEV** | assiduous-dev | Same codebase | Active feature development with isolated backend | https://assiduous-dev.web.app |
| **STAGING** | assiduous-staging | Same codebase | Pre-production validation with production-like config | https://assiduous-staging.web.app |
| **PROD** | assiduous-prod | Same codebase | Live production site with real user data | https://assiduous-prod.web.app |

**Key Architecture Benefits:**
- ✅ Each Firebase project has **isolated backend** (separate Firestore, Auth, Functions, Storage)
- ✅ DEV environment on **free Spark plan** ($0/month)
- ✅ STAGING environment on **minimal Blaze plan** (~$5-10/month)
- ✅ Safe to test **destructive operations** without affecting production
- ✅ **Real Firebase services** testing (not local emulators)
- ✅ **Production parity** - same runtime characteristics

#### **C. Development Workflow (MANDATORY STEPS)**

**Step 1: LOCAL Development**
1. Make ALL changes in `firebase-migration-package/assiduous-build/` directory
2. Start local server: `python -m http.server 8080` (from assiduous-build/)
3. Test changes at http://localhost:8080
4. Run RULE 4 QA/QC assessment (full browser testing)
5. Fix ALL bugs found
6. Document changes in commit message

**Step 2: Deploy LOCAL → FIREBASE DEV**
1. Navigate to: `cd firebase-migration-package`
2. Run deployment script: `./deploy.sh dev`
3. Review changes to be deployed
4. Deployment happens automatically (no confirmation for dev)
5. Test at https://assiduous-dev.web.app
6. Run RULE 4 QA/QC assessment with **real Firebase backend**
7. Test authentication, database operations, cloud functions
8. Verify no regressions introduced

**Step 3: Deploy DEV → FIREBASE STAGING**
1. Ensure all DEV testing passed
2. Run deployment script: `./deploy.sh staging`
3. Review changes to be deployed
4. Confirm deployment (requires explicit approval)
5. Test at https://assiduous-staging.web.app
6. Run RULE 4 QA/QC assessment final time
7. Test with production-like data and configuration
8. Verify ready for production
9. Take screenshots for documentation

**Step 4: Commit to GitHub**
1. Verify staging deployment successful
2. Commit changes: `git add . && git commit -m "feat: ..." && git push`
3. GitHub becomes the **source of truth**
4. Tag release if major version: `git tag -a v1.0.0 -m "Release 1.0.0"`
5. Push tags: `git push --tags`

**Step 5: Deploy STAGING → FIREBASE PRODUCTION**
1. Ensure code is committed to GitHub
2. Run production deployment: `./deploy.sh production`
3. Complete pre-deployment checklist:
   - [ ] Tested in staging
   - [ ] All pages load without errors
   - [ ] All functionality works end-to-end
   - [ ] Screenshots taken
   - [ ] Changes committed to GitHub
4. Type `DEPLOY TO PRODUCTION` (exact text) to confirm
5. Firebase deploys to production
6. Verify at https://assiduous-prod.web.app
7. Run post-deployment smoke tests
8. Monitor Firebase Console for errors

#### **D. Pipeline Rules (ABSOLUTE)**

**NEVER:**
- ❌ Deploy directly to PRODUCTION without testing in DEV and STAGING
- ❌ Skip Firebase DEV or STAGING environments
- ❌ Deploy to production with known bugs
- ❌ Deploy without Git commit to GitHub first
- ❌ Make changes directly in production Firebase project
- ❌ Edit production Firestore data without backup
- ❌ Bypass approval gates for production deployment
- ❌ Use production API keys in dev/staging code

**ALWAYS:**
- ✅ Start in LOCAL development
- ✅ Deploy to DEV first for backend testing
- ✅ Deploy to STAGING for final validation
- ✅ Commit to GitHub before production deployment
- ✅ Test in each Firebase environment before promoting
- ✅ Run QA/QC at each stage (LOCAL, DEV, STAGING)
- ✅ Use environment-specific Firebase configs
- ✅ Document what changed in commit messages
- ✅ Verify deployment succeeded with smoke tests
- ✅ Monitor Firebase Console after production deploy

#### **E. Validation Requirements Per Stage**

**LOCAL Stage Validation:**
- ✅ Code runs without errors on localhost
- ✅ All new features work as expected
- ✅ No console errors in browser DevTools
- ✅ All links and navigation work
- ✅ Mobile responsive design works
- ✅ CSS/JS assets load correctly

**DEV Firebase Stage Validation:**
- ✅ All LOCAL features still work
- ✅ Firebase Authentication works (test users)
- ✅ Firestore database operations succeed
- ✅ Cloud Functions respond correctly
- ✅ Cloud Storage uploads/downloads work
- ✅ Security rules enforced properly
- ✅ No regressions in existing features
- ✅ API calls succeed with real Firebase backend
- ✅ Data persists correctly in dev database

**STAGING Firebase Stage Validation:**
- ✅ Production-ready quality
- ✅ All user workflows complete end-to-end
- ✅ Performance acceptable (page load < 3s)
- ✅ No known bugs
- ✅ Ready to show stakeholders
- ✅ Production-like data configuration
- ✅ All Firebase services work as expected
- ✅ Security rules mirror production
- ✅ Error handling works correctly

**PRODUCTION Firebase Stage Validation:**
- ✅ Deployed successfully to Firebase
- ✅ All pages accessible at production URL
- ✅ All functionality works in production
- ✅ No errors in Firebase Console logs
- ✅ Analytics tracking works
- ✅ Cloud Functions responding normally
- ✅ Firestore queries performing well
- ✅ Authentication flows working
- ✅ No spike in error rates

#### **F. Emergency Hotfix Process**

For CRITICAL production bugs only:

1. Create hotfix in LOCAL
2. Test in LOCAL (expedited but thorough)
3. Deploy to DEV Firebase (expedited testing)
4. **MAY skip DEV if truly urgent AND small change**
5. Deploy to STAGING Firebase (mandatory - NO EXCEPTIONS)
6. Commit to GitHub immediately
7. Deploy to PRODUCTION
8. Document why DEV was skipped (if applicable)
9. Monitor production logs closely

**Criteria for emergency hotfix:**
- Production is completely broken (500 errors, white screen)
- Security vulnerability discovered
- Data loss occurring
- Revenue-impacting bug
- Authentication completely failing

**NOT emergency hotfixes:**
- UI cosmetic issues
- Feature requests
- Performance optimization
- Nice-to-have improvements
- Minor bugs with workarounds

#### **G. Deployment Commands**

**Deploy to DEV:**
```bash
cd firebase-migration-package
./deploy.sh dev
```

**Deploy to STAGING:**
```bash
cd firebase-migration-package
./deploy.sh staging
```

**Deploy to PRODUCTION:**
```bash
cd firebase-migration-package
./deploy.sh production  # Requires typing 'DEPLOY TO PRODUCTION'
```

**Test locally:**
```bash
cd firebase-migration-package/assiduous-build
python -m http.server 8080
open http://localhost:8080
```

#### **H. Commit & Promotion Documentation**

When promoting through pipeline, document:

```markdown
## Promotion: DEV → TEST
**Date**: 2025-10-06
**Changes**:
- Added PropertyService with getProperty() method
- Created client properties browse page
- Created client property detail page

**DEV Testing**:
✅ All pages load without errors
✅ Browser console clean
✅ All links work
✅ Mobile responsive verified

**TEST Verification**:
✅ No regressions detected
✅ Integration with existing code successful
✅ Ready for STAGING promotion
```

#### **I. Pipeline Violations**

If pipeline is bypassed:
- 🚨 Changes may break production
- 🚨 No way to verify changes work
- 🚨 No rollback plan
- 🚨 No audit trail
- 🚨 Stakeholder trust damaged

**If you bypass pipeline:**
1. Stop immediately
2. Revert unauthorized changes
3. Start over from DEV
4. Follow pipeline correctly

#### **H. GitHub as Source of Truth**

**CRITICAL: GitHub is the single source of truth**

- All code in `firebase-migration-package/assiduous-build/` is the canonical codebase
- GitHub main branch = what's deployed to production
- **ALWAYS commit to GitHub BEFORE deploying to production**
- Production deployments must match GitHub main branch exactly

**Deployment flow:**
```
LOCAL → Firebase DEV → Firebase STAGING → GitHub Commit → Firebase PRODUCTION
```

**Firebase Projects:**
- `assiduous-dev` - Development testing (may not match GitHub)
- `assiduous-staging` - Pre-production (should match GitHub after testing)
- `assiduous-prod` - Production (MUST match GitHub main branch)

#### **K. CI/CD Integration**

Once changes are in GitHub:

1. **GitHub Actions triggered automatically**
2. **Automated tests run** (when available)
3. **Firebase deployment happens** (manual trigger currently)
4. **Deployment verification** (manual currently)
5. **Metrics updated** (automated)

**Future automation goals:**
- Automated testing on GitHub push
- Automated Firebase deployment on main branch
- Automated smoke tests post-deployment
- Automated rollback on failure

**These pipeline rules apply to ALL repositories and ALL development work, current and future.**

---

## Essential Commands

### Development Server
```bash
# Start local development server (choose one)
python -m http.server 8080           # Basic Python server
python serve.py                      # If serve.py exists

# Access application
open http://localhost:8080/assiduousflip/
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

