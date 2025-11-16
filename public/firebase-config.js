/**
 * Firebase Configuration and Helper Functions
 * For Assiduous Real Estate Platform
 * 
 * This file initializes Firebase services and provides helper functions
 * for authentication, database operations, and real-time updates
 */

// Firebase configuration objects for different environments
const firebaseConfigs = {
    staging: {
        apiKey: "AIzaSyDnMkQbhC5kYl5O_07zQ2yfYvGjLRq6E0c",
        authDomain: "assiduous-staging.firebaseapp.com",
        projectId: "assiduous-staging",
        storageBucket: "assiduous-staging.firebasestorage.app",
        messagingSenderId: "853661742177",
        appId: "1:853661742177:web:cf93349a7f50a2d9f2e620"
    },
    production: {
        apiKey: "AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE",
        authDomain: "assiduous-prod.firebaseapp.com",
        projectId: "assiduous-prod",
        storageBucket: "assiduous-prod.firebasestorage.app",
        messagingSenderId: "9355377564",
        appId: "1:9355377564:web:cee09f952eea43976ee659",
        measurementId: "G-DVBZP21459",
        databaseURL: "https://assiduous-prod-default-rtdb.firebaseio.com"
    }
};

// Auto-detect environment based on hostname
const isStaging = window.location.hostname.includes('staging');
const currentEnv = isStaging ? 'staging' : 'production';
const firebaseConfig = firebaseConfigs[currentEnv];

console.log(`[Firebase] 🌐 Environment detected: ${currentEnv}`);
console.log(`[Firebase] 📍 Project: ${firebaseConfig.projectId}`);

// Make available globally
window.firebaseConfig = firebaseConfig;

// Initialize Firebase (will be done when SDK is loaded)
let app, auth, db, storage, analytics;

// Initialize Firebase services when SDK is loaded
function initializeFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.error('[Firebase] ❌ SDK not loaded. Please include Firebase scripts.');
            return false;
        }

        // Initialize app
        app = firebase.initializeApp(firebaseConfig);
        console.log('[Firebase] ✓ App initialized');
        
        // Initialize services
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Initialize storage only if SDK is loaded
        if (firebase.storage) {
            storage = firebase.storage();
            window.firebaseStorage = storage;
        }
        
        // Export to window immediately
        window.firebaseApp = app;
        window.firebaseAuth = auth;
        window.firebaseDb = db;
        
        console.log('[Firebase] ✓ Services initialized (auth, db' + (storage ? ', storage' : '') + ')');
        
        // Initialize Analytics if available
        if (firebase.analytics) {
            analytics = firebase.analytics();
            window.firebaseAnalytics = analytics;
        }
        
        // Enable offline persistence for Firestore
        db.enablePersistence({ synchronizeTabs: true })
            .then(() => console.log('[Firebase] ✓ Offline persistence enabled'))
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn('[Firebase] Multiple tabs open, persistence enabled in first tab only');
                } else if (err.code == 'unimplemented') {
                    console.warn('[Firebase] Browser doesn\'t support offline persistence');
                }
            });
        
        // Dispatch firebase-ready event for dependent scripts
        window.dispatchEvent(new CustomEvent('firebase-ready', {
            detail: { app, auth, db, storage, analytics }
        }));
        
        console.log('[Firebase] 🚀 All services ready and exported to window');
        return true;
        
    } catch (error) {
        console.error('[Firebase] ❌ Initialization error:', error);
        return false;
    }
}

