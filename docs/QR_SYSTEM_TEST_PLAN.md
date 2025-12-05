# QR Code System Test Plan
**Version:** 1.0  
**Date:** November 12, 2025  
**Status:** Ready for Testing

## Overview

This document provides a comprehensive test plan for the QR Code system across all user roles (Admin, Agent, Client).

---

## Test Environment

**Production URL**: https://assiduous-prod.web.app

### Test Accounts Needed

1. **Admin Account**
   - Role: `admin`
   - Access: Full system access
   
2. **Agent Account**
   - Role: `agent`
   - Access: Property management, client sharing
   
3. **Client Account**
   - Role: `client`
   - Access: Browse properties, view own QR

---

## Test Scenarios

### SCENARIO 1: Admin - Property QR Generation
**Role:** Admin  
**Goal:** Generate QR code for a property

#### Steps
1. Navigate to https://assiduous-prod.web.app/admin/properties.html
2. Click on any property card to open property detail page
3. Scroll down to "Property QR Code" widget (or click QR icon on card)
4. Observe the widget loads with:
   - Assiduous ID (format: `PROP-2025-NNNNNN`)
   - QR code image displayed
   - Four action buttons visible

#### Expected Results
- ✅ Widget appears below investment summary
- ✅ Assiduous ID shows sequential format (not random)
- ✅ QR code image loads successfully (400x400px)
- ✅ No console errors
- ✅ Property URL format: `https://assiduous-prod.web.app/property-detail.html?id={propertyId}`

#### Pass/Fail Criteria
- [ ] Widget loads without errors
- [ ] Assiduous ID is sequential format
- [ ] QR code image displays
- [ ] All 4 buttons are clickable

---

### SCENARIO 2: Admin - Download QR Code
**Role:** Admin  
**Goal:** Download property QR code as PNG

#### Steps
1. From property detail page with QR widget visible
2. Click "Download QR" button (blue primary button)
3. Check browser downloads folder

#### Expected Results
- ✅ File downloads immediately
- ✅ Filename format: `PROP-2025-NNNNNN-QR.png`
- ✅ File is valid PNG image (400x400px)
- ✅ QR code scans correctly when tested with phone
- ✅ Toast notification: "QR code downloaded!"

#### Pass/Fail Criteria
- [ ] PNG file downloads successfully
- [ ] Filename matches Assiduous ID
- [ ] QR code is scannable
- [ ] Toast notification appears

---

### SCENARIO 3: Admin - Copy Property Link
**Role:** Admin  
**Goal:** Copy property link to clipboard

#### Steps
1. From property detail page with QR widget visible
2. Click "Copy Link" button
3. Paste link into new browser tab or text editor

#### Expected Results
- ✅ Link copied to clipboard
- ✅ Toast notification: "Property link copied to clipboard!"
- ✅ Link format: `https://assiduous-prod.web.app/property-detail.html?id={propertyId}`
- ✅ Link opens property detail page when visited

#### Pass/Fail Criteria
- [ ] Clipboard contains correct URL
- [ ] Toast notification appears
- [ ] Link is valid and opens property page

---

### SCENARIO 4: Admin - Share Property via Email
**Role:** Admin  
**Goal:** Share property with client via email with attribution tracking

#### Steps
1. From property detail page, click "Share" button in QR widget
2. Share modal opens with Email/SMS tabs
3. Ensure "Email" tab is active
4. Fill in form:
   - Recipient Email: `test-client@example.com` (use real email you can check)
   - Personal Message: "Check out this property!"
5. Click "Send Email"
6. Check recipient email inbox
7. Click link in email
8. Check browser console and Firestore

#### Expected Results
- ✅ Modal opens with tabbed interface
- ✅ Email form has email input and message textarea
- ✅ Submit button says "Send Email"
- ✅ On submit: Button changes to "Sending..."
- ✅ Toast notification: "Property shared via email successfully!"
- ✅ Modal closes automatically
- ✅ Form resets

**Email Should Contain:**
- ✅ Property address and price
- ✅ Personal message from admin
- ✅ QR code image embedded
- ✅ "View Property" button/link
- ✅ Link includes `&shared_by={adminUserId}` parameter

**Firestore Verification:**
```javascript
// Check property_shares collection
{
  propertyId: "...",
  assiduousId: "PROP-2025-NNNNNN",
  sharedBy: "{adminUserId}",
  sharerName: "Admin Name",
  method: "email",
  recipientEmail: "test-client@example.com",
  sharedAt: Timestamp,
  viewed: false,
  viewedAt: null
}
```

