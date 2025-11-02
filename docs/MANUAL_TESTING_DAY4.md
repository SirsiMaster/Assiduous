# Day 4 Manual Testing Plan - Billing & Notifications

## Overview
This document covers manual browser testing for Day 4 features:
- Stripe subscription checkout ($99/month agent subscriptions)
- Stripe webhook handling (subscription lifecycle)
- SendGrid email notifications
- In-app notification system

## Testing Environment
- **Staging URL**: https://assiduous-staging.web.app
- **API Base**: https://us-central1-assiduous-staging.cloudfunctions.net/app/api/v1
- **Test User**: agent@sirsimaster.com (password: Test123!)

## Prerequisites
⚠️ **CRITICAL**: These tests require Stripe and SendGrid configuration:

```bash
# Configure Stripe (Test Mode)
firebase functions:config:set \
  stripe.secret="sk_test_..." \
  stripe.webhook_secret="whsec_..." \
  stripe.price_agent="price_..."

# Configure SendGrid
firebase functions:config:set \
  sendgrid.key="SG..." \
  sendgrid.from_email="no-reply@assiduous.ai"
```

---

## Test Suite 1: Health Check & API Verification

### Test 1.1: API Health Endpoint
**URL**: https://us-central1-assiduous-staging.cloudfunctions.net/app/api/v1/health

**Steps**:
1. Open URL in browser or run: `curl https://us-central1-assiduous-staging.cloudfunctions.net/app/api/v1/health`
2. Verify response: `{"status":"ok","timestamp":"..."}`

**Expected Result**:
- ✅ Returns 200 OK
- ✅ JSON with status="ok" and current timestamp

**Screenshot**: `day4_health_check.png`

---

## Test Suite 2: Billing Service - Agent Subscription

### Test 2.1: Check Billing Status (Before Subscription)
**URL**: https://assiduous-staging.web.app/agent/settings.html

**Steps**:
1. Login as agent@sirsimaster.com
2. Open browser DevTools Console
3. Run:
   ```javascript
   import('./assets/js/services/billingservice.js').then(async (m) => {
     const status = await m.getBillingStatus();
     console.log('Billing status:', status);
   });
   ```

**Expected Result**:
- ✅ Returns `{status: "inactive", customerId: null, ...}`
- ✅ No console errors

**Screenshot**: `day4_billing_status_inactive.png`

---

### Test 2.2: Start Subscription Checkout
**URL**: https://assiduous-staging.web.app/agent/settings.html

**Steps**:
1. Login as agent@sirsimaster.com
2. Open browser DevTools Console
3. Run:
   ```javascript
   import('./assets/js/services/billingservice.js').then(async (m) => {
     await m.startAgentSubscription();
   });
   ```
4. **Redirects to Stripe Checkout page**

**Expected Result**:
- ✅ Redirects to `https://checkout.stripe.com/...`
- ✅ Stripe Checkout shows "$99.00 / month" subscription
- ✅ Email pre-filled with agent@sirsimaster.com

**Screenshot**: `day4_stripe_checkout_page.png`

---

### Test 2.3: Complete Stripe Test Payment
**URL**: Stripe Checkout page

**Steps**:
1. On Stripe Checkout, use test card: **4242 4242 4242 4242**
2. Expiry: Any future date (e.g., 12/34)
3. CVC: Any 3 digits (e.g., 123)
4. ZIP: Any 5 digits (e.g., 12345)
5. Click "Subscribe"

**Expected Result**:
- ✅ Payment processes successfully
- ✅ Redirects to: `https://assiduous-staging.web.app/agent/settings.html?session_id=cs_test_...`
- ✅ Success message displayed (if UI implemented)

**Screenshot**: `day4_stripe_payment_success.png`

---

### Test 2.4: Verify Subscription in Firestore
**URL**: https://console.firebase.google.com/project/assiduous-staging/firestore

**Steps**:
1. Navigate to Firestore Database
2. Open `users/{agent_uid}` document
3. Check `billing` field

**Expected Result**:
```json
{
  "billing": {
    "customerId": "cus_...",
    "subscriptionId": "sub_...",
    "subscriptionStatus": "active",
    "currentPeriodEnd": null,
    "updatedAt": "2025-11-02T22:15:00Z"
  }
}
```

**Screenshot**: `day4_firestore_billing_active.png`

---

### Test 2.5: Verify Billing Status API (After Subscription)
**URL**: https://assiduous-staging.web.app/agent/settings.html

**Steps**:
1. Refresh page after subscription
2. Open browser DevTools Console
3. Run:
   ```javascript
   import('./assets/js/services/billingservice.js').then(async (m) => {
     const status = await m.getBillingStatus();
     console.log('Billing status:', status);
   });
   ```

