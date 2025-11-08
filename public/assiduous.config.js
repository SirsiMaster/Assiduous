/**
 * Assiduous Universal Component System (UCS) Configuration
 * 
 * This is the SINGLE SOURCE OF TRUTH for all component paths, CSS/JS dependencies,
 * role configurations, and build settings across the entire Assiduous platform.
 * 
 * Changes here propagate automatically to all pages on next build.
 * 
 * CRITICAL: Admin pages use this as the gold standard for all layouts.
 */

module.exports = {
  // ============================================
  // ENVIRONMENT CONFIGURATION
  // ============================================
  environments: {
    dev: {
      name: 'Development',
      baseUrl: 'http://localhost:8080',
      firebase: {
        enabled: true,
        projectId: 'assiduous-dev',
      },
      build: {
        minify: false,
        sourceMaps: true,
        strictMode: true,
      }
    },
    staging: {
      name: 'Staging',
      baseUrl: 'https://assiduous-staging.web.app',
      firebase: {
        enabled: true,
        projectId: 'assiduous-staging',
      },
      build: {
        minify: false,
        sourceMaps: true,
        strictMode: true,
        failOnWarning: true,
      }
    },
    prod: {
      name: 'Production',
      baseUrl: 'https://assiduous-prod.web.app',
      firebase: {
        enabled: true,
        projectId: 'assiduous-prod',
      },
      build: {
        minify: true,
        sourceMaps: false,
        strictMode: true,
        failOnWarning: true,
      }
    }
  },

  // ============================================
  // PATH CONFIGURATION
  // ============================================
  paths: {
    // Base directories
    base: '/Users/thekryptodragon/Development/assiduous',
    public: 'public',
    components: 'public/components',
    assets: 'public/assets',
    
    // Resource paths (relative to public/)
    css: 'assets/css',
    js: 'assets/js',
    images: 'assets/images',
    
    // Component-specific
    templates: 'public/components',
    registry: 'public/components/registry.json',
    
    // Build outputs
    output: {
      mode: 'inPlace', // 'inPlace' = write next to source; 'build' = separate directory
      buildDir: '.build', // Only used if mode = 'build'
      sourceMapDir: '.maps',
    }
  },

  // ============================================
  // ROLE CONFIGURATION (Admin = Gold Standard)
  // ============================================
  roles: {
    admin: {
      name: 'Administrator',
      skin: 'admin-layout.css',
      defaultLayout: 'sidebar-header',
      permissions: ['all'],
      baseColor: '#60A3D9', // Sky blue
    },
    client: {
      name: 'Client',
      skin: 'admin-layout.css', // Use admin skin for consistency
      defaultLayout: 'sidebar-header',
      permissions: ['view', 'edit-own'],
      baseColor: '#60A3D9',
    },
    agent: {
      name: 'Agent',
      skin: 'admin-layout.css', // Use admin skin for consistency
      defaultLayout: 'sidebar-header',
      permissions: ['view', 'edit', 'create'],
      baseColor: '#60A3D9',
    },
    public: {
      name: 'Public',
      skin: null, // Marketing pages have custom styles
      defaultLayout: 'header-only',
      permissions: ['view'],
      baseColor: '#60A3D9',
    }
  },

  // ============================================
  // DESIGN SYSTEM (Admin Pages are Standard)
  // ============================================
  design: {
    // Core CSS files (loaded in this order)
    coreCss: [
      'assiduous.css',           // Design tokens and base styles
      'components/admin-layout.css', // Admin layout (GOLD STANDARD)
    ],
    
    // Role-specific CSS overrides
    roleCss: {
      admin: ['assets/css/button-override.css'],
      client: ['assets/css/button-override.css'],
      agent: ['assets/css/button-override.css'],
      public: [],
    },
    
    // External CSS dependencies
    externalCss: [
      'https://cdn.jsdelivr.net/gh/SirsiMaster/ui-components@latest/dist/sirsimaster-ui.css',
      'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap',
      'https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.6/latin.css',
    ],
    
    // Design tokens
    tokens: {
      colors: {
        navy: '#0B1F41',
        sky: '#60A3D9',
        mist: '#E2E8F0',
        accent: '#FFD940',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      }
    }
  },

  // ============================================
  // ASSET BUNDLES (Reusable dependency groups)
  // ============================================
  bundles: {
    core: {
      css: [
        'assiduous.css',
        'components/admin-layout.css',
        'assets/css/button-override.css',
      ],
      js: [
        'assets/js/main.js',
      ]
    },
    
    charts: {
      css: [],
      js: [
        'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
      ]
    },
    
    forms: {
      css: [],
      js: [
        'assets/js/form-validation.js',
      ]
    },
    
    firebase: {
      css: [],
      js: [
        'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
        'firebase-config.js',
      ]
    }
  },

  // ============================================
  // BUILD BEHAVIOR
  // ============================================
  build: {
    // Template discovery
    patterns: {
      templates: ['**/*.template.html'], // Find template files
      pages: ['**/*.html'], // Scan for @component directives
      exclude: [
        'public/admin/**', // DO NOT TOUCH ADMIN PAGES (protected)
        'node_modules/**',
        '.git/**',
        '.build/**',
        '**/*.backup.html',
      ]
    },
    
    // Validation rules
    validation: {
      strictMode: true, // Fail on any error
      failOnWarning: false, // Warnings don't stop build (except staging/prod)
      validatePaths: true, // Check all asset paths exist
      validateProps: true, // Validate component props against schema
      checkDuplicateDeps: true, // Warn on duplicate CSS/JS
      requireRegistry: true, // All components must be in registry
    },
    
    // Performance
    cache: {
      enabled: true,
      templates: true,
      registry: true,
      parsedComponents: true,
    },
    
    // Output options
    output: {
      cleanBefore: false, // Don't delete existing files
      preserveComments: false, // Strip HTML comments in production
      formatHtml: false, // Don't reformat HTML (preserve original)
      generateReport: true, // Create build-report.json
      generateSourceMaps: true, // Create .map files for debugging
    }
  },

  // ============================================
  // MIGRATION SETTINGS (Phase-based rollout)
  // ============================================
  migration: {
    // Current phase (controls what gets processed)
    currentPhase: 'phase-0-setup', // phase-0-setup, phase-1-client, phase-2-dev, phase-3-admin
    
    // Phase definitions
    phases: {
      'phase-0-setup': {
        description: 'Setup UCS infrastructure, no page conversion',
        include: [],
      },
      'phase-1-client': {
        description: 'Convert client portal and docs pages',
        include: [
          'public/client/**',
          'public/docs/**',
        ],
      },
      'phase-2-dev': {
        description: 'Convert admin/development pages',
        include: [
          'public/admin/development/**',
        ],
      },
      'phase-3-admin': {
        description: 'Selectively convert core admin pages with visual diff approval',
        include: [
          'public/admin/dashboard.html',
          'public/admin/analytics.html',
          // Add more as approved
        ],
      }
    },
    
    // Backward compatibility
    legacy: {
      preserveExisting: true, // Keep non-template files as-is
      bridgeStylesheet: 'components/legacy-bridge.css', // Harmonization CSS
    }
  },

  // ============================================
  // COMPONENT DEFAULTS
  // ============================================
  components: {
    defaultProps: {
      header: {
        role: 'admin',
        title: 'Dashboard',
        subtitle: 'Welcome back',
        searchPlaceholder: 'Search...',
      },
      sidebar: {
        active: 'dashboard',
        role: 'admin',
      }
    },
    
    // Reserved tokens available in all components
    tokens: [
      '{{BASE_PATH}}',      // Relative path to public root
      '{{ASSETS_PATH}}',    // Relative path to assets
      '{{COMPONENTS_PATH}}', // Relative path to components
      '{{ROLE}}',           // Current user role
      '{{PAGE_PATH}}',      // Current page path
      '{{PROP_*}}',         // Any prop passed to component
      '{{REL(path)}}',      // Function to resolve relative path
    ]
  },

  // ============================================
  // EXPORT TO SIRSI COMPONENT LIBRARY
  // ============================================
  export: {
    enabled: false, // Set to true when ready to export
    targetRepo: '/Users/thekryptodragon/Development/sirsimaster-component-library',
    components: [
      // Mark components as exportable in registry.json
      // This is just the config; actual export logic is in scripts/export-to-sirsi.js
    ],
    stripSelectors: [
      '.assiduous-specific', // Remove Assiduous-only classes
    ],
    includeVersioning: true,
  }
};
