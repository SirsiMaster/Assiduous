# Prod Validation – Stepwise Continuation

This document captures the step-by-step manual validation flow for production, written so that every instruction is inline text (no bash code blocks). Use it as a guided checklist and work through it task-by-task.

---

## Task 1 – Prod landing page and Firebase wiring

**Goal:** Verify the production landing page loads correctly and Firebase is initialized via the modal flow with no config errors.

### Steps

1. In your browser, go to: `https://assiduous-prod.web.app/`
2. Open DevTools and switch to the Console tab.
   - On macOS: press Command + Option + I.
   - On Windows: press Control + Shift + I.
3. Hard-reload the page with DevTools open so you see any startup errors.
   - On macOS: press Command + Shift + R.
   - On Windows: press Control + Shift + R.
4. Look at the console and check:
   - There are no errors like any of the following:
     - `Firebase: No Firebase App 'default' has been created...`
     - `FirebaseError: Error (app/duplicate-app).`
     - 404 errors for `firebase-config.js` or `assets/js/firebase-init.js`.
   - It is expected (and OK) to see informational logs such as:
     - `[Auth] Firebase ready, initializing signup/login handlers`.
5. Check that both auth modals work from the landing page header:
   - Click the "Sign In" button in the header and confirm that a login modal opens.
   - Click the "Get Started Free" button in the header and confirm that a signup modal opens.

### Success Criteria

You can mark Task 1 as complete when all of the following are true:

- The page at `https://assiduous-prod.web.app/` loads without HTTP errors.
- The DevTools console shows no Firebase configuration or initialization errors.
- Both the Sign In and Get Started Free buttons open their respective modals.

---

## Task 2 – Prod reset-password page and auth wiring

**Goal:** Confirm the reset-password page in production loads correctly, is wired to Firebase without config errors, and can send a password reset email for a real test account.

### Steps

1. In your browser, go to: `https://assiduous-prod.web.app/auth/reset-password.html`
2. Open DevTools and switch to the Console tab.
   - On macOS: press Command + Option + I.
   - On Windows: press Control + Shift + I.
3. Hard-reload the page with DevTools open so you see any startup errors.
   - On macOS: press Command + Shift + R.
   - On Windows: press Control + Shift + R.
4. Look at the console and confirm:
   - There are no errors like:
     - `Firebase: No Firebase App 'default' has been created...`
     - `FirebaseError: Error (app/duplicate-app).`
     - 404 or 403 errors for `../firebase-config.js`, `../assets/js/firebase-init.js`, or auth scripts.
5. In the reset-password form:
   - Enter the email address of a real test account you control (one that exists in Firebase Auth).
   - Click the button to send a reset link.
6. Watch the UI and console:
   - The UI should show a confirmation that a reset email has been sent (or similar wording).
   - The console should not show Firebase configuration or app errors.
7. (Optional but ideal) Check the inbox for that test account and confirm that a password reset email from Firebase arrives.

### Success Criteria

You can mark Task 2 as complete when all of the following are true:

- `https://assiduous-prod.web.app/auth/reset-password.html` loads without HTTP or Firebase configuration errors.
- Submitting a valid test account email does not produce Firebase app/config errors in the console.
- The UI indicates a reset email was sent, and ideally the email arrives in the inbox.

---

> Additional tasks (properties + QR, My QR, dashboards, and final grep-style checks) can be appended to this document in the same style as they are defined during the interactive validation workflow.
