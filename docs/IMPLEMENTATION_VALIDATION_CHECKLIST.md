# Implementation & Validation Checklist

**Purpose:** Live checklist to validate GA4 Firebase/Analytics alignment, QR workflows, modal-only auth, and SirsiAuth quarantine across all personas and key paths.

> Keep this file open while dev/testing. Check items off as they are verified in browser and logs.

---

## 1. Canonical Firebase Config & Analytics (GA4)

**Canonical app:**
- **Project:** `assiduous-prod`
- **Web app (GA4):** `1:9355377564:web:cee09f952eea43976ee659`
- **Measurement ID:** `G-DVBZP21459`

**Authoritative config modules:**
- `public/assets/js/firebase-init.js` (modular SDK + AuthService, DatabaseService, etc.)
- `public/firebase-config.js` (compat SDK + `firebase-ready` event)

### 1.1 Global rules (must hold everywhere)

- [ ] No inline `firebase.initializeApp({...})` in any **active** HTML page.
- [ ] No usage of legacy appIds:
  - [ ] `1:9355377564:web:84bd6fa0e7c8a2e7c3f56b`
  - [ ] `1:594472642287:web:adf723a456b123c4567890`
  - [ ] `messagingSenderId: "1039432328034"` (old v8 config)
- [ ] All compat pages rely on `firebase-config.js` + `firebase-ready` for `app/auth/db/functions`.
- [ ] All new work that needs Firebase uses `firebase-init.js` (modular) or the compat globals, not ad-hoc config.

### 1.2 Page-level config checklist (prior path list)

**Auth & landing:**
- [ ] `public/index.html` uses `firebase-init.js` and exposes `AuthService`, `DatabaseService` on `window`.
- [ ] `public/auth/signup.html` uses `../firebase-config.js` + `firebase-ready` and **no** inline config.
- [ ] `public/auth/reset-password.html` uses `../firebase-config.js` + `firebase-ready` and **no** inline config.

**Client tools & QR entry points:**
- [ ] `public/client/micro-flip-calculator.html`:
  - [ ] Loads compat SDK + `../firebase-config.js`.
  - [ ] No inline `firebaseConfig` / `firebase.initializeApp`.
- [ ] `public/client/property-detail.html`:
  - [ ] Uses canonical GA4 config for `FavoritesService` (appId `cee09f...`, measurementId `G-DVBZP21459`).
  - [ ] QR widget relies on shared compat `firebase` (via `firebase-config.js`).
- [ ] `public/client/my-qr.html`:
  - [ ] Uses compat SDK + `../firebase-config.js`.
  - [ ] Uses `firebase-ready` for `auth` + `functions`.
  - [ ] No inline legacy appId.

**Public property pages:**
- [ ] `public/property-detail.html`:
  - [ ] Uses compat SDK + `./firebase-config.js`.
  - [ ] QR widget is loaded only after `firebase-ready`.
  - [ ] No inline app initialization.

**Admin/Agent dashboards & detail pages:**
- [ ] `public/admin/property-detail.html`:
  - [ ] Uses compat SDK + `../firebase-config.js`.
  - [ ] QR widget is loaded only after `firebase-ready`.
  - [ ] No inline app initialization.
- [ ] `public/admin/clients.html`:
  - [ ] Uses compat SDK v9 + `../firebase-config.js` (no v8 scripts).
  - [ ] `db` is derived from `window.firebaseDb || firebase.firestore()` on `firebase-ready`.
- [ ] `public/admin/agents.html`:
  - [ ] Same pattern as clients (no v8, no inline config).
- [ ] `public/admin/transactions.html`:
  - [ ] Same pattern as clients (no v8, no inline config).
- [ ] `public/agent/transactions.html`:
  - [ ] Same pattern as admin transactions (compat + shared config, no v8).

**Legacy / flip path (if still used):**
- [ ] `public/assiduousflip/client/property-detail.html`:
  - [ ] Either clearly marked legacy or aligned to canonical config and QR widget pattern.

