/**
 * Universal Header Loader - Dynamic Role-Based Header Component
 *
 * TODO: BEFORE PRODUCTION:
 * - Integrate with Firebase Auth to get actual user data
 * - Implement role-based access control
 * - Add real user profile pictures
 * - Connect logout to Firebase Auth signOut
 * - Implement actual search functionality
 * 
 * How it works:
 * - On DOMContentLoaded, replaces <header id="admin-header-root"> with the shared template
 * - Detects user role from URL path or data attribute
 * - Uses data attributes for configuration:
 *   - data-title: Page title
 *   - data-subtitle: Page subtitle  
 *   - data-search-placeholder: Search input placeholder
 *   - data-actions: JSON string of action buttons
 *   - data-user-role: 'admin', 'agent', or 'client'
 *   - data-user-name: User's display name
 *   - data-user-email: User's email
 * - Dynamically adjusts content based on user role
 */
(function () {
  function resolveBase(el) {
    var base = el.getAttribute('data-base');
    if (base && base.trim()) return base.replace(/\/$/, '');

    // New structure: everything is at root level
    return '';
  }

  function createBreadcrumb(pathParts) {
    if (pathParts.length <= 1) return null;
    
    var breadcrumbItems = [];
    var currentPath = '';
    
    // Add back button for nested pages (depth > 2)
    if (pathParts.length > 2) {
      var parentPath = '/' + pathParts.slice(0, -1).join('/') + '/';
      var backButton = '<a href="' + parentPath + '" class="breadcrumb-back">';
      backButton += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      backButton += 'Back</a>';
      breadcrumbItems.push(backButton);
    }
    
    // Add home/root
    breadcrumbItems.push('<a href="/">Home</a>');
    
    // Build breadcrumb trail
    for (var i = 0; i < pathParts.length; i++) {
      currentPath += '/' + pathParts[i];
      var label = pathParts[i];
      
      // Format the label (capitalize, replace hyphens/underscores)
      label = label.replace(/[-_]/g, ' ');
      label = label.charAt(0).toUpperCase() + label.slice(1);
      
      // Special case labels
      if (label === 'Admin') label = 'Admin Portal';
      if (label === 'Development') label = 'Development';
      if (label === 'Contracts') label = 'Contracts';
      if (label.includes('.html')) {
        label = label.replace('.html', '');
        label = label.charAt(0).toUpperCase() + label.slice(1);
        if (label === 'Sirsi contract') label = 'Sirsi Contract';
        if (label === 'Payment structure') label = 'Payment Structure';
      }
      
      // Add separator and link
      if (i < pathParts.length - 1) {
        // Not the last item - make it a link
        breadcrumbItems.push('<span class="breadcrumb-separator">/</span>');
        breadcrumbItems.push('<a href="' + currentPath + '/">' + label + '</a>');
      } else {
        // Last item - current page (not a link)
        breadcrumbItems.push('<span class="breadcrumb-separator">/</span>');
        breadcrumbItems.push('<span class="breadcrumb-current">' + label + '</span>');
      }
    }
    
    return breadcrumbItems.join('');
  }

  function getUserDataFromConfig(config) {
    // TODO: In production, get this from Firebase Auth
    // const user = firebase.auth().currentUser;
    
    // Determine role from URL path or config
    var path = window.location.pathname;
    var role = config.userRole || 'admin'; // default
    
    if (path.includes('/agent/')) {
      role = 'agent';
    } else if (path.includes('/client/')) {
      role = 'client';
    } else if (path.includes('/admin/')) {
      role = 'admin';
    }
    
    // Role display names
    var roleDisplayNames = {
      'admin': 'Administrator',
      'agent': 'Real Estate Agent',
      'client': 'Client'
    };
    
    // Get user initials from name
    var userName = config.userName || 'User';
    var initials = userName.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
    
    return {
      role: role,
      roleDisplay: roleDisplayNames[role],
      name: userName,
      email: config.userEmail || role + '@assiduousrealty.com',
      initials: initials,
      avatarContent: '<span>' + initials + '</span>'
    };
  }
  
  function getRoleSpecificUrls(role) {
    var basePrefix = role === 'admin' ? '../admin/' : (role === 'agent' ? '../agent/' : '../client/');
    
    return {
      settings: basePrefix + 'settings.html',
      help: basePrefix + 'help.html',
      logout: '/' // TODO: Should be '/login?role=' + role in production
    };
  }
  
  function injectHeader(root, base, config) {
    var xhr = new XMLHttpRequest();
    // Determine the correct path based on current page location
    var path = window.location.pathname;
    var headerPath;
    
    // Check if we're in development subfolder
    if (path.includes('/assiduousflip/admin/development/backups/')) {
      headerPath = '../../../components/admin-header.html';
    } else if (path.includes('/admin/development/backups/')) {
      headerPath = '../../../components/admin-header.html';
    } else if (path.includes('/assiduousflip/admin/development/') || path.includes('/assiduousflip/admin/contracts/')) {
      headerPath = '../../components/admin-header.html';
    } else if (path.includes('/admin/development/') || path.includes('/admin/contracts/')) {
      headerPath = '../../components/admin-header.html';
    } else if (path.includes('/assiduousflip/admin/')) {
      headerPath = '../components/admin-header.html';
    } else if (path.includes('/admin/') || path.includes('/client/') || path.includes('/docs/')) {
      headerPath = '../components/admin-header.html';
    } else if (path.includes('/assiduousflip/')) {
      headerPath = 'components/admin-header.html';
    } else {
      // Root level
      headerPath = 'components/admin-header.html';
    }
    
    console.log('Loading header from:', headerPath);
    
    xhr.open('GET', headerPath);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          var userData = getUserDataFromConfig(config);
          var urls = getRoleSpecificUrls(userData.role);
          
          // Replace all placeholders in the template
          var html = xhr.responseText
            .replace(/\[\[BASE\]\]/g, base)
            .replace(/\[\[USER_NAME\]\]/g, userData.name)
            .replace(/\[\[USER_EMAIL\]\]/g, userData.email)
            .replace(/\[\[USER_ROLE\]\]/g, userData.role)
            .replace(/\[\[USER_ROLE_DISPLAY\]\]/g, userData.roleDisplay)
            .replace(/\[\[USER_INITIALS\]\]/g, userData.initials)
            .replace(/\[\[USER_AVATAR_CONTENT\]\]/g, userData.avatarContent)
            .replace(/\[\[SETTINGS_URL\]\]/g, urls.settings)
            .replace(/\[\[HELP_URL\]\]/g, urls.help)
            .replace(/\[\[LOGOUT_URL\]\]/g, urls.logout);
          
          root.outerHTML = '<header class="admin-header" data-base="' + base + '" data-user-role="' + userData.role + '">' + html + '</header>';
          
          // Configure the header after injection
          setTimeout(function() {
            configureHeader(config);
            addRoleSpecificMenuItems(userData.role);
          }, 0);
        } else {
          console.error('Failed to load admin header template:', xhr.status, xhr.statusText);
        }
      }
    };
    xhr.send();
  }

  function configureHeader(config) {
    // Add back button if we're in a subdirectory
    var path = window.location.pathname;
    var pathParts = path.split('/').filter(function(p) { return p; });
    
    // Set page title and subtitle
    var titleEl = document.querySelector('[data-header-title]');
    var subtitleEl = document.querySelector('[data-header-subtitle]');
    var searchInput = document.querySelector('[data-search-input]');
    var actionsContainer = document.querySelector('[data-header-actions]');

    // Add breadcrumb navigation for nested pages
    if (pathParts.length > 1) {
      var breadcrumbContainer = document.querySelector('[data-breadcrumb-container]');
      if (breadcrumbContainer) {
        var breadcrumb = createBreadcrumb(pathParts);
        if (breadcrumb) {
          breadcrumbContainer.innerHTML = breadcrumb;
          breadcrumbContainer.style.display = 'flex';
        }
      }
    }

    if (titleEl && config.title) {
      titleEl.textContent = config.title;
    }

    if (subtitleEl && config.subtitle) {
      subtitleEl.textContent = config.subtitle;
    }

    if (searchInput && config.searchPlaceholder) {
      searchInput.placeholder = config.searchPlaceholder;
    }

    // Add action buttons if provided
    if (actionsContainer && config.actions && config.actions.length > 0) {
      actionsContainer.innerHTML = config.actions.map(function(action) {
        var classes = 'header-action-btn' + (action.primary ? ' primary' : '');
        var icon = action.icon ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + action.icon + '</svg>' : '';
        
        if (action.href) {
          return '<a href="' + action.href + '" class="' + classes + '">' + icon + action.label + '</a>';
        } else {
          return '<button class="' + classes + '" onclick="' + (action.onclick || '') + '">' + icon + action.label + '</button>';
        }
      }).join('');
    }
  }

  function addRoleSpecificMenuItems(role) {
    var container = document.getElementById('role-specific-menu-items');
    if (!container) return;
    
    var menuItems = [];
    
    if (role === 'agent') {
      menuItems = [
        { icon: '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>', 
          text: 'Commission Dashboard', 
          href: '../agent/commissions.html' },
        { icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>', 
          text: 'Lead Manager', 
          href: '../agent/leads.html' }
      ];
    } else if (role === 'admin') {
      menuItems = [
        { icon: '<path d="M3 3h18v18H3zM12 8v8m-4-4h8"></path>', 
          text: 'System Settings', 
          href: '../admin/system-settings.html' },
        { icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>', 
          text: 'User Management', 
          href: '../admin/users.html' }
      ];
    } else if (role === 'client') {
      menuItems = [
        { icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>', 
          text: 'My Properties', 
          href: '../client/properties.html' },
        { icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>', 
          text: 'Documents', 
          href: '../client/documents.html' }
      ];
    }
    
    if (menuItems.length > 0) {
      var html = menuItems.map(function(item) {
        return '<a href="' + item.href + '" class="dropdown-item">' +
               '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
               item.icon + '</svg>' + item.text + '</a>';
      }).join('');
      container.innerHTML = html;
    }
  }
  
  function parseConfig(root) {
    var config = {
      title: root.getAttribute('data-title') || 'Dashboard',
      subtitle: root.getAttribute('data-subtitle') || 'Welcome to your portal',
      searchPlaceholder: root.getAttribute('data-search-placeholder') || 'Search...',
      userRole: root.getAttribute('data-user-role'),
      userName: root.getAttribute('data-user-name') || 'User',
      userEmail: root.getAttribute('data-user-email'),
      actions: []
    };

    // Parse actions from data attribute
    var actionsData = root.getAttribute('data-actions');
    if (actionsData) {
      try {
        config.actions = JSON.parse(actionsData);
      } catch (e) {
        console.warn('Failed to parse header actions:', e);
      }
    }

    return config;
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    var root = document.getElementById('admin-header-root');
    if (!root) return; // no-op if page doesn't include the placeholder

    var base = resolveBase(root);
    var config = parseConfig(root);
    injectHeader(root, base, config);
  });

  // Utility functions for common header actions
  window.HeaderActions = {
    // Add Property button for properties page
    addProperty: function() {
      console.log('Add property action triggered');
      // Implement add property logic
    },
    
    // Export button for analytics pages
    exportData: function() {
      console.log('Export data action triggered');
      // Implement export logic
    },
    
    // Generic action handler
    handleAction: function(actionType, data) {
      console.log('Header action:', actionType, data);
      // Implement specific action logic based on type
    }
  };
})();
