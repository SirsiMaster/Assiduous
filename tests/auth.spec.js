/**
 * Automated Authentication Tests for Assiduous
 * Uses Playwright for end-to-end browser testing
 * 
 * Run: npm run test:auth
 */

const { test, expect } = require('@playwright/test');
const { config } = require('dotenv');
const { readFileSync } = require('fs');

// Load test credentials
config({ path: '.env.test' });

const BASE_URL = 'https://assiduous-prod.web.app';
const LOGIN_URL = `${BASE_URL}/#login`; // Use modal on home page

// Test credentials
const CREDENTIALS = {
  admin: {
    email: 'admin@assiduousrealty.com',
    password: process.env.ADMIN_REALTY_PASSWORD,
    expectedDashboard: '/admin/dashboard.html',
    role: 'admin'
  },
  agent: {
    email: 'agent@assiduousrealty.com',
    password: process.env.AGENT_REALTY_PASSWORD,
    expectedDashboard: '/agent/dashboard.html',
    role: 'agent'
  },
  client: {
    email: 'client@assiduousrealty.com',
    password: process.env.CLIENT_REALTY_PASSWORD,
    expectedDashboard: '/client/dashboard.html',
    role: 'client'
  }
};

// Helper function to wait for Firebase to be ready
async function waitForFirebaseReady(page) {
  await page.waitForFunction(() => {
    return typeof window.AuthService !== 'undefined';
  }, { timeout: 15000 });
}

// Helper function to clear Firebase auth state
async function clearAuthState(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

// Helper function to login
async function login(page, email, password) {
  // Go to login URL
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  
  // Wait for Firebase to be ready (up to 20 seconds for production)
  await page.waitForFunction(() => {
    return window.AuthService !== undefined;
  }, { timeout: 20000 });
  
  // Wait for modal to be visible
  await page.waitForSelector('#loginModal', { state: 'visible', timeout: 15000 });
  
  // Fill in credentials
  await page.locator('#loginEmail').fill(email);
  await page.locator('#loginPassword').fill(password);
  
  // Submit form
  await page.locator('#loginForm button[type="submit"]').click();
  
  // Wait for redirect (Firebase does this immediately)
  await page.waitForURL(/\/(admin|agent|client)\//, { timeout: 20000 });
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 20000 });
}

// Helper function to logout
async function logout(page) {
  try {
    // Find and click logout button (try multiple selectors)
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out"), #logoutBtn').first();
    await logoutButton.click({ timeout: 5000 });
    
    // Wait for redirect to login page (hash-based)
    await page.waitForURL(/#login/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');
  } catch (error) {
    // If logout button not found, manually clear auth and navigate
    await context.clearCookies();
    // Cleared by context
  }
}

// Helper function to check console errors
async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe('Step 12.3: Admin Login Flow', () => {
  
  test.beforeEach(async ({ context }) => {
    // Clear all cookies and storage between tests
    await context.clearCookies();
  });
  
  test('TC-01: Admin Login Success', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    
    // Verify redirect to admin dashboard
    await expect(page).toHaveURL(new RegExp(`${CREDENTIALS.admin.expectedDashboard}`));
    
    // Verify no console errors
    expect(errors).toHaveLength(0);
    
    // Verify admin header displays email
    const emailDisplay = page.locator('text=' + CREDENTIALS.admin.email);
    await expect(emailDisplay).toBeVisible();
  });
  
  test('TC-02: Admin Dashboard Access', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-page="dashboard"], .dashboard-container', { timeout: 10000 });
    
    // Check for metrics
    const metrics = page.locator('.metric, .stat-card, .dashboard-stat');
    await expect(metrics.first()).toBeVisible();
    
    // Verify page title
    await expect(page).toHaveTitle(/Dashboard|Admin/i);
  });
  
  test('TC-03: Admin Logout', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    
    // Logout
    await logout(page);
    
    // Verify redirect to login
    await expect(page).toHaveURL(new RegExp('/login.html'));
    
    // Try to access dashboard directly
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    
    // Should redirect back to login
    await expect(page).toHaveURL(new RegExp('/login.html'));
  });
});

test.describe('Step 12.4: Agent Login Flow', () => {
  
  test.beforeEach(async ({ context }) => {
    // Cleared by context
    await context.clearCookies();
  });
  
  test('TC-04: Agent Login Success', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await login(page, CREDENTIALS.agent.email, CREDENTIALS.agent.password);
    
    // Verify redirect to agent dashboard
    await expect(page).toHaveURL(new RegExp(`${CREDENTIALS.agent.expectedDashboard}`));
    
    // Verify no console errors
    expect(errors).toHaveLength(0);
  });
  
  test('TC-05: Agent Dashboard Access', async ({ page }) => {
    await login(page, CREDENTIALS.agent.email, CREDENTIALS.agent.password);
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-page="dashboard"], .dashboard-container', { timeout: 10000 });
    
    // Verify agent-specific content
    const agentContent = page.locator('text=/Listings|Properties|Clients|Commissions/i');
    await expect(agentContent.first()).toBeVisible();
  });
  
  test('TC-06: Agent Cannot Access Admin Pages', async ({ page }) => {
    await login(page, CREDENTIALS.agent.email, CREDENTIALS.agent.password);
    
    // Try to access admin dashboard
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    
    // Should redirect away from admin or show error
    const url = page.url();
    expect(url).not.toContain('/admin/dashboard.html');
  });
  
  test('TC-07: Agent Logout', async ({ page }) => {
    await login(page, CREDENTIALS.agent.email, CREDENTIALS.agent.password);
    await logout(page);
    await expect(page).toHaveURL(new RegExp('/login.html'));
  });
});

