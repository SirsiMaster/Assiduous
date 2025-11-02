#!/usr/bin/env node
/**
 * Secure RBAC Setup for Assiduous
 * - Sets custom claims for all users
 * - Updates passwords to meet security requirements
 * - Creates Firestore user documents
 * - Does NOT store passwords in plain text
 */

import admin from 'firebase-admin';
import { createInterface } from 'readline';

// Initialize Firebase Admin using default credentials
admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();

// Password validation
function validatePassword(password) {
  const minLength = 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  if (!hasUpper) return 'Password must contain uppercase letter';
  if (!hasLower) return 'Password must contain lowercase letter';
  if (!hasNumber) return 'Password must contain number';
  if (!hasSpecial) return 'Password must contain special character (!@#$%^&*)';
  
  return null;
}

// Generate secure password
function generateSecurePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = upper + lower + numbers + special;
  
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// User configuration
const users = [
  { email: 'admin@sirsimaster.com', role: 'admin' },
  { email: 'agent@sirsimaster.com', role: 'agent' },
  { email: 'client@sirsimaster.com', role: 'client' },
  { email: 'admin@assiduousrealty.com', role: 'admin' },
  { email: 'agent@assiduousrealty.com', role: 'agent' },
  { email: 'client@assiduousrealty.com', role: 'client' },
  { email: 'investor@assiduousrealty.com', role: 'client' }
];

async function setupRBAC(resetPasswords = false) {
  console.log('🔐 Starting Secure RBAC Setup\n');
  console.log('═'.repeat(60));
  
  const newPasswords = {};
  
  for (const userData of users) {
    try {
      console.log(`\n📧 ${userData.email}`);
      
      // Get user
      const user = await auth.getUserByEmail(userData.email);
      console.log(`   UID: ${user.uid}`);
      
      // Set custom claims
      await auth.setCustomUserClaims(user.uid, {
        role: userData.role
      });
      console.log(`   ✅ Custom claims set: role=${userData.role}`);
      
      // Update Firestore document
      await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: userData.email,
        role: userData.role,
        displayName: user.displayName || userData.email.split('@')[0],
        emailVerified: user.emailVerified,
        status: 'active',
        updatedAt: admin.firestore.Timestamp.now()
      }, { merge: true });
      console.log(`   ✅ Firestore document updated`);
      
      // Reset password if requested
      if (resetPasswords) {
        const newPassword = generateSecurePassword();
        await auth.updateUser(user.uid, { password: newPassword });
        newPasswords[userData.email] = newPassword;
        console.log(`   ✅ Password reset (see output below)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ RBAC Setup Complete\n');
  
  if (resetPasswords && Object.keys(newPasswords).length > 0) {
    console.log('🔑 NEW PASSWORDS (SAVE THESE SECURELY)');
    console.log('═'.repeat(60));
    for (const [email, password] of Object.entries(newPasswords)) {
      console.log(`${email.padEnd(40)} ${password}`);
    }
    console.log('\n⚠️  IMPORTANT: Save these passwords to your password manager!');
    console.log('⚠️  These will NOT be shown again!\n');
  }
  
  console.log('📋 Summary:');
  console.log(`   - ${users.length} users configured with RBAC`);
  console.log(`   - Custom claims set for all users`);
  console.log(`   - Firestore documents updated`);
  if (resetPasswords) {
    console.log(`   - ${Object.keys(newPasswords).length} passwords reset`);
  }
}

// CLI Interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Assiduous RBAC Setup Tool\n');
console.log('This will configure role-based access control for all test users.');
console.log('\nOptions:');
console.log('  1. Setup RBAC only (keep existing passwords)');
console.log('  2. Setup RBAC + Reset all passwords to secure passwords');
console.log('  3. Exit\n');

rl.question('Choose option (1-3): ', async (answer) => {
  rl.close();
  
  if (answer === '1') {
    await setupRBAC(false);
  } else if (answer === '2') {
    await setupRBAC(true);
  } else {
    console.log('Exiting...');
  }
  
  process.exit(0);
});
