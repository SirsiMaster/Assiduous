/**
 * Agent Property Management Service
 * 
 * Provides easy-to-use methods for agents to manage their property listings
 * Uses Firebase Cloud Functions for secure, authenticated operations
 * 
 * Usage:
 *   const service = new AgentPropertyService();
 *   await service.createProperty(propertyData);
 *   await service.updateProperty(propertyId, updates);
 *   await service.deleteProperty(propertyId);
 *   const properties = await service.getMyProperties();
 */

class AgentPropertyService {
    constructor() {
        this.functions = null;
        this.auth = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Firebase connection
     */
    async initialize() {
        // Wait for Firebase to be ready
        if (window.Firebase && window.Firebase.functions) {
            this.functions = window.Firebase.functions;
            this.auth = window.Firebase.auth;
            this.isInitialized = true;
            console.log('✅ AgentPropertyService initialized');
            return true;
        }

        // Wait for firebase-ready event
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Firebase initialization timeout'));
            }, 10000);

            window.addEventListener('firebase-ready', () => {
                clearTimeout(timeout);
                this.functions = window.Firebase.functions;
                this.auth = window.Firebase.auth;
                this.isInitialized = true;
                console.log('✅ AgentPropertyService initialized');
                resolve(true);
            }, { once: true });
        });
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.auth && this.auth.currentUser !== null;
    }

    /**
     * Create a new property listing
     * @param {Object} propertyData - Property details
     * @returns {Promise<{success: boolean, propertyId?: string, error?: string}>}
     */
    async createProperty(propertyData) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        if (!this.isAuthenticated()) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const createPropertyFn = firebase.functions().httpsCallable('createProperty');
            const result = await createPropertyFn(propertyData);
            
            console.log('✅ Property created:', result.data.propertyId);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error creating property:', error);
            return {
                success: false,
                error: error.message || 'Failed to create property'
            };
        }
    }

    /**
     * Update an existing property
     * @param {string} propertyId - Property ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateProperty(propertyId, updates) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        if (!this.isAuthenticated()) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const updatePropertyFn = firebase.functions().httpsCallable('updateProperty');
            const result = await updatePropertyFn({ propertyId, updates });
            
            console.log('✅ Property updated:', propertyId);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error updating property:', error);
            return {
                success: false,
                error: error.message || 'Failed to update property'
            };
        }
    }

    /**
     * Delete a property
     * @param {string} propertyId - Property ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteProperty(propertyId) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        if (!this.isAuthenticated()) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const deletePropertyFn = firebase.functions().httpsCallable('deleteProperty');
            const result = await deletePropertyFn({ propertyId });
            
            console.log('✅ Property deleted:', propertyId);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error deleting property:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete property'
            };
        }
    }

    /**
     * Get agent's properties
     * @param {Object} options - Query options {status, limit}
     * @returns {Promise<{success: boolean, properties?: Array, error?: string}>}
     */
    async getMyProperties(options = {}) {
        if (!this.isInitialized) {
            return { success: false, error: 'Service not initialized' };
        }

        if (!this.isAuthenticated()) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const getAgentPropertiesFn = firebase.functions().httpsCallable('getAgentProperties');
            const result = await getAgentPropertiesFn(options);
            
            console.log(`✅ Fetched ${result.data.properties.length} properties`);
            return result.data;
            
        } catch (error) {
            console.error('❌ Error getting properties:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch properties'
            };
        }
    }

    /**
     * Subscribe to real-time updates for agent's properties
     * @param {Function} callback - Called when properties change
     * @returns {Function} Unsubscribe function
     */
    subscribeToMyProperties(callback) {
        if (!this.isAuthenticated()) {
            console.error('User not authenticated');
            return () => {};
        }

        const db = firebase.firestore();
        const userId = this.auth.currentUser.uid;

        return db.collection('properties')
            .where('agentId', '==', userId)
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const properties = [];
                    snapshot.forEach(doc => {
                        properties.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    callback(properties);
                },
                (error) => {
                    console.error('❌ Error in real-time subscription:', error);
                }
            );
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentPropertyService;
}

// Make available globally
window.AgentPropertyService = AgentPropertyService;