**Expected Result**:
- ✅ Returns `{status: "active", customerId: "cus_...", ...}`
- ✅ No console errors

**Screenshot**: `day4_billing_status_active.png`

---

## Test Suite 3: Notifications API

### Test 3.1: Get Notifications (Empty State)
**URL**: https://assiduous-staging.web.app/agent/dashboard.html

**Steps**:
1. Login as agent@sirsimaster.com
2. Open browser DevTools Console
3. Run:
   ```javascript
   import('./assets/js/services/notificationservice.js').then(async (m) => {
     const notifications = await m.getNotifications();
     console.log('Notifications:', notifications);
   });
   ```

**Expected Result**:
- ✅ Returns empty array `[]` (if no notifications yet)
- ✅ Or returns notification array with subscription welcome message
- ✅ No console errors

**Screenshot**: `day4_notifications_initial.png`

---

### Test 3.2: Check Subscription Welcome Notification
**URL**: https://console.firebase.google.com/project/assiduous-staging/firestore

**Steps**:
1. Navigate to Firestore Database
2. Open `notifications` collection
3. Filter by `userId == {agent_uid}`

**Expected Notification Document**:
```json
{
  "userId": "agent_uid",
  "type": "billing",
  "title": "Subscription Activated",
  "message": "Your agent subscription is now active. Welcome to Assiduous Pro!",
  "read": false,
  "createdAt": "2025-11-02T22:15:30Z"
}
```

**Screenshot**: `day4_notification_firestore.png`

---

### Test 3.3: Mark Notification as Read
**URL**: https://assiduous-staging.web.app/agent/dashboard.html

**Steps**:
1. Get notification ID from previous test
2. Open browser DevTools Console
3. Run:
   ```javascript
   import('./assets/js/services/notificationservice.js').then(async (m) => {
     const notificationId = 'REPLACE_WITH_ACTUAL_ID';
     await m.markNotificationRead(notificationId);
     console.log('Marked as read');
   });
   ```
4. Verify in Firestore that `read: true` and `readAt` timestamp added

**Expected Result**:
- ✅ API returns `{ok: true}`
- ✅ Firestore document updated with `read: true`
- ✅ No console errors

**Screenshot**: `day4_notification_marked_read.png`

---

### Test 3.4: Real-time Notifications Listener
**URL**: https://assiduous-staging.web.app/agent/dashboard.html

**Steps**:
1. Open browser DevTools Console
2. Run:
   ```javascript
   import('./assets/js/services/notificationservice.js').then(async (m) => {
     const unsubscribe = await m.subscribeToNotifications((notifications) => {
       console.log('Real-time notifications:', notifications);
     });
     
     // Keep listener active
     window.notificationUnsubscribe = unsubscribe;
   });
   ```
3. **In another tab**, create a test notification via Firestore Console manually
4. **Or** use Admin endpoint to create test notification

**Expected Result**:
- ✅ Console logs notification array immediately
- ✅ When new notification added, console logs updated array in real-time
- ✅ No console errors

**Screenshot**: `day4_realtime_notifications.png`

---

## Test Suite 4: SendGrid Email Notifications

### Test 4.1: Welcome Email on Subscription
**Prerequisites**: Complete subscription flow (Test 2.3)

**Steps**:
1. Check email inbox for agent@sirsimaster.com
2. Look for email from no-reply@assiduous.ai
3. Subject: "Welcome to Assiduous Agent Pro"

**Expected Email Content**:
```
Subject: Welcome to Assiduous Agent Pro

Welcome to Assiduous Agent Pro!
Your subscription is now active. You can now access all premium features.
Thank you for choosing Assiduous!

[Go to Dashboard]
```

**Expected Result**:
- ✅ Email received within 1 minute of subscription
- ✅ Correct subject and content
- ✅ Link to dashboard works: https://assiduous-prod.web.app/agent/dashboard.html

**Screenshot**: `day4_welcome_email.png`

---

### Test 4.2: Payment Failed Email (Stripe Test Event)
**Prerequisites**: Stripe CLI installed or Stripe Dashboard access

**Steps**:
1. **Option A - Stripe CLI**:
   ```bash
   stripe trigger payment_intent.payment_failed \
     --customer cus_... \
     --forward-to https://us-central1-assiduous-staging.cloudfunctions.net/app/webhooks/stripe
   ```

2. **Option B - Stripe Dashboard**:
   - Go to Stripe Dashboard → Subscriptions
   - Find test subscription
   - Manually trigger "payment failed" event

3. Check email inbox for agent@sirsimaster.com