#### Pass/Fail Criteria
- [ ] Modal works correctly
- [ ] Email sends successfully
- [ ] Email contains all required elements
- [ ] Tracking link includes shared_by parameter
- [ ] Document created in property_shares collection

---

### SCENARIO 5: Admin - Share Property via SMS
**Role:** Admin  
**Goal:** Share property via SMS with tracking

#### Steps
1. From property detail page, click "Share" button
2. Switch to "SMS" tab in modal
3. Fill in form:
   - Recipient Phone: `+1 555 123 4567` (use real phone if available)
   - Personal Message: "Great investment opportunity"
4. Click "Send SMS"
5. Check phone for SMS (if available)

#### Expected Results
- ✅ SMS tab becomes active
- ✅ Form shows phone input and message textarea
- ✅ Submit button says "Send SMS"
- ✅ Toast notification: "Property shared via SMS successfully!"

**SMS Should Contain:**
- ✅ Admin name + "shared {address} with you on Assiduous"
- ✅ Tracked link with `shared_by` parameter
- ✅ Short, mobile-friendly message

**Firestore Verification:**
```javascript
// Check property_shares collection
{
  method: "sms",
  recipientPhone: "+1 555 123 4567",
  // ... other fields same as email
}
```

#### Pass/Fail Criteria
- [ ] SMS form works
- [ ] SMS sends (or Twilio not configured warning appears)
- [ ] Tracking document created in Firestore
- [ ] SMS received (if Twilio configured)

---

### SCENARIO 6: Client - View Shared Property (Attribution Tracking)
**Role:** Client (or anonymous)  
**Goal:** Track property view from shared link

#### Steps
1. Use the link from SCENARIO 4 email (with `shared_by` parameter)
2. Open link in browser (incognito recommended)
3. Property detail page loads
4. Open browser DevTools Console
5. Check for tracking messages

#### Expected Results
- ✅ Property detail page loads normally
- ✅ Console shows: "✅ Property view tracked" (if tracking enabled)
- ✅ QR widget visible on page

**Firestore Verification:**
```javascript
// property_shares document should update
{
  viewed: true,
  viewedAt: Timestamp,
  viewerId: "{clientUserId or anonymous}"
}

// properties/{propertyId}/views subcollection
{
  viewedAt: Timestamp,
  viewerId: "...",
  sharedBy: "{adminUserId}",
  attribution: "email"
}
```

#### Pass/Fail Criteria
- [ ] Property page loads
- [ ] property_shares document updated (viewed: true)
- [ ] View document created in subcollection
- [ ] Attribution correctly records sharer

---

### SCENARIO 7: Admin - Regenerate Property QR
**Role:** Admin  
**Goal:** Generate new QR code for property

#### Steps
1. From property detail page with existing QR
2. Note current Assiduous ID (e.g., `PROP-2025-000001`)
3. Click "Regenerate" button
4. Confirm dialog: "Are you sure you want to regenerate..."
5. Click OK
6. Wait for regeneration

#### Expected Results
- ✅ Confirmation dialog appears
- ✅ Button changes to "Regenerating..."
- ✅ New Assiduous ID generated (sequential, next number)
- ✅ New QR code image loads
- ✅ Toast notification: "QR code regenerated successfully!"
- ✅ Button returns to normal state

**Firestore Verification:**
```javascript
// Property document updated
{
  assiduousId: "PROP-2025-000002", // New sequential ID
  qrCodeUrl: "https://api.qrserver.com/...", // New QR
  qrGeneratedAt: Timestamp, // Updated timestamp
  qrGeneratedBy: "{adminUserId}"
}
```

#### Pass/Fail Criteria
- [ ] Confirmation required
- [ ] New sequential ID generated
- [ ] Old QR code replaced
- [ ] Firestore updated correctly

---

### SCENARIO 8: Admin - Quick Access from Property List
**Role:** Admin  
**Goal:** Access QR code directly from property card

#### Steps
1. Navigate to https://assiduous-prod.web.app/admin/properties.html
2. Find any property card
3. Locate QR icon button (small blue button, bottom right of card)
4. Click QR icon button (NOT the card itself)
5. Property detail page opens

