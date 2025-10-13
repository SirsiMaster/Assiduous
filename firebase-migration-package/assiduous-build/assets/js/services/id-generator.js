/**
 * ID Generator Service
 * Generates unique IDs for all objects in the system
 * Format: TYPE-YEAR-SEQUENCE (e.g., ACCT-2024-001234)
 */

class IDGenerator {
    constructor() {
        this.db = null;
        this.countersCollection = null;
    }

    /**
     * Initialize the ID generator with Firestore instance
     * @param {object} firestore - Firebase Firestore instance
     */
    initialize(firestore) {
        this.db = firestore;
        this.countersCollection = this.db.collection('_id_counters');
    }

    /**
     * Generate a new unique ID for the specified type
     * @param {string} type - Type prefix (ACCT, PROP, TRAN, MSG, etc.)
     * @returns {Promise<string>} Generated ID (e.g., ACCT-2024-001234)
     */
    async generateId(type) {
        if (!this.db) {
            throw new Error('IDGenerator not initialized. Call initialize() first.');
        }

        const year = new Date().getFullYear();
        const counterKey = `${type.toUpperCase()}_${year}`;
        const counterDoc = this.countersCollection.doc(counterKey);

        // Use transaction to ensure atomic increment
        try {
            const sequence = await this.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(counterDoc);
                
                let nextSequence = 1;
                if (doc.exists) {
                    const data = doc.data();
                    nextSequence = (data.current || 0) + 1;
                    transaction.update(counterDoc, {
                        current: nextSequence,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // First time for this type+year combo
                    transaction.set(counterDoc, {
                        type: type.toUpperCase(),
                        year: year,
                        current: 1,
                        created: firebase.firestore.FieldValue.serverTimestamp(),
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                return nextSequence;
            });

            // Format: TYPE-YEAR-SEQUENCE (padded to 6 digits)
            const paddedSequence = sequence.toString().padStart(6, '0');
            return `${type.toUpperCase()}-${year}-${paddedSequence}`;
        } catch (error) {
            console.error('Error generating ID:', error);
            throw new Error(`Failed to generate ${type} ID: ${error.message}`);
        }
    }

    /**
     * Generate an account ID
     * @returns {Promise<string>} e.g., ACCT-2024-001234
     */
    async generateAccountId() {
        return this.generateId('ACCT');
    }

    /**
     * Generate a property ID
     * @returns {Promise<string>} e.g., PROP-2024-001234
     */
    async generatePropertyId() {
        return this.generateId('PROP');
    }

    /**
     * Generate a transaction ID
     * @returns {Promise<string>} e.g., TRAN-2024-001234
     */
    async generateTransactionId() {
        return this.generateId('TRAN');
    }

    /**
     * Generate a message ID
     * @returns {Promise<string>} e.g., MSG-2024-001234
     */
    async generateMessageId() {
        return this.generateId('MSG');
    }

    /**
     * Generate a notification ID
     * @returns {Promise<string>} e.g., NOTIF-2024-001234
     */
    async generateNotificationId() {
        return this.generateId('NOTIF');
    }

    /**
     * Parse an ID to extract its components
     * @param {string} id - The ID to parse
     * @returns {object} Parsed components or null if invalid
     */
    parseId(id) {
        const regex = /^([A-Z]+)-(\d{4})-(\d{6})$/;
        const match = id.match(regex);
        
        if (!match) {
            return null;
        }
        
        return {
            type: match[1],
            year: parseInt(match[2]),
            sequence: parseInt(match[3]),
            original: id
        };
    }

    /**
     * Validate an ID format
     * @param {string} id - The ID to validate
     * @returns {boolean} True if valid format
     */
    isValidId(id) {
        return this.parseId(id) !== null;
    }
}

// Export singleton instance
const idGenerator = new IDGenerator();

// Wait for Firebase to be ready before auto-initializing
if (typeof window !== 'undefined') {
    // Try immediate initialization if Firebase is already loaded
    const tryInit = () => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                idGenerator.initialize(firebase.firestore());
                console.log('[IDGenerator] ✓ Initialized successfully');
                return true;
            } catch (error) {
                console.warn('[IDGenerator] Initialization failed:', error);
                return false;
            }
        }
        return false;
    };
    
    // Listen for firebase-ready event
    window.addEventListener('firebase-ready', tryInit);
    
    // Also try after a delay in case firebase-ready was already fired
    setTimeout(() => {
        if (!idGenerator.db) {
            tryInit();
        }
    }, 500);
}
