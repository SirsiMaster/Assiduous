#!/usr/bin/env node
/**
 * delete-user-by-email.mjs
 *
 * Delete a single Firebase Auth user + Firestore profile by email.
 *
 * Usage:
 *   node scripts/delete-user-by-email.mjs user@example.com
 *
 * Behavior:
 *   - Looks up the Auth user by email
 *   - Deletes `users/{uid}` in Firestore (if it exists)
 *   - Deletes the Auth user
 */

import admin from 'firebase-admin';

async function main() {
  const emailArg = process.argv[2];

  if (!emailArg) {
    console.error('Usage: node scripts/delete-user-by-email.mjs <email>');
    process.exit(1);
  }

  const email = String(emailArg).trim();
  if (!email.includes('@')) {
    console.error('Invalid email:', email);
    process.exit(1);
  }

  // Initialize Admin SDK using default credentials / active project
  try {
    admin.initializeApp();
  } catch (err) {
    console.error('Failed to initialize firebase-admin:', err.message);
    process.exit(1);
  }

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    console.log(`\n🔍 Looking up user by email: ${email}`);
    const user = await auth.getUserByEmail(email);
    const { uid } = user;
    console.log(`Found user: UID=${uid}`);

    // Delete Firestore profile (best-effort)
    try {
      const userRef = db.collection('users').doc(uid);
      const snap = await userRef.get();
      if (snap.exists) {
        await userRef.delete();
        console.log('  ✓ Deleted Firestore users/ document');
      } else {
        console.log('  • No Firestore users/ document found');
      }
    } catch (err) {
      console.warn('  ⚠️ Failed to delete Firestore users/ document:', err.message);
    }

    // Delete Auth user
    try {
      await auth.deleteUser(uid);
      console.log('  ✓ Deleted Firebase Auth user');
    } catch (err) {
      console.error('  ❌ Failed to delete Firebase Auth user:', err.message);
    }

    console.log('\n✅ Done.');
    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`No user found with email: ${email}`);
    } else {
      console.error('Error while deleting user:', err.message || err);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
