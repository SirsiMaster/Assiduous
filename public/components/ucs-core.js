/**
 * Universal Component System (UCS) Core
 * 
 * Foundation for truly universal components that adapt based on user role.
 * Write once, use everywhere - role-based filtering happens at runtime.
 * 
 * @author Assiduous Development Team
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  const UCS = {
    version: '1.0.0',
    config: {
      debug: false,
      componentBasePath: '/components/',
      roleAttribute: 'data-roles',
      activeAttribute: 'data-key',
      baseToken: '[[BASE]]'
    },

    // Cache for loaded templates
    _templateCache: {},
    _mountedComponents: new Set(),

    /**
     * Detect user role from URL path or Firebase Auth
     * @returns {string} 'admin' | 'agent' | 'client' | 'universal'
     */
    detectUserRole() {
      const path = window.location.pathname;
      
      // Check URL path first (most reliable)
      if (path.includes('/admin/')) return 'admin';
      if (path.includes('/agent/')) return 'agent';
      if (path.includes('/client/')) return 'client';
      
      // Fallback to Firebase Auth custom claims
      if (window.firebase && window.firebase.auth) {
        const user = window.firebase.auth().currentUser;
        if (user) {
          return user.getIdTokenResult()
            .then(idTokenResult => idTokenResult.claims.role || 'client')
            .catch(() => 'client');
        }
      }
      
      // Default to universal for public pages
      return 'universal';
    },

    /**
     * Compute base path relative to current location
     * @param {string} role - User role
     * @returns {string} Relative base path
     */
    computeBase(role) {
      const path = window.location.pathname;
      const pathParts = path.split('/').filter(p => p && p !== 'public');
      
      // Calculate depth from role root
      let depth = 0;
      let foundRole = false;
      
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === role) {
          foundRole = true;
          depth = pathParts.length - i - 1;
          break;
        }
      }
      
      if (!foundRole) {
        // Not in a role directory, assume root level
        return '';
      }
      
      // Build relative path
      if (depth === 0) return '';
      return '../'.repeat(depth);
    },

    /**
     * Filter DOM elements by role visibility
     * @param {HTMLElement} container - Container to filter
     * @param {string} role - Current user role
     */
    filterElementsByRole(container, role) {
      if (!container) return;
      
      const elements = container.querySelectorAll(`[${this.config.roleAttribute}]`);
      
      elements.forEach(element => {
        const roles = element.getAttribute(this.config.roleAttribute);
        if (!roles) return;
        
        const roleList = roles.split(',').map(r => r.trim());
        const isVisible = roleList.includes(role) || roleList.includes('universal');
        
        if (!isVisible) {
          element.style.display = 'none';
          element.setAttribute('aria-hidden', 'true');
        } else {
          element.style.display = '';
          element.removeAttribute('aria-hidden');
        }
      });
      
      this._log(`Filtered ${elements.length} elements for role: ${role}`);
    },

    /**
     * Set active state on navigation item
     * @param {HTMLElement} container - Container with nav items
     * @param {string} activeKey - Key to activate
     */
    setActiveByKey(container, activeKey) {
      if (!container || !activeKey) return;
      
      // Remove existing active classes
      const activeItems = container.querySelectorAll('.nav-item.active, .active');
      activeItems.forEach(item => item.classList.remove('active'));
      
      // Set new active item
      const targetItem = container.querySelector(`[${this.config.activeAttribute}="${activeKey}"]`);
      if (targetItem) {
        targetItem.classList.add('active');
        this._log(`Set active: ${activeKey}`);
      }
    },

    /**
     * Replace [[BASE]] tokens with actual base path
     * @param {HTMLElement} container - Container to process
     * @param {string} basePath - Base path to use
     */
    replaceBaseTokens(container, basePath) {
      if (!container) return;
      
      const token = this.config.baseToken;
      let replacements = 0;
      
      // Replace in href attributes
      const links = container.querySelectorAll(`[href*="${token}"]`);
      links.forEach(link => {
        const href = link.getAttribute('href');
        link.setAttribute('href', href.replace(new RegExp(token, 'g'), basePath));
        replacements++;
      });
      
      // Replace in src attributes
      const sources = container.querySelectorAll(`[src*="${token}"]`);
      sources.forEach(source => {
        const src = source.getAttribute('src');
        source.setAttribute('src', src.replace(new RegExp(token, 'g'), basePath));
        replacements++;
      });
      
      // Replace in data attributes
      const dataElements = container.querySelectorAll('[data-href], [data-src]');
      dataElements.forEach(el => {
        ['data-href', 'data-src'].forEach(attr => {
          if (el.hasAttribute(attr)) {
            const value = el.getAttribute(attr);
            if (value.includes(token)) {
              el.setAttribute(attr, value.replace(new RegExp(token, 'g'), basePath));
              replacements++;
            }
          }
        });
      });
      
      this._log(`Replaced ${replacements} base tokens with: ${basePath || '(empty)'}`);
    },

    /**
     * Mount a component into a container
     * @param {Object} options - Mount options
     * @param {string} options.name - Component name
     * @param {HTMLElement} options.container - Target container
     * @param {string} options.rootPath - Path to root template
     * @param {Function} options.onLoad - Callback after load
     * @returns {Promise}
     */
    async mountComponent({ name, container, rootPath, onLoad }) {
      if (!container) {
        this._warn(`No container found for component: ${name}`);
        return;
      }
      
      if (this._mountedComponents.has(container)) {
        this._log(`Component already mounted: ${name}`);
        return;
      }
      
      try {
        // Fetch template (with caching)
        const html = await this._fetchTemplate(rootPath);
        
        // Inject HTML
        container.innerHTML = html;
        
        // Get current role and base path
        const role = await Promise.resolve(this.detectUserRole());
        const base = this.computeBase(role);
        
        // Apply transformations
        this.filterElementsByRole(container, role);
        this.replaceBaseTokens(container, base);
        
        // Mark as mounted
        this._mountedComponents.add(container);
        container.setAttribute('data-ucs-mounted', 'true');
        container.setAttribute('data-ucs-component', name);
        
        // Execute callback
        if (onLoad && typeof onLoad === 'function') {
          await onLoad(container, role, base);
        }
        
        this._log(`Mounted component: ${name}`);
        
      } catch (error) {
        this._error(`Failed to mount component: ${name}`, error);
      }
    },

    /**
     * Initialize UCS - scan for components and mount them
     * @param {Object} options - Init options
     */
    async initUCS(options = {}) {
      this._log('Initializing Universal Component System...');
      
      // Set global role context
      const role = await Promise.resolve(this.detectUserRole());
      const base = this.computeBase(role);
      
      document.documentElement.dataset.role = role;
      document.documentElement.dataset.base = base;
      
      // Get active key from body or infer from pathname
      const bodyActive = document.body.getAttribute('data-active');
      const inferredActive = this._inferActiveKey();
      const activeKey = bodyActive || inferredActive;
      
      if (activeKey) {
        document.body.dataset.active = activeKey;
      }
      
      this._log(`Global context: role=${role}, base=${base}, active=${activeKey}`);
      
      // Find all component placeholders
      const placeholders = document.querySelectorAll('[data-component]');
      
      if (placeholders.length === 0) {
        this._warn('No component placeholders found');
        return;
      }
      
      // Mount in priority order
      const mountPromises = [];
      
      placeholders.forEach(placeholder => {
        const componentName = placeholder.getAttribute('data-component');
        if (!componentName) return;
        
        // Get component config from registry
        const config = window.UCS_REGISTRY && window.UCS_REGISTRY[componentName];
        
        if (!config) {
          this._warn(`Component not registered: ${componentName}`);
          return;
        }
        
        const promise = this.mountComponent({
          name: componentName,
          container: placeholder,
          rootPath: config.root,
          onLoad: config.onLoad
        });
        
        mountPromises.push(promise);
      });
      
      // Wait for all components to mount
      await Promise.all(mountPromises);
      
      this._log(`UCS initialized: ${mountPromises.length} components mounted`);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('ucs:ready', { 
        detail: { role, base, activeKey, componentCount: mountPromises.length }
      }));
    },

    /**
     * Fetch template with caching
     * @private
     */
    async _fetchTemplate(path) {
      // Check cache first
      if (this._templateCache[path]) {
        return this._templateCache[path];
      }
      
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${path} (${response.status})`);
      }
      
      const html = await response.text();
      
      // Cache it
      this._templateCache[path] = html;
      
      return html;
    },

    /**
     * Infer active navigation key from pathname
     * @private
     */
    _inferActiveKey() {
      const path = window.location.pathname;
      const filename = path.split('/').pop().replace('.html', '');
      
      // Map common filenames to keys
      const keyMap = {
        'index': 'dashboard',
        'dashboard': 'dashboard',
        'analytics': 'analytics',
        'market': 'market',
        'properties': 'properties',
        'agents': 'agents',
        'clients': 'clients',
        'transactions': 'transactions',
        'leads': 'leads',
        'listings': 'listings',
        'schedule': 'schedule',
        'commissions': 'commissions',
        'settings': 'settings'
      };
      
      return keyMap[filename] || filename;
    },

    /**
     * Logging utilities
     * @private
     */
    _log(message, ...args) {
      if (this.config.debug) {
        console.log(`[UCS] ${message}`, ...args);
      }
    },

    _warn(message, ...args) {
      console.warn(`[UCS] ${message}`, ...args);
    },

    _error(message, error) {
      console.error(`[UCS] ${message}`, error);
    }
  };

  // Export to window
  window.UCS = UCS;

  // Auto-initialize on DOMContentLoaded if not already initialized
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.UCS_MANUAL_INIT) {
        window.UCS.initUCS();
      }
    });
  } else if (!window.UCS_MANUAL_INIT) {
    window.UCS.initUCS();
  }

})(window);