**Expected Email Content**:
```
Subject: Payment Failed - Action Required

Payment Failed
We were unable to process your subscription payment.
Please update your payment method to avoid service interruption.

[Update Payment Method]
```

**Expected Result**:
- ✅ Email received
- ✅ Notification created in Firestore with type="billing", title="Payment Failed"
- ✅ Link works (even if portal not yet implemented)

**Screenshot**: `day4_payment_failed_email.png`

---

## Test Suite 5: Stripe Webhooks

### Test 5.1: Webhook Event Logging
**URL**: https://console.firebase.google.com/project/assiduous-staging/functions/logs

**Steps**:
1. Navigate to Cloud Functions Logs
2. Filter by function: `app`
3. Look for recent webhook events

**Expected Log Entries**:
```
Stripe webhook event: checkout.session.completed
Subscription activated for user: {uid}
Created checkout session: cs_test_... for user: {uid}
```

**Expected Result**:
- ✅ All webhook events logged with type
- ✅ No errors in webhook processing
- ✅ User updates reflected in logs

**Screenshot**: `day4_webhook_logs.png`

---

### Test 5.2: Subscription Update Event
**URL**: Stripe Dashboard

**Steps**:
1. Go to Stripe Dashboard → Subscriptions
2. Find test subscription
3. Update subscription (e.g., change billing cycle or add metadata)
4. Check Cloud Functions logs
5. Verify Firestore `users/{uid}/billing` updated

**Expected Result**:
- ✅ Webhook event `customer.subscription.updated` logged
- ✅ Firestore document updated with new subscription data
- ✅ No errors in Cloud Functions logs

**Screenshot**: `day4_subscription_updated.png`

---

### Test 5.3: Subscription Canceled Event
**URL**: Stripe Dashboard

**Steps**:
1. Go to Stripe Dashboard → Subscriptions
2. Find test subscription
3. Cancel subscription
4. Check Cloud Functions logs
5. Check Firestore `users/{uid}/billing`
6. Check notifications collection for cancellation notification

**Expected Result**:
- ✅ Webhook event `customer.subscription.deleted` logged
- ✅ Firestore: `subscriptionStatus: "canceled"`, `canceledAt` timestamp
- ✅ Notification created: "Subscription Canceled"
- ✅ No errors

**Screenshot**: `day4_subscription_canceled.png`

---

## Test Suite 6: Error Handling & Edge Cases

### Test 6.1: Unauthenticated Billing Request
**URL**: https://assiduous-staging.web.app/agent/settings.html

**Steps**:
1. **Logout** from application
2. Open browser DevTools Console
3. Run:
   ```javascript
   fetch('https://us-central1-assiduous-staging.cloudfunctions.net/app/api/v1/billing/create-checkout-session', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   }).then(r => r.json()).then(console.log);
   ```

**Expected Result**:
- ✅ Returns 401 Unauthorized
- ✅ Error message: `{"error":"No token provided"}`

**Screenshot**: `day4_unauthenticated_billing.png`

---

### Test 6.2: Client Role Cannot Subscribe (403 Forbidden)
**URL**: https://assiduous-staging.web.app

**Steps**:
1. Login as client@sirsimaster.com (if exists) or create client user
2. Get auth token from DevTools
3. Run:
   ```javascript
   import('./assets/js/services/billingservice.js').then(async (m) => {
     try {
       await m.startAgentSubscription();
     } catch (error) {
       console.error('Expected error:', error);
     }
   });
   ```

**Expected Result**:
- ✅ Returns 403 Forbidden
- ✅ Error: `{"error":"Agents only"}`
- ✅ Client role cannot access billing endpoints

**Screenshot**: `day4_client_forbidden_billing.png`

---

### Test 6.3: Stripe Not Configured (503 Service Unavailable)
**Prerequisites**: Remove Stripe config temporarily

**Steps**:
1. **Temporarily remove** Stripe config:
   ```bash
   firebase functions:config:unset stripe
   firebase deploy --only functions
   ```
2. Try to start subscription as agent
3. Verify error response

**Expected Result**:
- ✅ Returns 503 Service Unavailable
- ✅ Error: `{"error":"Stripe not configured"}`

**Restore Config**:
```bash
firebase functions:config:set stripe.secret="..." stripe.webhook_secret="..." stripe.price_agent="..."
firebase deploy --only functions
```

**Screenshot**: `day4_stripe_not_configured.png`

---

## Test Suite 7: Integration Tests

### Test 7.1: End-to-End Agent Subscription Flow
**Complete workflow from signup to active subscription**

