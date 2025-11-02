/**
 * RBAC Cloud Functions
 * 
 * Server-side role-based access control functions
 * - Validate user roles
 * - Check permissions
 * - Audit role changes
 * - Manage role assignments
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const db = getFirestore();

/**
 * Valid roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  CLIENT = 'client',
  GUEST = 'guest'
}

/**
 * Permission sets for each role
 */
const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'users:read',
    'users:write',
    'users:delete',
    'properties:read',
    'properties:write',
    'properties:delete',
    'transactions:read',
    'transactions:write',
    'analytics:read',
    'settings:write',
    'roles:write'
  ],
  [UserRole.AGENT]: [
    'properties:read',
    'properties:write',
    'transactions:read',
    'transactions:write',
    'clients:read',
    'clients:write',
    'leads:read',
    'leads:write'
  ],
  [UserRole.CLIENT]: [
    'properties:read',
    'transactions:read',
    'profile:write',
    'viewings:write'
  ],
  [UserRole.GUEST]: [
    'properties:read'
  ]
};

/**
 * Check if user has specific role
 */
export const checkUserRole = onCall(async (request) => {
  const { role } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!role) {
    throw new HttpsError('invalid-argument', 'Role parameter required');
  }

  try {
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User document not found');
    }

    const userData = userDoc.data();
    const userRole = userData?.role;

    return {
      hasRole: userRole === role,
      currentRole: userRole,
      requestedRole: role
    };
  } catch (error: any) {
    throw new HttpsError('internal', `Role check failed: ${error.message}`);
  }
});

/**
 * Check if user has specific permission
 */
export const checkPermission = onCall(async (request) => {
  const { permission } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!permission) {
    throw new HttpsError('invalid-argument', 'Permission parameter required');
  }

  try {
    // Get user role
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User document not found');
    }

    const userData = userDoc.data();
    const userRole = userData?.role as UserRole;

    if (!userRole || !Object.values(UserRole).includes(userRole)) {
      throw new HttpsError('permission-denied', 'Invalid user role');
    }

    // Check if role has permission
    const permissions = rolePermissions[userRole] || [];
    const hasPermission = permissions.includes(permission);

    return {
      hasPermission,
      role: userRole,
      permission,
      allPermissions: permissions
    };
  } catch (error: any) {
    throw new HttpsError('internal', `Permission check failed: ${error.message}`);
  }
});

/**
 * Get all permissions for current user
 */
export const getUserPermissions = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User document not found');
    }

    const userData = userDoc.data();
    const userRole = userData?.role as UserRole;

    if (!userRole) {
      return {
        role: UserRole.GUEST,
        permissions: rolePermissions[UserRole.GUEST]
      };
    }

    return {
      role: userRole,
      permissions: rolePermissions[userRole] || []
    };
  } catch (error: any) {
    throw new HttpsError('internal', `Get permissions failed: ${error.message}`);
  }
});

/**
 * Update user role (admin only)
 */
export const updateUserRole = onCall(async (request) => {
  const { targetUserId, newRole } = request.data;
  const adminUid = request.auth?.uid;

  if (!adminUid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!targetUserId || !newRole) {
    throw new HttpsError('invalid-argument', 'targetUserId and newRole required');
  }

  try {
    // Check if requester is admin
    const adminDoc = await db.collection('users').doc(adminUid).get();
    const adminData = adminDoc.data();

    if (adminData?.role !== UserRole.ADMIN) {
      throw new HttpsError('permission-denied', 'Only admins can update roles');
    }

    // Validate new role
    if (!Object.values(UserRole).includes(newRole as UserRole)) {
      throw new HttpsError('invalid-argument', `Invalid role: ${newRole}`);
    }

    // Get target user
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();

    if (!targetUserDoc.exists) {
      throw new HttpsError('not-found', 'Target user not found');
    }

    const oldRole = targetUserDoc.data()?.role;

    // Update role in Firestore
    await db.collection('users').doc(targetUserId).update({
      role: newRole,
      roleUpdatedAt: FieldValue.serverTimestamp(),
      roleUpdatedBy: adminUid
    });

    // Update custom claims in Firebase Auth
    await getAuth().setCustomUserClaims(targetUserId, { role: newRole });

    // Log role change for audit
    await db.collection('audit_logs').add({
      type: 'role_change',
      targetUserId,
      oldRole,
      newRole,
      adminUid,
      timestamp: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      targetUserId,
      oldRole,
      newRole,
      message: `Role updated from ${oldRole} to ${newRole}`
    };
  } catch (error: any) {
    throw new HttpsError('internal', `Update role failed: ${error.message}`);
  }
});

/**
 * Audit log trigger: Log all role changes
 */
export const auditRoleChanges = onDocumentWritten('users/{userId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const userId = event.params.userId;

  // Check if role changed
  if (before?.role !== after?.role) {
    console.log(`Role changed for user ${userId}: ${before?.role} → ${after?.role}`);

    // Create audit log entry
    try {
      await db.collection('audit_logs').add({
        type: 'role_change',
        userId,
        oldRole: before?.role || 'none',
        newRole: after?.role || 'none',
        timestamp: FieldValue.serverTimestamp(),
        triggeredBy: after?.roleUpdatedBy || 'system'
      });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }
});

/**
 * Validate role assignment (security check)
 */
export const validateRoleAssignment = onCall(async (request) => {
  const { userId } = request.data;
  const adminUid = request.auth?.uid;

  if (!adminUid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId required');
  }

  try {
    // Check admin permissions
    const adminDoc = await db.collection('users').doc(adminUid).get();

    if (adminDoc.data()?.role !== UserRole.ADMIN) {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        valid: false,
        reason: 'User document not found'
      };
    }

    const userData = userDoc.data();
    const userRole = userData?.role;

    // Validate role
    if (!userRole) {
      return {
        valid: false,
        reason: 'No role assigned',
        recommendation: 'Assign role: client'
      };
    }

    if (!Object.values(UserRole).includes(userRole as UserRole)) {
      return {
        valid: false,
        reason: `Invalid role: ${userRole}`,
        recommendation: 'Assign valid role'
      };
    }

    // Check Auth custom claims
    const authUser = await getAuth().getUser(userId);
    const customClaims = authUser.customClaims || {};

    if (customClaims.role !== userRole) {
      return {
        valid: false,
        reason: 'Role mismatch between Firestore and Auth',
        firestoreRole: userRole,
        authRole: customClaims.role,
        recommendation: 'Sync roles'
      };
    }

    return {
      valid: true,
      userId,
      role: userRole,
      permissions: rolePermissions[userRole as UserRole]
    };
  } catch (error: any) {
    throw new HttpsError('internal', `Validation failed: ${error.message}`);
  }
});
