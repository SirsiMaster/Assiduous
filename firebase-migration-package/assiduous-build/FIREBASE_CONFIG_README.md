# 🔥 Firebase Configuration - Single Source of Truth

## ⚠️ CRITICAL RULE

**THERE IS ONLY ONE FIREBASE CONFIGURATION FILE:**

📍 **Location:** `/firebase-config.js` (root level)

**DO NOT create Firebase configs anywhere else!**

---

## 🎯 Current Configuration

### Production Environment
- **Project ID:** `assiduous-prod`
- **API Key:** `AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE`
- **Auth Domain:** `assiduous-prod.firebaseapp.com`
- **Hosting URL:** https://assiduous-prod.web.app/

### Staging Environment
- **Project ID:** `assiduous-staging`
- **API Key:** `AIzaSyDnMkQbhC5kYl5O_07zQ2yfYvGjLRq6E0c`
- **Auth Domain:** `assiduous-staging.firebaseapp.com`
- **Hosting URL:** https://assiduous-staging.web.app/

---

## 📂 File Structure

```
assiduous-build/
├── firebase-config.js          ← SINGLE SOURCE OF TRUTH
├── index.html                  ← Loads firebase-config.js
├── admin/
│   └── *.html                 ← All load firebase-config.js
├── client/
│   └── *.html                 ← All load firebase-config.js
└── agent/
    └── *.html                 ← All load firebase-config.js
```

---

## 🚫 NEVER DO THIS

❌ **DO NOT** create duplicate config files like:
- `assets/js/config/firebase-config.js`
- `config/firebase.js`
- `firebase.config.js`
- Or any other variation

❌ **DO NOT** hardcode Firebase config in HTML files

❌ **DO NOT** create inline Firebase configs in JavaScript files

---

## ✅ HOW TO USE

### In HTML Files

```html
<!-- Step 1: Load Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>

<!-- Step 2: Load SINGLE config file -->
<script src="/firebase-config.js"></script>

<!-- Step 3: Use it -->
<script>
  // Config is already loaded and initialized!
  // Access via window.firebaseAuth, window.firebaseDb, etc.
</script>
```

### Auto-Environment Detection

The config automatically detects the environment:
- `localhost` or `127.0.0.1` → Uses staging config
- `assiduous-staging.web.app` → Uses staging config
- `assiduous-prod.web.app` → Uses production config

---

## 🔧 How to Update API Key

**If you ever need to change the API key:**

1. **Get the new key from Firebase Console:**
   ```bash
   open "https://console.firebase.google.com/project/assiduous-prod/settings/general"
   ```

2. **Update ONLY ONE FILE:**
   ```bash
   nano /Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build/firebase-config.js
   ```

3. **Find the production section:**
   ```javascript
   production: {
       apiKey: "AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE",  // ← Update this
       ...
   }
   ```

4. **Deploy:**
   ```bash
   cd /Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build
   firebase deploy --only hosting
   ```

5. **Done!** All pages will use the new key automatically.

---

## 🔍 How to Verify Configuration

### Check which config is loaded:
```bash
# Open browser console (F12) on any page
# You should see:
# [Firebase] 🌐 Environment detected: PRODUCTION
# [Firebase] 📍 Project: assiduous-prod
```

### Check for duplicate configs:
```bash
cd /Users/thekryptodragon/Development/assiduous/firebase-migration-package/assiduous-build
find . -name "*firebase*config*.js" -type f | grep -v node_modules
# Should ONLY show: ./firebase-config.js
```

---

## 🐛 Troubleshooting

### Problem: "API key not valid" error

**Solution:**
1. Check the API key in `/firebase-config.js`
2. Compare with Firebase Console
3. Deploy if different
4. Clear browser cache (Cmd + Shift + R)

### Problem: Wrong environment loading

**Solution:**
1. Check `console.log` output in browser
2. Verify hostname detection logic in `firebase-config.js`
3. Make sure you're on the correct URL

### Problem: Firebase not initializing

**Solution:**
1. Ensure `/firebase-config.js` loads AFTER Firebase SDK
2. Check browser console for errors
3. Verify the file path is `/firebase-config.js` (root level)

---

## 📋 Deployment Checklist

Before deploying, verify:

- [ ] Only ONE `firebase-config.js` file exists (at root)
- [ ] API keys are correct for staging and production
- [ ] All HTML files load `/firebase-config.js` (not inline configs)
- [ ] No hardcoded API keys in other files
- [ ] Browser cache will be cleared by users (or use cache busting)

---

## 🎯 Summary

**Remember:**
1. ✅ ONE config file: `/firebase-config.js`
2. ✅ Auto-detects environment
3. ✅ Update in ONE place
4. ✅ All pages use it automatically

**Never again will you have duplicate config issues!** 🎉

---

**Last Updated:** 2025-10-13  
**Maintained By:** Development Team
