# Password Security Standards - Assiduous

## 🔐 Password Requirements

All accounts must meet these requirements:

### Complexity
- **Minimum length**: 12 characters
- **Uppercase letters**: At least 1 (A-Z)
- **Lowercase letters**: At least 1 (a-z)
- **Numbers**: At least 1 (0-9)
- **Special characters**: At least 1 (!@#$%^&*)

### Best Practices
- Use unique passwords for each account
- Store passwords in a password manager (1Password, Bitwarden, LastPass)
- Never commit passwords to version control
- Rotate passwords every 90 days
- Enable two-factor authentication (2FA) when available

## 🔒 Secure Password Storage

### ❌ NEVER Store Passwords In:
- Source code files
- Git repositories
- Plain text files
- Documentation
- Configuration files committed to git
- Environment variables in CI/CD logs

### ✅ ALWAYS Store Passwords In:
- Password managers (1Password, Bitwarden, LastPass)
- Encrypted `.env` files (NOT committed to git)
- Firebase Admin SDK service account (for programmatic access)
- Secure key management systems (AWS Secrets Manager, HashiCorp Vault)

## 🛠️ RBAC Setup Process

### Step 1: Secure Setup Script
```bash
# Run the secure RBAC setup tool
node scripts/setup-rbac-secure.mjs
```

This script:
- Sets custom claims for role-based access control
- Updates Firestore user documents
- Optionally resets passwords to secure, randomly-generated values
- **Never** stores passwords in plain text

### Step 2: Password Management
After running the script:
1. Copy generated passwords to your password manager
2. Mark passwords as "Test Account - Assiduous"
3. Share securely with team members via password manager sharing
4. **Never** paste passwords into Slack, email, or documentation

## 📋 Account Overview

| Email | Role | Purpose |
|-------|------|---------|
| admin@sirsimaster.com | admin | Full system access |
| agent@sirsimaster.com | agent | Agent dashboard testing |
| client@sirsimaster.com | client | Client portal testing |
| admin@assiduousrealty.com | admin | Full system access |
| agent@assiduousrealty.com | agent | Agent dashboard testing |
| client@assiduousrealty.com | client | Client portal testing |
| investor@assiduousrealty.com | client | Investor portal testing |

## 🔑 Firebase Service Account

The Firebase Admin SDK requires a service account key for programmatic access.

### Setup
```bash
# 1. Download service account key from Firebase Console
# https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts

# 2. Save to project root (this file is gitignored)
cp ~/Downloads/assiduous-prod-firebase-adminsdk.json ./service-account-key.json

# 3. Verify it's gitignored
git status  # Should NOT show service-account-key.json
```

### Security Notes
- Service account keys grant full access to Firebase project
- Never commit to version control
- Rotate keys every 90 days
- Use Firebase CLI authentication for local development when possible

## 🚨 Security Incidents

### If Passwords Are Compromised
1. Immediately reset all affected passwords
2. Revoke Firebase authentication tokens
3. Check Firebase audit logs for unauthorized access
4. Notify team members
5. Document incident and response

### If Service Account Key Is Exposed
1. Immediately revoke the exposed key in Firebase Console
2. Generate new service account key
3. Update all systems using the old key
4. Check Firebase audit logs for unauthorized operations
5. Document incident and response

## 📖 Related Documentation

- [Firebase Authentication Security](https://firebase.google.com/docs/auth/admin/manage-users)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html#sec5)

## ✅ Security Checklist

Before deploying to production:

- [ ] All passwords meet complexity requirements (12+ chars, mixed case, numbers, special chars)
- [ ] No passwords stored in source code or git
- [ ] Service account key is secured and gitignored
- [ ] `.env.test` file is gitignored
- [ ] All team members using password manager
- [ ] Two-factor authentication enabled for Firebase Console
- [ ] Firebase Security Rules configured properly
- [ ] Audit logging enabled in Firebase
- [ ] Password rotation policy documented
- [ ] Incident response plan documented

## 📝 Password Rotation

Set reminders to rotate passwords every 90 days:

```bash
# Generate new secure passwords
node scripts/setup-rbac-secure.mjs
# Choose option 2 to reset all passwords

# Document rotation date
echo "Password rotated: $(date)" >> .password-rotation-log
```

**Never commit `.password-rotation-log` to git.**
