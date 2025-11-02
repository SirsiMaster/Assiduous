/**
 * Agent Service
 * Handles agent-specific operations: listings, leads, client relationships
 */

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const API_BASE_URL = 'https://us-central1-assiduous-prod.cloudfunctions.net/api';

/**
 * Get agent's own property listings
 * @param {Object} filters - Optional additional filters
 * @returns {Promise<Array>} Agent's properties
 */
export async function getMyListings(filters = {}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("Not signed in");
    }

    const token = await user.getIdToken();
    
    // Build query parameters with agentId filter
    const queryParams = new URLSearchParams({
      agentId: user.uid,
      limit: filters.limit || 100,
      orderBy: filters.orderBy || "updatedAt",
      direction: filters.direction || "desc",
      ...filters
    });

    const response = await fetch(`${API_BASE_URL}/properties?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching agent listings:', error);
    throw error;
  }
}

/**
 * Get agent's assigned leads
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by status
 * @param {number} filters.limit - Number of results
 * @returns {Promise<Array>} Agent's leads
 */
export async function getMyLeads(filters = {}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required to view leads");
    }

    const token = await user.getIdToken();
    
    const queryParams = new URLSearchParams({
      mine: 'true',
      limit: filters.limit || 100,
      ...filters,
    });

    const response = await fetch(`${API_BASE_URL}/leads?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching agent leads:', error);
    throw error;
  }
}

/**
 * Update lead status or details
 * @param {string} leadId - Lead document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Update confirmation
 */
export async function updateLead(leadId, updates) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
}

/**
 * Get agent's client relationships
 * @returns {Promise<Array>} Agent's clients
 */
export async function getMyClients() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/relationships?agentId=${user.uid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If endpoint doesn't exist yet, return empty array
      if (response.status === 404) {
        console.warn('Relationships endpoint not yet implemented');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching agent clients:', error);
    // Return empty array instead of throwing to maintain compatibility
    return [];
  }
}

/**
 * Get agent's commission summary
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Commission data
 */
export async function getCommissionSummary(filters = {}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();
    const queryParams = new URLSearchParams(filters);

    const response = await fetch(`${API_BASE_URL}/transactions?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If endpoint doesn't exist yet, return empty summary
      if (response.status === 404) {
        console.warn('Transactions endpoint not yet implemented');
        return {
          total: 0,
          pending: 0,
          paid: 0,
          transactions: [],
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const transactions = data.data || data;

    // Calculate summary
    const summary = {
      total: 0,
      pending: 0,
      paid: 0,
      transactions,
    };

    transactions.forEach(txn => {
      const amount = txn.commissionAmount || 0;
      summary.total += amount;
      
      if (txn.status === 'closed' || txn.status === 'completed') {
        summary.paid += amount;
      } else {
        summary.pending += amount;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    return {
      total: 0,
      pending: 0,
      paid: 0,
      transactions: [],
    };
  }
}

/**
 * Get agent profile/stats
 * @returns {Promise<Object>} Agent profile data
 */
export async function getAgentProfile() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.user || data;
  } catch (error) {
    console.error('Error fetching agent profile:', error);
    throw error;
  }
}

/**
 * Create a new property listing (agent-only)
 * @param {Object} propertyData - Property information
 * @returns {Promise<Object>} Created property with ID
 */
export async function createListing(propertyData) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...propertyData,
        agentId: user.uid, // Automatically set agent ID
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

/**
 * Update agent's own listing
 * @param {string} propertyId - Property document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Update confirmation
 */
export async function updateListing(propertyId, updates) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
}

/**
 * Get agent statistics
 * @returns {Promise<Object>} Agent stats
 */
export async function getAgentStats() {
  try {
    const [listings, leads, commissions] = await Promise.all([
      getMyListings({ limit: 1000 }),
      getMyLeads({ limit: 1000 }),
      getCommissionSummary(),
    ]);

    return {
      totalListings: listings.length,
      activeListings: listings.filter(p => p.status === 'available').length,
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'new').length,
      assignedLeads: leads.filter(l => l.status === 'assigned').length,
      contactedLeads: leads.filter(l => l.status === 'contacted').length,
      totalCommissions: commissions.total,
      pendingCommissions: commissions.pending,
      paidCommissions: commissions.paid,
    };
  } catch (error) {
    console.error('Error calculating agent stats:', error);
    return {
      totalListings: 0,
      activeListings: 0,
      totalLeads: 0,
      newLeads: 0,
      assignedLeads: 0,
      contactedLeads: 0,
      totalCommissions: 0,
      pendingCommissions: 0,
      paidCommissions: 0,
    };
  }
}

// Export singleton instance
export class AgentService {
  getMyListings = getMyListings;
  getMyLeads = getMyLeads;
  updateLead = updateLead;
  getMyClients = getMyClients;
  getCommissionSummary = getCommissionSummary;
  getAgentProfile = getAgentProfile;
  createListing = createListing;
  updateListing = updateListing;
  getAgentStats = getAgentStats;
}

export const agentService = new AgentService();
