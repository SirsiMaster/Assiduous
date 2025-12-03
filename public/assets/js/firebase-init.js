/**
 * Firebase Modular SDK Initialization
 * AssiduousFlip Real Estate Platform
 *
 * This file provides a clean, modular Firebase initialization
 * that eliminates "firebase is not defined" errors
 */

// Import modular SDK functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  enableIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';
import {
  getAnalytics,
  logEvent,
  isSupported as analyticsIsSupported,
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js';

// Firebase configuration - auto-detect environment
const isStaging = window.location.hostname.includes('staging');
const firebaseConfig = isStaging ? {
  apiKey: 'AIzaSyDnMkQbhC5kYl5O_07zQ2yfYvGjLRq6E0c',
  authDomain: 'assiduous-staging.firebaseapp.com',
  projectId: 'assiduous-staging',
  storageBucket: 'assiduous-staging.firebasestorage.app',
  messagingSenderId: '853661742177',
  appId: '1:853661742177:web:cf93349a7f50a2d9f2e620'
} : {
  // Canonical production web app with GA4 enabled (from firebase apps:sdkconfig)
  apiKey: 'AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE',
  authDomain: 'assiduous-prod.firebaseapp.com',
  projectId: 'assiduous-prod',
  storageBucket: 'assiduous-prod.firebasestorage.app',
  messagingSenderId: '9355377564',
  appId: '1:9355377564:web:cee09f952eea43976ee659',
  measurementId: 'G-DVBZP21459'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
const storage = getStorage(app);
let analytics = null;

// Initialize analytics if in production and not localhost
if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  analyticsIsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((error) => {
    console.warn('Analytics not available:', error.message);
  });
}

// NOTE: Offline persistence via enableIndexedDbPersistence(db) was causing
// long hangs when IndexedDB was disabled or locked by another tab. For now
// we rely on the default in-memory cache to prioritize responsiveness.
// When we migrate to FirestoreSettings.cache with multi-tab support, we can
// reintroduce persistence in a more robust way.

// Set authentication persistence
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error('Failed to set auth persistence:', error);
});

// Connect to emulators in development
if (window.location.hostname === 'localhost') {
  // Uncomment to use emulators
  // connectFunctionsEmulator(functions, 'localhost', 5001);
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

/**
 * Authentication Service
 */
export const AuthService = {
  // Sign up new user
  async signUp(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name if provided
      if (userData.firstName || userData.lastName) {
        const displayName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        await updateProfile(user, { displayName });
      }

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        role: userData.role || 'client',
        phone: userData.phone || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Agent-specific fields
        ...(userData.role === 'agent'
          ? {
              licenseNumber: userData.licenseNumber || '',
              licenseState: userData.licenseState || '',
              brokerageName: userData.brokerageName || '',
              licenseExpiry: userData.licenseExpiry || null,
              status: 'pending', // Agents need approval
            }
          : {
              status: 'active',
            }),
      });

      return { success: true, user, requiresApproval: userData.role === 'agent' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const PROFILE_TIMEOUT_MS = 3000;

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Quick role guess based on canonical test emails to avoid long waits
      let guessedRole = null;
      if (user.email === 'admin@assiduousrealty.com') guessedRole = 'admin';
      if (user.email === 'agent@assiduousrealty.com') guessedRole = 'agent';
      if (user.email === 'client@assiduousrealty.com') guessedRole = 'client';
      if (user.email === 'investor@assiduousrealty.com') guessedRole = 'investor';

      // Get user role from Firestore, but bound latency with a timeout
      let userData = null;
      try {
        const userRef = doc(db, 'users', user.uid);
        const profilePromise = getDoc(userRef).then((snap) => (snap.exists() ? snap.data() : null));
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve(null), PROFILE_TIMEOUT_MS);
        });
        userData = await Promise.race([profilePromise, timeoutPromise]);
      } catch (profileError) {
        console.warn('User profile fetch failed, continuing with guessed role:', profileError);
      }

      const role = userData?.role || guessedRole || 'client';
      const status = userData?.status || 'active';

      // Log successful auth event for audit/debugging (best-effort, non-blocking for caller)
      try {
        addDoc(collection(db, 'auth_events'), {
          uid: user.uid,
          email: user.email,
          role,
          status: 'success',
          source: 'web_landing_modal',
          timestamp: serverTimestamp(),
        }).catch((logError) => {
          console.warn('Failed to log auth event:', logError);
        });
      } catch (logErrorOuter) {
        console.warn('Failed to enqueue auth event log:', logErrorOuter);
      }

      return {
        success: true,
        user,
        role,
        status,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Get user role and data
  async getUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error getting user data:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get redirect URL based on role (environment-aware for local /public dev)
  getRoleRedirect(role, status = 'active') {
    const path = window.location.pathname || '';
    let base = '';
    if (path.startsWith('/public/')) {
      base = '/public';
    } else if (path.startsWith('/assiduousflip/')) {
      base = '/assiduousflip';
    }

    if (role === 'agent' && status === 'pending') {
      return `${base}/agent-pending.html`;
    }

    const redirects = {
      admin: `${base}/admin/dashboard.html`,
      agent: `${base}/agent/dashboard.html`,
      client: `${base}/client/dashboard.html`,
      investor: `${base}/client/dashboard.html`, // Investors use client portal
    };

    return redirects[role] || `${base}/client/dashboard.html`;
  },
};

