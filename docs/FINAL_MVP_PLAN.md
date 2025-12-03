# FINAL MVP PLAN (Canonical)

**Version:** 1.0.0  
**Last Updated:** 2025-12-01  
**Status:** Canonical forward-looking MVP plan

This document supersedes the following legacy acceleration plans:
- `100_PERCENT_ACCELERATION_PLAN.md`
- `15_DAY_MVP_ACCELERATION_PLAN.md`
- `80_HOUR_BLITZ_PLAN.md`
- `MVP_ACCELERATION_PLAN.md`

Those documents are now archived and should be treated as historical context only.

Canonical ground truth for scope and requirements continues to live in:
- `docs/PROJECT_SCOPE.md`
- `docs/REQUIREMENTS_SPECIFICATION.md`
- `docs/USER_STORIES.md`
- `docs/ARCHITECTURE_DESIGN.md`
- `docs/TECHNICAL_DESIGN.md`

This plan describes the **minimal, clean path from current state to handoff**.

---

## 1. Current Baseline

From `PROJECT_COMPLETION_STATUS.md` and recent work:

- Overall completion ~95%.
- Admin, Agent, Client portals are functionally complete and integrated with Firebase backend.
- Micro-flipping engine and core analytics are implemented.
- Dev history & metrics subsystem is now documented and wired (server-side pipeline + dashboards).

What remains is **final hardening + owner handoff**, not major new feature development.

---

## 2. Canonical MVP Definition (What "Done" Means)

The MVP is considered complete when:

1. **Core portals fully operational**
   - Admin: full platform management (properties, agents, clients, transactions, analytics, settings).
   - Agent: listings, leads, clients, commissions, and dashboards are correct per-role.
   - Client: property discovery, favorites, leads, and deal analysis work end-to-end.

2. **Backend and security solid**
   - All portals talk to the documented Cloud Functions/API and Firestore schema.
   - Firestore/Storage rules enforce the intended access model.
   - No reliance on mock data in live environments.

3. **Dev history & metrics available**
   - Admin development dashboards show an accurate picture of commits, daily activity, and sessions.
   - Pipeline is GitHub → Cloud Functions → Firestore; browser is read-only for metrics.

4. **Owner can operate without you**
   - Handoff docs exist (operations runbook, admin usage, config locations).
   - Remaining gaps are clearly identified as **Phase 2+** items, not hidden debt.

---

## 3. Final Path to MVP (Execution Steps)

### 3.1 Stabilize & Verify Core Features

Focus: confirm reality, not add features.

1. **Portal End-to-End QA (Admin, Agent, Client)**
   - Walk all core flows with real data (not mock):
     - Admin: create/edit/delete property → appears correctly in client/agent views.
     - Client: discover property → favorite → submit lead.
     - Agent: see lead → update status → reflect in admin dashboards.
   - Verify zero console errors and correct Firestore writes per flow.

2. **Security & Rules Check**
   - Reconfirm Firestore and Storage rules match the design in `SECURITY_COMPLIANCE.md` / `ARCHITECTURE_DESIGN.md`.
   - Perform a small battery of negative tests (forbidden role actions, direct URL access, etc.).

Status outcome:
- If any flow or rule is broken, create a **targeted bugfix task** and resolve it before proceeding.

---

### 3.2 Wire and Confirm Metrics Pipeline (Server-Side Only)

Focus: ensure the admin/dev dashboards show the truth, not guesses.

1. **Deploy latest Cloud Functions**
   - `functions/src/index.ts` must include:
     - `api` (main backend)
     - `githubWebhook`
     - `recomputeDailyMetrics`
   - Deploy functions via:
     - `cd functions && npm run build && npm run deploy` (or equivalent documented command).

2. **Configure GitHub Webhook**
   - Follow `docs/COMPLETE_METRICS_SYSTEM.md` → "Server-Side Dev History & Metrics Pipeline" section.
   - Ensure pushes to `main` hit `githubWebhook` and new commits appear in `git_commits` and `development_metrics`.

3. **Configure Cloud Scheduler (optional but recommended)**
   - Set up `recomputeDailyMetrics` to run daily as described in `COMPLETE_METRICS_SYSTEM.md`.

4. **Verify Metrics in Dashboard**
   - Visit `/admin/development/dashboard.html` and check:
     - History Explorer shows recent days with realistic commits/hours/cost.
     - Per-day commit drill-down matches GitHub history.
     - Consistency pill reports "In sync" under normal conditions.

---

### 3.3 Handoff Documentation & Owner Experience

Focus: make the platform and its history understandable to a non-developer owner.

1. **Operations Runbook**
   - Either confirm or create a concise runbook (can live in `/docs/` or `/README.md`):
     - How to deploy (GitHub → Firebase pipeline summary).
     - How to rotate keys / secrets.
     - How to see logs and handle common incidents.

2. **Admin Usage Guide**
   - Short, practical guide for the owner:
     - How to log in as admin.
     - How to manage properties, agents, clients, and transactions.
     - How to interpret the development & business dashboards.

3. **Known Limitations & Phase 2 Roadmap**
   - Clearly list:
     - Features explicitly out of MVP scope (e.g., advanced AI, deeper billing automation, heavy analytics).
     - Any rough edges you are choosing not to polish now (with rationale).
   - This ensures there is no ambiguity between "bug" and "future work".

---

## 4. Post-MVP (Phase 2+ Evolution)

Once MVP is accepted and in production, future work can be prioritized from the archived plans and canonical docs, but **those documents no longer define the path**.

Suggested Phase 2+ buckets:

1. **AI & Advanced Analytics**
   - Recommendations, valuations, market sentiment, etc. as described in `15_DAY_MVP_ACCELERATION_PLAN.md` (now reference-only).

2. **Payments & Billing**
   - Full Stripe subscription lifecycle and in-app billing views.

3. **Automation & Integrations**
   - Email/SMS notifications at scale.
   - External system integrations (CRMs, MLS, etc.) where needed.

These should be broken into new, explicit specs and stories when you decide to fund Phase 2.

---

## 5. Canonical References for Agents

Agents (AI or human) working on this repo MUST:

1. Treat this file (`docs/FINAL_MVP_PLAN.md`) as the **high-level forward plan**.
2. Treat `/docs` canonical files and `FINAL_MVP_AGENT_EXECUTION_PLAN.md` as the **source of truth** for:
   - Detailed scope
   - Requirements
   - Architecture
   - Security
   - Metrics/Dev history
3. Treat all older acceleration plans as **archived historical context only**.

If there is ever a conflict between this file and `/docs/PROJECT_SCOPE.md` or `/docs/REQUIREMENTS_SPECIFICATION.md`, the `/docs` canonical documents win and this file should be updated accordingly.
