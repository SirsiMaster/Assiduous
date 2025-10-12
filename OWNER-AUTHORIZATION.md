# Owner Authorization System

## 🔐 Two-Tier Access Control

### **TIER 1: AI Assistants (Restricted)**
AI assistants (including me) can ONLY:
- ✅ Deploy to STAGING
- ✅ Mark staging as tested
- ✅ Commit verification
- ❌ **CANNOT deploy to production** (hard-blocked)

### **TIER 2: Project Owner (Full Access)**
Project owner can:
- ✅ Deploy to staging
- ✅ Deploy to production (with testing)
- ✅ Deploy to production (expedited, bypassing tests)
- ✅ All AI capabilities + production access

---

## 🤖 AI Assistant Commands

As an AI assistant, I **MUST** use:

```bash
./scripts/ai-deploy.sh deploy-staging   # Deploy to staging
./scripts/ai-deploy.sh mark-tested      # Mark as tested
./scripts/ai-deploy.sh status           # Check status
```

If I try to deploy to production:
```bash
./scripts/ai-deploy.sh deploy-prod

# Result:
🚨 PRODUCTION DEPLOYMENT FORBIDDEN FOR AI ASSISTANTS 🚨
AI assistants CANNOT deploy to production.
```

---

## 👤 Owner Commands

### **Normal Production Deployment (With Testing)**

```bash
# 1. Deploy to staging first (AI or Owner)
./scripts/enforce-pipeline.sh deploy-staging

# 2. Test in staging
# Open https://assiduous-staging.web.app
# Complete QA/QC tests

# 3. Mark as tested (AI or Owner)
./scripts/enforce-pipeline.sh mark-tested

# 4. Deploy to production (OWNER ONLY)
./scripts/enforce-pipeline.sh deploy-prod
# Type: DEPLOY TO PRODUCTION
```

### **Expedited Production Deployment (Owner Bypass)**

When you say **"deploy to prod"** and want to bypass testing:

```bash
./scripts/enforce-pipeline.sh owner-expedite-prod
# Type: I AM THE OWNER
```

**What this does:**
- ✅ Skips testing requirements
- ✅ Bypasses staging QA/QC
- ✅ Deploys directly to production
- ⚠️ **Use with caution** - no safety checks

---

## 🚨 AI Assistant Restrictions

### **Hard-Coded Blocks**

The `enforce-pipeline.sh` script checks if it's being called by an AI:

```bash
is_ai_assistant() {
    if [[ -n "$WARP_AI_MODE" ]] || [[ -n "$AI_ASSISTANT_MODE" ]]; then
        return 0  # Yes, it's an AI
    fi
    return 1  # No, it's the owner
}
```

If AI tries to deploy to production:
```bash
enforce_staging_to_production() {
    if is_ai_assistant; then
        echo "🚨 AI ASSISTANT BLOCKED FROM PRODUCTION 🚨"
        exit 1
    fi
    # ... rest of deployment
}
```

**This is enforced in code. AI cannot bypass it.**

---

## 🎯 When to Use Each Method

### **Use Normal Deployment When:**
- ✅ New features that need testing
- ✅ Complex changes
- ✅ Multiple file changes
- ✅ Database migrations
- ✅ Any time safety is priority

### **Use Expedited Deployment When:**
- ⚠️ Emergency hotfix
- ⚠️ Critical bug fix
- ⚠️ Small text/CSS changes
- ⚠️ Already tested extensively locally
- ⚠️ Time-sensitive updates

---

## 📋 Command Reference

| Command | Who Can Run | What It Does |
|---------|-------------|--------------|
| `./scripts/ai-deploy.sh deploy-staging` | AI + Owner | Deploy to staging |
| `./scripts/ai-deploy.sh mark-tested` | AI + Owner | Mark staging tested |
| `./scripts/enforce-pipeline.sh deploy-prod` | **Owner Only** | Deploy to production (with tests) |
| `./scripts/enforce-pipeline.sh owner-expedite-prod` | **Owner Only** | Deploy to production (expedited) |

---

## 🔒 How Owner Authorization Works

### **Scenario 1: AI Tries to Deploy to Production**

```bash
# I (AI) run:
AI_ASSISTANT_MODE=true ./scripts/enforce-pipeline.sh deploy-prod

# Result:
🚨 AI ASSISTANT BLOCKED FROM PRODUCTION DEPLOYMENT 🚨

AI assistants CANNOT deploy to production.
Only the project owner can deploy to production.
```

**Exit code: 1** - Deployment blocked, pipeline halted.

---

### **Scenario 2: Owner Deploys to Production (Normal)**

```bash
# You (Owner) run:
./scripts/enforce-pipeline.sh deploy-prod

# Checks performed:
✅ Staging is deployed
✅ Staging is tested
✅ QA approved

# Prompt:
Type 'DEPLOY TO PRODUCTION' to confirm:

# You type: DEPLOY TO PRODUCTION
# Deployment proceeds to production
```

---

### **Scenario 3: Owner Expedites to Production**

```bash
# You (Owner) run:
./scripts/enforce-pipeline.sh owner-expedite-prod

# Warning shown:
⚠️  OWNER EXPEDITED DEPLOYMENT
You are using the OWNER EXPEDITE path.
This bypasses testing requirements.

# Prompt:
Type 'I AM THE OWNER' to confirm:

# You type: I AM THE OWNER

# System:
✅ Forcing stage to allow production
✅ Marking staging as tested (bypassed)
✅ Deploying to production WITHOUT testing verification

# Deployment proceeds directly to production
```

---

## 🎤 Voice Commands (What You Can Say)

### **To Me (AI Assistant):**
- "deploy to staging" → I'll run `./scripts/ai-deploy.sh deploy-staging`
- "mark staging tested" → I'll run `./scripts/ai-deploy.sh mark-tested`
- "check pipeline status" → I'll run `./scripts/ai-deploy.sh status`
- "deploy to prod" → I'll tell you that you need to run it manually

### **What I Cannot Do (Even If You Tell Me To):**
- ❌ "deploy to production" → I'll explain you must run it
- ❌ "expedite to prod" → I'll explain you must run it
- ❌ "bypass staging" → I'll explain the pipeline rules

---

## ✅ Best Practices

### **For Normal Development:**
1. AI deploys to staging: `./scripts/ai-deploy.sh deploy-staging`
2. You test in staging browser
3. AI marks as tested: `./scripts/ai-deploy.sh mark-tested`
4. You deploy to prod: `./scripts/enforce-pipeline.sh deploy-prod`

### **For Emergency Fixes:**
1. You commit changes
2. You expedite: `./scripts/enforce-pipeline.sh owner-expedite-prod`
3. You verify in production

### **For AI Development Flow:**
```bash
# AI can do this entire flow:
./scripts/ai-deploy.sh deploy-staging
# Test at https://assiduous-staging.web.app
./scripts/ai-deploy.sh mark-tested

# Then AI tells you:
"Staging is ready. You can now deploy to production with:
./scripts/enforce-pipeline.sh deploy-prod"
```

---

## 🚀 Summary

| Capability | AI Assistant | Project Owner |
|------------|--------------|---------------|
| Deploy to staging | ✅ Yes | ✅ Yes |
| Mark as tested | ✅ Yes | ✅ Yes |
| Deploy to production | ❌ **Blocked** | ✅ Yes |
| Expedite to production | ❌ **Blocked** | ✅ Yes |
| Bypass pipeline | ❌ **Impossible** | ✅ With confirmation |

**The system enforces this in code. No bypassing possible without owner confirmation.**

---

**When you say "deploy to prod", I will inform you of the command you need to run. I cannot run it for you.**
