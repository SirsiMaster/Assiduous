# QR System Validation Checklist

**Date:** November 16, 2025  
**Tester:** WARP Agent Mode  
**Goal:** Validate QR system locally and in production before full app build

---

## Phase 1.2: Local Testing

### Admin Property Detail Page

**URL:** `http://localhost:8080/public/admin/property-detail.html?id=TEST_PROPERTY_ID`

#### Tests:

- [ ] Page loads without console errors
- [ ] Firebase SDK initializes (check console for "Firebase App initialized")
- [ ] Property details render
- [ ] QR widget container appears on right sidebar
- [ ] QR widget loads HTML (check Network tab for property-qr-widget.html fetch)
- [ ] QR generation button renders
- [ ] Share (Email/SMS) button renders
- [ ] Download QR button renders
- [ ] Copy Link button renders
- [ ] Regenerate button renders
- [ ] No console JS errors

#### Expected Console Messages:
```
✅ Property QR loaded: {assiduousId, qrCodeUrl, propertyUrl}
```

#### Known Issues to Check:
- Firebase functions not callable (expected - no emulator)
- QR code not generating (expected - needs Cloud Functions)
- Toast notifications may not work (CSS animations)

---

## Phase 1.3: SendGrid Email Validation

### Prerequisites:
- SENDGRID_API_KEY secret configured (verified: exists and accessible)
- Test property in Firestore
- Controlled test email address

### Test Flow:

1. **Access Production Admin Portal**
   - URL: `https://assiduous-prod.web.app/public/admin/dashboard.html`
   - Login as admin

2. **Navigate to Test Property**
   - Find or create "QR Validation Test Property"
   - Open property detail page

3. **Trigger Email Share**
   - Click "Share" button
   - Select "Email" tab
   - Enter test email (e.g., your address)
   - Add optional message
   - Click "Send Email"

4. **Monitor Firebase Functions**
   - Open terminal: `firebase functions:log`
   - Look for `sharePropertyQR` logs
   - Confirm no auth errors for SendGrid

5. **Verify Email Delivery**
   - Check inbox for email from `noreply@assiduous.com`
   - Check spam folder if not in inbox
   - Verify:
     - Subject includes property address
     - Body contains property details
     - QR code link or image present
     - Link resolves to production property detail page

### Expected Results:
- [ ] Email arrives within 30 seconds
- [ ] Subject: "Shared [Address] with you"
- [ ] Body contains property info and QR link
- [ ] Firebase logs show `[QR] sendGrid email sent` or equivalent
- [ ] Function execution time < 2 seconds
- [ ] No authentication errors in logs

### Failure Troubleshooting:
- Email not received → Check SendGrid logs and bounce messages
- Function errors → Verify SENDGRID_API_KEY secret is properly bound
- Wrong from email → Check SENDGRID_FROM_EMAIL env var

---

## Phase 1.4: Twilio SMS Validation

### Prerequisites:
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets
- Currently: ACCOUNT_SID and AUTH_TOKEN are "twilio_placeholder" ❌ NEED REAL VALUES
- Test phone number (your personal phone, with SMS enabled)

### Note: TWILIO REQUIRES REAL CREDENTIALS FIRST

Before testing SMS:
1. [ ] Obtain real Twilio account credentials
2. [ ] Set Firebase secrets:
   ```bash
   firebase functions:secrets:set TWILIO_ACCOUNT_SID
   firebase functions:secrets:set TWILIO_AUTH_TOKEN
   firebase functions:secrets:set TWILIO_PHONE_NUMBER
   ```
3. [ ] Redeploy Cloud Functions: `firebase deploy --only functions`

### Test Flow (after credentials set):

1. **Navigate to Test Property** (same as email)

2. **Trigger SMS Share**
   - Click "Share" button
   - Select "SMS" tab
   - Enter test phone number (format: +1 (555) 123-4567)
   - Add optional message
   - Click "Send SMS"

