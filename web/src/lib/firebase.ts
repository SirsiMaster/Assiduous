import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  type User,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

// Match canonical config from public/assets/js/firebase-init.js
const isStaging = typeof window !== 'undefined' && window.location.hostname.includes('staging');

const firebaseConfig = isStaging
  ? {
      apiKey: 'AIzaSyDnMkQbhC5kYl5O_07zQ2yfYvGjLRq6E0c',
      authDomain: 'assiduous-staging.firebaseapp.com',
      projectId: 'assiduous-staging',
      storageBucket: 'assiduous-staging.firebasestorage.app',
      messagingSenderId: '853661742177',
      appId: '1:853661742177:web:cf93349a7f50a2d9f2e620',
    }
  : {
      apiKey: 'AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE',
      authDomain: 'assiduous-prod.firebaseapp.com',
      projectId: 'assiduous-prod',
      storageBucket: 'assiduous-prod.firebasestorage.app',
      messagingSenderId: '9355377564',
      appId: '1:9355377564:web:cee09f952eea43976ee659',
      measurementId: 'G-DVBZP21459',
    };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  ref,
  uploadBytes,
  getDownloadURL,
};
