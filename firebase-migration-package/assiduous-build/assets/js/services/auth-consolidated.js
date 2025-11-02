/**
 * Consolidated Authentication Service
 * 
 * Single source of truth for all authentication operations
 * Uses Firebase Modular SDK (v9+) exclusively
 * Supports: email/password, username, accountId login
 * 
 * Usage:
 *   await authService.login(email, password);
 *   await authService.signup(userData);
 *   await authService.logout();
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
  query,
  where,
  getDocs,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class AuthService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.initialized = false;
  }

  /**
   * Initialize auth service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Get Firebase instances (assumes firebase-init.js loaded)
      this.auth = getAuth(window.app);
      this.db = getFirestore(window.app);

      // Set up auth state listener
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(this.db, 'users', user.uid));
          if (userDoc.exists()) {
            this.currentUser = {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified,
              ...userDoc.data()
            };
          } else {
            this.currentUser = {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified
            };
          }
        } else {
          this.currentUser = null;
          // Clear localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_data');
        }
      });

      this.initialized = true;
      console.log('[AuthService] Initialized');
    } catch (error) {
      console.error('[AuthService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Login with email/username/accountId
   * @param {string} identifier - Email, username, or accountId
   * @param {string} password - Password
   * @returns {Promise<Object>} Login result
   */
  async login(identifier, password) {
    if (!this.initialized) await this.initialize();

    try {
      let email = identifier;

      // If not an email, look up the email
      if (!identifier.includes('@')) {
        email = await this.getEmailFromIdentifier(identifier);
        if (!email) {
          return {
            success: false,
            error: 'Invalid username or account ID'
          };
        }
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Get user profile
      const userDoc = await getDoc(doc(this.db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Update last login
      await updateDoc(doc(this.db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      });

      // Store in localStorage for backward compatibility
      localStorage.setItem('auth_token', user.uid);
      localStorage.setItem('user_role', userData.role || 'client');
      localStorage.setItem('user_data', JSON.stringify({
        uid: user.uid,
        email: user.email,
        ...userData
      }));

      // Determine redirect based on role and approval status
      let redirect = '/client/dashboard.html';
      if (userData.role === 'admin') {
        redirect = '/admin/dashboard.html';
      } else if (userData.role === 'agent') {
        redirect = userData.agentInfo?.status === 'approved' 
          ? '/agent/dashboard.html' 
          : '/agent-pending.html';
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          ...userData
        },
        redirect,
        needsApproval: userData.role === 'agent' && userData.agentInfo?.status !== 'approved'
      };
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Signup result
   */
  async signup(userData) {
    if (!this.initialized) await this.initialize();

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      role = 'client',
      username,
      licenseNumber
    } = userData;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return {
        success: false,
        error: 'Email, password, first name, and last name are required'
      };
    }

    // Validate password
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.errors.join('. ')
      };
    }

    // Validate username if provided
    if (username) {
      const usernameAvailable = await this.checkUsernameAvailable(username);
      if (!usernameAvailable) {
        return {
          success: false,
          error: 'Username is already taken'
        };
      }
    }

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      const user = userCredential.user;

      // Generate account ID
      const accountId = await this.generateAccountId();

      // Prepare user profile
      const userProfile = {
        uid: user.uid,
        accountId,
        email: email.toLowerCase(),
        username: username ? username.toLowerCase() : null,
        firstName,
        lastName,
        phone: phone || null,
        role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: false,
        accountStatus: 'active',
        preferences: {
          notifications: true,
          emailNotifications: true
        }
      };

      // Add agent-specific data
      if (role === 'agent') {
        userProfile.agentInfo = {
          licenseNumber: licenseNumber || null,
          status: 'pending_approval',
          submittedAt: serverTimestamp()
        };
      }

      // Create user document
      await setDoc(doc(this.db, 'users', user.uid), userProfile);

      // Reserve username if provided
      if (username) {
        await setDoc(doc(this.db, 'usernames', username.toLowerCase()), {
          uid: user.uid,
          email: email.toLowerCase(),
          createdAt: serverTimestamp()
        });
      }

      // Create accountId lookup
      await setDoc(doc(this.db, 'accountIds', accountId), {
        accountId,
        uid: user.uid,
        email: email.toLowerCase(),
        createdAt: serverTimestamp()
      });

      // Send email verification
      try {
        await sendEmailVerification(user);
      } catch (error) {
        console.warn('[AuthService] Email verification failed:', error);
      }

      return {
        success: true,
        message: role === 'agent' 
          ? 'Account created. Pending admin approval.' 
          : 'Account created successfully',
        user: {
          uid: user.uid,
          accountId,
          email,
          ...userProfile
        },
        requiresApproval: role === 'agent'
      };
    } catch (error) {
      console.error('[AuthService] Signup error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    if (!this.initialized) await this.initialize();

    try {
      await signOut(this.auth);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   */
  async resetPassword(email) {
    if (!this.initialized) await this.initialize();

    try {
      await sendPasswordResetEmail(this.auth, email);
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('[AuthService] Password reset error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get current user role
   */
  getCurrentRole() {
    return this.currentUser?.role || null;
  }

  /**
   * Get email from username or accountId
   */
  async getEmailFromIdentifier(identifier) {
    const cleanIdentifier = identifier.trim();

    // Check if it's an account ID (format: ACCT-YYYY-NNNNNN)
    if (cleanIdentifier.match(/^ACCT-\d{4}-\d{6}$/)) {
      const accountDoc = await getDoc(doc(this.db, 'accountIds', cleanIdentifier));
      if (accountDoc.exists()) {
        return accountDoc.data().email;
      }
      return null;
    }

    // Otherwise, treat as username
    const usernameDoc = await getDoc(doc(this.db, 'usernames', cleanIdentifier.toLowerCase()));
    if (usernameDoc.exists()) {
      return usernameDoc.data().email;
    }

    return null;
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailable(username) {
    const usernameDoc = await getDoc(doc(this.db, 'usernames', username.toLowerCase()));
    return !usernameDoc.exists();
  }

  /**
   * Generate unique account ID
   */
  async generateAccountId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `ACCT-${year}-${random}`;
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    const errors = [];
    const minLength = 8;

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'Email address is already in use',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection'
    };

    return errorMessages[error.code] || error.message || 'Authentication failed';
  }
}

// Create singleton instance
const authService = new AuthService();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    authService.initialize();
  });
} else {
  authService.initialize();
}

// Export
window.authService = authService;

// Backward compatibility - expose as AuthService for old code
window.AuthService = {
  login: (email, password) => authService.login(email, password),
  signup: (userData) => authService.signup(userData),
  logout: () => authService.logout(),
  resetPassword: (email) => authService.resetPassword(email),
  isAuthenticated: () => authService.isAuthenticated(),
  getCurrentUser: () => authService.getCurrentUser(),
  getCurrentRole: () => authService.getCurrentRole()
};
