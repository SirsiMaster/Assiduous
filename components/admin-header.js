/**
 * Standardized Admin Header Loader
 *
 * How it works:
 * - On DOMContentLoaded, replaces <header id="admin-header-root"> with the shared template
 * - Uses data attributes for configuration:
 *   - data-title: Page title
 *   - data-subtitle: Page subtitle  
 *   - data-search-placeholder: Search input placeholder
 *   - data-actions: JSON string of action buttons
 * - Ensures consistent professional header across all admin pages
 */
(function () {
  function resolveBase(el) {
    var base = el.getAttribute('data-base');
    if (base && base.trim()) return base.replace(/\/$/, '');

    // New structure: everything is at root level
    return '';
  }

  function injectHeader(root, base, config) {
    var xhr = new XMLHttpRequest();
    // Determine the correct path based on current page location
    var path = window.location.pathname;
    var depth = (path.match(/\//g) || []).length - 1; // Count slashes to determine depth
    var prefix = '';
    for (var i = 0; i < depth; i++) {
      prefix += '../';
    }
    var headerPath = prefix + 'components/admin-header.html';
    xhr.open('GET', headerPath);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          var html = xhr.responseText.replace(/\[\[BASE\]\]/g, base);
          root.outerHTML = '<header class="admin-header" data-base="' + base + '">' + html + '</header>';
          
          // Configure the header after injection
          setTimeout(function() {
            configureHeader(config);
          }, 0);
        } else {
          console.error('Failed to load admin header template:', xhr.status, xhr.statusText);
        }
      }
    };
    xhr.send();
  }

  function configureHeader(config) {
    // Set page title and subtitle
    var titleEl = document.querySelector('[data-header-title]');
    var subtitleEl = document.querySelector('[data-header-subtitle]');
    var searchInput = document.querySelector('[data-search-input]');
    var actionsContainer = document.querySelector('[data-header-actions]');

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

  function parseConfig(root) {
    var config = {
      title: root.getAttribute('data-title') || 'Admin Portal',
      subtitle: root.getAttribute('data-subtitle') || 'Manage your platform efficiently',
      searchPlaceholder: root.getAttribute('data-search-placeholder') || 'Search across all modules...',
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
