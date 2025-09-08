import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseService } from '@/services/firebaseservice';

/**
 * Verify Firebase ID token from request
 */
export async function verifyAuth(req) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return null;
    }

    // Verify token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user data
    const userDoc = await getDoc(doc(firebaseService.db, 'users', decodedToken.uid));
    if (!userDoc.exists()) {
      return null;
    }

    return {
      uid: decodedToken.uid,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function checkRole(user, requiredRole) {
  if (!user || !user.role) {
    return false;
  }
  
  // Admin has access to everything
  if (user.role === 'admin') {
    return true;
  }

  return user.role === requiredRole;
}

/**
 * Middleware to enforce role-based access
 */
export function withRoleCheck(handler, requiredRole) {
  return async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!checkRole(user, requiredRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return handler(req, res);
  };
}
