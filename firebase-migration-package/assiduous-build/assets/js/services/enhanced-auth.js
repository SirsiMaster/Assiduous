/**
 * Enhanced Authentication Service
 * Supports registration with email (required) + username (optional) + auto-generated accountId
 * Supports login with email, username, OR accountId
 */

class EnhancedAuth {
    constructor() {
        this.auth = null;
        this.db = null;
        this.idGenerator = null;
    }

    /**
     * Initialize the enhanced auth service
     * @param {object} firebaseAuth - Firebase Auth instance
     * @param {object} firestore - Firebase Firestore instance
     * @param {object} idGen - ID Generator instance
     */
    initialize(firebaseAuth, firestore, idGen) {
        this.auth = firebaseAuth;
        this.db = firestore;
        this.idGenerator = idGen;
    }

    /**
     * Register a new user
     * @param {object} userData - User registration data
     * @param {string} userData.email - Email address (REQUIRED)
     * @param {string} userData.password - Password (REQUIRED)
     * @param {string} [userData.username] - Username (OPTIONAL)
     * @param {string} [userData.firstName] - First name
     * @param {string} [userData.lastName] - Last name
     * @param {string} [userData.phone] - Phone number
     * @param {string} [userData.role='client'] - User role
     * @returns {Promise<object>} Created user data with uid and accountId
     */
    async register(userData) {
        const { email, password, username, firstName, lastName, phone, role = 'client' } = userData;

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Validate username if provided
        if (username) {
            await this.validateUsername(username);
        }

        try {
            // 1. Create Firebase Auth account
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // 2. Generate unique account ID
            const accountId = await this.idGenerator.generateAccountId();

            // 3. Reserve username if provided
            if (username) {
                await this.reserveUsername(username, uid, accountId);
            }

            // 4. Create accountId lookup
            await this.db.collection('accountIds').doc(accountId).set({
                accountId: accountId,
                uid: uid,
                email: email.toLowerCase(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 5. Create user profile document
            const userProfile = {
                uid: uid,
                accountId: accountId,
                email: email.toLowerCase(),
                username: username ? username.toLowerCase() : null,
                firstName: firstName || null,
                lastName: lastName || null,
                phone: phone || null,
                role: role,
                
                // Metadata
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: false,
                accountStatus: 'active',
                
                // Settings
                preferences: {
                    notifications: true,
                    emailNotifications: true
                }
            };

            await this.db.collection('users').doc(uid).set(userProfile);

            // 6. Send email verification
            try {
                await userCredential.user.sendEmailVerification();
            } catch (error) {
                console.warn('Failed to send verification email:', error);
            }

            return {
                uid: uid,
                accountId: accountId,
                email: email,
                username: username || null
            };

        } catch (error) {
            console.error('Registration error:', error);
            
            // Clean up on failure
            try {
                if (username) {
                    await this.db.collection('usernames').doc(username.toLowerCase()).delete();
                }
            } catch (cleanupError) {
                console.warn('Cleanup failed:', cleanupError);
            }

            throw new Error(this.getErrorMessage(error));
        }
    }

    /**
     * Login with email, username, or account ID
     * @param {string} identifier - Email, username, or account ID
     * @param {string} password - Password
     * @returns {Promise<object>} User credential
     */
    async login(identifier, password) {
        if (!identifier || !password) {
            throw new Error('Identifier and password are required');
        }

        try {
            let email = identifier;

            // If not an email, look up the email
            if (!identifier.includes('@')) {
                email = await this.getEmailFromIdentifier(identifier);
                
                if (!email) {
                    throw new Error('Invalid username or account ID');
                }
            }

            // Sign in with email
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);

            // Update last login
            try {
                await this.db.collection('users').doc(userCredential.user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.warn('Failed to update last login:', error);
            }

            return userCredential;

        } catch (error) {
            console.error('Login error:', error);
            throw new Error(this.getErrorMessage(error));
        }
    }

    /**
     * Get email from username or account ID
     * @param {string} identifier - Username or account ID
     * @returns {Promise<string|null>} Email address or null if not found
     */
    async getEmailFromIdentifier(identifier) {
        const cleanIdentifier = identifier.trim();

        // Check if it's an account ID (format: ACCT-YYYY-NNNNNN)
        if (cleanIdentifier.match(/^ACCT-\d{4}-\d{6}$/)) {
            const doc = await this.db.collection('accountIds').doc(cleanIdentifier).get();
            if (doc.exists) {
                return doc.data().email;
            }
            return null;
        }

        // Otherwise, treat as username
        const doc = await this.db.collection('usernames').doc(cleanIdentifier.toLowerCase()).get();
        if (doc.exists) {
            return doc.data().email;
        }

        return null;
    }

    /**
     * Validate username availability and format
     * @param {string} username - Username to validate
     * @returns {Promise<void>}
     * @throws {Error} If username is invalid or taken
     */
    async validateUsername(username) {
        if (!username || username.length < 3) {
            throw new Error('Username must be at least 3 characters');
        }

        if (username.length > 30) {
            throw new Error('Username must be less than 30 characters');
        }

        // Only allow alphanumeric, underscore, and hyphen
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
        }

        // Check if username is taken
        const doc = await this.db.collection('usernames').doc(username.toLowerCase()).get();
        if (doc.exists) {
            throw new Error('Username is already taken');
        }
    }

    /**
     * Reserve a username for a user
     * @param {string} username - Username to reserve
     * @param {string} uid - User's Firebase UID
     * @param {string} accountId - User's account ID
     * @returns {Promise<void>}
     */
    async reserveUsername(username, uid, accountId) {
        await this.db.collection('usernames').doc(username.toLowerCase()).set({
            username: username.toLowerCase(),
            originalUsername: username,
            uid: uid,
            accountId: accountId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Get user profile by UID
     * @param {string} uid - Firebase UID
     * @returns {Promise<object>} User profile
     */
    async getUserProfile(uid) {
        const doc = await this.db.collection('users').doc(uid).get();
        if (!doc.exists) {
            throw new Error('User profile not found');
        }
        return doc.data();
    }

    /**
     * Get user profile by account ID
     * @param {string} accountId - Account ID
     * @returns {Promise<object>} User profile
     */
    async getUserByAccountId(accountId) {
        const doc = await this.db.collection('accountIds').doc(accountId).get();
        if (!doc.exists) {
            throw new Error('Account not found');
        }
        const uid = doc.data().uid;
        return this.getUserProfile(uid);
    }

    /**
     * Get user profile by username
     * @param {string} username - Username
     * @returns {Promise<object>} User profile
     */
    async getUserByUsername(username) {
        const doc = await this.db.collection('usernames').doc(username.toLowerCase()).get();
        if (!doc.exists) {
            throw new Error('User not found');
        }
        const uid = doc.data().uid;
        return this.getUserProfile(uid);
    }

    /**
     * Update user profile
     * @param {string} uid - Firebase UID
     * @param {object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateProfile(uid, updates) {
        // Don't allow updating critical fields
        const forbidden = ['uid', 'accountId', 'email', 'createdAt'];
        forbidden.forEach(field => delete updates[field]);

        await this.db.collection('users').doc(uid).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Get user-friendly error message
     * @param {Error} error - Firebase error
     * @returns {string} User-friendly error message
     */
    getErrorMessage(error) {
        const errorMap = {
            'auth/email-already-in-use': 'This email is already registered',
            'auth/invalid-email': 'Invalid email address',
            'auth/weak-password': 'Password should be at least 6 characters',
            'auth/user-not-found': 'Invalid email or password',
            'auth/wrong-password': 'Invalid email or password',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your connection',
        };

        return errorMap[error.code] || error.message || 'An error occurred';
    }

    /**
     * Sign out current user
     * @returns {Promise<void>}
     */
    async logout() {
        await this.auth.signOut();
    }

    /**
     * Get current user
     * @returns {object|null} Current Firebase user
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }

    /**
     * Check if username exists
     * @param {string} username - Username to check
     * @returns {Promise<boolean>} True if exists
     */
    async usernameExists(username) {
        const doc = await this.db.collection('usernames').doc(username.toLowerCase()).get();
        return doc.exists;
    }
}

// Export singleton instance
const enhancedAuth = new EnhancedAuth();

// Wait for Firebase to be ready before auto-initializing
if (typeof window !== 'undefined') {
    // Try immediate initialization if Firebase is already loaded
    const tryInit = () => {
        if (typeof firebase !== 'undefined' && 
            firebase.auth && 
            firebase.firestore && 
            typeof idGenerator !== 'undefined') {
            try {
                enhancedAuth.initialize(firebase.auth(), firebase.firestore(), idGenerator);
                console.log('[EnhancedAuth] ✓ Initialized successfully');
                return true;
            } catch (error) {
                console.warn('[EnhancedAuth] Initialization failed:', error);
                return false;
            }
        }
        return false;
    };
    
    // Listen for firebase-ready event
    window.addEventListener('firebase-ready', tryInit);
    
    // Also try after a delay in case firebase-ready was already fired
    setTimeout(() => {
        if (!enhancedAuth.auth) {
            tryInit();
        }
    }, 500);
}
