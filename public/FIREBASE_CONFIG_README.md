# 🔥 Firebase Initialization – Single Source of Truth

## ⚠️ CRITICAL RULE

**There is only one canonical Firebase initializer for the web app runtime:**

📍 **Location:** `/public/assets/js/firebase-init.js`

All client, agent, and admin pages must use this file. **Do not** embed new
Firebase configs directly in HTML or JS, and **do not** reintroduce
`firebase-*-compat.js` bundles on runtime pages.

`firebase-config.js` now lives only inside the **firebase-migration-package**
for CI/CD and legacy build tooling. It must **never** be loaded by pages under
`/public/`.

---

## 🎯 Current Runtime Configuration

`firebase-init.js` uses the modular Firebase v10 SDK and automatically
selects the correct project based on hostname:

- **Production:** `assiduous-prod` (default for non-localhost)
- **Staging:** `assiduous-staging` (hostnames containing `staging`)

It exports initialized instances and high-level services:

- `app`, `auth`, `db`, `functions`, `storage`, `analytics`
- `AuthService`, `DatabaseService`, `CloudFunctionsService`, `APIService`, `StorageService`

It also exposes compatible globals for legacy code:

- `window.firebaseApp`, `window.firebaseAuth`, `window.firebaseDb`, `window.firebaseStorage`
- `window.db`, `window.auth`
- `window.firebase` shim with:
  - `firebase.auth()` → modular Auth
  - `firebase.firestore()` → modular Firestore
  - `firebase.firestore.FieldValue.serverTimestamp()`
  - `firebase.firestore.FieldValue.increment()`
  - `firebase.firestore.FieldValue.arrayUnion()`
  - `firebase.storage()` → thin wrapper over modular Storage

---

## ✅ How to Use in HTML Pages

### Pattern A – Modern ES module usage

For new pages, prefer direct ES module imports from `firebase-init.js`:

```html
<script type="module">
  import Firebase, { app, auth, db } from "./assets/js/firebase-init.js";

  // Optional: use service layer
  const { AuthService, DatabaseService } = Firebase;

  // Example: simple query
  // DatabaseService.getDocument("users", userId) ...
</script>
```

Use paths relative to the page location, e.g. from `public/client/`:

```html
<script type="module">
  import Firebase, { auth, db } from "../assets/js/firebase-init.js";
  // ... page logic ...
</script>
```

### Pattern B – Legacy templates using globals

Existing templates that were written against compat-style globals can keep
most of their logic but **must not** load compat SDKs. Instead, they should
rely on the shim provided by `firebase-init.js` and the `firebase-ready`
event:

```html
<!-- At the bottom of the page -->
<script type="module">
  import Firebase from "../assets/js/firebase-init.js";
  void Firebase; // ensure module executes
</script>

<script>
  window.addEventListener('firebase-ready', function () {
    const db = window.db;              // modular Firestore instance
    const auth = window.auth;          // modular Auth instance
    const firebase = window.firebase;  // compat-style shim

    // Example: legacy-style usage still works
    db.collection('properties').get().then(...);
    firebase.firestore().collection('leads');
    firebase.firestore.FieldValue.serverTimestamp();
  });
</script>
```

> If you need `firebase.storage()` or `firebase.functions()`, the shim also
> exposes these as wrappers around the modular instances.

---

## 🚫 Never Do This on Runtime Pages

❌ **Do not** add new includes for:

- `firebase-app-compat.js`
- `firebase-auth-compat.js`
- `firebase-firestore-compat.js`
- `firebase-storage-compat.js`
- Any other `firebase-*-compat.js` bundles

❌ **Do not** add new `<script src="/firebase-config.js"></script>` tags.

❌ **Do not** inline new Firebase configs in HTML or JS.

If you see any of the above in `/public/client`, `/public/agent`, or
`/public/admin`, refactor the page to use `firebase-init.js` instead.

---

## 🔧 How to Update API Keys / Project Settings

Runtime web clients get their config from `firebase-init.js`. To update API
keys or project metadata used by the frontend:

1. Open the Firebase Console for the target project:
   ```bash
   open "https://console.firebase.google.com/project/assiduous-prod/settings/general"
   ```
2. Copy the updated Web App config values.
3. Edit `public/assets/js/firebase-init.js` and update the `firebaseConfig`
   object for **production** and/or **staging**.
4. Deploy via the normal pipeline (GitHub → Firebase Hosting).

`firebase-config.js` inside `firebase-migration-package/assiduous-build` is
reserved for build-time pipelines and legacy tooling only.

---

## 🔍 How to Verify You Are Using the Modular Init

1. Run the app locally:
   ```bash
   cd /Users/thekryptodragon/Development/assiduous
   python -m http.server 8080
   open "http://localhost:8080/public/"
   ```
2. Open DevTools → Console.
3. Confirm there are **no** network requests for `firebase-*-compat.js`.
4. Check that `window.Firebase`, `window.db`, and `window.auth` are defined.
5. Check that the `firebase-ready` event fires once on page load.

You can also search the codebase:

```bash
# Using WARP grep (conceptual example)
# Look for compat bundles under public/
```

There should be **no** active references to compat SDKs in non-archival
pages under `/public/`.

---

## 📋 Runtime Checklist Before Deploying

- [ ] No `firebase-*-compat.js` includes under `public/` (except archived
      backups or migration artifacts outside the runtime path).
- [ ] No `<script src="firebase-config.js">` in client/agent/admin pages.
- [ ] All new pages import `assets/js/firebase-init.js` (Pattern A or B).
- [ ] `firebase-ready` event is used where legacy templates depend on
      deferred initialization.

---

## 🎯 Summary

1. ✅ **One canonical runtime initializer:** `public/assets/js/firebase-init.js`.
2. ✅ **Modular v10 SDK only** for new development.
3. ✅ **Legacy templates supported** via shims and `firebase-ready`.
4. ✅ **No new compat bundles or `/firebase-config.js` on runtime pages.**

If you ever feel tempted to add a new Firebase config snippet, stop and
wire the page into `firebase-init.js` instead.

---

**Last Updated:** 2025-12-10  
**Maintained By:** Development Team
