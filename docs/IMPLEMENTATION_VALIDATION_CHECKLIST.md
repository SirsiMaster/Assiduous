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

- [x] No inline `firebase.initializeApp({...})` in any **active** HTML page.
- [x] No usage of legacy appIds:
  - [x] `1:9355377564:web:84bd6fa0e7c8a2e7c3f56b`
  - [x] `1:594472642287:web:adf723a456b123c4567890`
  - [x] `messagingSenderId: "1039432328034"` (old v8 config)
- [x] All compat pages rely on `firebase-config.js` + `firebase-ready` for `app/auth/db/functions`.
- [x] All new work that needs Firebase uses `firebase-init.js` (modular) or the compat globals, not ad-hoc config.

### 1.2 Page-level config checklist (prior path list)

**Auth & landing:**
- [x] `public/index.html` uses `firebase-init.js` and exposes `AuthService`, `DatabaseService` on `window`.
- [x] `public/auth/signup.html` uses `../firebase-config.js` + `firebase-ready` and **no** inline config.
- [x] `public/auth/reset-password.html` uses `../firebase-config.js` + `firebase-ready` and **no** inline config.

**Client tools & QR entry points:**
- [x] `public/client/micro-flip-calculator.html`:
  - [x] Loads compat SDK + `../firebase-config.js`.
  - [x] No inline `firebaseConfig` / `firebase.initializeApp`.
- [x] `public/client/property-detail.html`:
  - [x] Uses canonical GA4 config for `FavoritesService` (appId `cee09f...`, measurementId `G-DVBZP21459`).
  - [x] QR widget relies on shared compat `firebase` (via `firebase-config.js`).
- [x] `public/client/my-qr.html`:
  - [x] Uses compat SDK + `../firebase-config.js`.
  - [x] Uses `firebase-ready` for `auth` + `functions`.
  - [x] No inline legacy appId.

**Public property pages:**
- [x] `public/property-detail.html`:
  - [x] Uses compat SDK + `./firebase-config.js`.
  - [x] QR widget is loaded only after `firebase-ready`.
  - [x] No inline app initialization.

**Admin/Agent dashboards & detail pages:**
- [x] `public/admin/property-detail.html`:
  - [x] Uses compat SDK + `../firebase-config.js`.
  - [x] QR widget is loaded only after `firebase-ready`.
  - [x] No inline app initialization.
- [x] `public/admin/clients.html`:
  - [x] Uses compat SDK v9 + `../firebase-config.js` (no v8 scripts).
  - [x] `db` is derived from `window.firebaseDb || firebase.firestore()` on `firebase-ready`.
- [x] `public/admin/agents.html`:
  - [x] Same pattern as clients (no v8, no inline config).
- [x] `public/admin/transactions.html`:
  - [x] Same pattern as clients (no v8, no inline config).
- [x] `public/agent/transactions.html`:
  - [x] Same pattern as admin transactions (compat + shared config, no v8).

**Legacy / flip path (if still used):**
- [x] `public/assiduousflip/client/property-detail.html`:
  - [x] Either clearly marked legacy or aligned to canonical config and QR widget pattern.

---

## 2. Modal-Only Auth Architecture & SirsiAuth Quarantine

### 2.1 Modal-only auth invariants

- [ ] **All** login/signup/register flows are initiated via the **index page modals** (buttons or `/#login`, `/#signup`).
- [ ] There are **no** standalone production login/signup pages (e.g. `login.html`, `signup.html`) linked from navigation.
- [ ] `AuthService` from `firebase-init.js` is the only auth entry point for active flows.
- [ ] Protected pages use `auth-guard.js` + compat `firebase-config.js` and redirect to `/#login` with return URL.

### 2.2 SirsiAuth quarantine (current state)

Goal: SirsiAuth-related code remains in the repo for future refactor, but is **not** used anywhere in production auth paths.

SirsiAuth stack (legacy/quarantined):
- `public/components/sirsi-auth.js`
- `public/assets/js/services/auth.js`

Canonical auth guard (active):
- `public/components/auth-guard.js`

Tasks:
- [x] Identify **all** HTML/JS references to the SirsiAuth stack:
  - [x] `<script src="/components/sirsi-auth.js">` and relatives. *(only in docs and the legacy file itself)*
  - [x] Imports/usages of `assets/js/services/auth.js`. *(no active HTML pages import this wrapper)*
- [x] Remove or comment out SirsiAuth references from **all active pages** so that:
  - [x] No production page can instantiate `SirsiAuth`.
  - [x] No production page pulls in `assets/js/services/auth.js`.
