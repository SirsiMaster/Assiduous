/**
 * RBAC UI Enforcement Module
 * 
 * Provides role-based access control for frontend UI elements
 * Automatically shows/hides elements based on user role
 * 
 * Usage:
 *   <button data-rbac-role="admin,agent">Admin Only Button</button>
 *   <div data-rbac-role="client">Client Only Section</div>
 *   
 * Initialize on page load:
 *   RBACUIEnforcement.init();
 */

class RBACUIEnforcement {
  constructor() {
    this.userRole = null;
    this.initialized = false;
  }

  /**
   * Initialize RBAC UI enforcement
   * Must be called after Firebase auth is ready
   */
  async init() {
    if (this.initialized) {
      console.log('[RBAC-UI] Already initialized');
      return;
    }

    try {
      // Get current user role from Firebase auth and Firestore
      const role = await this.getCurrentUserRole();
      
      if (!role) {
        console.warn('[RBAC-UI] No user role found, applying default restrictions');
        this.userRole = 'guest';
      } else {
        this.userRole = role;
        console.log(`[RBAC-UI] User role: ${this.userRole}`);
      }

      // Apply role-based restrictions to all elements
      this.applyRoleRestrictions();

      // Set up mutation observer to handle dynamically added elements
      this.observeDOMChanges();

      this.initialized = true;
      console.log('[RBAC-UI] Initialization complete');
    } catch (error) {
      console.error('[RBAC-UI] Initialization failed:', error);
      // Apply strictest restrictions on error
      this.userRole = 'guest';
      this.applyRoleRestrictions();
    }
  }

  /**
   * Get current user role from Firestore
   */
  async getCurrentUserRole() {
    try {
      // Check if auth is available
      if (typeof auth === 'undefined' || !auth) {
        console.warn('[RBAC-UI] Firebase auth not available');
        return null;
      }

      const user = auth.currentUser;
      if (!user) {
        console.log('[RBAC-UI] No authenticated user');
        return null;
      }

      // Get user role from Firestore
      if (typeof db === 'undefined' || !db) {
        console.warn('[RBAC-UI] Firebase Firestore not available');
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.warn('[RBAC-UI] User document not found');
        return null;
      }

      const userData = userDoc.data();
      return userData.role || null;
    } catch (error) {
      console.error('[RBAC-UI] Error getting user role:', error);
      return null;
    }
  }

  /**
   * Apply role restrictions to all elements with data-rbac-role attribute
   */
  applyRoleRestrictions() {
    const elements = document.querySelectorAll('[data-rbac-role]');
    
    console.log(`[RBAC-UI] Applying restrictions to ${elements.length} elements`);
    
    elements.forEach(element => {
      this.applyElementRestriction(element);
    });
  }

  /**
   * Apply restriction to a single element
   */
  applyElementRestriction(element) {
    const allowedRoles = element.getAttribute('data-rbac-role');
    
    if (!allowedRoles) {
      return;
    }

    // Parse allowed roles (comma-separated)
    const rolesArray = allowedRoles.split(',').map(r => r.trim().toLowerCase());
    
    // Check if user role is allowed
    const isAllowed = rolesArray.includes(this.userRole?.toLowerCase() || 'guest');
    
    if (isAllowed) {
      // Show element
      element.style.display = '';
      element.removeAttribute('data-rbac-hidden');
      element.setAttribute('data-rbac-allowed', 'true');
    } else {
      // Hide element
      element.style.display = 'none';
      element.setAttribute('data-rbac-hidden', 'true');
      element.removeAttribute('data-rbac-allowed');
      
      // Log restriction for debugging
      console.log(`[RBAC-UI] Restricted element (requires: ${allowedRoles}, user role: ${this.userRole}):`, element);
    }
  }

  /**
   * Watch for dynamically added elements and apply restrictions
   */
  observeDOMChanges() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // Check if node is an element
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check the element itself
            if (node.hasAttribute('data-rbac-role')) {
              this.applyElementRestriction(node);
            }
            
            // Check child elements
            const children = node.querySelectorAll('[data-rbac-role]');
            children.forEach(child => {
              this.applyElementRestriction(child);
            });
          }
        });
      });
    });

    // Start observing the document
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[RBAC-UI] DOM mutation observer started');
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    if (!this.userRole) {
      return false;
    }
    
    if (Array.isArray(role)) {
      return role.some(r => r.toLowerCase() === this.userRole.toLowerCase());
    }
    
    return role.toLowerCase() === this.userRole.toLowerCase();
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles) {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }
    
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Get current user role
   */
  getRole() {
    return this.userRole;
  }

  /**
   * Manually refresh restrictions (useful after role change)
   */
  refresh() {
    console.log('[RBAC-UI] Refreshing role restrictions');
    this.init();
  }
}

// Create singleton instance
const rbacUI = new RBACUIEnforcement();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = rbacUI;
}

// Auto-initialize when DOM is ready (if Firebase auth is available)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase auth to initialize
    if (typeof auth !== 'undefined') {
      auth.onAuthStateChanged(user => {
        if (user) {
          rbacUI.init();
        }
      });
    }
  });
} else {
  // DOM already loaded
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(user => {
      if (user) {
        rbacUI.init();
      }
    });
  }
}
