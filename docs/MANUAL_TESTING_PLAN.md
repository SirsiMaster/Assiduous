# Manual Browser Testing Plan
**Assiduous Real Estate Platform - Post-Development QA**

## Overview
This document contains all manual browser testing procedures to be performed after development completion. Each feature should be tested end-to-end in a real browser with DevTools open.

---

## Testing Environment Setup

### Prerequisites
- [ ] Chrome/Firefox browser with DevTools
- [ ] Test user accounts created:
  - Client: `client@sirsimaster.com` / `Test123!`
  - Agent: `agent@sirsimaster.com` / `Test123!`
  - Admin: `admin@sirsimaster.com` / `Test123!`
- [ ] Staging URL: `https://assiduous-staging.web.app`
- [ ] Production URL: `https://assiduous-prod.web.app`

### DevTools Checklist
- [ ] Console tab open (check for errors)
- [ ] Network tab open (monitor API calls)
- [ ] Mobile device toolbar available (Cmd+Shift+M)

---

## Day 2: Client Portal - Favorites & Lead Submission

### Test Case 2.1: Property Detail Page Load
**URL:** `https://assiduous-staging.web.app/client/property-detail.html?id=yqc90rjMbvBU0XMF0WYa`

**Steps:**
1. Open URL in browser
2. Open DevTools Console
3. Wait for page to fully load
4. Verify property details display correctly

**Expected Results:**
- [ ] Zero JavaScript errors in console
- [ ] Property image loads
- [ ] Property details (price, beds, baths, sqft) display
- [ ] "Save Property" button visible
- [ ] "Contact Agent" button visible
- [ ] Page loads in under 3 seconds

**Screenshot:** `screenshots/day2_property_detail_load.png`

---

### Test Case 2.2: Save Property (Favorites) - Unauthenticated
**Prerequisites:** Logged out / no active session

**Steps:**
1. Navigate to property detail page
2. Click "❤️ Save Property" button
3. Observe alert message
4. Check localStorage in DevTools Application tab

**Expected Results:**
- [ ] Alert displays: "Please sign in to save properties to your account."
- [ ] Property saved to localStorage as fallback
- [ ] Button UI updates to show saved state
- [ ] No console errors

**Screenshot:** `screenshots/day2_save_unauthenticated.png`

---

### Test Case 2.3: Save Property (Favorites) - Authenticated
**Prerequisites:** Logged in as `client@sirsimaster.com`

**Steps:**
1. Log in to client portal
2. Navigate to property detail page
3. Open DevTools Network tab
4. Click "❤️ Save Property" button
5. Check Firestore in Firebase Console: `users/{uid}/favorites/{propertyId}`

**Expected Results:**
- [ ] No alert message (silent success)
- [ ] Button text changes to "❤️ Saved"
- [ ] Network tab shows Firestore write operation
- [ ] Favorite document created in Firestore with `createdAt` timestamp
- [ ] localStorage also updated (backward compatibility)
- [ ] No console errors

**Firestore Verification:**
```
Collection: users/{client_uid}/favorites
Document ID: {propertyId}
Fields:
  - propertyId: string
  - createdAt: timestamp
```

**Screenshot:** `screenshots/day2_save_authenticated.png`

---

### Test Case 2.4: Unsave Property (Remove Favorite)
**Prerequisites:** Property already saved, logged in

**Steps:**
1. Navigate to previously saved property
2. Verify button shows "❤️ Saved"
3. Click button again
4. Check Firestore document deleted

**Expected Results:**
- [ ] Button text changes back to "❤️ Save Property"
- [ ] Firestore document deleted from `users/{uid}/favorites/{propertyId}`
- [ ] localStorage updated
- [ ] No console errors

**Screenshot:** `screenshots/day2_unsave_property.png`

---

### Test Case 2.5: Lead Submission (Contact Form) - Unauthenticated
**Prerequisites:** Logged out

**Steps:**
1. Navigate to property detail page
2. Click "Contact Agent" button
3. Fill form:
   - Name: "John Doe"
   - Email: "john.doe@example.com"
   - Phone: "555-1234"
   - Message: "I'm interested in viewing this property."
4. Open Network tab
5. Click "Send Message"
6. Check response in Network tab
7. Verify lead in Firestore Console: `leads` collection

**Expected Results:**
- [ ] Form validates email format
- [ ] Network tab shows POST to `/leads` endpoint
- [ ] Response: `201 Created` with lead ID
- [ ] Success alert: "Message sent successfully! An agent will contact you soon."
- [ ] Form resets after submission
- [ ] Modal closes
- [ ] Lead document created in Firestore with structure:
  ```
  {
    propertyId: string,
    name: string,
    email: string,
    phone: string,
    message: string,
    clientId: null,
    status: "new",
    assignedAgentId: null,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  ```