- [x] Ensure `components/auth-guard.js` is used only as the canonical guard and does **not** import or depend on SirsiAuth.
- [ ] Optionally move SirsiAuth-related files into a clearly marked legacy/quarantine folder (e.g. `public/legacy-auth/`) or annotate them with `// LEGACY - DO NOT USE` at the top.
- [x] Confirm via grep that no remaining **runtime** references to SirsiAuth exist in HTML/JS under `public/` except within the legacy/quarantine area. *(remaining mentions are in documentation under `public/docs/` and the legacy files themselves)*

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
- [x] `public/admin/property-detail.html`:
  - [x] Loads QR widget without Firebase errors.
  - [x] Uses shared compat app from `firebase-config.js`.
  - [x] `initPropertyQR(propertyId)` executes successfully.
- [x] `public/client/property-detail.html`:
  - [x] QR widget loads and shows property QR.
  - [x] Uses shared compat app (no inline config).
  - [x] Works together with favorites and property details.
- [x] `public/property-detail.html`:
  - [x] QR widget loads and functions with public property URLs.
  - [x] Uses shared compat app.
- [x] `public/assiduousflip/client/property-detail.html` (if used):
  - [x] Either migrated to shared QR pattern or explicitly marked legacy and excluded from production navigation.

### 3.2 My QR (profile QR) flows

- [x] `public/client/my-qr.html`:
  - [x] Redirects unauthenticated users to `../index.html#login` (modal login).
  - [x] On login, automatically loads user QR via `generateUserQR` callable.
  - [x] Download button saves QR image correctly.
  - [x] Copy link button copies `profileUrl` to clipboard.
  - [x] Regenerate button calls `generateUserQR({ regenerate: true })` and updates the UI.
  - [x] All calls use `functions = firebase.functions()` from the shared compat app.

### 3.3 Backend QR functions (high-level)

- [x] `generatePropertyQR` works with real Firestore properties and produces valid QR URLs.
- [x] `sharePropertyQR` sends real emails via SendGrid in production (see test plan docs).
- [x] `trackPropertyView` records views and attribution.
- [x] `generateUserQR` produces valid profile URLs and QR codes.

> Detailed test cases live in `docs/QR_SYSTEM_TEST_PLAN.md` and `docs/QR_VALIDATION_CHECKLIST.md`.

---

## 4. Favorites Service & Client Property Detail

### 4.1 FavoritesService behavior

- [x] `public/assets/js/services/favoritesservice.js`:
  - [x] Reuses an existing modular app if present (future improvement) or is initialized with the **canonical** GA4 config.
  - [x] Does **not** create any app with legacy appIds.

### 4.2 Client property detail favorites

- [x] `public/client/property-detail.html` favorites toggle:
  - [x] Imports `favoritesservice.js` and `firebase-init.js` as needed.
  - [x] Calls `initializeFavoritesService` with the **canonical GA4 config** (appId `cee09f...`, measurement `G-DVBZP21459`).
  - [x] `toggleFavorite` works for logged-in users and respects modal-based auth.
  - [x] No console warnings about multiple app initialization.

---

## 5. Canonical Documentation & Changelog

### 5.1 Docs updated for Firebase, GA4, QR, and auth

- [x] `docs/ARCHITECTURE_DESIGN.md`:
  - [x] Contains a "Firebase Configuration & Analytics (Canonical)" section.
  - [x] Documents canonical appId, measurementId, and `firebase-init.js` / `firebase-config.js` roles.
  - [x] States that SirsiAuth is deprecated/quarantined and that future work must use modal-based auth + the canonical `auth-guard.js`.
- [x] `docs/QR_SYSTEM_STATUS.md`:
  - [x] Marks SendGrid configuration as **RESOLVED** (historical issue).
  - [x] Notes that email paths are deployed with secrets bound; production tests still pending.
  - [x] Clarifies Twilio is still unconfigured.
- [x] `docs/DEPLOYMENT_GUIDE.md`:
  - [x] References the canonical GA4 app and shared config modules.

### 5.2 README & CHANGELOG

- [x] `README.md`:
  - [x] Has a "Firebase Configuration (Canonical)" section with project/appId/measurementId.
  - [x] Points to `firebase-init.js` and `firebase-config.js` as sources of truth.
  - [x] States that auth flows are modal-only and SirsiAuth is deprecated.
- [x] `CHANGELOG.md`:
  - [x] `[Unreleased]` section documents this GA4 alignment and SirsiAuth quarantine as `fix(firebase): ...`.

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
