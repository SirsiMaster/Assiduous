/**
 * Unified Authentication Service
 * Single source of truth - uses Firebase Modular SDK only
 * Replaces: auth.js, enhanced-auth.js, sirsi-auth.js
 */

import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class UnifiedAuthService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    this.auth = getAuth(window.app);
    this.db = getFirestore(window.app);
    
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(this.db, 'users', user.uid));
        this.currentUser = userDoc.exists() ? { uid: user.uid, email: user.email, ...userDoc.data() } : null;
      } else {
        this.currentUser = null;
      }
    });
    
    this.initialized = true;
  }

  async login(identifier, password) {
    if (!this.initialized) await this.initialize();
    
    let email = identifier.includes('@') ? identifier : await this.getEmailFromIdentifier(identifier);
    if (!email) return { success: false, error: 'Invalid credentials' };

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const userDoc = await getDoc(doc(this.db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      await updateDoc(doc(this.db, 'users', userCredential.user.uid), { lastLogin: serverTimestamp() });

      let redirect = '/client/dashboard.html';
      if (userData.role === 'admin') redirect = '/admin/dashboard.html';
      else if (userData.role === 'agent') redirect = userData.agentInfo?.status === 'approved' ? '/agent/dashboard.html' : '/agent-pending.html';

      return { success: true, user: { uid: userCredential.user.uid, ...userData }, redirect };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async signup(userData) {
    if (!this.initialized) await this.initialize();
    
    const { email, password, firstName, lastName, role = 'client', username } = userData;
    if (!email || !password || !firstName || !lastName) {
      return { success: false, error: 'Required fields missing' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const accountId = `ACCT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

      const profile = {
        uid: userCredential.user.uid,
        accountId,
        email: email.toLowerCase(),
        username: username?.toLowerCase() || null,
        firstName,
        lastName,
        role,
        createdAt: serverTimestamp(),
        emailVerified: false
      };

      if (role === 'agent') profile.agentInfo = { status: 'pending_approval' };

      await setDoc(doc(this.db, 'users', userCredential.user.uid), profile);
      if (username) await setDoc(doc(this.db, 'usernames', username.toLowerCase()), { uid: userCredential.user.uid, email: email.toLowerCase() });
      await setDoc(doc(this.db, 'accountIds', accountId), { uid: userCredential.user.uid, email: email.toLowerCase() });

      try { await sendEmailVerification(userCredential.user); } catch {}

      return { success: true, user: profile, requiresApproval: role === 'agent' };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async logout() {
    await signOut(this.auth);
    localStorage.clear();
    window.location.href = '/';
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  async getEmailFromIdentifier(identifier) {
    if (identifier.match(/^ACCT-\d{4}-\d{6}$/)) {
      const doc = await getDoc(doc(this.db, 'accountIds', identifier));
      return doc.exists() ? doc.data().email : null;
    }
    const doc = await getDoc(doc(this.db, 'usernames', identifier.toLowerCase()));
    return doc.exists() ? doc.data().email : null;
  }

  getErrorMessage(error) {
    const messages = {
      'auth/email-already-in-use': 'Email already in use',
      'auth/user-not-found': 'Invalid credentials',
      'auth/wrong-password': 'Invalid credentials'
    };
    return messages[error.code] || error.message;
  }

  isAuthenticated() { return !!this.currentUser; }
  getCurrentUser() { return this.currentUser; }
  getCurrentRole() { return this.currentUser?.role || null; }
}

const authService = new UnifiedAuthService();
authService.initialize();

window.authService = authService;
window.AuthService = {
  login: (...args) => authService.login(...args),
  signup: (...args) => authService.signup(...args),
  logout: () => authService.logout(),
  resetPassword: (...args) => authService.resetPassword(...args),
  isAuthenticated: () => authService.isAuthenticated(),
  getCurrentUser: () => authService.getCurrentUser(),
  getCurrentRole: () => authService.getCurrentRole()
};