- [ ] No console errors

**API Request Verification:**
```bash
POST https://api-36hssmwerq-uc.a.run.app/leads
Content-Type: application/json

{
  "propertyId": "yqc90rjMbvBU0XMF0WYa",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "555-1234",
  "message": "I'm interested in viewing this property."
}
```

**Screenshot:** `screenshots/day2_lead_submission_unauth.png`

---

### Test Case 2.6: Lead Submission - Authenticated
**Prerequisites:** Logged in as `client@sirsimaster.com`

**Steps:**
1. Log in to client portal
2. Navigate to property detail page
3. Click "Contact Agent"
4. Fill and submit form (same as 2.5)
5. Check lead document in Firestore

**Expected Results:**
- [ ] Lead created with `clientId` field populated with current user UID
- [ ] All other behaviors same as unauthenticated test
- [ ] Lead document structure:
  ```
  {
    ...
    clientId: "{client_uid}",
    ...
  }
  ```

**Screenshot:** `screenshots/day2_lead_submission_auth.png`

---

### Test Case 2.7: Lead Submission - Validation Errors
**Steps:**
1. Click "Contact Agent"
2. Try submitting with empty name
3. Try submitting with invalid email format
4. Try submitting with all fields empty

**Expected Results:**
- [ ] Form prevents submission if required fields empty
- [ ] Email field validates format (shows browser validation)
- [ ] Error messages display appropriately
- [ ] No API calls made for invalid submissions
- [ ] No console errors

**Screenshot:** `screenshots/day2_lead_validation_errors.png`

---

### Test Case 2.8: Mobile Responsive - Property Detail
**Steps:**
1. Open property detail page
2. Open DevTools device toolbar (Cmd+Shift+M)
3. Select iPhone SE viewport (375x667)
4. Test save button
5. Test contact form
6. Scroll through page

**Expected Results:**
- [ ] Layout adapts to mobile width
- [ ] Images scale correctly
- [ ] Buttons are tappable (minimum 44x44px)
- [ ] Forms are usable on mobile
- [ ] Contact modal fits mobile screen
- [ ] Text is readable without zooming
- [ ] No horizontal scrolling
- [ ] All functionality works on mobile

**Screenshot:** `screenshots/day2_mobile_responsive.png`

---

## Day 2: Admin/Agent - Lead Management

### Test Case 2.9: Agent Views Assigned Leads
**Prerequisites:** Logged in as `agent@sirsimaster.com`

**Steps:**
1. Navigate to agent dashboard
2. Go to "My Leads" section
3. Verify only assigned leads display

**Expected Results:**
- [ ] Only leads with `assignedAgentId === agent_uid` display
- [ ] Leads sorted by `createdAt DESC`
- [ ] Each lead shows: name, email, property, status, date
- [ ] No console errors

**Screenshot:** `screenshots/day2_agent_leads.png`

---

### Test Case 2.10: Admin Auto-Assigns Lead
**Prerequisites:** Logged in as `admin@sirsimaster.com`, at least 2 active agents

**Steps:**
1. Create a test lead (use Test Case 2.5)
2. Navigate to Admin > Leads
3. Click "Auto-Assign" on the new lead
4. Check Firestore: lead document updated
5. Check Firestore: `counters/leadRouting` document

**Expected Results:**
- [ ] Lead `assignedAgentId` field populated
- [ ] Lead `status` changed to "assigned"
- [ ] Lead `assignedAt` timestamp added
- [ ] Round-robin counter updated
- [ ] If lead has `clientId`, relationship document created in `relationships` collection
- [ ] No console errors

**Screenshot:** `screenshots/day2_admin_auto_assign.png`

---

### Test Case 2.11: Admin Manually Assigns Lead
**Prerequisites:** Logged in as admin, test lead exists

**Steps:**
1. Navigate to Admin > Leads
2. Select unassigned lead
3. Click "Assign to Agent"
4. Select specific agent from dropdown
5. Confirm assignment

**Expected Results:**
- [ ] Lead assigned to selected agent
- [ ] Lead status changes to "assigned"
- [ ] Agent can now see lead in "My Leads"
- [ ] Relationship created if clientId exists
- [ ] No console errors

**Screenshot:** `screenshots/day2_admin_manual_assign.png`

---

### Test Case 2.12: Agent Updates Lead Status
**Prerequisites:** Logged in as agent with assigned leads

**Steps:**
1. Navigate to "My Leads"
2. Select a lead
3. Update status from "assigned" to "contacted"
4. Save changes

**Expected Results:**
- [ ] PUT request to `/leads/{id}` succeeds
- [ ] Lead `status` field updated in Firestore
- [ ] Lead `updatedAt` timestamp updated
- [ ] UI reflects new status
- [ ] No console errors

