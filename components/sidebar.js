/**
 * Shared Admin Sidebar Loader
 *
 * How it works:
 * - On DOMContentLoaded, replaces <aside id="sidebar-root"> with the shared template
 * - Uses data-base attribute on the aside as the base path (defaults to "/Assiduous/AssiduousFlip")
 * - Highlights active item via data-active (data-key in template)
 * - Ensures portable across SirsiMaster projects (only dependency is CSS already on each page)
 */
(function () {
  function resolveBase(el) {
    var base = el.getAttribute('data-base');
    if (base && base.trim()) return base.replace(/\/$/, '');

    // New structure: everything is at root level
    // No more /AssiduousFlip subdirectory
    return '';
  }

  function injectSidebar(root, base, activeKey) {
    var xhr = new XMLHttpRequest();
    // Determine the correct path based on current page location
    var path = window.location.pathname;
    var sidebarPath;
    
    // Check if we're in development subfolder
    if (path.includes('/admin/development/backups/')) {
      sidebarPath = '../../../components/sidebar.html';
    } else if (path.includes('/admin/development/') || path.includes('/admin/contracts/')) {
      sidebarPath = '../../components/sidebar.html';
    } else if (path.includes('/admin/') || path.includes('/client/') || path.includes('/docs/')) {
      sidebarPath = '../components/sidebar.html';
    } else {
      // Root level
      sidebarPath = 'components/sidebar.html';
    }
    
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
          console.error('Failed to load sidebar template:', xhr.status, xhr.statusText);
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

