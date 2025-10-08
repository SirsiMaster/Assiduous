# Firebase Multi-Environment Quick Reference

**Last Updated:** October 8, 2025  
**Status:** ✅ Fully Operational

---

## 🌐 Environment URLs

| Environment | URL | Firebase Console |
|-------------|-----|------------------|
| **DEV** | https://assiduous-dev.web.app | [Console](https://console.firebase.google.com/project/assiduous-dev) |
| **STAGING** | https://assiduous-staging.web.app | [Console](https://console.firebase.google.com/project/assiduous-staging) |
| **PRODUCTION** | https://assiduousflip.web.app | [Console](https://console.firebase.google.com/project/assiduous-prod) |

---

## 🚀 Deployment Commands

```bash
# Navigate to deployment directory first
cd firebase-migration-package

# Deploy to DEV (no confirmation required)
./deploy.sh dev

# Deploy to STAGING (requires confirmation)
./deploy.sh staging

# Deploy to PRODUCTION (requires typing 'DEPLOY TO PRODUCTION')
./deploy.sh production
```

### Manual Deployment (Alternative)

```bash
cd firebase-migration-package

# Deploy specific environment
firebase deploy --only hosting:dev --project dev
firebase deploy --only hosting:staging --project staging
firebase deploy --only hosting:production --project production
```

---

## 📊 Firebase Projects

| Project | ID | Number | Plan | Purpose |
|---------|----|----|------|---------|
| **DEV** | assiduous-dev | 186714044941 | Spark (Free) | Active development |
| **STAGING** | assiduous-staging | 853661742177 | Blaze (PAYG) | Pre-production testing |
| **PROD** | assiduous-prod | 9355377564 | Blaze (PAYG) | Live production |

---

## 🔑 Firebase Configuration (Auto-Detected)

The system automatically detects which environment you're on and uses the correct Firebase project:

**DEV Environment:**
```javascript
{
  apiKey: "AIzaSyDLi14oefCZVVlQm7cPfDb0WQ9nXlIF4jY",
  authDomain: "assiduous-dev.firebaseapp.com",
  projectId: "assiduous-dev",
  storageBucket: "assiduous-dev.firebasestorage.app",
  messagingSenderId: "186714044941",
  appId: "1:186714044941:web:1525a0503610519dd5f344"
}
```

**STAGING Environment:**
```javascript
{
  apiKey: "AIzaSyDnMkQbhC5kYl5O_07zQ2yfYvGjLRq6E0c",
  authDomain: "assiduous-staging.firebaseapp.com",
  projectId: "assiduous-staging",
  storageBucket: "assiduous-staging.firebasestorage.app",
  messagingSenderId: "853661742177",
  appId: "1:853661742177:web:cf93349a7f50a2d9f2e620"
}
```

**PRODUCTION Environment:**
```javascript
{
  apiKey: "AIzaSyCL8Y7cQ-kZfhCXaM1KBTnAI6_LXq2J8fE",
  authDomain: "assiduous-prod.firebaseapp.com",
  projectId: "assiduous-prod",
  storageBucket: "assiduous-prod.firebasestorage.app",
  messagingSenderId: "9355377564",
  appId: "1:9355377564:web:84bd6fa0e7c8a2e7c3f56b"
}
```

---

## 🧪 Testing Environment Detection

Open browser console on any environment:

```javascript
// Check current environment
console.log('Environment:', getCurrentEnvironment());
// Output: 'development', 'staging', or 'production'

// Check if production
console.log('Is Production:', isProduction());
// Output: true or false

// Get current Firebase config
console.log('Firebase Config:', getFirebaseConfig());
// Output: Current environment's Firebase configuration
```

---

## 🔄 Development Workflow

### Standard Flow
```
1. Develop locally (localhost:8080)
   ↓
2. Deploy to DEV (./deploy.sh dev)
   ↓ Test with real Firebase backend
3. Deploy to STAGING (./deploy.sh staging)
   ↓ Final validation
4. Commit to GitHub (git push)
   ↓
5. Deploy to PRODUCTION (./deploy.sh production)
   ↓ Type 'DEPLOY TO PRODUCTION' to confirm
6. Verify at https://assiduousflip.web.app
```

### Emergency Hotfix Flow
```
1. Fix locally
   ↓
2. Deploy to DEV (quick test)
   ↓
3. Deploy to STAGING (mandatory)
   ↓
4. Commit to GitHub immediately
   ↓
5. Deploy to PRODUCTION
   ↓
6. Monitor production logs
```

---

## 📦 What's Deployed in Each Environment

### Frontend Code
- ✅ All HTML, CSS, JavaScript files
- ✅ Assets (images, fonts, etc.)
- ✅ Environment-specific Firebase config (auto-detected)

### Backend Configuration
- ✅ Firestore security rules
- ✅ Firestore indexes
- ✅ Cloud Storage security rules
- ✅ Hosting configuration (caching, rewrites)

