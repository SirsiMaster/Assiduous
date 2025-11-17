/**
 * LEGACY Authentication Service (SirsiAuth Wrapper)
 * ------------------------------------------------
 * This file is part of the deprecated SirsiAuth stack and SHOULD NOT be used
 * by new code paths. Active authentication flows must go through the
 * modal-based AuthService exposed from `public/assets/js/firebase-init.js`.
 *
 * This wrapper is preserved temporarily for reference and for future work
 * when SirsiAuth is refactored to consume the new canonical auth behavior.
 */

// Ensure SirsiAuth is loaded
if (typeof window.SirsiAuth === 'undefined') {
  console.warn('SirsiAuth not loaded. Loading now...');
  const script = document.createElement('script');
  script.src = '/components/sirsi-auth.js';
  document.head.appendChild(script);
}

// Initialize SirsiAuth instance if not already done
let sirsiAuthInstance = null;

const initializeSirsiAuth = async () => {
  if (!sirsiAuthInstance) {
    sirsiAuthInstance = new window.SirsiAuth({
      firebaseConfig: window.firebaseConfig,
    });
    await sirsiAuthInstance.initialize();
  }
  return sirsiAuthInstance;
};

// Authentication service wrapper
const AuthService = {
  /**
   * User authentication using SirsiAuth
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User's role (not used - determined from Firestore)
   * @returns {Promise} Authentication result
   */
  async login(email, password, role = null) {
    try {
      const auth = await initializeSirsiAuth();
      const result = await auth.signIn(email, password, false);

      if (result.success) {
        // Store in localStorage for backward compatibility
        localStorage.setItem('auth_token', result.user.uid);
        localStorage.setItem('user_role', result.user.role);
        localStorage.setItem('user_data', JSON.stringify(result.user));

        return {
          success: true,
          user: result.user,
          token: result.user.uid,
          redirect: result.redirect,
        };
      } else {
        return {
          success: false,
          error: result.error || result.message || 'Authentication failed',
          needsApproval: result.needsApproval,
          status: result.status,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
      };
    }
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    try {
      const auth = await initializeSirsiAuth();
      return auth.isAuthenticated();
    } catch {
      // Fallback to localStorage check
      return !!localStorage.getItem('auth_token');
    }
  },

  /**
   * Get current user role
   * @returns {Promise<string|null>}
   */
  async getCurrentRole() {
    try {
      const auth = await initializeSirsiAuth();
      return auth.getUserRole();
    } catch {
      // Fallback to localStorage
      return localStorage.getItem('user_role');
    }
  },

  /**
   * Get current user data
   * @returns {Promise<Object|null>}
   */
  async getCurrentUser() {
    try {
      const auth = await initializeSirsiAuth();
      return auth.getCurrentUser();
    } catch {
      // Fallback to localStorage
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    }
  },

  /**
   * User signup using SirsiAuth
   * @param {Object} userData - User signup data
   * @param {string} userData.name - User's full name (will be split into first/last)
   * @param {string} userData.firstName - User's first name
   * @param {string} userData.lastName - User's last name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} userData.role - User's role (client, agent, investor, admin)
   * @param {string} [userData.licenseNumber] - Agent's license number (required for agents)
   * @returns {Promise} Signup result
   */
  async signup(userData) {
    try {
      const auth = await initializeSirsiAuth();

      // Handle name splitting if full name is provided
      if (userData.name && (!userData.firstName || !userData.lastName)) {
        const nameParts = userData.name.trim().split(' ');
        userData.firstName = userData.firstName || nameParts[0];
        userData.lastName = userData.lastName || nameParts.slice(1).join(' ') || nameParts[0];
      }

      // Map role names for backward compatibility
      const roleMap = {
        buyer: 'client',
        seller: 'client',
        agent: 'agent',
        investor: 'investor',
      };
      userData.role = roleMap[userData.role] || userData.role;

      const result = await auth.signUp(userData);

      if (result.success) {
        return {
          success: true,
          message: result.message || 'Account created successfully',
          user: result.user,
          requiresApproval: result.requiresApproval,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create account',
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create account',
      };
    }
  },

  /**
   * User logout using SirsiAuth
   */
  async logout() {
    try {
      const auth = await initializeSirsiAuth();
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear localStorage for backward compatibility
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');
    window.location.href = '/';
  },

  /**
   * Reset password using SirsiAuth
   * @param {string} email - User's email
   * @returns {Promise} Password reset result
   */
  async resetPassword(email) {
    try {
      const auth = await initializeSirsiAuth();
      return await auth.resetPassword(email);
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send password reset email',
      };
    }
  },

  /**
   * Get SirsiAuth instance for advanced operations
   * @returns {Promise<SirsiAuth>} SirsiAuth instance
   */
  async getSirsiAuth() {
    return await initializeSirsiAuth();
  },
};

export default AuthService;
