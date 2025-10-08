/**
 * Firebase Configuration for Multi-Environment Setup
 * 
 * Automatically detects the environment based on hostname and loads
 * the appropriate Firebase project configuration.
 * 
 * Environments:
 * - DEV: assiduous-dev.web.app (isolated development)
 * - STAGING: assiduous-staging.web.app (pre-production validation)
 * - PRODUCTION: assiduousflip.web.app (live production)
 */

// Firebase configurations for each environment
const FIREBASE_CONFIGS = {
  development: {
    apiKey: "AIzaSyDLi14oefCZVVlQm7cPfDb0WQ9nXlIF4jY",
    authDomain: "assiduous-dev.firebaseapp.com",
    projectId: "assiduous-dev",
    storageBucket: "assiduous-dev.firebasestorage.app",
    messagingSenderId: "186714044941",
    appId: "1:186714044941:web:1525a0503610519dd5f344",
    databaseURL: "https://assiduous-dev-default-rtdb.firebaseio.com"
  },
  
  staging: {
    apiKey: "AIzaSyDnMkQbhC5kYl5O_07zQ2yfYvGjLRq6E0c",
    authDomain: "assiduous-staging.firebaseapp.com",
    projectId: "assiduous-staging",
    storageBucket: "assiduous-staging.firebasestorage.app",
    messagingSenderId: "853661742177",
    appId: "1:853661742177:web:cf93349a7f50a2d9f2e620",
    databaseURL: "https://assiduous-staging-default-rtdb.firebaseio.com"
  },
  
  production: {
    apiKey: "AIzaSyCL8Y7cQ-kZfhCXaM1KBTnAI6_LXq2J8fE",
    authDomain: "assiduous-prod.firebaseapp.com",
    projectId: "assiduous-prod",
    storageBucket: "assiduous-prod.firebasestorage.app",
    messagingSenderId: "9355377564",
    appId: "1:9355377564:web:84bd6fa0e7c8a2e7c3f56b",
    databaseURL: "https://assiduous-prod-default-rtdb.firebaseio.com"
  }
};

/**
 * Detect the current environment based on hostname
 * @returns {string} Environment name ('development', 'staging', or 'production')
 */
function detectEnvironment() {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  // Development environment
  if (hostname.includes('assiduous-dev.web.app') || 
      hostname.includes('assiduous-dev.firebaseapp.com')) {
    return 'development';
  }
  
  // Staging environment
  if (hostname.includes('assiduous-staging.web.app') || 
      hostname.includes('assiduous-staging.firebaseapp.com')) {
    return 'staging';
  }
  
  // Production environment (default)
  return 'production';
}

/**
 * Get the Firebase configuration for the current environment
 * @returns {Object} Firebase configuration object
 */
function getFirebaseConfig() {
  const environment = detectEnvironment();
  const config = FIREBASE_CONFIGS[environment];
  
  console.log(`🔥 Firebase Environment: ${environment.toUpperCase()}`);
  console.log(`🔥 Project ID: ${config.projectId}`);
  
  return config;
}

/**
 * Get the current environment name
 * @returns {string} Environment name
 */
function getCurrentEnvironment() {
  return detectEnvironment();
}

/**
 * Check if running in production
 * @returns {boolean} True if in production
 */
function isProduction() {
  return detectEnvironment() === 'production';
}

/**
 * Check if running in development
 * @returns {boolean} True if in development
 */
function isDevelopment() {
  return detectEnvironment() === 'development';
}

/**
 * Check if running in staging
 * @returns {boolean} True if in staging
 */
function isStaging() {
  return detectEnvironment() === 'staging';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFirebaseConfig,
    getCurrentEnvironment,
    isProduction,
    isDevelopment,
    isStaging,
    FIREBASE_CONFIGS
  };
}
