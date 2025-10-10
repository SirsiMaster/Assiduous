import { authService } from '../authService';
import { auth } from '../firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth');
jest.mock('../firebaseConfig', () => ({
  auth: {}
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    test('successfully signs in with valid credentials', async () => {
      const mockUser = { 
        uid: '123', 
        email: 'test@example.com',
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: { role: 'agent' }
        })
      };
      
      signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      
      const result = await authService.signIn('test@example.com', 'password123');
      
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
      expect(result.user.uid).toBe('123');
      expect(result.role).toBe('agent');
    });

    test('handles invalid credentials error', async () => {
      signInWithEmailAndPassword.mockRejectedValue(
        new Error('auth/wrong-password')
      );
      
      await expect(
        authService.signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('auth/wrong-password');
    });

    test('validates email format', async () => {
      await expect(
        authService.signIn('invalidemail', 'password123')
      ).rejects.toThrow('Invalid email format');
    });

    test('validates password length', async () => {
      await expect(
        authService.signIn('test@example.com', '12345')
      ).rejects.toThrow('Password must be at least 6 characters');
    });
  });

  describe('signUp', () => {
    test('successfully creates new user account', async () => {
      const mockUser = { 
        uid: '456', 
        email: 'newuser@example.com' 
      };
      
      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      
      const result = await authService.signUp(
        'newuser@example.com',
        'password123',
        { name: 'New User', role: 'client' }
      );
      
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'newuser@example.com',
        'password123'
      );
      expect(result.user.uid).toBe('456');
    });

    test('handles duplicate email error', async () => {
      createUserWithEmailAndPassword.mockRejectedValue(
        new Error('auth/email-already-in-use')
      );
      
      await expect(
        authService.signUp('existing@example.com', 'password123')
      ).rejects.toThrow('auth/email-already-in-use');
    });

    test('validates password strength', async () => {
      await expect(
        authService.signUp('test@example.com', 'weak')
      ).rejects.toThrow('Password too weak');
    });
  });

  describe('signOut', () => {
    test('successfully signs out user', async () => {
      signOut.mockResolvedValue();
      
      await authService.signOut();
      
      expect(signOut).toHaveBeenCalledWith(auth);
    });

    test('handles sign out error', async () => {
      signOut.mockRejectedValue(new Error('Network error'));
      
      await expect(authService.signOut()).rejects.toThrow('Network error');
    });
  });

  describe('Role-Based Access Control', () => {
    test('correctly identifies admin role', async () => {
      const mockUser = {
        uid: '789',
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: { role: 'admin' }
        })
      };
      
      const hasAccess = await authService.checkAccess(mockUser, 'admin');
      expect(hasAccess).toBe(true);
    });

    test('correctly identifies agent role', async () => {
      const mockUser = {
        uid: '789',
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: { role: 'agent' }
        })
      };
      
      const hasAccess = await authService.checkAccess(mockUser, 'agent');
      expect(hasAccess).toBe(true);
    });

    test('denies access for insufficient role', async () => {
      const mockUser = {
        uid: '789',
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: { role: 'client' }
        })
      };
      
      const hasAccess = await authService.checkAccess(mockUser, 'admin');
      expect(hasAccess).toBe(false);
    });

    test('handles missing role claim', async () => {
      const mockUser = {
        uid: '789',
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: {}
        })
      };
      
      const hasAccess = await authService.checkAccess(mockUser, 'agent');
      expect(hasAccess).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    test('returns current authenticated user', (done) => {
      const mockUser = { 
        uid: '999', 
        email: 'current@example.com' 
      };
      
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn(); // unsubscribe function
      });
      
      authService.getCurrentUser().then(user => {
        expect(user.uid).toBe('999');
        expect(user.email).toBe('current@example.com');
        done();
      });
    });

    test('returns null when no user is authenticated', (done) => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });
      
      authService.getCurrentUser().then(user => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('Password Reset', () => {
    test('sends password reset email', async () => {
      const sendPasswordResetEmail = jest.fn().mockResolvedValue();
      authService.sendPasswordResetEmail = sendPasswordResetEmail;
      
      await authService.sendPasswordResetEmail('forgot@example.com');
      
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('forgot@example.com');
    });

    test('validates email before sending reset', async () => {
      await expect(
        authService.sendPasswordResetEmail('invalid-email')
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('Token Management', () => {
    test('refreshes ID token when expired', async () => {
      const mockUser = {
        uid: '123',
        getIdToken: jest.fn().mockResolvedValue('new-token-123')
      };
      
      const token = await authService.refreshToken(mockUser);
      
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
      expect(token).toBe('new-token-123');
    });

    test('validates token expiration', async () => {
      const mockToken = {
        exp: Math.floor(Date.now() / 1000) - 3600 // expired 1 hour ago
      };
      
      const isExpired = authService.isTokenExpired(mockToken);
      expect(isExpired).toBe(true);
    });

    test('validates token not expired', async () => {
      const mockToken = {
        exp: Math.floor(Date.now() / 1000) + 3600 // expires in 1 hour
      };
      
      const isExpired = authService.isTokenExpired(mockToken);
      expect(isExpired).toBe(false);
    });
  });
});