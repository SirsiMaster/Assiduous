/**
 * Universal Header Component Loader
 * 
 * Loads the appropriate header layout based on data-type attribute:
 * - admin: Admin interface header with search, actions, user menu
 * - client: Client portal header with property search, user welcome
 * - public: Public website header with navigation and auth buttons
 * 
 * Usage:
 *   <header id="universal-header-root" 
 *           data-type="admin|client|public"
 *           data-title="Page Title"
 *           data-subtitle="Page subtitle"
 *           data-user-name="John Smith"
 *           data-search-placeholder="Search..."
 *           data-show-auth="true"></header>
 *   <script src="[[BASE]]/components/universal-header.js"></script>
 */

(function () {
  const baseTokenRegex = /\\[\\[BASE\\]\\]/g;
  const typeTokenRegex = /\\[\\[TYPE\\]\\]/g;
  const titleTokenRegex = /\\[\\[TITLE\\]\\]/g;
  const subtitleTokenRegex = /\\[\\[SUBTITLE\\]\\]/g;
  const userNameTokenRegex = /\\[\\[USER_NAME(?::(\\d+):(\\d+))?\\]\\]/g;
  const searchPlaceholderTokenRegex = /\\[\\[SEARCH_PLACEHOLDER\\]\\]/g;

  function resolveBase() {
    // Attempt to infer base from script tag src
    const script = document.currentScript || document.querySelector('script[src$="universal-header.js"]');
    if (!script) {
      // Fallback to current page location
      const currentPath = window.location.pathname;
      if (currentPath.includes('/AssiduousFlip/')) {
        return window.location.origin + '/AssiduousFlip';
      }
      return window.location.origin;
    }
    const src = script.getAttribute('src');
    if (src) {
      // Handle relative paths
      if (src.startsWith('components/')) {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/AssiduousFlip/')) {
          return window.location.origin + '/AssiduousFlip';
        }
        return window.location.origin;
      }
      // Handle absolute paths
      return src.replace(/\/components\/universal-header\.js$/, '');
    }
    return '';
  }

  function processTokens(html, config) {
    // Replace base path
    html = html.replace(baseTokenRegex, config.base);
    
    // Replace type
    html = html.replace(typeTokenRegex, config.type);
    
    // Replace title and subtitle
    html = html.replace(titleTokenRegex, config.title);
    html = html.replace(subtitleTokenRegex, config.subtitle);
    
    // Replace search placeholder
    html = html.replace(searchPlaceholderTokenRegex, config.searchPlaceholder);
    
    // Replace user name with substring support
    html = html.replace(userNameTokenRegex, (match, start, end) => {
      if (!config.userName) return '';
      if (start !== undefined && end !== undefined) {
        return config.userName.substring(parseInt(start), parseInt(end)).toUpperCase();
      }
      return config.userName;
    });
    
    return html;
  }

  function showOnlyHeaderType(container, type) {
    // Hide all header types
    const headerTypes = container.querySelectorAll('[data-show-if-type]');
    headerTypes.forEach(element => {
      if (element.getAttribute('data-show-if-type') === type) {
        element.style.display = 'flex';
      } else {
        element.style.display = 'none';
      }
    });
  }

  function setupInteractivity(container, config) {
    // User menu dropdown
    const userMenu = container.querySelector('.user-menu');
    const userAvatar = container.querySelector('.user-avatar');
    const userDropdown = container.querySelector('.user-dropdown');
    
    if (userMenu && userAvatar && userDropdown) {
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userDropdown.style.display = 'none';
      });
    }

    // Search functionality
    const searchInput = container.querySelector('[data-search-input]');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        // Dispatch custom search event
        window.dispatchEvent(new CustomEvent('universalHeaderSearch', {
          detail: { query: e.target.value, type: config.type }
        }));
      });
    }

    // Action buttons setup
    if (config.actions && config.type === 'admin') {
      const actionsContainer = container.querySelector('[data-header-actions]');
      if (actionsContainer) {
        config.actions.forEach(action => {
          const button = document.createElement('button');
          button.className = `header-action-btn ${action.primary ? 'primary' : 'secondary'}`;
          button.innerHTML = `${action.icon || ''} ${action.label}`;
          if (action.onclick) {
            button.addEventListener('click', () => eval(action.onclick));
          }
          actionsContainer.appendChild(button);
        });
      }
    }
  }

  function injectHeader() {
    const root = document.getElementById('universal-header-root');
    if (!root) return;

    const base = resolveBase();
    const type = root.getAttribute('data-type') || 'public';
    const title = root.getAttribute('data-title') || 'Assiduous Properties';
    const subtitle = root.getAttribute('data-subtitle') || '';
    const userName = root.getAttribute('data-user-name') || 'User';
    const searchPlaceholder = root.getAttribute('data-search-placeholder') || 'Search...';
    const showAuth = root.getAttribute('data-show-auth') === 'true';
    
    let actions = [];
    try {
      const actionsAttr = root.getAttribute('data-actions');
      if (actionsAttr) {
        actions = JSON.parse(actionsAttr);
      }
    } catch (e) {
      console.warn('Failed to parse data-actions:', e);
    }

    const config = {
      base,
      type,
      title,
      subtitle,
      userName,
      searchPlaceholder,
      showAuth,
      actions
    };

    // Fetch the header template
    fetch(base + '/components/universal-header.html')
      .then(response => response.text())
      .then(html => {
        // Process tokens
        html = processTokens(html, config);
        
        // Create container and inject HTML
        const container = document.createElement('div');
        container.innerHTML = html;
        const headerElement = container.firstElementChild;
        
        // Show only the appropriate header type
        showOnlyHeaderType(headerElement, type);
        
        // Replace the root element
        root.parentNode.replaceChild(headerElement, root);
        
        // Setup interactivity
        setupInteractivity(headerElement, config);
        
        // Dispatch loaded event
        window.dispatchEvent(new CustomEvent('universalHeaderLoaded', {
          detail: { type, config }
        }));
      })
      .catch(err => {
        console.error('Failed to load universal header:', err);
        // Fallback to basic header
        root.innerHTML = `
          <div style="padding: 1rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <h1 style="margin: 0; font-size: 1.5rem; color: #111827;">${title}</h1>
            ${subtitle ? `<p style="margin: 0.25rem 0 0 0; color: #6b7280; font-size: 0.875rem;">${subtitle}</p>` : ''}
          </div>
        `;
      });
  }

  // Load header when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }
})();