**Screenshot:** `screenshots/day2_agent_update_status.png`

---

## Performance Testing

### Test Case 2.13: Page Load Performance
**Tools:** DevTools Performance tab, Lighthouse

**Steps:**
1. Open property detail page
2. Run Lighthouse audit
3. Check Performance score

**Expected Results:**
- [ ] Page loads in under 3 seconds
- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.9s
- [ ] No layout shifts (CLS < 0.1)

**Screenshot:** `screenshots/day2_lighthouse_performance.png`

---

## Error Handling

### Test Case 2.14: Network Failure - Lead Submission
**Steps:**
1. Open DevTools Network tab
2. Enable "Offline" mode
3. Try submitting contact form
4. Observe error handling

**Expected Results:**
- [ ] User-friendly error message displays
- [ ] Form doesn't reset (data preserved)
- [ ] Console shows network error (expected)
- [ ] No page crash

**Screenshot:** `screenshots/day2_network_failure.png`

---

### Test Case 2.15: Invalid Property ID
**URL:** `https://assiduous-staging.web.app/client/property-detail.html?id=invalid-id-123`

**Steps:**
1. Navigate to URL with non-existent property ID
2. Observe page behavior

**Expected Results:**
- [ ] Error message displays: "Property not found"
- [ ] No JavaScript crashes
- [ ] User can navigate back or to home page
- [ ] Console shows 404 error (expected)

**Screenshot:** `screenshots/day2_invalid_property.png`

---

## Cross-Browser Testing

### Browsers to Test
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Test Cases to Repeat
Run Test Cases 2.1 - 2.8 on each browser

**Expected Results:**
- [ ] All functionality works consistently across browsers
- [ ] UI renders correctly in all browsers
- [ ] No browser-specific console errors

---

## Accessibility Testing

### Test Case 2.16: Keyboard Navigation
**Steps:**
1. Navigate to property detail page
2. Use Tab key to navigate through interactive elements
3. Use Enter/Space to activate buttons
4. Use Escape to close modals

**Expected Results:**
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators visible
- [ ] Logical tab order
- [ ] Modals can be closed with Escape
- [ ] Form fields can be filled without mouse

**Screenshot:** `screenshots/day2_keyboard_nav.png`

---

### Test Case 2.17: Screen Reader Compatibility
**Tools:** VoiceOver (Mac), NVDA (Windows)

**Steps:**
1. Enable screen reader
2. Navigate property detail page
3. Interact with save button
4. Fill contact form

**Expected Results:**
- [ ] All content is announced properly
- [ ] Buttons have descriptive labels
- [ ] Form fields have associated labels
- [ ] Status messages are announced
- [ ] Images have alt text

---

## Security Testing

### Test Case 2.18: XSS Prevention
**Steps:**
1. Try submitting lead form with XSS payload:
   - Name: `<script>alert('XSS')</script>`
   - Message: `<img src=x onerror=alert('XSS')>`
2. Check how data is stored and displayed

**Expected Results:**
- [ ] Malicious scripts are sanitized or escaped
- [ ] No alerts execute
- [ ] Data stored safely in Firestore
- [ ] When displayed, HTML is escaped

---

### Test Case 2.19: Authentication Bypass Attempt
**Steps:**
1. Log out
2. Try to access authenticated-only endpoints directly via curl/Postman
3. Try to modify Firestore data without authentication

**Expected Results:**
- [ ] API returns 401 Unauthorized
- [ ] Firestore security rules prevent unauthorized access
- [ ] No sensitive data exposed

---

## Regression Testing

After any code changes, re-run:
- [ ] Test Case 2.1 (Page Load)
- [ ] Test Case 2.3 (Save Authenticated)
- [ ] Test Case 2.5 (Lead Submission)
- [ ] Test Case 2.8 (Mobile Responsive)

---

## Test Results Summary Template

```markdown
## Test Run: [Date]
**Tester:** [Name]
**Environment:** Staging / Production
**Browser:** Chrome 120 / Firefox 121 / Safari 17

### Test Cases Executed: X/Y
### Passed: X
### Failed: Y
### Blocked: Z

### Critical Issues Found:
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce
   - Screenshot

### Notes:
[Additional observations]
```

---

## Sign-Off Checklist

Before marking Day 2 complete:
- [ ] All test cases pass (0 critical/high issues)
- [ ] Zero console errors in production
- [ ] Mobile responsive verified
- [ ] Performance benchmarks met
- [ ] Cross-browser compatibility verified
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Security vulnerabilities addressed
- [ ] Screenshots captured for documentation

---

**Last Updated:** 2025-11-02  
**Document Owner:** Development Team  
**Next Review:** After each major feature completion
