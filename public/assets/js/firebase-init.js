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
  browserLocalPersistence
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
  enableIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { 
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';
import {
  getAnalytics,
  logEvent
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE",
  authDomain: "assiduous-prod.firebaseapp.com",
  projectId: "assiduous-prod",
  storageBucket: "assiduous-prod.firebasestorage.app",
  messagingSenderId: "9355377564",
  appId: "1:9355377564:web:84bd6fa0e7c8a2e7c3f56b",
  databaseURL: "https://assiduous-prod-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
const storage = getStorage(app);
let analytics = null;

// Only initialize analytics if not in localhost
if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  analytics = getAnalytics(app);
}

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence enabled in first tab only');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support offline persistence');
  }
});

// Set authentication persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
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
        ...(userData.role === 'agent' ? {
          licenseNumber: userData.licenseNumber || '',
          licenseState: userData.licenseState || '',
          brokerageName: userData.brokerageName || '',
          licenseExpiry: userData.licenseExpiry || null,
          status: 'pending' // Agents need approval
        } : {
          status: 'active'
        })
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      return { 
        success: true, 
        user,
        role: userData?.role || 'client',
        status: userData?.status || 'active'
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
  
  // Get redirect URL based on role
  getRoleRedirect(role, status = 'active') {
    if (role === 'agent' && status === 'pending') {
      return '/agent-pending.html';
    }
    
    const redirects = {
      admin: '/admin/dashboard.html',
      agent: '/agent/dashboard.html',
      client: '/client/dashboard.html',
      investor: '/client/dashboard.html' // Investors use client portal
    };
    
    return redirects[role] || '/client/dashboard.html';
  }
};

/**
 * Database Service
 */
export const DatabaseService = {
  // Generic method to get documents from any collection
  async getDocuments(collectionName, filters = [], limitCount = null, orderByField = null, orderDirection = 'asc') {
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
    
    return onSnapshot(q, (snapshot) => {
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
    
    return onSnapshot(q, (snapshot) => {
      const leads = [];
      snapshot.forEach(doc => {
        leads.push({ id: doc.id, ...doc.data() });
      });
      callback(leads);
    });
  }
};

/**
 * API Service - Calls to Cloud Functions
 */
export const APIService = {
  // Call the main API endpoint
  async callAPI(endpoint, method = 'GET', data = null) {
    try {
      const baseURL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5001/assiduous-prod/us-central1/api'
        : 'https://us-central1-assiduous-prod.cloudfunctions.net/api';
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
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
  }
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
  }
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
  StorageService
};

// Make available globally for legacy code
window.Firebase = Firebase;

// Export for ES modules
export default Firebase;
export { app, auth, db, functions, storage, analytics };