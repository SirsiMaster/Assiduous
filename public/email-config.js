/**
 * Email Configuration for Assiduous Realty
 * All email addresses should use the @assiduousrealty.com domain
 */

const EMAIL_CONFIG = {
  // Company domain
  DOMAIN: '@assiduousrealty.com',
  
  // System email addresses
  SYSTEM: {
    NOREPLY: 'noreply@assiduousrealty.com',
    SUPPORT: 'support@assiduousrealty.com',
    INFO: 'info@assiduousrealty.com',
    ADMIN: 'admin@assiduousrealty.com',
    NOTIFICATIONS: 'notifications@assiduousrealty.com'
  },
  
  // Department email addresses
  DEPARTMENTS: {
    SALES: 'sales@assiduousrealty.com',
    AGENTS: 'agents@assiduousrealty.com',
    CLIENTS: 'clients@assiduousrealty.com',
    INVESTMENTS: 'investments@assiduousrealty.com',
    FLIPPING: 'flipping@assiduousrealty.com'
  },
  
  // Test account email addresses
  TEST_ACCOUNTS: {
    ADMIN: 'admin@assiduousrealty.com',
    AGENT: 'agent@assiduousrealty.com',
    CLIENT: 'client@assiduousrealty.com',
    TEST_ADMIN: 'test_admin@assiduousrealty.com',
    TEST_AGENT: 'test_agent@assiduousrealty.com',
    TEST_CLIENT: 'test_client@assiduousrealty.com'
  },
  
  // Sample agent emails
  SAMPLE_AGENTS: [
    'sarah.johnson@assiduousrealty.com',
    'mike.thompson@assiduousrealty.com',
    'lisa.anderson@assiduousrealty.com',
    'david.williams@assiduousrealty.com',
    'jennifer.davis@assiduousrealty.com'
  ],
  
  // Sample client emails  
  SAMPLE_CLIENTS: [
    'john.doe@assiduousrealty.com',
    'jane.smith@assiduousrealty.com',
    'robert.brown@assiduousrealty.com',
    'emily.wilson@assiduousrealty.com',
    'michael.jones@assiduousrealty.com'
  ],
  
  // Email validation regex for @assiduousrealty.com domain
  VALIDATION_REGEX: /^[a-zA-Z0-9._-]+@assiduousrealty\.com$/,
  
  // Validate email function
  validateEmail: function(email) {
    return this.VALIDATION_REGEX.test(email);
  },
  
  // Generate standardized email from name
  generateEmail: function(firstName, lastName, role = '') {
    const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const prefix = role ? `${first}.${last}.${role}` : `${first}.${last}`;
    return `${prefix}@assiduousrealty.com`;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EMAIL_CONFIG;
}

// Also make available globally in browser
if (typeof window !== 'undefined') {
  window.EMAIL_CONFIG = EMAIL_CONFIG;
}