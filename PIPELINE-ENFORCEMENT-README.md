# Pipeline Enforcement System

## 🎯 Purpose

This system **ENFORCES** the mandatory deployment pipeline and prevents anyone (including AI assistants) from bypassing it.

## 🔒 Enforced Pipeline

```
LOCAL → GITHUB → STAGING → PRODUCTION
```

**You CANNOT skip stages. Period.**

---

## 📋 Installation

```bash
./scripts/setup-pipeline-enforcement.sh
```

This will:
- ✅ Make scripts executable
- ✅ Install git pre-commit hook
- ✅ Initialize pipeline state tracker
- ✅ Check for required dependencies (jq, firebase-tools)

---

## 🚀 Usage

### Step 1: Commit to GitHub

```bash
# Make your changes locally
# Then commit and push

git add .
git commit -m "feat: your changes"
git push origin main

# Verify it's on GitHub
./scripts/enforce-pipeline.sh commit
```

**What it checks:**
- ❌ Blocks if you have uncommitted changes
- ❌ Blocks if commit is not pushed to GitHub
- ✅ Only proceeds if GitHub has your changes

---

### Step 2: Deploy to Staging

```bash
./scripts/enforce-pipeline.sh deploy-staging
```

**What it checks:**
- ❌ Blocks if code not committed to GitHub
- ❌ Blocks if Firebase CLI not installed
- ✅ Only deploys if all checks pass
- ✅ Deploys to: https://assiduous-staging.web.app

**After deployment:**
- You MUST test in staging
- Open: https://assiduous-staging.web.app/test-enhanced-auth.html
- Run all QA/QC tests (RULE 4)

---

### Step 3: Mark Staging as Tested

```bash
./scripts/enforce-pipeline.sh mark-tested
```

**You must confirm:**
- ✅ Opened in browser with DevTools
- ✅ Zero JavaScript console errors
- ✅ All user workflows tested end-to-end
- ✅ All methods/functions verified to exist
- ✅ All API calls return expected data
- ✅ All database operations work correctly
- ✅ All UI elements visible and functional
- ✅ Mobile responsive design verified

**Type `YES` to confirm** - anything else cancels.

---

### Step 4: Deploy to Production

```bash
./scripts/enforce-pipeline.sh deploy-prod
```

**What it checks:**
- ❌ Blocks if not deployed to staging
- ❌ Blocks if staging not tested
- ❌ Blocks if staging not QA approved
- ✅ Only deploys if ALL checks pass

**Confirmation required:**
- Type `DEPLOY TO PRODUCTION` exactly
- Deploys to: https://assiduous-prod.web.app

---

## 📊 Check Status Anytime

```bash
./scripts/enforce-pipeline.sh status
```

Shows:
- Current pipeline stage
- Last commit
- Staging deployment info
- Production deployment info
- Test status

---

## 🔐 How It Prevents Bypassing

### 1. **State Tracking**
`.pipeline-state.json` tracks:
- What stage you're at
- What's deployed where
- Whether staging was tested
- Production deployment source

### 2. **Stage Validation**
Each command checks:
- ❌ Can't deploy to staging without GitHub commit
- ❌ Can't mark as tested without staging deployment
- ❌ Can't deploy to prod without testing staging
- ❌ Can't skip any stage

### 3. **Git Pre-Commit Hook**
Installed at `.git/hooks/pre-commit`:
- ✅ Reminds you of pipeline on every commit
- ✅ Warns if modifying production files

### 4. **Direct Firebase Deploy Blocking**
The `firebase-wrapper.sh` prevents:
- ❌ `firebase deploy` (blocked)
- ❌ Direct production deployments
- ✅ Forces use of enforce-pipeline.sh

---

## 🚨 What Happens If You Try to Cheat

### Scenario 1: Try to deploy to staging without committing
```bash
./scripts/enforce-pipeline.sh deploy-staging
```
**Result:**
```
❌ PIPELINE VIOLATION: You must commit all changes to GitHub first.
```
**Script exits with error.**

---

### Scenario 2: Try to deploy to production without testing staging
```bash
./scripts/enforce-pipeline.sh deploy-prod
```
**Result:**
```
❌ PIPELINE VIOLATION: Staging has NOT been tested!
You MUST test in staging before deploying to production.
Run: ./scripts/enforce-pipeline.sh mark-tested
```
**Script exits with error.**

---

### Scenario 3: Try to use firebase deploy directly
```bash
firebase deploy
```
**Result:**
```
❌ BLOCKED: Direct firebase deploy detected

⚠️  PIPELINE VIOLATION

You cannot run 'firebase deploy' directly.
You MUST use the enforced pipeline:
  LOCAL → GITHUB → STAGING → PRODUCTION
```
**Script exits with error.**

---

## 🛠️ Emergency Reset

**Use ONLY if pipeline state is corrupted:**

```bash
./scripts/enforce-pipeline.sh reset
```

Type `RESET PIPELINE` to confirm.

This resets state to initial values. **Use sparingly.**

---

## 📝 Files Created

| File | Purpose |
|------|---------|
| `.pipeline-state.json` | Tracks pipeline state (gitignored) |
| `scripts/enforce-pipeline.sh` | Main enforcement script |
| `scripts/firebase-wrapper.sh` | Blocks direct firebase deploy |
| `scripts/hooks/pre-commit-pipeline` | Git hook reminder |
| `scripts/setup-pipeline-enforcement.sh` | Installation script |
| `.git/hooks/pre-commit` | Installed git hook |

---

## ✅ Checklist for AI Assistants

When deploying code:

- [ ] Code committed locally
- [ ] Code pushed to GitHub (`git push origin main`)
- [ ] Verified with `./scripts/enforce-pipeline.sh commit`
- [ ] Deployed to staging `./scripts/enforce-pipeline.sh deploy-staging`
- [ ] Opened staging in browser
- [ ] Completed ALL QA/QC tests
- [ ] Marked as tested `./scripts/enforce-pipeline.sh mark-tested`
- [ ] Deployed to production `./scripts/enforce-pipeline.sh deploy-prod`
- [ ] Verified production deployment

**If ANY step fails, STOP and fix it. Do not proceed.**

---

## 🔒 Why This Matters

### Without enforcement:
- 🚨 Code deployed without testing
- 🚨 Bugs reach production
- 🚨 No rollback plan
- 🚨 Production breaks

### With enforcement:
- ✅ All code tested in staging first
- ✅ QA/QC mandatory before production
- ✅ Audit trail of what's deployed
- ✅ Production stays stable

---

## 📞 Support

**If pipeline is blocking you incorrectly:**
1. Check status: `./scripts/enforce-pipeline.sh status`
2. Verify GitHub push: `git status`
3. Reset if needed: `./scripts/enforce-pipeline.sh reset`

**If you need to bypass for emergency:**
- Don't. The pipeline exists for a reason.
- If truly urgent, use `./scripts/enforce-pipeline.sh reset`
- Document why you reset it
- Re-test everything after emergency fix

---

**Remember: This system protects your production. It's not optional.**
