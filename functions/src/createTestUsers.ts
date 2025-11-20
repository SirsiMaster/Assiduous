import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

/**
 * DEPRECATED: Legacy test-user factory (DO NOT USE IN PRODUCTION)
 * ----------------------------------------------------------------
 * This function was originally used to create `@assiduous.com` test
 * accounts for Step 12 auth testing. Those accounts have been removed
 * from the production project and must not be recreated.
 *
 * To avoid future confusion, this endpoint is now **hard-disabled**.
 * Any calls will return HTTP 410 and perform **no writes** to Auth or
 * Firestore. The implementation is kept only for historical reference.
 *
 * If you need to seed test users in the future, create them manually
 * in Firebase Auth using the current approved test-account policy for
 * this project.
 */

interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'agent' | 'client';
  displayName: string;
  profile: any;
  [key: string]: any;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'admin@assiduous.com',
    password: 'Test123!@#',
    role: 'admin',
    displayName: 'Test Admin',
    profile: {
      firstName: 'Test',
      lastName: 'Admin',
      phone: '+1-555-0001',
      title: 'System Administrator'
    },
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_properties', 'view_analytics']
  },
  {
    email: 'agent@assiduous.com',
    password: 'Test123!@#',
    role: 'agent',
    displayName: 'Test Agent',
    profile: {
      firstName: 'Test',
      lastName: 'Agent',
      phone: '+1-555-0002',
      licenseNumber: 'LIC-TEST-001',
      specializations: ['residential', 'buyer', 'seller'],
      yearsExperience: 5,
      bio: 'Test agent account for authentication testing'
    },
    stats: {
      totalSales: 0,
      totalVolume: 0,
      activeListings: 0,
      avgRating: 0,
      reviewCount: 0
    }
  },
  {
    email: 'client@assiduous.com',
    password: 'Test123!@#',
    role: 'client',
    displayName: 'Test Client',
    profile: {
      firstName: 'Test',
      lastName: 'Client',
      phone: '+1-555-0003',
      preferences: {
        propertyTypes: ['house', 'condo'],
        priceRange: { min: 200000, max: 500000 },
        bedrooms: { min: 2, max: 4 },
        bathrooms: { min: 2, max: 3 }
      }
    },
    favorites: [],
    savedSearches: []
  }
];

export const createTestUsers = onRequest(
  { cors: true, maxInstances: 1 },
  async (req, res) => {
    // HARD-DEPRECATED GUARD
    // ----------------------
    // This endpoint no longer performs any actions. It exists only so
    // that old documentation references do not break.
    res.status(410).json({
      error:
        'createTestUsers is deprecated. @assiduous.com test users were removed and must not be recreated.',
    });
    return;

    // --- Legacy implementation below (kept for historical reference) ---
    try {
      // SECURITY: Require authorization header for production
      const authHeader = req.headers.authorization;
      const isAuthorized = authHeader === 'Bearer CREATE_TEST_USERS_2025' ||
                           process.env.FIREBASE_CONFIG?.includes('staging') || 
                           process.env.GCLOUD_PROJECT?.includes('dev');
      
      if (!isAuthorized) {
        res.status(403).json({
          error: 'Unauthorized. This endpoint requires authorization.'
        });
        return;
      }

      const { action } = req.body;

      if (action === 'create') {
        const results = await createUsers();
        res.status(200).json({
          success: true,
          action: 'create',
          results
        });
        return;
      } else if (action === 'delete') {
        const results = await deleteUsers();
        res.status(200).json({
          success: true,
          action: 'delete',
          results
        });
        return;
      } else if (action === 'list') {
        const results = await listUsers();
        res.status(200).json({
          success: true,
          action: 'list',
          results
        });
        return;
      } else {
        res.status(400).json({
          error: 'Invalid action. Use: create, delete, or list'
        });
        return;
      }

    } catch (error: any) {
      console.error('Error in createTestUsers:', error);
      res.status(500).json({
        error: error.message
      });
      return;
    }
  }
);

async function createUsers() {
  const results = [];

  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(userData.email);
        results.push({
          email: userData.email,
          status: 'already_exists',
          uid: userRecord.uid
        });
        
        // Update custom claims anyway
        await admin.auth().setCustomUserClaims(userRecord.uid, {
          role: userData.role
        });
        
        continue;
      } catch (error) {
        // User doesn't exist, create it
        userRecord = await admin.auth().createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: true
        });
      }

      // Set custom claims for role-based access
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: userData.role
      });

      // Create Firestore document
      const userDoc: any = {
        uid: userRecord.uid,
        email: userData.email,
        role: userData.role,
        profile: userData.profile,
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
        lastLogin: admin.firestore.Timestamp.now(),
        emailVerified: true
      };

      // Add role-specific fields
      if (userData.role === 'admin') {
        userDoc.permissions = userData.permissions;
      } else if (userData.role === 'agent') {
        userDoc.stats = userData.stats;
        userDoc.profileComplete = true;
      } else if (userData.role === 'client') {
        userDoc.favorites = userData.favorites;
        userDoc.savedSearches = userData.savedSearches;
        userDoc.onboardingComplete = true;
      }

      await admin.firestore().collection('users').doc(userRecord.uid).set(userDoc, { merge: true });

      results.push({
        email: userData.email,
        status: 'created',
        uid: userRecord.uid,
        role: userData.role
      });

    } catch (error: any) {
      results.push({
        email: userData.email,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

async function deleteUsers() {
  const results = [];

  for (const userData of TEST_USERS) {
    try {
      const userRecord = await admin.auth().getUserByEmail(userData.email);

      // Delete from Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).delete();

      // Delete from Authentication
      await admin.auth().deleteUser(userRecord.uid);

      results.push({
        email: userData.email,
        status: 'deleted',
        uid: userRecord.uid
      });

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        results.push({
          email: userData.email,
          status: 'not_found'
        });
      } else {
        results.push({
          email: userData.email,
          status: 'error',
          error: error.message
        });
      }
    }
  }

  return results;
}

async function listUsers() {
  const results = [];

  for (const userData of TEST_USERS) {
    try {
      const userRecord = await admin.auth().getUserByEmail(userData.email);
      const firestoreDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();

      results.push({
        email: userData.email,
        uid: userRecord.uid,
        role: userData.role,
        authExists: true,
        firestoreExists: firestoreDoc.exists,
        emailVerified: userRecord.emailVerified,
        customClaims: userRecord.customClaims
      });

    } catch (error: any) {
      results.push({
        email: userData.email,
        authExists: false,
        firestoreExists: false
      });
    }
  }

  return results;
}
