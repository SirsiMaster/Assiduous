# Password Standards - Assiduous Realty

## 🔑 Test Account Passwords

### Admin Accounts
All admin accounts use the password:
```
admin123
```

This applies to:
- `admin@assiduousrealty.com`
- `test_admin@assiduousrealty.com`
- Any account with role: `admin`

### Agent & Client Accounts
All non-admin test accounts use the password:
```
test123
```

This applies to:
- `agent@assiduousrealty.com`
- `client@assiduousrealty.com`
- `test_agent@assiduousrealty.com`
- `test_client@assiduousrealty.com`
- All sample agent accounts
- All sample client accounts

## 📋 Quick Reference

| Account Type | Email Pattern | Password |
|-------------|---------------|----------|
| Admin | `*admin*@assiduousrealty.com` | `admin123` |
| Agent | `*agent*@assiduousrealty.com` | `test123` |
| Client | `*client*@assiduousrealty.com` | `test123` |

## 🧪 Primary Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@assiduousrealty.com` | `admin123` |
| **Agent** | `agent@assiduousrealty.com` | `test123` |
| **Client** | `client@assiduousrealty.com` | `test123` |

## 🔐 Password Rules

### Test Accounts (Development)
- Admin role: `admin123`
- All other roles: `test123`
- Minimum length: 6 characters
- Special characters: Not required for test accounts

### Production Accounts
- Minimum length: 8 characters
- Must include: uppercase, lowercase, number, special character
- Cannot reuse last 5 passwords
- Must change every 90 days

## 💻 Implementation

### Using Test Credentials Module
```javascript
const TEST_CREDENTIALS = require('./test-credentials.js');

// Get admin credentials
const admin = TEST_CREDENTIALS.ADMIN;
console.log(admin.email);     // admin@assiduousrealty.com
console.log(admin.password);  // admin123

// Get password for a role
const password = TEST_CREDENTIALS.getPasswordForRole('admin');  // admin123
const password2 = TEST_CREDENTIALS.getPasswordForRole('agent'); // test123
```

### Creating Test Users
```javascript
async function createTestUser(role) {
    const password = role === 'admin' ? 'admin123' : 'test123';
    // Create user with appropriate password
}
```

## 📝 Important Notes

1. **Consistency**: Always use `admin123` for admin accounts
2. **Security**: These passwords are for TEST/DEVELOPMENT only
3. **Production**: Never use these simple passwords in production
4. **Documentation**: Keep all documentation updated with correct passwords

## 🔄 Migration Status

- [x] Updated test-auth-complete.html
- [x] Updated populate-test-data.js
- [x] Updated EMAIL_STANDARD.md
- [x] Created test-credentials.js module
- [x] Created PASSWORD_STANDARDS.md
- [x] Deployed to production

## 🚨 Security Warning

These passwords are intentionally simple for development and testing purposes only. In production:
- Use strong, unique passwords
- Enable two-factor authentication
- Implement proper password policies
- Never share credentials
- Rotate passwords regularly