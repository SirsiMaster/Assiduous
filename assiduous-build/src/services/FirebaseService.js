import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Fields requiring client-side encryption
const SENSITIVE_FIELDS = {
  users: ['email', 'phone', 'ssn'],
  properties: ['ownerContact', 'accessCodes'],
  transactions: ['financialDetails']
};

/**
 * Service for handling all Firebase/Firestore operations
 */
export class FirebaseService {
  constructor() {
    // Initialize Firebase if it hasn't been
    if (!getApps().length) {
      const app = initializeApp(firebaseConfig);
      this.app = app;
    } else {
      this.app = getApps()[0];
    }

    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.storage = getStorage(this.app);

    // Collection references
    this.collections = {
      users: collection(this.db, 'users'),
      properties: collection(this.db, 'properties'),
      transactions: collection(this.db, 'transactions'),
      messages: collection(this.db, 'messages'),
      notifications: collection(this.db, 'notifications')
    };
  }

  /**
   * Encrypt sensitive fields before storage
   */
  async encryptSensitiveFields(collectionName, data) {
    const sensitiveFields = SENSITIVE_FIELDS[collectionName];
    if (!sensitiveFields) return data;

    const result = { ...data };
    for (const field of sensitiveFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], result);
      if (value) {
        const encrypted = await this.encryptField(value.toString());
        // Update nested field
        const keys = field.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
          if (!obj[key]) obj[key] = {};
          return obj[key];
        }, result);
        target[lastKey] = encrypted;
      }
    }
    return result;
  }

  /**
   * Decrypt sensitive fields after retrieval
   */
  async decryptSensitiveFields(collectionName, data) {
    const sensitiveFields = SENSITIVE_FIELDS[collectionName];
    if (!sensitiveFields) return data;

    const result = { ...data };
    for (const field of sensitiveFields) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], result);
      if (value && value.encrypted) {
        const decrypted = await this.decryptField(value);
        // Update nested field
        const keys = field.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
          if (!obj[key]) obj[key] = {};
          return obj[key];
        }, result);
        target[lastKey] = decrypted;
      }
    }
    return result;
  }

  /**
   * Encrypt a single field using Web Crypto API
   */
  async encryptField(value) {
    // Get encryption key from environment
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(value)
    );
    
    return {
      encrypted: this.arrayBufferToBase64(encryptedData),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  /**
   * Decrypt a single encrypted field
   */
  async decryptField(data) {
    try {
      const key = await this.getEncryptionKey();
      const iv = this.base64ToArrayBuffer(data.iv);
      const encryptedData = this.base64ToArrayBuffer(data.encrypted);
      const decoder = new TextDecoder();

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );

      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Get or derive encryption key
   */
  async getEncryptionKey() {
    if (!this._encryptionKey) {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(process.env.ENCRYPTION_KEY),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      this._encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('assiduous-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }
    return this._encryptionKey;
  }

  // Helper methods for ArrayBuffer conversion
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Create a new document
   */
  async create(collectionName, data) {
    if (!this.auth.currentUser) {
      throw new Error('Authentication required');
    }

    try {
      const encryptedData = await this.encryptSensitiveFields(collectionName, data);
      const docRef = await addDoc(this.collections[collectionName], {
        ...encryptedData,
        createdBy: this.auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const newDoc = await getDoc(docRef);
      const decryptedData = await this.decryptSensitiveFields(
        collectionName,
        { id: newDoc.id, ...newDoc.data() }
      );

      return decryptedData;
    } catch (error) {
      console.error(`Error creating ${collectionName} document:`, error);
      throw error;
    }
  }

  /**
   * Query documents with filtering and pagination
   */
  async find(collectionName, queryParams = {}) {
    try {
      let q = this.collections[collectionName];

      // Add query conditions
      if (queryParams.where) {
        queryParams.where.forEach(condition => {
          q = query(q, where(...condition));
        });
      }

      // Add sorting
      if (queryParams.orderBy) {
        queryParams.orderBy.forEach(([field, direction]) => {
          q = query(q, orderBy(field, direction));
        });
      }

      // Add pagination
      if (queryParams.limit) {
        q = query(q, limit(queryParams.limit));
      }

      if (queryParams.startAfter) {
        q = query(q, startAfter(queryParams.startAfter));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Decrypt sensitive fields
      return Promise.all(
        docs.map(doc => this.decryptSensitiveFields(collectionName, doc))
      );
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async update(collectionName, id, data) {
    if (!this.auth.currentUser) {
      throw new Error('Authentication required');
    }

    try {
      const docRef = doc(this.db, collectionName, id);
      const encryptedData = await this.encryptSensitiveFields(collectionName, data);

      await updateDoc(docRef, {
        ...encryptedData,
        updatedBy: this.auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });

      const updatedDoc = await getDoc(docRef);
      return this.decryptSensitiveFields(
        collectionName,
        { id: updatedDoc.id, ...updatedDoc.data() }
      );
    } catch (error) {
      console.error(`Error updating ${collectionName} document:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(collectionName, id) {
    if (!this.auth.currentUser) {
      throw new Error('Authentication required');
    }

    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting ${collectionName} document:`, error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async findById(collectionName, id) {
    try {
      const docRef = doc(this.db, collectionName, id);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return this.decryptSensitiveFields(
        collectionName,
        { id: snapshot.id, ...snapshot.data() }
      );
    } catch (error) {
      console.error(`Error getting ${collectionName} document:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  onUpdate(collectionName, callback) {
    const q = query(this.collections[collectionName]);
    return onSnapshot(q, async (snapshot) => {
      const changes = [];
      for (const change of snapshot.docChanges()) {
        const decryptedDoc = await this.decryptSensitiveFields(
          collectionName,
          { id: change.doc.id, ...change.doc.data() }
        );
        changes.push({
          type: change.type,
          doc: decryptedDoc
        });
      }
      callback(changes);
    });
  }

  /**
   * Batch operations
   */
  async batchOperation(operations) {
    if (!this.auth.currentUser) {
      throw new Error('Authentication required');
    }

    try {
      const batch = writeBatch(this.db);
      const timestamp = serverTimestamp();

      for (const op of operations) {
        const docRef = doc(this.db, op.collection, op.id);
        switch (op.type) {
          case 'create':
          case 'update': {
            const encryptedData = await this.encryptSensitiveFields(op.collection, op.data);
            batch.set(docRef, {
              ...encryptedData,
              updatedBy: this.auth.currentUser.uid,
              updatedAt: timestamp
            }, { merge: true });
            break;
          }
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
