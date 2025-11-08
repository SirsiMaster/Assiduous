/**
 * Universal Component System - Component Registry
 * 
 * Central registry for all UCS components.
 * Maps component names to their root templates and loaders.
 * 
 * @author Assiduous Development Team
 * @version 1.0.0
 */

(function(window) {
  'use strict';

  // Helper to compute component path based on current location
  function getComponentPath(filename) {
    const path = window.location.pathname;
    if (path.includes('/client/') || path.includes('/agent/') || path.includes('/admin/')) {
      return '../components/' + filename;
    }
    return 'components/' + filename;
  }

  // Component Registry
  window.UCS_REGISTRY = {
    
    // ========================================
    // LAYOUT & NAVIGATION COMPONENTS
    // ========================================
    
    'sidebar': {
      get root() { return getComponentPath('sidebar-root.html'); },
      onLoad: async (container, role, base) => {
        // Update logo text based on role
        const logoText = container.querySelector('[data-el="logo-text"]');
        if (logoText) {
          const roleNames = {
            'admin': 'Admin Portal',
            'agent': 'Agent Portal',
            'client': 'Client Portal',
            'universal': 'Assiduous'
          };
          logoText.textContent = roleNames[role] || 'Assiduous';
        }
        
        // Set active navigation item
        const activeKey = document.body.dataset.active;
        if (activeKey) {
          window.UCS.setActiveByKey(container, activeKey);
        }
      }
    },
    
    'header': {
      get root() { return getComponentPath('universal-header.html'); },
      onLoad: async (container, role, base) => {
        // Initialize header dropdown toggles
        const userAvatar = container.querySelector('[data-user-avatar]');
        const dropdown = container.querySelector('#userDropdown');
        
        if (userAvatar && dropdown) {
          userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
          });
          
          // Close on outside click
          document.addEventListener('click', () => {
            dropdown.style.display = 'none';
          });
        }
        
        // Set role display
        const roleDisplay = container.querySelector('[data-user-role-display]');
        if (roleDisplay) {
          const roleNames = {
            'admin': 'Administrator',
            'agent': 'Real Estate Agent',
            'client': 'Client'
          };
          roleDisplay.textContent = roleNames[role] || 'User';
        }
      }
    },
    
    'breadcrumbs': {
      root: '../components/breadcrumbs-root.html',
      onLoad: async (container, role, base) => {
        // Build breadcrumb trail based on current path
        const path = window.location.pathname;
        const parts = path.split('/').filter(p => p && p !== 'public' && !p.endsWith('.html'));
        
        if (parts.length <= 1) {
          container.style.display = 'none';
          return;
        }
        
        // Generate breadcrumb HTML
        let breadcrumbHTML = '<a href="/">Home</a>';
        let currentPath = '';
        
        parts.forEach((part, index) => {
          currentPath += '/' + part;
          const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
          
          if (index < parts.length - 1) {
            breadcrumbHTML += ` <span class="breadcrumb-separator">/</span> <a href="${currentPath}/">${label}</a>`;
          } else {
            breadcrumbHTML += ` <span class="breadcrumb-separator">/</span> <span class="breadcrumb-current">${label}</span>`;
          }
        });
        
        container.innerHTML = breadcrumbHTML;
        container.style.display = 'flex';
      }
    },
    
    'mobile-menu': {
      root: '../components/mobile-menu-root.html',
      onLoad: async (container, role, base) => {
        // Clone sidebar content for mobile
        const sidebar = document.querySelector('[data-component="sidebar"]');
        if (sidebar) {
          const sidebarClone = sidebar.cloneNode(true);
          container.appendChild(sidebarClone);
        }
        
        // Setup mobile toggle
        const toggle = document.querySelector('[data-mobile-toggle]');
        if (toggle) {
          toggle.addEventListener('click', () => {
            container.classList.toggle('mobile-open');
          });
        }
      }
    },
    
    // ========================================
    // UI COMPONENTS
    // ========================================
    
    'data-table': {
      root: '../components/ui/tables/data-table-root.html',
      onLoad: async (container, role, base) => {
        // Initialize sortable headers if needed
        const headers = container.querySelectorAll('th[data-sortable]');
        headers.forEach(header => {
          header.style.cursor = 'pointer';
          header.addEventListener('click', () => {
            // Sorting logic would go here
            console.log('Sort by:', header.dataset.sortable);
          });
        });
      }
    },
    
    'stat-card': {
      root: '../components/ui/cards/stat-card-root.html',
      onLoad: async (container, role, base) => {
        // Animate numbers on load
        const values = container.querySelectorAll('[data-animate-value]');
        values.forEach(el => {
          const target = parseInt(el.textContent);
          let current = 0;
          const increment = target / 50;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              el.textContent = target;
              clearInterval(timer);
            } else {
              el.textContent = Math.floor(current);
            }
          }, 20);
        });
      }
    },
    
    'modal': {
      root: '../components/ui/modals/modal-root.html',
      onLoad: async (container, role, base) => {
        // Setup modal open/close handlers
        const closeBtn = container.querySelector('[data-modal-close]');
        const overlay = container.querySelector('.modal-overlay');
        
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            container.style.display = 'none';
          });
        }
        
        if (overlay) {
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
              container.style.display = 'none';
            }
          });
        }
      }
    },
    
    // ========================================
    // AUTH COMPONENTS
    // ========================================
    
    'auth-form': {
      root: '../components/auth/auth-root.html',
      onLoad: async (container, role, base) => {
        // Initialize Firebase Auth handlers
        const loginForm = container.querySelector('#loginForm');
        const registerForm = container.querySelector('#registerForm');
        
        if (loginForm) {
          loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Firebase login logic
            console.log('Login submitted');
          });
        }
        
        if (registerForm) {
          registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Firebase registration logic
            console.log('Register submitted');
          });
        }
      }
    },
    
    // ========================================
    // INTEGRATION COMPONENTS
    // ========================================
    
    'firebase-connector': {
      root: '../components/integrations/firebase-connector-root.html',
      onLoad: async (container, role, base) => {
        // Display connection status
        const statusEl = container.querySelector('[data-connection-status]');
        if (statusEl && window.firebase) {
          firebase.auth().onAuthStateChanged(user => {
            statusEl.textContent = user ? 'Connected' : 'Disconnected';
            statusEl.className = user ? 'status-connected' : 'status-disconnected';
          });
        }
      }
    }
  };

  /**
   * Register a new component
   * @param {string} name - Component name
   * @param {Object} config - Component configuration
   */
  window.UCS.register = function(name, config) {
    if (!name || !config || !config.root) {
      console.error('[UCS Registry] Invalid component registration:', name);
      return;
    }
    
    window.UCS_REGISTRY[name] = config;
    console.log(`[UCS Registry] Registered component: ${name}`);
  };

  /**
   * Mount all registered components
   */
  window.UCS.mountAll = async function() {
    const placeholders = document.querySelectorAll('[data-component]');
    const promises = [];
    
    placeholders.forEach(placeholder => {
      const name = placeholder.getAttribute('data-component');
      const config = window.UCS_REGISTRY[name];
      
      if (config) {
        promises.push(
          window.UCS.mountComponent({
            name,
            container: placeholder,
            rootPath: config.root,
            onLoad: config.onLoad
          })
        );
      }
    });
    
    return Promise.all(promises);
  };

  console.log('[UCS Registry] Component registry loaded');

})(window);
