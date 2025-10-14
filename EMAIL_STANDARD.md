# Email Standardization Guide - Assiduous Realty

## 📧 Official Domain
All email addresses for the Assiduous Realty platform **MUST** use the domain:
```
@assiduousrealty.com
```

## 🚫 Deprecated Domains
The following domains should NO LONGER be used:
- `@assiduous.com`
- `@assiduousflip.com` 
- `@test.com`
- `@realty.com`
- `@example.com`

## ✅ Standard Email Formats

### System Emails
- `noreply@assiduousrealty.com` - Automated system emails
- `support@assiduousrealty.com` - Customer support
- `info@assiduousrealty.com` - General information
- `admin@assiduousrealty.com` - Administrative
- `notifications@assiduousrealty.com` - System notifications

### Department Emails
- `sales@assiduousrealty.com` - Sales inquiries
- `agents@assiduousrealty.com` - Agent support
- `clients@assiduousrealty.com` - Client services
- `investments@assiduousrealty.com` - Investment opportunities
- `flipping@assiduousrealty.com` - Micro-flipping division

### User Email Format
- **Agents**: `firstname.lastname@assiduousrealty.com`
- **Clients**: `firstname.lastname@assiduousrealty.com`
- **Admin**: `firstname.lastname.admin@assiduousrealty.com`

### Test Account Format
- **Test Admin**: `test_admin@assiduousrealty.com`
- **Test Agent**: `test_agent@assiduousrealty.com`
- **Test Client**: `test_client@assiduousrealty.com`

## 📝 Implementation

### Using the Email Config
```javascript
// Import the email configuration
const EMAIL_CONFIG = require('./email-config.js');

// Validate an email
if (EMAIL_CONFIG.validateEmail(userEmail)) {
  // Email is valid @assiduousrealty.com address
}

// Generate a standardized email
const email = EMAIL_CONFIG.generateEmail('John', 'Doe', 'agent');
// Returns: john.doe.agent@assiduousrealty.com
```

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@assiduousrealty.com` | `admin123` |
| Agent | `agent@assiduousrealty.com` | `test123` |
| Client | `client@assiduousrealty.com` | `test123` |

## 🔄 Migration Checklist

- [x] Update test authentication page
- [x] Update populate-test-data.js script
- [x] Update test-agent-dashboard.html
- [x] Create email-config.js standardization file
- [x] Update login.html page
- [x] Deploy changes to production

## 📍 Files Updated

1. `/test-auth-complete.html` - Test authentication page
2. `/test-agent-dashboard.html` - Agent dashboard test
3. `/firebase-migration-package/assiduous-build/populate-test-data.js` - Test data script
4. `/firebase-migration-package/assiduous-build/email-config.js` - Email configuration
5. `/firebase-migration-package/assiduous-build/login.html` - Login page

## 🚀 Usage in Production

All new features and test data should follow this email standard:
1. Use `@assiduousrealty.com` for ALL email addresses
2. Follow the naming conventions above
3. Use the email-config.js for validation
4. Update any existing code that uses old domains

## 📌 Important Notes

- Firebase Authentication accepts any valid email format
- Firestore user documents should store emails with @assiduousrealty.com
- Email validation should be enforced at the application level
- All test data uses the standardized domain