/**
 * Billing Service - Stripe subscription management
 * Day 4: Agent subscription billing
 */

const API_BASE = 'https://us-central1-assiduous-prod.cloudfunctions.net/app/api/v1';

/**
 * Get authentication token
 */
async function getAuthToken() {
  try {
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Not authenticated');
    }
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Auth token error:', error);
    throw error;
  }
}

/**
 * Start agent subscription checkout
 * Redirects to Stripe Checkout page
 */
export async function startAgentSubscription() {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to start checkout');
    }

    const { url } = await res.json();
    
    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Subscription error:', error);
    throw error;
  }
}

/**
 * Get current billing status
 */
export async function getBillingStatus() {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/billing/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to get billing status');
    }

    return await res.json();
  } catch (error) {
    console.error('Billing status error:', error);
    throw error;
  }
}

/**
 * Create Stripe Customer Portal session (for managing subscription)
 * Note: This requires additional Stripe setup, placeholder for now
 */
export async function openCustomerPortal() {
  try {
    const billing = await getBillingStatus();
    if (!billing.customerId) {
      throw new Error('No active subscription');
    }
    
    // TODO: Implement customer portal endpoint in Cloud Functions
    alert('Customer portal coming soon. Contact support to manage your subscription.');
  } catch (error) {
    console.error('Customer portal error:', error);
    throw error;
  }
}

/**
 * Handle successful subscription (call after redirect from Stripe)
 */
export function handleSubscriptionSuccess(sessionId) {
  console.log('Subscription successful, session:', sessionId);
  // Display success message
  return {
    success: true,
    sessionId
  };
}

/**
 * Handle canceled subscription attempt
 */
export function handleSubscriptionCanceled() {
  console.log('Subscription canceled by user');
  return {
    success: false,
    canceled: true
  };
}
