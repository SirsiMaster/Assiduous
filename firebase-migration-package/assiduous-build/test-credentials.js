/**
 * Test Credentials Configuration for Assiduous Realty
 * Standardized test accounts for development and testing
 */

const TEST_CREDENTIALS = {
  // Primary test accounts
  ADMIN: {
    email: 'admin@assiduousrealty.com',
    password: 'admin123',
    role: 'admin',
    displayName: 'Admin User'
  },
  
  AGENT: {
    email: 'agent@assiduousrealty.com',
    password: 'test123',
    role: 'agent',
    displayName: 'Agent User'
  },
  
  CLIENT: {
    email: 'client@assiduousrealty.com',
    password: 'test123',
    role: 'client',
    displayName: 'Client User'
  },
  
  // Secondary test accounts (with test_ prefix)
  TEST_ADMIN: {
    email: 'test_admin@assiduousrealty.com',
    password: 'admin123',
    role: 'admin',
    displayName: 'Test Admin'
  },
  
  TEST_AGENT: {
    email: 'test_agent@assiduousrealty.com',
    password: 'test123',
    role: 'agent',
    displayName: 'Test Agent'
  },
  
  TEST_CLIENT: {
    email: 'test_client@assiduousrealty.com',
    password: 'test123',
    role: 'client',
    displayName: 'Test Client'
  },
  
  // Sample agent accounts
  SAMPLE_AGENTS: [
    {
      email: 'sarah.johnson@assiduousrealty.com',
      password: 'test123',
      role: 'agent',
      displayName: 'Sarah Johnson',
      licenseNumber: 'RE-2025-001'
    },
    {
      email: 'mike.thompson@assiduousrealty.com',
      password: 'test123',
      role: 'agent',
      displayName: 'Mike Thompson',
      licenseNumber: 'RE-2025-002'
    },
    {
      email: 'lisa.anderson@assiduousrealty.com',
      password: 'test123',
      role: 'agent',
      displayName: 'Lisa Anderson',
      licenseNumber: 'RE-2025-003'
    }
  ],
  
  // Sample client accounts
  SAMPLE_CLIENTS: [
    {
      email: 'john.doe@assiduousrealty.com',
      password: 'test123',
      role: 'client',
      displayName: 'John Doe'
    },
    {
      email: 'jane.smith@assiduousrealty.com',
      password: 'test123',
      role: 'client',
      displayName: 'Jane Smith'
    },
    {
      email: 'robert.brown@assiduousrealty.com',
      password: 'test123',
      role: 'client',
      displayName: 'Robert Brown'
    }
  ],
  
  // Password rules
  PASSWORD_RULES: {
    ADMIN: 'admin123',    // Admin accounts use admin123
    DEFAULT: 'test123',   // All other accounts use test123
    MIN_LENGTH: 6,
    REQUIRE_SPECIAL: false  // For test accounts only
  },
  
  // Helper function to get password by role
  getPasswordForRole: function(role) {
    return role === 'admin' ? this.PASSWORD_RULES.ADMIN : this.PASSWORD_RULES.DEFAULT;
  },
  
  // Helper function to get credentials by email
  getCredentialsByEmail: function(email) {
    // Check primary accounts
    for (const key in this) {
      if (typeof this[key] === 'object' && this[key].email === email) {
        return this[key];
      }
    }
    
    // Check sample accounts
    const allSamples = [...this.SAMPLE_AGENTS, ...this.SAMPLE_CLIENTS];
    return allSamples.find(account => account.email === email);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEST_CREDENTIALS;
}

// Also make available globally in browser
if (typeof window !== 'undefined') {
  window.TEST_CREDENTIALS = TEST_CREDENTIALS;
}