// Authentication Functions
const AuthService = {
    // Get current user
    getCurrentUser() {
        return auth ? auth.currentUser : null;
    },
    
    // Check if user is authenticated
    async checkAuth() {
        return new Promise((resolve) => {
            if (!auth) {
                resolve(null);
                return;
            }
            
            const unsubscribe = auth.onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            });
        });
    },
    
    // Sign in with email and password
    async signIn(email, password) {
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Sign up new user
    async signUp(email, password, userData) {
        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update user profile
            if (userData.displayName) {
                await result.user.updateProfile({
                    displayName: userData.displayName
                });
            }
            
            // Store additional user data in Firestore
            await db.collection('users').doc(result.user.uid).set({
                email: email,
                displayName: userData.displayName || '',
                role: userData.role || 'client',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...userData
            });
            
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Sign out
    async signOut() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get user role
    async getUserRole(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            return doc.exists ? doc.data().role : null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }
};

// Database Helper Functions
const DatabaseService = {
    // Collections
    collections: {
        USERS: 'users',
        LISTINGS: 'listings',
        LEADS: 'leads',
        CLIENTS: 'clients',
        EVENTS: 'events',
        TRANSACTIONS: 'transactions',
        COMMISSIONS: 'commissions'
    },
    
    // Get agent's listings
    async getAgentListings(agentId, status = null) {
        try {
            let query = db.collection(this.collections.LISTINGS)
                .where('agentId', '==', agentId);
            
            if (status) {
                query = query.where('status', '==', status);
            }
            
            const snapshot = await query.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting agent listings:', error);
            return [];
        }
    },
    
    // Get agent's leads
    async getAgentLeads(agentId) {
        try {
            const snapshot = await db.collection(this.collections.LEADS)
                .where('agentId', '==', agentId)
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting agent leads:', error);
            return [];
        }
    },
    
    // Get agent's clients
    async getAgentClients(agentId) {
        try {
            const snapshot = await db.collection(this.collections.CLIENTS)
                .where('agentId', '==', agentId)
                .orderBy('name')
                .get();
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting agent clients:', error);
            return [];
        }
    },
    
    // Get agent's schedule events
    async getAgentEvents(agentId, startDate, endDate) {
        try {
            let query = db.collection(this.collections.EVENTS)
                .where('agentId', '==', agentId);
            
            if (startDate) {
                query = query.where('date', '>=', startDate);
            }
            if (endDate) {
                query = query.where('date', '<=', endDate);
            }
            
            const snapshot = await query.orderBy('date').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting agent events:', error);
            return [];
        }
    },
    
    // Calculate agent's commission
    async calculateAgentCommission(agentId, year = new Date().getFullYear()) {
        try {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            
            const snapshot = await db.collection(this.collections.COMMISSIONS)
                .where('agentId', '==', agentId)
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .get();
            
            let total = 0;
            snapshot.docs.forEach(doc => {
                total += doc.data().amount || 0;
            });
            
            return total;
        } catch (error) {
            console.error('Error calculating commission:', error);
            return 0;
        }
    },
    
    // Real-time listeners
    subscribeToListings(agentId, callback) {
        return db.collection(this.collections.LISTINGS)
            .where('agentId', '==', agentId)
            .onSnapshot(snapshot => {
                const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(listings);
            });
    },
    
    subscribeToLeads(agentId, callback) {
        return db.collection(this.collections.LEADS)
            .where('agentId', '==', agentId)
            .onSnapshot(snapshot => {
                const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(leads);
            });
    }
};

// Statistics Helper Functions
const StatsService = {
    // Get dashboard statistics for agent
    async getAgentStats(agentId) {
        try {
            const [listings, leads, clients, commission] = await Promise.all([
                DatabaseService.getAgentListings(agentId, 'active'),
                DatabaseService.getAgentLeads(agentId),
                DatabaseService.getAgentClients(agentId),
                DatabaseService.calculateAgentCommission(agentId)
            ]);
            
            return {
                activeListings: listings.length,
                totalLeads: leads.length,
                newLeads: leads.filter(l => {
                    const created = l.createdAt?.toDate?.() || new Date(l.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return created > weekAgo;
                }).length,
                activeClients: clients.filter(c => c.status === 'active').length,
                commissionYTD: commission
            };
        } catch (error) {
            console.error('Error getting agent stats:', error);
            return {
                activeListings: 0,
                totalLeads: 0,
                newLeads: 0,
                activeClients: 0,
                commissionYTD: 0
            };
        }
    }
};

// Utility Functions
const Utils = {
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },
    
    // Format date
    formatDate(date) {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    },
    
    // Format time
    formatTime(date) {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    },
    
    // Get relative time
    getRelativeTime(date) {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000); // seconds
        
        if (diff < 60) return 'just now';
        if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
        if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
        if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
        return this.formatDate(date);
    }
};

// Auto-initialize when DOM is ready and Firebase SDK is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Give Firebase SDK a moment to fully load
        setTimeout(initializeFirebase, 100);
    });
} else {
    // Give Firebase SDK a moment to fully load
    setTimeout(initializeFirebase, 100);
}

// Export for use in other scripts
const FirebaseServices = {
    auth: AuthService,
    db: DatabaseService,
    stats: StatsService,
    utils: Utils,
    initialize: initializeFirebase
};

// Make available globally
window.FirebaseServices = FirebaseServices;

// Shorthand functions for common operations
window.checkAuth = AuthService.checkAuth;
window.signOut = AuthService.signOut;