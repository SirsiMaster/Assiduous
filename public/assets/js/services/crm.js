// CRM Service for Assiduous Realty

import AuthService from './auth.js';

// API endpoints
const API_ENDPOINTS = {
    profile: '/api/crm/profile',
    leads: '/api/crm/leads',
    properties: '/api/crm/properties',
    contacts: '/api/crm/contacts',
    tasks: '/api/crm/tasks',
    notifications: '/api/crm/notifications'
};

// CRM Service
const CRMService = {
    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise} API response
     */
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            throw new Error('Authentication required');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            if (response.status === 401) {
                AuthService.logout();
                throw new Error('Session expired. Please login again.');
            }
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }

        return response.json();
    },

    /**
     * Get user profile
     * @returns {Promise} User profile data
     */
    async getProfile() {
        return this.apiRequest(API_ENDPOINTS.profile);
    },

    /**
     * Update user profile
     * @param {Object} profileData - Updated profile data
     * @returns {Promise} Updated profile
     */
    async updateProfile(profileData) {
        return this.apiRequest(API_ENDPOINTS.profile, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    /**
     * Get user's leads
     * @param {Object} filters - Optional filters
     * @returns {Promise} Leads data
     */
    async getLeads(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.apiRequest(`${API_ENDPOINTS.leads}?${queryParams}`);
    },

    /**
     * Add new lead
     * @param {Object} leadData - Lead information
     * @returns {Promise} Created lead
     */
    async addLead(leadData) {
        return this.apiRequest(API_ENDPOINTS.leads, {
            method: 'POST',
            body: JSON.stringify(leadData)
        });
    },

    /**
     * Get user's properties
     * @param {Object} filters - Optional filters
     * @returns {Promise} Properties data
     */
    async getProperties(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.apiRequest(`${API_ENDPOINTS.properties}?${queryParams}`);
    },

    /**
     * Get user's contacts
     * @returns {Promise} Contacts data
     */
    async getContacts() {
        return this.apiRequest(API_ENDPOINTS.contacts);
    },

    /**
     * Add new contact
     * @param {Object} contactData - Contact information
     * @returns {Promise} Created contact
     */
    async addContact(contactData) {
        return this.apiRequest(API_ENDPOINTS.contacts, {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
    },

    /**
     * Get user's tasks
     * @param {Object} filters - Optional filters
     * @returns {Promise} Tasks data
     */
    async getTasks(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.apiRequest(`${API_ENDPOINTS.tasks}?${queryParams}`);
    },

    /**
     * Add new task
     * @param {Object} taskData - Task information
     * @returns {Promise} Created task
     */
    async addTask(taskData) {
        return this.apiRequest(API_ENDPOINTS.tasks, {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },

    /**
     * Get user's notifications
     * @returns {Promise} Notifications data
     */
    async getNotifications() {
        return this.apiRequest(API_ENDPOINTS.notifications);
    },

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     * @returns {Promise} Updated notification
     */
    async markNotificationAsRead(notificationId) {
        return this.apiRequest(`${API_ENDPOINTS.notifications}/${notificationId}`, {
            method: 'PUT',
            body: JSON.stringify({ read: true })
        });
    }
};

export default CRMService;
