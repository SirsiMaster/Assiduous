# Final MVP Agent Execution Plan

**Purpose:**
This document is an internal execution playbook for AI agents working on the Assiduous codebase. It is **subordinate to the canonical docs in `/docs`** and exists to translate canonical requirements into concrete, repeatable execution steps.

Canonical truth sources:
- `docs/PROJECT_SCOPE.md`
- `docs/REQUIREMENTS_SPECIFICATION.md`
- `docs/USER_STORIES.md`
- `docs/TECHNICAL_DESIGN.md`
- `docs/ARCHITECTURE_DESIGN.md`
- `PROJECT_COMPLETION_STATUS.md`

If there is any conflict, **canonical docs win**.

---

## 1. Definition of "MVP Complete" (for Agents)

The MVP is considered complete when **all** of the following are true and verified in a real browser against the deployed environment (staging, then production):

1. **Core Portals Functional**
   - Admin portal: properties, agents, clients, transactions, analytics all load real data and support intended CRUD operations.
   - Client portal: browse/search real properties, save favorites, submit leads, run deal/ROI tools.
   - Agent portal: dashboard, my listings, my leads, my clients (and any documented equivalent pages) work with role-based data.

2. **Authentication & RBAC**
   - Email/password login and signup flows work.
   - Roles (admin/agent/client) are enforced on all protected pages.
   - Unauthorized access attempts are denied per Firestore/Storage rules.

3. **Backend Integration**
   - All pages use **real** Firestore/Cloud Functions data paths documented in `docs/TECHNICAL_DESIGN.md` (no mock data in production flows).
   - At least 50–100 realistic properties exist in the database for the primary market.

4. **Quality Bar (RULE 4 style)**
   - Zero JavaScript console errors across main user flows.
   - All main workflows (admin, agent, client) are tested end-to-end.
   - Mobile responsiveness verified on at least one iOS and one Android device.

5. **Deployment & Security**
   - Firebase Hosting, Firestore rules, Storage rules, and indexes are deployed and match documented behavior.
   - Monitoring/analytics are enabled and accessible.

6. **Handover Readiness**
   - Operations runbook exists (how to deploy, roll back, inspect logs, manage users).
   - Known limitations and Phase 2 roadmap are clearly documented.

---

## 2. Agent Execution Loop

For **any** future work on this project, the agent lifecycle is:

1. **Read Canonical Context**
   - Always start from `/docs` (scope, requirements, user stories, technical/architecture design).
   - Cross-check current status in `PROJECT_COMPLETION_STATUS.md`.

2. **Plan Briefly**
   - For any non-trivial change, create or update an internal plan (like this file) that:
     - Maps the change to specific requirements/user stories.
     - Identifies impacted collections, pages, and Cloud Functions.

3. **Implement**
   - Make minimal, targeted changes that satisfy canonical requirements.
   - Prefer enhancing existing pages/components over adding new divergent ones.
   - Keep auth, Firestore access, and security rules in sync with the design docs.

4. **Verify in Browser**
   - Use the RULE 4 QA/QC checklist (adapted):
     - DevTools open, zero console errors.
     - All affected workflows tested end-to-end.
     - API responses and Firestore writes/reads validated.

5. **Update Canonical State**
   - If work materially changes scope, requirements, or status, update:
     - `PROJECT_COMPLETION_STATUS.md` (high-level completion).
     - Any affected canonical doc in `/docs`.

6. **Log Development Activity (when metrics pipeline exists)**
   - Ensure each significant change is represented in development metrics (see Section 4 below).

---

## 3. Concrete MVP Verification Checklist (for final sign-off)

Agents must be able to answer **"yes" with evidence"** to each item below.

### 3.1 Core Functionality

- [ ] Admin: create/edit/delete properties; see them reflected in client/agent portals.
- [ ] Client: browse/search; save/remove favorites; submit a lead; see expected feedback.
- [ ] Agent: see only their listings/leads/clients; update statuses; see correct metrics.
- [ ] Micro-flipping/ROI tooling produces sensible results on sample properties.

### 3.2 Security & Rules

- [ ] Firestore rules: unauthorized reads/writes are rejected as designed.
- [ ] Storage rules: public vs protected paths behave as documented.
- [ ] No secrets or credentials are committed to the repo.