### Services Available
- ✅ Firebase Hosting
- ✅ Firestore Database (isolated per environment)
- ✅ Firebase Authentication (isolated per environment)
- ✅ Cloud Functions API (when deployed)
- ✅ Cloud Storage (when initialized)

---

## 🔍 Verification Commands

```bash
# List all Firebase projects
firebase projects:list

# List hosting sites for each environment
firebase hosting:sites:list --project dev
firebase hosting:sites:list --project staging
firebase hosting:sites:list --project production

# Check hosting targets
cat firebase-migration-package/.firebaserc

# View current deployments
firebase hosting:channel:list --project dev
firebase hosting:channel:list --project staging
firebase hosting:channel:list --project production

# Test site availability
curl -s -o /dev/null -w "%{http_code}\n" https://assiduous-dev.web.app
curl -s -o /dev/null -w "%{http_code}\n" https://assiduous-staging.web.app
curl -s -o /dev/null -w "%{http_code}\n" https://assiduousflip.web.app
```

---

## 🛠️ Common Tasks

### Deploy Security Rules Only
```bash
cd firebase-migration-package
firebase deploy --only firestore:rules,storage:rules --project dev
firebase deploy --only firestore:rules,storage:rules --project staging
firebase deploy --only firestore:rules,storage:rules --project production
```

### Deploy Firestore Indexes Only
```bash
cd firebase-migration-package
firebase deploy --only firestore:indexes --project dev
firebase deploy --only firestore:indexes --project staging
firebase deploy --only firestore:indexes --project production
```

### View Firebase Logs
```bash
# View hosting logs
firebase hosting:channel:list --project production

# View function logs (if deployed)
firebase functions:log --project production
```

---

## 📋 Pre-Deployment Checklist

### Before Deploying to DEV
- [ ] Code changes tested locally
- [ ] No console errors in browser DevTools
- [ ] All new features work as expected

### Before Deploying to STAGING
- [ ] All DEV testing passed
- [ ] No regressions in existing features
- [ ] Integration with Firebase backend verified

### Before Deploying to PRODUCTION
- [ ] All STAGING testing passed
- [ ] No known bugs
- [ ] Changes committed to GitHub
- [ ] Screenshots taken for documentation
- [ ] Team/stakeholders notified

---

## ⚠️ Important Rules

### ❌ NEVER
- Skip environments (LOCAL → PROD is forbidden)
- Deploy to production with known bugs
- Use production API keys in dev/staging code
- Edit production Firestore directly without backup
- Make changes directly in production Firebase Console
- Deploy without testing in at least STAGING

### ✅ ALWAYS
- Test locally first
- Deploy to DEV for backend testing
- Deploy to STAGING for final validation
- Commit to GitHub before production deployment
- Use the deployment script for safety checks
- Monitor Firebase Console after production deploy
- Document what changed in commit messages

---

## 🆘 Troubleshooting

### Deployment Fails
```bash
# Check if authenticated
firebase login --reauth

# Check if build directory exists
ls -la firebase-migration-package/assiduous-build

# Check Firebase projects
firebase projects:list

# Try manual deployment
cd firebase-migration-package
firebase deploy --only hosting:dev --project dev --debug
```

### Wrong Environment Detected
```javascript
// Check hostname in browser console
console.log(window.location.hostname);

// Force environment detection
const env = detectEnvironment();
console.log('Detected:', env);

// Check Firebase config being used
const config = getFirebaseConfig();
console.log('Using project:', config.projectId);
```

### Site Not Loading
1. Check deployment status in Firebase Console
2. Clear browser cache (Cmd+Shift+R on Mac)
3. Wait 2-3 minutes for CDN propagation
4. Check browser DevTools Console for errors
5. Verify files uploaded: `firebase hosting:channel:list --project <env>`

---

## 📞 Support Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Project Documentation:** `docs/FIREBASE_MULTI_ENVIRONMENT_SETUP.md`
- **Pipeline Rules:** `WARP.md` (RULE 5)
- **Firebase Console DEV:** https://console.firebase.google.com/project/assiduous-dev
- **Firebase Console STAGING:** https://console.firebase.google.com/project/assiduous-staging
- **Firebase Console PROD:** https://console.firebase.google.com/project/assiduous-prod

---

## 🎓 Key Files

| File | Purpose |
|------|---------|
| `firebase-migration-package/firebase.json` | Hosting configuration for all environments |
| `firebase-migration-package/.firebaserc` | Project aliases and hosting targets |
| `firebase-migration-package/deploy.sh` | Automated deployment script |
| `firebase-migration-package/firestore.rules` | Firestore security rules |
| `firebase-migration-package/storage.rules` | Cloud Storage security rules |
| `firebase-migration-package/firestore.indexes.json` | Firestore query indexes |
| `assiduous-build/assets/js/config/firebase-config.js` | Environment detection and Firebase configs |

---

**Last Verified:** October 8, 2025  
**All Systems:** ✅ Operational  
**All Environments:** ✅ Live