---

## 2. Modal-Only Auth Architecture & SirsiAuth Quarantine

### 2.1 Modal-only auth invariants

- [ ] **All** login/signup/register flows are initiated via the **index page modals** (buttons or `/#login`, `/#signup`).
- [ ] There are **no** standalone production login/signup pages (e.g. `login.html`, `signup.html`) linked from navigation.
- [ ] `AuthService` from `firebase-init.js` is the only auth entry point for active flows.
- [ ] Protected pages use `auth-guard-simple.js` + compat `firebase-config.js` and redirect to `/#login` with return URL.

### 2.2 SirsiAuth quarantine (current state)

Goal: SirsiAuth-related code remains in the repo for future refactor, but is **not** used anywhere in production auth paths.

SirsiAuth stack:
- `public/components/sirsi-auth.js`
- `public/assets/js/services/auth.js`
- `public/components/auth-guard.js`

Tasks:
- [ ] Identify **all** HTML/JS references to the SirsiAuth stack:
  - [ ] `<script src="/components/sirsi-auth.js">` and relatives.
  - [ ] Imports/usages of `assets/js/services/auth.js`.
  - [ ] Imports/usages of `components/auth-guard.js`.
- [ ] Remove or comment out SirsiAuth references from **all active pages** so that:
  - [ ] No production page can instantiate `SirsiAuth`.
  - [ ] No production page pulls in `assets/js/services/auth.js`.
  - [ ] No production page uses `components/auth-guard.js`.
- [ ] Optionally move SirsiAuth-related files into a clearly marked legacy/quarantine folder (e.g. `public/legacy-auth/`) or annotate them with `// LEGACY - DO NOT USE` at the top.
- [ ] Confirm via grep that no remaining **runtime** references exist in HTML/JS under `public/` except within the legacy/quarantine area.

> Future Plan: After we stabilize Assiduous on `firebase-init.js` + modal auth, we will **infuse SirsiAuth** with this new logic so that SirsiAuth becomes the canonical, reusable auth component for future apps. For now, SirsiAuth is **archived but not active**.

---

## 3. QR System & Property/QR Workflows

### 3.1 Property QR widgets across personas

Property detail + QR integration must work consistently for:
- Admin
- Client
- Public (unauthenticated)
- Any remaining flip/legacy variants

Checklist:
- [ ] `public/admin/property-detail.html`:
  - [ ] Loads QR widget without Firebase errors.
  - [ ] Uses shared compat app from `firebase-config.js`.
  - [ ] `initPropertyQR(propertyId)` executes successfully.
- [ ] `public/client/property-detail.html`:
  - [ ] QR widget loads and shows property QR.
  - [ ] Uses shared compat app (no inline config).
  - [ ] Works together with favorites and property details.
- [ ] `public/property-detail.html`:
  - [ ] QR widget loads and functions with public property URLs.
  - [ ] Uses shared compat app.
- [ ] `public/assiduousflip/client/property-detail.html` (if used):
  - [ ] Either migrated to shared QR pattern or explicitly marked legacy and excluded from production navigation.

### 3.2 My QR (profile QR) flows

- [ ] `public/client/my-qr.html`:
  - [ ] Redirects unauthenticated users to `../index.html#login` (modal login).
  - [ ] On login, automatically loads user QR via `generateUserQR` callable.
  - [ ] Download button saves QR image correctly.
  - [ ] Copy link button copies `profileUrl` to clipboard.
  - [ ] Regenerate button calls `generateUserQR({ regenerate: true })` and updates the UI.
  - [ ] All calls use `functions = firebase.functions()` from the shared compat app.

### 3.3 Backend QR functions (high-level)

- [ ] `generatePropertyQR` works with real Firestore properties and produces valid QR URLs.
- [ ] `sharePropertyQR` sends real emails via SendGrid in production (see test plan docs).
- [ ] `trackPropertyView` records views and attribution.
- [ ] `generateUserQR` produces valid profile URLs and QR codes.

