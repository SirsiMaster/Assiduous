/**
 * Lead Service
 * Handles lead submission (property inquiries) to Cloud Functions API
 */

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const API_BASE_URL = 'https://us-central1-assiduous-prod.cloudfunctions.net/api';

/**
 * Submit a lead/inquiry for a property
 * Can be called by authenticated or unauthenticated users
 * @param {Object} leadData - Lead information
 * @param {string} leadData.propertyId - Property document ID
 * @param {string} leadData.name - Contact name
 * @param {string} leadData.email - Contact email
 * @param {string} leadData.phone - Contact phone (optional)
 * @param {string} leadData.message - Inquiry message (optional)
 * @returns {Promise<Object>} Created lead with ID
 */
export async function submitLead(leadData) {
  try {
    // Validate required fields
    if (!leadData.propertyId || !leadData.name || !leadData.email) {
      throw new Error("Missing required fields: propertyId, name, and email are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      throw new Error("Invalid email format");
    }

    // Get current user if authenticated
    const auth = getAuth();
    const user = auth.currentUser;

    const payload = {
      propertyId: leadData.propertyId,
      name: leadData.name.trim(),
      email: leadData.email.trim().toLowerCase(),
      phone: leadData.phone ? leadData.phone.trim() : "",
      message: leadData.message ? leadData.message.trim() : "",
      clientId: user ? user.uid : null,
    };

    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Lead submitted successfully:", result);
    return result;
  } catch (error) {
    console.error('Error submitting lead:', error);
    throw error;
  }
}

/**
 * Get leads for authenticated agent
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by status (new, assigned, contacted, etc.)
 * @param {number} filters.limit - Number of results
 * @returns {Promise<Array>} Array of leads
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
    console.error('Error fetching leads:', error);
    throw error;
  }
}

/**
 * Get all leads (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of all leads
 */
export async function getAllLeads(filters = {}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();
    const queryParams = new URLSearchParams(filters);

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
    console.error('Error fetching all leads:', error);
    throw error;
  }
}

/**
 * Update lead status (agent/admin only)
 * @param {string} leadId - Lead document ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Update confirmation
 */
export async function updateLeadStatus(leadId, status) {
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
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
}

/**
 * Auto-assign lead to agent (admin only)
 * @param {string} leadId - Lead document ID
 * @returns {Promise<Object>} Assignment result
 */
export async function autoAssignLead(leadId) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/assign:auto`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error auto-assigning lead:', error);
    throw error;
  }
}

/**
 * Manually assign lead to specific agent (admin only)
 * @param {string} leadId - Lead document ID
 * @param {string} agentId - Agent user ID
 * @returns {Promise<Object>} Assignment result
 */
export async function manualAssignLead(leadId, agentId) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/assign:manual`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error manually assigning lead:', error);
    throw error;
  }
}

// Export singleton instance
export class LeadService {
  submitLead = submitLead;
  getMyLeads = getMyLeads;
  getAllLeads = getAllLeads;
  updateLeadStatus = updateLeadStatus;
  autoAssignLead = autoAssignLead;
  manualAssignLead = manualAssignLead;
}

export const leadService = new LeadService();