test.describe('Step 12.5: Client Login Flow', () => {
  
  test.beforeEach(async ({ context }) => {
    // Cleared by context
    await context.clearCookies();
  });
  
  test('TC-08: Client Login Success', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await login(page, CREDENTIALS.client.email, CREDENTIALS.client.password);
    
    // Verify redirect to client dashboard
    await expect(page).toHaveURL(new RegExp(`${CREDENTIALS.client.expectedDashboard}`));
    
    // Verify no console errors
    expect(errors).toHaveLength(0);
  });
  
  test('TC-09: Client Dashboard Access', async ({ page }) => {
    await login(page, CREDENTIALS.client.email, CREDENTIALS.client.password);
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-page="dashboard"], .dashboard-container', { timeout: 10000 });
    
    // Verify client-specific content
    const clientContent = page.locator('text=/Properties|Saved|Search|Viewings/i');
    await expect(clientContent.first()).toBeVisible();
  });
  
  test('TC-10: Client Cannot Access Admin/Agent Pages', async ({ page }) => {
    await login(page, CREDENTIALS.client.email, CREDENTIALS.client.password);
    
    // Try admin page
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/admin/dashboard.html');
    
    // Try agent page
    await page.goto(`${BASE_URL}/agent/dashboard.html`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/agent/dashboard.html');
  });
  
  test('TC-11: Client Logout', async ({ page }) => {
    await login(page, CREDENTIALS.client.email, CREDENTIALS.client.password);
    await logout(page);
    await expect(page).toHaveURL(new RegExp('/login.html'));
  });
});

test.describe('Step 12.7: Role-Based Access Control', () => {
  
  test.beforeEach(async ({ context }) => {
    // Cleared by context
    await context.clearCookies();
  });
  
  test('TC-16: Admin Full Access', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    
    // Verify access to admin pages
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await expect(page).toHaveURL(new RegExp('/admin/dashboard.html'));
    
    await page.goto(`${BASE_URL}/admin/properties.html`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp('/admin/properties.html'));
  });
  
  test('TC-17: Agent Limited Access', async ({ page }) => {
    await login(page, CREDENTIALS.agent.email, CREDENTIALS.agent.password);
    
    // Verify access to agent pages
    await page.goto(`${BASE_URL}/agent/dashboard.html`);
    await expect(page).toHaveURL(new RegExp('/agent/dashboard.html'));
    
    // Verify NO access to admin pages
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/admin/dashboard.html');
  });
  
  test('TC-18: Client Restricted Access', async ({ page }) => {
    await login(page, CREDENTIALS.client.email, CREDENTIALS.client.password);
    
    // Verify access to client pages
    await page.goto(`${BASE_URL}/client/dashboard.html`);
    await expect(page).toHaveURL(new RegExp('/client/dashboard.html'));
    
    // Verify NO access to admin pages
    await page.goto(`${BASE_URL}/admin/dashboard.html`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/admin/dashboard.html');
    
    // Verify NO access to agent pages
    await page.goto(`${BASE_URL}/agent/dashboard.html`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/agent/dashboard.html');
  });
  
  test('TC-19: Custom Claims Verification', async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    
    // Get custom claims from Firebase
    const claims = await page.evaluate(async () => {
      const user = window.firebase.auth().currentUser;
      if (!user) return null;
      const token = await user.getIdTokenResult();
      return token.claims;
    });
    
    // Verify admin role in claims
    expect(claims).toHaveProperty('role');
    expect(claims.role).toBe('admin');
  });
});

test.describe('Step 12.6: Password Reset Flow', () => {
  
  test('TC-12: Forgot Password Link', async ({ page }) => {
    // Cleared by context
    await page.waitForLoadState('networkidle');
    
    // Click forgot password link
    const forgotLink = page.locator('a[href="/auth/reset-password.html"]');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    
    // Wait for navigation to reset password page
    await page.waitForLoadState('networkidle');
    
    // Verify we're on reset password page
    await expect(page).toHaveURL(/reset-password/);
  });
  
  test.skip('TC-13-15: Password Reset Email Flow', async ({ page }) => {
    // Skipped: Requires email access
    // Manual testing required for:
    // - Email delivery verification
    // - Reset link functionality
    // - Password update confirmation
  });
});
