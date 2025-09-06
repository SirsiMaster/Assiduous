// Firebase Configuration for Assiduous Production
// This file provides the Firebase configuration for the deployed application

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBkSjqPfWb5jLxQ_bEV_QHJyKxKCEu7iCY",
  authDomain: "assiduous-prod.firebaseapp.com",
  projectId: "assiduous-prod",
  storageBucket: "assiduous-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Note: These are placeholder values. You'll need to get the actual values from:
// Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet

// GitHub API configuration (for development dashboard)
window.GITHUB_CONFIG = {
  owner: 'SirsiMaster',
  repo: 'Assiduous',
  // No token needed for public repos and basic read operations
};

// Environment configuration
window.ENV = {
  FIREBASE_API_KEY: window.FIREBASE_CONFIG.apiKey,
  FIREBASE_AUTH_DOMAIN: window.FIREBASE_CONFIG.authDomain,
  FIREBASE_PROJECT_ID: window.FIREBASE_CONFIG.projectId,
  FIREBASE_STORAGE_BUCKET: window.FIREBASE_CONFIG.storageBucket,
  FIREBASE_MESSAGING_SENDER_ID: window.FIREBASE_CONFIG.messagingSenderId,
  FIREBASE_APP_ID: window.FIREBASE_CONFIG.appId,
  ENCRYPTION_KEY: "your-encryption-key-here" // Replace with secure key
};

console.log('Firebase configuration loaded for:', window.FIREBASE_CONFIG.projectId);