#### Expected Results
- ✅ QR icon visible on each property card
- ✅ Clicking icon doesn't trigger card click
- ✅ Property detail page opens
- ✅ Page auto-scrolls to QR widget
- ✅ QR widget highlighted briefly (2-second glow effect)
- ✅ URL includes `#qr` hash

#### Pass/Fail Criteria
- [ ] QR icon clickable without opening card
- [ ] Page scrolls to QR section
- [ ] Visual highlight appears
- [ ] Hash navigation works

---

### SCENARIO 9: Client - View Personal QR Code
**Role:** Client  
**Goal:** Access and manage personal profile QR code

#### Steps
1. Login as client: https://assiduous-prod.web.app/client/
2. Navigate to sidebar, under "My Portal"
3. Click "My QR Code" navigation item
4. Page loads: https://assiduous-prod.web.app/client/my-qr.html

#### Expected Results
- ✅ Dedicated QR page loads
- ✅ Personal QR code displayed (300x300px)
- ✅ Profile URL shown
- ✅ Four action buttons visible:
  - Download QR Code (primary)
  - Copy Profile Link
  - Share QR Code
  - Regenerate QR
- ✅ "How to Use Your QR Code" section with 4 examples
- ✅ Usage examples: Email signature, business cards, social media, networking

**Firestore Verification:**
```javascript
// users/{clientUserId}
{
  profileQRCode: "https://api.qrserver.com/...",
  profileUrl: "https://assiduous-prod.web.app/profile?uid={clientUserId}",
  profileQRGeneratedAt: Timestamp
}
```

#### Pass/Fail Criteria
- [ ] Page accessible from sidebar
- [ ] Personal QR code displays
- [ ] All buttons functional
- [ ] Usage examples visible
- [ ] User document has QR fields

---

### SCENARIO 10: Client - Download Personal QR
**Role:** Client  
**Goal:** Download personal QR code for business card

#### Steps
1. From client my-qr.html page
2. Click "Download QR Code" button
3. Check downloads folder

#### Expected Results
- ✅ PNG downloads immediately
- ✅ Filename: `{ClientName}-Profile-QR.png` (e.g., `John-Profile-QR.png`)
- ✅ Image is 300x300px
- ✅ QR code scans to profile URL
- ✅ Toast notification appears

#### Pass/Fail Criteria
- [ ] Download successful
- [ ] Filename includes user name
- [ ] QR code scannable
- [ ] Links to correct profile

---

### SCENARIO 11: Client - Regenerate Personal QR
**Role:** Client  
**Goal:** Generate new personal QR code

#### Steps
1. From client my-qr.html page
2. Note current QR code image URL
3. Click "Regenerate QR" button
4. Confirm dialog
5. Wait for regeneration

