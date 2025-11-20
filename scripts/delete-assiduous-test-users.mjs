#!/usr/bin/env node
/**
 * Delete legacy test accounts from Firebase Auth + Firestore
 *
 * - Removes all users with emails ending in `@assiduous.com`
 * - Removes all users whose email starts with `test` (case-insensitive)
 *
 * For each matching user:
 *   - Deletes `users/{uid}` in Firestore (if present)
 *   - Deletes the Firebase Auth user
 *
 * This script uses default Firebase Admin credentials.
 */

import admin from 'firebase-admin';

// Initialize Admin SDK using default credentials / active project
try {
  admin.initializeApp();
} catch (err) {
  console.error('Failed to initialize firebase-admin:', err.message);
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

async function findTargetUsers() {
  const targets = [];
  let nextPageToken = undefined;

  do {
    const res = await auth.listUsers(1000, nextPageToken);
    for (const user of res.users) {
      const email = (user.email || '').toLowerCase();
      if (!email) continue;

      const isAssiduousDotCom = email.endsWith('@assiduous.com');
      const isTestPrefix = email.startsWith('test');

      if (isAssiduousDotCom || isTestPrefix) {
        targets.push({ uid: user.uid, email });
      }
    }
    nextPageToken = res.pageToken;
  } while (nextPageToken);

  return targets;
}

async function deleteUserAndProfile({ uid, email }) {
  console.log(`\nDeleting user: ${email} (${uid})`);

  // Delete Firestore user doc (best-effort)
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
}

async function main() {
  console.log('🔍 Scanning Firebase Auth users for legacy test accounts...');
  const targets = await findTargetUsers();

  if (targets.length === 0) {
    console.log('✅ No @assiduous.com or test* accounts found. Nothing to delete.');
    process.exit(0);
  }

  console.log(`\nFound ${targets.length} user(s) to delete:`);
  for (const t of targets) {
    console.log(`  - ${t.email} (${t.uid})`);
  }

  for (const target of targets) {
    await deleteUserAndProfile(target);
  }

  console.log('\n✅ Cleanup complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Fatal error while deleting test users:', err);
  process.exit(1);
});