/**
 * Database Service
 */
export const DatabaseService = {
  // Generic method to get documents from any collection
  async getDocuments(
    collectionName,
    filters = [],
    limitCount = null,
    orderByField = null,
    orderDirection = 'asc'
  ) {
    try {
      let q = collection(db, collectionName);

      // Apply filters
      const queryConstraints = [];
      filters.forEach(filter => {
        if (filter.field && filter.operator && filter.value !== undefined) {
          queryConstraints.push(where(filter.field, filter.operator, filter.value));
        }
      });

      // Apply ordering
      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }

      // Apply limit
      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      // Create and execute query
      if (queryConstraints.length > 0) {
        q = query(q, ...queryConstraints);
      }

      const snapshot = await getDocs(q);
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      return documents;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      return [];
    }
  },
  // Properties
  async getProperties(filters = {}) {
    try {
      let q = collection(db, 'properties');

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.city) {
        q = query(q, where('address.city', '==', filters.city));
      }
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const properties = [];
      snapshot.forEach(doc => {
        properties.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: properties };
    } catch (error) {
      console.error('Error getting properties:', error);
      return { success: false, error: error.message };
    }
  },

  async getProperty(propertyId) {
    try {
      const docRef = await getDoc(doc(db, 'properties', propertyId));
      if (docRef.exists()) {
        return { success: true, data: { id: docRef.id, ...docRef.data() } };
      }
      return { success: false, error: 'Property not found' };
    } catch (error) {
      console.error('Error getting property:', error);
      return { success: false, error: error.message };
    }
  },

  async createProperty(propertyData) {
    try {
      const docRef = await addDoc(collection(db, 'properties'), {
        ...propertyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating property:', error);
      return { success: false, error: error.message };
    }
  },

  async updateProperty(propertyId, updates) {
    try {
      await updateDoc(doc(db, 'properties', propertyId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating property:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteProperty(propertyId) {
    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting property:', error);
      return { success: false, error: error.message };
    }
  },

  // Leads
  async createLead(leadData) {
    try {
      const docRef = await addDoc(collection(db, 'leads'), {
        ...leadData,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating lead:', error);
      return { success: false, error: error.message };
    }
  },

  async getLeads(filters = {}) {
    try {
      let q = collection(db, 'leads');

      if (filters.agentId) {
        q = query(q, where('agentId', '==', filters.agentId));
      }
      if (filters.clientId) {
        q = query(q, where('clientId', '==', filters.clientId));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const leads = [];
      snapshot.forEach(doc => {
        leads.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: leads };
    } catch (error) {
      console.error('Error getting leads:', error);
      return { success: false, error: error.message };
    }
  },

  // Real-time listeners
  onPropertiesChange(callback, filters = {}) {
    let q = collection(db, 'properties');

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    return onSnapshot(q, snapshot => {
      const properties = [];
      snapshot.forEach(doc => {
        properties.push({ id: doc.id, ...doc.data() });
      });
      callback(properties);
    });
  },

  onLeadsChange(callback, filters = {}) {
    let q = collection(db, 'leads');

    if (filters.agentId) {
      q = query(q, where('agentId', '==', filters.agentId));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    return onSnapshot(q, snapshot => {
      const leads = [];
      snapshot.forEach(doc => {
        leads.push({ id: doc.id, ...doc.data() });
      });
      callback(leads);
    });
  },

  // Real-time listener for per-user message inbox
  onUserMessagesChange(userId, callback, options = {}) {
    try {
      const { limitCount = 50 } = options;
      let q = collection(db, 'users', userId, 'messages');
      q = query(q, orderBy('createdAt', 'desc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      return onSnapshot(
        q,
        snapshot => {
          callback(snapshot);
        },
        error => {
          console.error(`Error listening to messages for user ${userId}:`, error);
        }
      );
    } catch (error) {
      console.error('onUserMessagesChange setup failed:', error);
      return () => {};
    }
  },

  // Saved properties helpers (used by client portal)
  async getUserSavedProperties(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return [];
      const data = snap.data() || {};
      return Array.isArray(data.savedProperties) ? data.savedProperties : [];
    } catch (error) {
      console.error(`Error loading savedProperties for user ${userId}:`, error);
      return [];
    }
  },

  async setUserSavedProperties(userId, savedArray) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { savedProperties: savedArray || [] });
      return { success: true };
    } catch (error) {
      console.error(`Error updating savedProperties for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * API Service - Calls to Cloud Functions
 */
export const APIService = {
  // Call the main API endpoint
  async callAPI(endpoint, method = 'GET', data = null) {
    try {
      const baseURL =
        window.location.hostname === 'localhost'
          ? 'http://localhost:5001/assiduous-prod/us-central1/api'
          : 'https://us-central1-assiduous-prod.cloudfunctions.net/api';

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Add auth token if user is logged in
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${baseURL}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API request failed');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('API call error:', error);
      return { success: false, error: error.message };
    }
  },

  // Convenience methods
  async getProperties(filters) {
    const params = new URLSearchParams(filters);
    return this.callAPI(`/properties?${params}`, 'GET');
  },

  async getProperty(id) {
    return this.callAPI(`/properties/${id}`, 'GET');
  },

  async createProperty(data) {
    return this.callAPI('/properties', 'POST', data);
  },

  async updateProperty(id, data) {
    return this.callAPI(`/properties/${id}`, 'PUT', data);
  },

  async deleteProperty(id) {
    return this.callAPI(`/properties/${id}`, 'DELETE');
  },

  async createLead(data) {
    return this.callAPI('/leads', 'POST', data);
  },

  async getAnalytics() {
    return this.callAPI('/analytics', 'GET');
  },
};

/**
 * Storage Service
 */
export const StorageService = {
  async uploadFile(path, file) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteFile(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Export everything as a single object for compatibility
const Firebase = {
  app,
  auth,
  db,
  functions,
  storage,
  analytics,
  AuthService,
  DatabaseService,
  APIService,
  StorageService,
};

// Make available globally for legacy code
window.Firebase = Firebase;

// Bridge modular SDK to compat-style globals so legacy code and auth-guard
// see the same app, auth, and db instances as the landing AuthService.
try {
  if (!window.firebaseApp) window.firebaseApp = app;
  if (!window.firebaseAuth) window.firebaseAuth = auth;
  if (!window.firebaseDb) window.firebaseDb = db;
  if (!window.firebaseStorage) window.firebaseStorage = storage;

  // Expose AuthService for guards/pages that expect it on window
  if (!window.AuthService) window.AuthService = AuthService;

  // Fire a firebase-ready event for any compat listeners waiting on it
  window.dispatchEvent(new CustomEvent('firebase-ready', {
    detail: { app, auth, db, storage, analytics }
  }));
} catch (e) {
  console.warn('[firebase-init] Failed to bridge to compat globals:', e);
}

// Export for ES modules
export default Firebase;
export { app, auth, db, functions, storage, analytics };