### 3.3 Deployment & Monitoring

- [ ] Staging deploy passes smoke tests.
- [ ] Production deploy passes smoke tests.
- [ ] Monitoring dashboards (Firebase / analytics) show traffic and errors for key flows.

### 3.4 Documentation & Handover

- [ ] Owner-facing summary of what MVP includes/excludes is up to date.
- [ ] Operations runbook is current and references the real Firebase project IDs and GitHub repo.
- [ ] Known limitations and Phase 2 roadmap sections are present and consistent with `/docs`.

---

## 4. Analytics & Development History in the Admin Dashboard

**Goal:** The admin/development dashboard should provide a **narrative of development history** that aligns with Git and file/document changes, so an owner can visually see how the system evolved.

### 4.1 Target Capabilities

1. **Commit & Change Timeline**
   - Show a chronological feed of development events:
     - Git commit metadata (hash, author, timestamp, message).
     - High-level scope tags (e.g., `auth`, `agent-portal`, `payments`).

2. **File & Document Touches**
   - For each commit, list important touched artifacts:
     - Application files (e.g., key JS/HTML/CSS or Cloud Function files).
     - Canonical docs in `/docs`.
     - High-level diffs reduced to "what changed" tags (not raw patch text).

3. **Metrics Aggregation**
   - Aggregate per day/week:
     - Commits count.
     - Files changed.
     - Docs updated.
     - Key features completed (linking to requirements/user stories).

4. **Cross-Link to Requirements**
   - Where possible, link changes to requirement IDs or user story IDs.

### 4.2 Feasibility & Constraints

- **Yes, we can approximate this in a robust way**, but it requires:
  - A pipeline that extracts Git history and maps it into Firestore collections.
  - A convention for tagging commits with scopes/issue IDs.
  - A lightweight summarization of file paths (e.g., group by feature or directory) to avoid overwhelming the UI.

- **We cannot magically reconstruct every historical "bit" of code purely from analytics** if it was never logged:
  - However, Git history *does* contain full file contents and diffs.
  - By ingesting Git metadata and selected diffs into Firestore, the admin dashboard can present a rich, navigable development history that is grounded in real source control.

### 4.3 Proposed Implementation (High-Level)

1. **Git Export Script (one-time + periodic)**
   - CLI script that:
     - Walks Git history.
     - Extracts for each commit: hash, author, timestamp, message, changed files.
     - Optionally infers tags (feature area) from paths and commit messages.
     - Writes/updates documents in a Firestore collection (e.g., `development_commits`).

2. **Dev Metrics Writer (Git Hooks or CI)**
   - Post-commit hook or CI job that:
     - On new commits to main/develop, pushes a summarized event into Firestore.
     - Ensures **future** work is always reflected without manual effort.

3. **Admin Dashboard Integration**
   - Add views to the development/admin dashboard that:
     - Query `development_commits` and related collections.
     - Show a timeline, with filters by date, scope, author.
     - Link to relevant docs (`/docs` entries) and pages where applicable.

4. **Privacy & Performance Considerations**
   - Do **not** store full source code or giant diffs in Firestore; store references and summaries.
   - Keep the Git repo itself as the canonical source of truth for exact code.

---

## 5. Agent Rules for Development History Features

When implementing or extending the "development history" and analytics features:

1. **Do not duplicate Git**
   - Treat Git as the canonical timeline; Firestore holds a *projection* designed for dashboards and analytics.

2. **Summarize, dont flood**
   - Prefer grouping by feature/area and date ranges instead of raw file lists everywhere.

3. **Keep In Sync with `/docs`**
   - When requirements or scope docs change, update the mapping logic so dashboard views stay aligned with the latest canonical specs.

4. **Verify UX in Admin Dashboard**
   - Ensure development history views load quickly and are easily understandable by a non-technical owner.

---

## 6. How Agents Use This Plan

- Use this file as a **working playbook** for:
  - Determining whether new work is MVP-critical or Phase 2+.
  - Ensuring any change is reflected in both **code** and **canonical documentation**.
  - Designing and validating the admin/development dashboards that visualize project history.
- Never override canonical docs with this file; instead, update this playbook whenever canonical docs evolve.