**Steps**:
1. Create new agent account: newagent@test.com
2. Login to Agent Portal
3. Navigate to Settings
4. Click "Subscribe" button (if UI implemented)
5. Complete Stripe Checkout with test card
6. Verify redirect to settings page with success message
7. Check Firestore for billing data
8. Check notifications for welcome notification
9. Check email inbox for welcome email
10. Verify agent can now access premium features (if implemented)

**Expected Result**:
- ✅ All steps complete without errors
- ✅ Subscription active in Stripe Dashboard
- ✅ Firestore updated correctly
- ✅ Notifications and email received
- ✅ Agent status upgraded to "Pro"

**Screenshot**: `day4_end_to_end_flow.png`

---

## Test Suite 8: Performance & Security

### Test 8.1: API Rate Limiting
**URL**: https://us-central1-assiduous-staging.cloudfunctions.net/app/api/v1/health

**Steps**:
1. Run rapid requests to API:
   ```bash
   for i in {1..150}; do
     curl -s -o /dev/null -w "%{http_code}\n" \
       https://us-central1-assiduous-staging.cloudfunctions.net/app/api/v1/health
   done
   ```

**Expected Result**:
- ✅ First 120 requests return 200 OK
- ✅ Requests 121+ return 429 Too Many Requests
- ✅ Rate limit resets after 60 seconds

**Screenshot**: `day4_rate_limiting.png`

---

### Test 8.2: Webhook Signature Verification
**URL**: Cloud Functions Logs

**Steps**:
1. Send invalid webhook request without signature:
   ```bash
   curl -X POST \
     https://us-central1-assiduous-staging.cloudfunctions.net/app/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"type":"test"}'
   ```
2. Check Cloud Functions logs

**Expected Result**:
- ✅ Returns 400 Bad Request
- ✅ Log: "Webhook signature verification failed"
- ✅ No database changes

**Screenshot**: `day4_webhook_signature_fail.png`

---

## Completion Checklist

Before marking Day 4 complete, ensure ALL tests pass:

### Billing
- [ ] ✅ Health check endpoint works
- [ ] ✅ Billing status API returns correct data
- [ ] ✅ Stripe checkout session creates successfully
- [ ] ✅ Test payment completes without errors
- [ ] ✅ Firestore updated with subscription data
- [ ] ✅ Billing status shows "active" after subscription

### Notifications
- [ ] ✅ Notifications API lists all user notifications
- [ ] ✅ Mark as read endpoint works
- [ ] ✅ Real-time listener receives updates
- [ ] ✅ Welcome notification created on subscription
- [ ] ✅ Notification documents have correct structure

### Emails
- [ ] ✅ Welcome email sent on subscription
- [ ] ✅ Payment failed email sent on failed payment
- [ ] ✅ Email content matches templates
- [ ] ✅ Links in emails work correctly

### Webhooks
- [ ] ✅ checkout.session.completed event handled
- [ ] ✅ customer.subscription.updated event handled
- [ ] ✅ customer.subscription.deleted event handled
- [ ] ✅ invoice.payment_failed event handled
- [ ] ✅ All webhook events logged correctly

### Security
- [ ] ✅ Unauthenticated requests rejected (401)
- [ ] ✅ Client role cannot access billing (403)
- [ ] ✅ Rate limiting works (429)
- [ ] ✅ Webhook signature verification enforced

### Error Handling
- [ ] ✅ Stripe not configured returns 503
- [ ] ✅ Invalid webhook requests rejected
- [ ] ✅ Console errors clean (zero errors)
- [ ] ✅ Network tab shows all 200/201 responses

---

## Known Issues / Future Enhancements

### Current Limitations:
1. **Customer Portal**: Not yet implemented - agents cannot manage subscriptions directly
2. **UI Integration**: Billing UI in agent settings page needs implementation
3. **Notification UI**: In-app notification bell/dropdown needs UI component
4. **Email Templates**: Using basic HTML, can be enhanced with branded templates
5. **Metadata Tracking**: Subscription metadata should include userId for better webhook handling

### Next Steps (Day 5):
- Implement UI components for billing and notifications
- Add customer portal endpoint for subscription management
- Create branded email templates
- Add notification bell icon with unread count
- Implement agent subscription benefits/restrictions

---

## Support & Resources

**Stripe Test Cards**: https://stripe.com/docs/testing
**Firebase Console**: https://console.firebase.google.com/project/assiduous-staging
**Staging URL**: https://assiduous-staging.web.app
**API Docs**: See `15_DAY_MVP_ACCELERATION_PLAN.md` Day 4 section

---

**Testing Date**: _________________
**Tested By**: _________________
**Status**: ⬜ PASS / ⬜ FAIL
**Notes**: _________________