#### Expected Results
- ✅ Confirmation dialog warns old QR won't work
- ✅ New QR code generated
- ✅ New QR image URL different from previous
- ✅ Profile URL remains same (user ID doesn't change)
- ✅ Toast notification: "QR code regenerated successfully!"
- ✅ User document updated in Firestore

#### Pass/Fail Criteria
- [ ] Confirmation required
- [ ] New QR generated
- [ ] Profile URL unchanged
- [ ] Old QR no longer works (technically impossible to enforce, but new one generated)

---

### SCENARIO 12: Agent - Full Property Sharing Workflow
**Role:** Agent  
**Goal:** Complete end-to-end property sharing with client

#### Steps
1. Login as agent
2. Navigate to agent properties page
3. Select a property
4. Generate QR code (if not exists)
5. Share via email to real client email
6. Client receives email
7. Client clicks link
8. Check attribution tracking

#### Expected Results
- ✅ Agent can access property QR widgets
- ✅ Agent can share properties
- ✅ Email sent from agent's name
- ✅ Tracking records agent as sharer
- ✅ Client view attributed to agent
- ✅ Agent could later see analytics (future feature)

#### Pass/Fail Criteria
- [ ] Agent has full QR access
- [ ] Sharing works from agent account
- [ ] Attribution tracks correctly
- [ ] End-to-end flow successful

---

## Integration Tests

### INT-1: ID Generator Integration
**Goal:** Verify sequential ID generation

#### Test Steps
1. Create/regenerate QR for 3 different properties
2. Note the Assiduous IDs

#### Expected Results
- ✅ IDs are sequential: `PROP-2025-000001`, `PROP-2025-000002`, `PROP-2025-000003`
- ✅ Year matches current year (2025)
- ✅ No duplicate IDs
- ✅ Counter increments atomically

**Firestore Verification:**
```javascript
// _id_counters/PROP_2025
{
  type: "PROP",
  year: 2025,
  current: 3, // Increments with each generation
  lastUpdated: Timestamp
}
```

#### Pass/Fail
- [ ] IDs are sequential
- [ ] Counter increments correctly
- [ ] No race conditions or duplicates

---

### INT-2: Cross-Portal Consistency
**Goal:** Verify QR widget works identically across portals

#### Test Steps
1. View same property from:
   - Admin portal: `/admin/property-detail.html?id=X`
   - Client portal: `/client/property-detail.html?id=X`
   - Public page: `/property-detail.html?id=X`
2. Compare QR widgets

#### Expected Results
- ✅ Same Assiduous ID shown in all portals
- ✅ Same QR code image URL
- ✅ All widgets fully functional
- ✅ Consistent UI/UX across portals

#### Pass/Fail
- [ ] Same data in all portals
- [ ] All widgets functional
- [ ] UI consistent

---

### INT-3: Error Handling
**Goal:** Test system behavior with errors

#### Test Scenarios

**A. Invalid Property ID**
1. Navigate to `/admin/property-detail.html?id=invalid123`
2. Expected: Error message, no QR widget crash

**B. Firebase Functions Offline**
1. Disable network in DevTools
2. Try to generate QR
3. Expected: Error toast, graceful failure message

**C. Unauthenticated User**
1. Logout
2. Try to access property detail with QR
3. Expected: Redirect to login OR error message

**D. Missing Email/Phone in Share**
1. Open share modal
2. Submit empty form
3. Expected: Browser validation, no submission

#### Pass/Fail
- [ ] Invalid property ID handled
- [ ] Network errors caught
- [ ] Auth errors handled
- [ ] Form validation works

---

## Performance Tests

### PERF-1: QR Generation Speed
**Goal:** Measure QR generation time

#### Test Steps
1. Open property detail page (fresh load, no cache)
2. Open DevTools → Network tab
3. Note time for `generatePropertyQR` function call

#### Expected Results
- ✅ Function responds in < 2 seconds (cold start)
- ✅ Function responds in < 500ms (warm start)
- ✅ QR widget fully loaded in < 3 seconds

#### Pass/Fail
- [ ] Cold start < 2s
- [ ] Warm start < 500ms
- [ ] Total load < 3s

---

### PERF-2: Page Load Impact
**Goal:** Measure QR widget impact on page load

#### Test Steps
1. Open property detail page
2. Check Lighthouse performance score
3. Compare with/without QR widget

#### Expected Results
- ✅ Performance score > 90
- ✅ No layout shift (CLS)
- ✅ QR widget doesn't block page render

#### Pass/Fail
- [ ] Performance acceptable
- [ ] No visual jank
- [ ] Progressive loading works

---

## Security Tests

### SEC-1: Authentication Required
**Goal:** Verify QR functions require auth

#### Test Steps
1. Logout
2. Try to call `generatePropertyQR` directly from console
3. Try to call `sharePropertyQR`
4. Try to call `generateUserQR` via `httpsCallable(functions, 'generateUserQR')`

#### Expected Results
- ✅ Functions return auth error
- ✅ No data exposed
- ✅ Proper error messages

#### Pass/Fail
- [ ] Auth enforced on all functions
- [ ] No data leakage

---

### SEC-2: Data Privacy
**Goal:** Verify share tracking respects privacy

#### Test Steps
1. Check Firestore rules for property_shares
2. Try to read another user's shares
3. Verify only owner/admin can access

#### Expected Results
- ✅ Users can only see their own shares
- ✅ Admins can see all shares
- ✅ No unauthorized access

#### Pass/Fail
- [ ] Privacy rules enforced
- [ ] Admin override works
- [ ] No data leaks

---

## Profile & User QR Acceptance Test

### Overview
These tests validate the end-to-end profile system and user QR flows for all personas (client, agent, admin). Run them after all profile-related development (18-task plan) is complete.

### P1. Backend Profile Schema & QR Triggers
- [ ] New users (admin, agent, client/investor) created via normal signup have:
  - [ ] `profile` object present under `users/{uid}` with keys: `photoUrl`, `bio`, `city`, `state`, `zip`, `linkedinUrl`, `twitterHandle`, `instagramHandle`, `websiteUrl`.
  - [ ] `profileUrl` pointing to the correct portal path:
    - Admin → `/admin/profile.html?id={uid}`
    - Agent → `/agent/profile.html?id={uid}`
    - Client/Investor → `/client/profile.html?id={uid}`
  - [ ] `profileQRCode` and `profileQRGeneratedAt` populated.
- [ ] Creating a user document manually (no `profile` field) triggers `onUserProfileCreated` to backfill `profile` and generate `profileUrl` + `profileQRCode`.
- [ ] Calling `generateUserQR({regenerate:false})` returns the existing QR + URL without creating a new code.
- [ ] Calling `generateUserQR({regenerate:true})` updates `profileQRCode` and `profileQRGeneratedAt` while keeping `profileUrl` stable.

### P2. Client Portal – Settings & Profile
- [ ] `/client/settings.html` (authenticated as client):
  - [ ] Loads without console errors; Firebase initialized.
  - [ ] Pre-populates: first/last name, email (disabled), phone, city, state, ZIP, bio, LinkedIn, website, X/Twitter, Instagram.
  - [ ] "Public profile link" shows a valid `/client/profile.html?id={uid}` URL and opens that page.
  - [ ] Editing basic info and saving updates Firestore root fields (`firstName`, `lastName`, `displayName`, `phone`).
  - [ ] Editing location/bio/social updates `profile.city/state/zip/bio/*social*`.
  - [ ] Uploading a profile photo:
    - [ ] Stores file under `users/{uid}/profile-photo/...` in Storage.
    - [ ] Sets `profile.photoUrl` and updates avatar preview.
- [ ] `/client/profile.html?id={uid}`:
  - [ ] Shows avatar (photo or initials), name, role, email (mailto), phone, location, bio.
  - [ ] Social pills open correct URLs; `@handle` or bare handle is normalized for X/Instagram.
  - [ ] Viewing another client’s profile while logged in shows that client’s data (no "not authorized" error for valid IDs).

### P3. Agent Portal – Settings & Profile
- [ ] `/agent/settings.html` (authenticated as agent):
  - [ ] Pre-populates basic info + brokerage + license fields (`brokerageName`, `licenseNumber`, `licenseState`, `licenseExpiry`).
  - [ ] License badge in summary card reflects current license number/state or "Not provided" when blank.
  - [ ] Saving writes updates to Firestore root and `profile` fields as designed.
  - [ ] Uploading a profile photo stores under `agents/{uid}/profile-photo/...` and updates `profile.photoUrl`.
  - [ ] Public profile link points to `/agent/profile.html?id={uid}` and opens correctly.
- [ ] `/agent/profile.html?id={uid}`:
  - [ ] Renders avatar, name, role, email, phone, location, bio.
  - [ ] Shows brokerage badge and license badge with correct values.
  - [ ] Social pills behave as in client profile.
  - [ ] Any authenticated user with access to this route can view an agent’s profile by ID.

### P4. Admin Portal – Settings & Profile
- [ ] `/admin/settings.html` (authenticated as admin):
  - [ ] "Admin profile" section populated from `users/{uid}` and `profile`.
  - [ ] Saving updates `displayName`, `phone` and `profile.*` fields.
  - [ ] Admin photo upload stores under `admins/{uid}/profile-photo/...` and updates `profile.photoUrl`.
- [ ] `/admin/profile.html?id={uid}`:
  - [ ] Renders avatar, name, role, email, phone, location, bio and social links.
  - [ ] Admin can view any user’s profile by ID; layout adjusts to the user’s role and data.

### P5. User QR Flows (My QR)
- [ ] `/client/my-qr.html`:
  - [ ] Loads a QR image without CORS/Callable errors.
  - [ ] Profile URL text matches `/client/profile.html?id={uid}`.
  - [ ] "Download QR Code" downloads a PNG that scans to the same profile URL.
  - [ ] "Copy Profile Link" copies the profile URL to clipboard.
  - [ ] "Share QR Code" uses Web Share or falls back to copy behavior gracefully.
  - [ ] "Regenerate QR" shows a warning, then updates QR image and `profileQRCode` / `profileQRGeneratedAt`.
- [ ] Equivalent behavior holds for agent/admin My QR pages (if implemented) with role-appropriate URLs.

### P6. Property & Document QR Non-Dud Behavior
- [ ] Property QR widgets:
  - [ ] Display a QR image and a clickable "Open property page" link that routes to the correct property detail URL.
  - [ ] Scanning the property QR from a phone reaches the same property page (login/guard behavior is acceptable as long as there is a valid destination).
- [ ] Document QR (client documents page):
  - [ ] QR button opens a modal with QR image and "Open document" link.
  - [ ] Scanning the QR opens the document’s URL (or login then URL) without a dead end.

### P7. Backfill & Migration
- [ ] Sample of pre-existing users (admin, agent, several clients):
  - [ ] Now have `profile` object with all keys.
  - [ ] Have `profileUrl` + `profileQRCode` populated.
  - [ ] Settings and profile pages work identically to newly-created accounts.
  - [ ] My QR pages can load/regenerate QRs without error.

### P8. Security & Access Control
- [ ] Anonymous users cannot access portal profile pages (are redirected or blocked by auth-guard).
- [ ] Auth rules still prevent a user from writing to another user’s `users/{uid}` document.
- [ ] Admin retains ability to read user profiles where expected (for admin tools).

### P9. Final Acceptance Flow
- [ ] New client signup → complete settings → verify profile page → verify My QR scan end-to-end.
- [ ] New agent signup (including any approval flow) → complete settings → verify profile page → verify My QR scan end-to-end.
- [ ] Admin configures own profile → verifies admin profile page.
- [ ] Spot-check property + document QR flows still behave as expected.

---

## Agent Mode Automation Prompt (Profile + QR)

Use the following prompt to have WARP Agent Mode execute this test plan once all 18 profile tasks are complete:

```text
You are Agent Mode running inside Warp on the Assiduous codebase.
The profile system and QR-related development tasks are complete.

Using docs/QR_SYSTEM_TEST_PLAN.md, run the "Profile & User QR Acceptance Test" section (P1–P9) against production (https://assiduous-prod.web.app) and, where appropriate, localhost.

For each subsection:
- Drive the browser and Firebase console as if you were the QA tester.
- Report pass/fail for every checklist item.
- Log any defects or inconsistencies with precise URLs, user roles, and console errors.
- Confirm that every QR (profile, property, document) resolves to a meaningful destination and never to a dead end.

When finished, output a short summary including:
- Overall status (PASS/FAIL/CONDITIONAL)
- Critical issues
- Minor issues
- Any follow-up work required before MVP handover on December 15.
```

---

## Browser Compatibility

### Test Matrix

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | [ ] |
| Firefox | Latest | [ ] |
| Safari | Latest | [ ] |
| Edge | Latest | [ ] |
| Mobile Safari | iOS 15+ | [ ] |
| Chrome Mobile | Android | [ ] |

---

## Test Results Summary

### Overall Status
- **Total Tests**: 12 scenarios + 3 integration + 2 performance + 2 security = 19 tests
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___
- **Not Run**: ___

### Critical Issues Found
1. 
2. 
3. 

### Minor Issues Found
1. 
2. 
3. 

### Recommendations
1. 
2. 
3. 

---

## Sign-Off

**Tested By**: ___________  
**Date**: ___________  
**Build Version**: v0.126.0 (November 12, 2025)  
**Status**: [ ] PASS [ ] FAIL [ ] CONDITIONAL PASS

---

## Appendix: Console Commands for Testing

### Check Firestore from Console
```javascript
// Get property shares
db.collection('property_shares')
  .where('propertyId', '==', 'YOUR_PROPERTY_ID')
  .get()
  .then(snapshot => snapshot.docs.map(doc => doc.data()));

// Get property views
db.collection('properties').doc('YOUR_PROPERTY_ID')
  .collection('views')
  .get()
  .then(snapshot => snapshot.docs.map(doc => doc.data()));

// Get ID counter
db.collection('_id_counters').doc('PROP_2025').get()
  .then(doc => doc.data());
```

### Test QR Generation Directly
```javascript
// Call from browser console on authenticated page
const generatePropertyQR = firebase.functions().httpsCallable('generatePropertyQR');
const generateUserQR = firebase.functions().httpsCallable('generateUserQR');

generatePropertyQR({ propertyId: 'YOUR_PROPERTY_ID' })
  .then(result => console.log('✅ Property QR:', result.data))
  .catch(error => console.error('❌ Property QR error:', error));

generateUserQR({ regenerate: false })
  .then(result => console.log('✅ User QR:', result.data))
  .catch(error => console.error('❌ User QR error:', error));
```
