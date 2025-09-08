import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import { firebaseService } from '../FirebaseService';

describe('FirebaseService', () => {
  let testEnv;
  let testDb;
  let adminDb;

  beforeAll(async () => {
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'assiduous-test',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /{document=**} {
                allow read, write: if false;
              }
              
              match /users/{userId} {
                allow read: if request.auth != null && request.auth.uid == userId;
                allow write: if request.auth != null && 
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
              }
              
              match /properties/{propertyId} {
                allow read: if true;
                allow create, update: if request.auth != null && 
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent';
              }
            }
          }
        `
      }
    });

    // Get test databases
    testDb = testEnv.authenticatedContext('test_user').firestore();
    adminDb = testEnv.authenticatedContext('admin_user', { role: 'admin' }).firestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('Document Operations', () => {
    test('creates a document with encryption', async () => {
      const data = {
        profile: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890'
        },
        role: 'client'
      };

      const doc = await firebaseService.create('users', data);
      
      // Verify document was created
      expect(doc.id).toBeDefined();
      expect(doc.profile.name).toBe(data.profile.name);
      
      // Verify sensitive fields are encrypted
      expect(doc.profile.email).not.toBe(data.profile.email);
      expect(doc.profile.phone).not.toBe(data.profile.phone);
      expect(doc.profile.email.encrypted).toBeDefined();
      expect(doc.profile.email.iv).toBeDefined();
    });

    test('reads a document with decryption', async () => {
      // Create test document
      const data = {
        profile: {
          name: 'Test User',
          email: await firebaseService.encryptField('test@example.com'),
          phone: await firebaseService.encryptField('+1234567890')
        },
        role: 'client'
      };
      
      const created = await firebaseService.create('users', data);
      const read = await firebaseService.findById('users', created.id);
      
      // Verify document was decrypted
      expect(read.profile.email).toBe('test@example.com');
      expect(read.profile.phone).toBe('+1234567890');
    });

    test('updates a document preserving encryption', async () => {
      // Create initial document
      const initial = await firebaseService.create('users', {
        profile: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890'
        },
        role: 'client'
      });

      // Update document
      const updated = await firebaseService.update('users', initial.id, {
        profile: {
          ...initial.profile,
          phone: '+0987654321'
        }
      });

      // Verify update
      expect(updated.profile.name).toBe(initial.profile.name);
      expect(updated.profile.email).toBe(initial.profile.email);
      expect(updated.profile.phone).toBe('+0987654321');
      
      // Verify encryption was preserved
      expect(updated.profile.email.encrypted).toBeDefined();
      expect(updated.profile.phone.encrypted).toBeDefined();
    });
  });

  describe('Security Rules', () => {
    test('prevents unauthorized access', async () => {
      const ref = testDb.collection('users').doc('test_user');
      await assertFails(ref.get());
    });

    test('allows user to read own data', async () => {
      const ref = testDb.collection('users').doc('test_user');
      await assertSucceeds(ref.get());
    });

    test('allows admin to write user data', async () => {
      const ref = adminDb.collection('users').doc('test_user');
      await assertSucceeds(ref.set({ name: 'Test User' }));
    });

    test('prevents non-admin from writing user data', async () => {
      const ref = testDb.collection('users').doc('other_user');
      await assertFails(ref.set({ name: 'Other User' }));
    });
  });

  describe('Query Operations', () => {
    test('filters and sorts documents', async () => {
      // Create test data
      await Promise.all([
        firebaseService.create('properties', {
          name: 'Property A',
          price: 100000,
          location: 'City A'
        }),
        firebaseService.create('properties', {
          name: 'Property B',
          price: 200000,
          location: 'City B'
        }),
        firebaseService.create('properties', {
          name: 'Property C',
          price: 150000,
          location: 'City A'
        })
      ]);

      // Query with filters and sorting
      const results = await firebaseService.find('properties', {
        where: [['location', '==', 'City A']],
        orderBy: [['price', 'desc']]
      });

      expect(results).toHaveLength(2);
      expect(results[0].price).toBe(150000);
      expect(results[1].price).toBe(100000);
    });

    test('paginates results', async () => {
      // Create test data
      await Promise.all(
        Array(10).fill(0).map((_, i) => 
          firebaseService.create('properties', {
            name: `Property ${i}`,
            price: 100000 + (i * 10000)
          })
        )
      );

      // Get first page
      const page1 = await firebaseService.find('properties', {
        orderBy: [['price', 'asc']],
        limit: 5
      });

      expect(page1).toHaveLength(5);
      expect(page1[0].price).toBe(100000);

      // Get second page
      const page2 = await firebaseService.find('properties', {
        orderBy: [['price', 'asc']],
        limit: 5,
        startAfter: page1[4].id
      });

      expect(page2).toHaveLength(5);
      expect(page2[0].price).toBe(150000);
    });
  });

  describe('Field Encryption', () => {
    test('encrypts nested fields', async () => {
      const data = {
        name: 'Complex Object',
        contact: {
          personal: {
            email: 'test@example.com',
            phone: '+1234567890'
          },
          business: {
            email: 'business@example.com'
          }
        }
      };

      const processed = await firebaseService.encryptSensitiveFields('users', data);
      
      expect(processed.name).toBe(data.name);
      expect(processed.contact.personal.email.encrypted).toBeDefined();
      expect(processed.contact.personal.phone.encrypted).toBeDefined();
      expect(processed.contact.business.email.encrypted).toBeDefined();
    });

    test('handles missing fields gracefully', async () => {
      const data = {
        name: 'Simple Object',
        contact: {
          personal: {}
        }
      };

      const processed = await firebaseService.encryptSensitiveFields('users', data);
      
      expect(processed).toEqual(data);
    });

    test('maintains data integrity through encrypt/decrypt cycle', async () => {
      const original = 'test@example.com';
      const encrypted = await firebaseService.encryptField(original);
      const decrypted = await firebaseService.decryptField(encrypted);
      
      expect(decrypted).toBe(original);
    });
  });
});