> Detailed test cases live in `docs/QR_SYSTEM_TEST_PLAN.md` and `docs/QR_VALIDATION_CHECKLIST.md`.

---

## 4. Favorites Service & Client Property Detail

### 4.1 FavoritesService behavior

- [ ] `public/assets/js/services/favoritesservice.js`:
  - [ ] Reuses an existing modular app if present (future improvement) or is initialized with the **canonical** GA4 config.
  - [ ] Does **not** create any app with legacy appIds.

### 4.2 Client property detail favorites

- [ ] `public/client/property-detail.html` favorites toggle:
  - [ ] Imports `favoritesservice.js` and `firebase-init.js` as needed.
  - [ ] Calls `initializeFavoritesService` with the **canonical GA4 config** (appId `cee09f...`, measurement `G-DVBZP21459`).
  - [ ] `toggleFavorite` works for logged-in users and respects modal-based auth.
  - [ ] No console warnings about multiple app initialization.

---

## 5. Canonical Documentation & Changelog

### 5.1 Docs updated for Firebase, GA4, QR, and auth

- [ ] `docs/ARCHITECTURE_DESIGN.md`:
  - [ ] Contains a "Firebase Configuration & Analytics (Canonical)" section.
  - [ ] Documents canonical appId, measurementId, and `firebase-init.js` / `firebase-config.js` roles.
  - [ ] States that SirsiAuth is deprecated for now and future work must use modal-based auth.
- [ ] `docs/QR_SYSTEM_STATUS.md`:
  - [ ] Marks SendGrid configuration as **RESOLVED** (historical issue).
  - [ ] Notes that email paths are deployed with secrets bound; production tests still pending.
  - [ ] Clarifies Twilio is still unconfigured.
- [ ] `docs/DEPLOYMENT_GUIDE.md`:
  - [ ] References the canonical GA4 app and shared config modules.

### 5.2 README & CHANGELOG

- [ ] `README.md`:
  - [ ] Has a "Firebase Configuration (Canonical)" section with project/appId/measurementId.
  - [ ] Points to `firebase-init.js` and `firebase-config.js` as sources of truth.
  - [ ] States that auth flows are modal-only and SirsiAuth is deprecated.
- [ ] `CHANGELOG.md`:
  - [ ] `[Unreleased]` section documents this GA4 alignment and SirsiAuth quarantine as `fix(firebase): ...`.

---

## 6. Manual Validation Flow (Browser + DevTools)

Use this quick run to validate everything end-to-end:

1. **Start local server:**
   - [ ] `python -m http.server 8080` from repo root.

2. **Landing & auth:**
   - [ ] Open `http://localhost:8080/public/`.
   - [ ] Check login/signup modals → ensure no Firebase config errors.

3. **Reset password:**
   - [ ] Open `http://localhost:8080/public/auth/reset-password.html`.
   - [ ] Submit a reset for a known email; confirm no auth-not-ready errors.

4. **Properties & QR:**
   - [ ] Admin property detail: `/public/admin/property-detail.html?id=...` → QR widget works.
   - [ ] Client property detail: `/public/client/property-detail.html?id=...` → QR + favorites.
   - [ ] Public property detail: `/public/property-detail.html?id=...` → QR widget loads.

5. **My QR:**
   - [ ] `/public/client/my-qr.html` redirects to `index.html#login` when logged out.
   - [ ] After login, profile QR loads and actions (download/copy/regenerate) work.

6. **Dashboards:**
   - [ ] `/public/admin/clients.html`, `/public/admin/agents.html`, `/public/admin/transactions.html`, `/public/agent/transactions.html` load data with no config or v8 warnings.

7. **Final grep checks:**
   - [ ] No legacy appIds present in active HTML.
   - [ ] No SirsiAuth references in active paths under `public/`.

---

This checklist is meant to be updated as we complete work. Feel free to add dates/initials next to items as they are fully validated (local + production).
