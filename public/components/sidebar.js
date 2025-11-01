/**
 * Shared Admin Sidebar Loader
 *
 * How it works:
 * - On DOMContentLoaded, replaces <aside id="sidebar-root"> with the shared template
 * - Dynamically calculates correct base path for navigation links
 * - Highlights active item via data-active (data-key in template)
 * - Works correctly from any location in the site hierarchy
 */
(function () {
  function resolveBase(el) {
    var base = el.getAttribute('data-base');
    if (base && base.trim()) return base.replace(/\/$/, '');

    // Calculate relative path to admin root based on current location
    var path = window.location.pathname;
    
    // For development subfolder pages
    if (path.includes('/admin/development/')) {
      return '../'; // Go up one level to admin/
    }
    // For contract subfolder pages  
    else if (path.includes('/admin/contracts/')) {
      return '../'; // Go up one level to admin/
    }
    // For admin root pages
    else if (path.includes('/admin/')) {
      return ''; // Already at admin level
    }
    // For root level or other pages
    return 'admin/';
  }

  function injectSidebar(root, base, activeKey) {
    var xhr = new XMLHttpRequest();
    var path = window.location.pathname;
    var sidebarPath;
    
    // Determine the correct path to sidebar.html based on current location
    if (path.includes('/assiduousflip/admin/development/') || path.includes('/assiduousflip/admin/contracts/')) {
      sidebarPath = '../../components/sidebar.html';
    } else if (path.includes('/admin/development/') || path.includes('/admin/contracts/')) {
      sidebarPath = '../../components/sidebar.html';
    } else if (path.includes('/assiduousflip/admin/')) {
      sidebarPath = '../components/sidebar.html';
    } else if (path.includes('/admin/') || path.includes('/client/') || path.includes('/docs/')) {
      sidebarPath = '../components/sidebar.html';
    } else if (path.includes('/assiduousflip/')) {
      sidebarPath = 'components/sidebar.html';
    } else {
      // Root level
      sidebarPath = 'components/sidebar.html';
    }
    
    console.log('Loading sidebar from:', sidebarPath);
    
    xhr.open('GET', sidebarPath);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          var html = xhr.responseText.replace(/\[\[BASE\]\]/g, base);
          root.outerHTML = '<aside class="sidebar" data-base="' + base + '">' + html + '</aside>';
          // Highlight active link
          if (activeKey) {
            var aside = document.querySelector('aside.sidebar');
            if (aside) {
              var link = aside.querySelector('[data-key="' + activeKey + '"]');
              if (link) link.classList.add('active');
            }
          }
        } else {
          console.error('Failed to load sidebar template:', xhr.status, xhr.statusText, 'from path:', sidebarPath);
        }
      }
    };
    xhr.send();
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    var root = document.getElementById('sidebar-root');
    if (!root) return; // no-op if page doesn't include the placeholder

    var base = resolveBase(root);
    var active = root.getAttribute('data-active') || '';
    injectSidebar(root, base, active);
  });
})();