3. **Monitor Firebase Functions**
   - `firebase functions:log` | grep sharePropertyQR
   - Confirm Twilio client initializes without auth errors

4. **Verify SMS Delivery**
   - Check SMS on test phone within 30 seconds
   - Verify:
     - Sender is Twilio phone number
     - Body contains property address/identifier
     - Short link to property detail page included
     - Message is production-ready (no debug text)

### Expected Results:
- [ ] SMS arrives within 30 seconds
- [ ] Body: "Check out [Address] - [Short Link]"
- [ ] Firebase logs show `[QR] Twilio SMS sent`
- [ ] Function execution time < 2 seconds
- [ ] No auth errors with Twilio API

### Failure Troubleshooting:
- SMS not received → Check Twilio trial account limits
- Function errors → Verify Twilio credentials are real (not placeholder)
- Phone validation failed → Verify number format and Twilio account region

---

## Phase 1.5: Cloud Functions Validation

### Functions to Test:

#### 1. generatePropertyQR
- [ ] Callable via Firebase Console or Postman
- [ ] Returns {assiduousId, qrCodeUrl, propertyUrl}
- [ ] QR code URL is accessible (returns image)
- [ ] Response time < 500ms
- [ ] Logs show [QR] prefix

#### 2. sharePropertyQR
- [ ] Tested via email (Phase 1.3)
- [ ] Tested via SMS (Phase 1.4)
- [ ] Firestore tracking writes to property_shares collection
- [ ] Response includes {success: true, trackingId}

#### 3. generateReferralCode
- [ ] Callable from UI (if implemented)
- [ ] Returns unique code
- [ ] Persists to Firestore referrals collection

#### 4. sendClientInvitation
- [ ] Callable from admin UI
- [ ] Sends invitation email via SendGrid
- [ ] Email includes signup link with ?ref= or ?token= param

#### 5. shareQRCode
- [ ] Callable from profile QR page
- [ ] Shares user profile QR

#### 6. trackPropertyView
- [ ] Triggered on property detail page load
- [ ] Records view event with source (qr/email/sms/direct)
- [ ] Writes to properties/{id}/views subcollection

#### 7. generateUserQR
- [ ] Generates QR for user profile via v2 callable (`onCall`) in `functions/src/index.ts`
- [ ] Returns QR code image URL and persona-aware `profileUrl` (`/admin|agent|client/profile.html?id=...`)
- [ ] Works from `public/client/my-qr.html` using `CloudFunctionsService.generateUserQR`

---

## Phase 1.6: Production Deployment

### Before Deploying:
- [ ] All local tests pass
- [ ] Email/SMS tests successful
- [ ] No console errors
- [ ] Twilio real credentials set if SMS enabled

### Deployment Steps:

```bash
# Commit changes
git add .
git commit -m "feat(qr): Complete QR system validation and integration"

# Push to GitHub
git push origin main

# Deploy to Firebase
firebase deploy --only functions
firebase deploy --only hosting

# Monitor logs
firebase functions:log --tail
```

### Production Smoke Tests:

- [ ] Admin property detail loads QR widget
- [ ] Agent property detail loads QR widget
- [ ] Client property detail loads QR widget
- [ ] Public property detail loads QR widget
- [ ] Email share triggers and delivers
- [ ] SMS share triggers and delivers (if enabled)
- [ ] Zero console errors
- [ ] DevTools Network tab clean

---

## Phase 1.7: Documentation Updates

### Files to Update:

- [ ] `docs/ARCHITECTURE_DESIGN.md` - Add QR System section
- [ ] `docs/WARP.md` - Add QR/Email/SMS subsection under Deployment
- [ ] `README.md` - Add QR sharing to features
- [ ] `CHANGELOG.md` - Document QR validation completion

---

## Sign-Off

**Local Testing Complete:** _____ (date)  
**Production Testing Complete:** _____ (date)  
**Documentation Updated:** _____ (date)  
**Ready for Phase 2:** _____ (yes/no)

---
