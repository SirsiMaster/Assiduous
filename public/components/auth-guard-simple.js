/**
 * Simplified Auth Guard for AssiduousFlip
 * Protects pages by checking Firebase Auth state and user roles
 * USAGE: Add to any protected page with:
 *   <script src="/components/auth-guard-simple.js"></script>
 *   <script>authGuard.protect(['admin', 'agent']);</script>
 */

(function() {
    'use strict';
    
    const authGuard = {
        /**
         * Protect a page - check authentication and roles
         * @param {Array|string} allowedRoles - Roles that can access this page
         * @param {Object} options - Additional options
         */
        protect: async function(allowedRoles = null, options = {}) {
            // Convert single role to array
            if (typeof allowedRoles === 'string') {
                allowedRoles = [allowedRoles];
            }
            
            // Default options
            const opts = {
                loginUrl: '/login.html',
                requireEmailVerification: false,
                onUnauthorized: null,
                onSuccess: null,
                ...options
            };
            
            try {
                // Wait for Firebase to be ready
                if (!window.firebaseAuth) {
                    console.warn('[AuthGuard] Waiting for Firebase...');
                    await this.waitForFirebase();
                }
                
                // Check authentication state
                const user = await this.checkAuth();
                
                if (!user) {
                    console.log('[AuthGuard] Not authenticated, redirecting to login');
                    this.redirectToLogin(opts.loginUrl);
                    return false;
                }
                
                console.log('[AuthGuard] User authenticated:', user.uid);
                
                // Check email verification if required
                if (opts.requireEmailVerification && !user.emailVerified) {
                    console.log('[AuthGuard] Email not verified');
                    this.showEmailVerificationRequired();
                    return false;
                }
                
                // Get user data from Firestore if roles need checking
                if (allowedRoles && allowedRoles.length > 0) {
                    const userData = await this.getUserData(user.uid);
                    
                    if (!userData) {
                        console.error('[AuthGuard] User data not found');
                        this.redirectToLogin(opts.loginUrl);
                        return false;
                    }
                    
                    const userRole = userData.role || 'client';
                    console.log('[AuthGuard] User role:', userRole);
                    
                    // Check if user's role is allowed
                    if (!allowedRoles.includes(userRole)) {
                        console.log('[AuthGuard] Unauthorized role, redirecting');
                        if (opts.onUnauthorized) {
                            opts.onUnauthorized(userRole);
                        } else {
                            this.redirectToRoleDashboard(userRole, userData);
                        }
                        return false;
                    }
                    
                    // Check agent approval status
                    if (userRole === 'agent' && userData.agentInfo?.status !== 'approved') {
                        console.log('[AuthGuard] Agent not approved');
                        window.location.href = '/agent-pending.html';
                        return false;
                    }
                }
                
                // Success - update UI with user info
                console.log('[AuthGuard] \u2713 Access granted');
                if (opts.onSuccess) {
                    opts.onSuccess(user);
                }
                
                this.updateUI(user);
                return true;
                
            } catch (error) {
                console.error('[AuthGuard] Error:', error);
                this.redirectToLogin(opts.loginUrl);
                return false;
            }
        },
        
        /**
         * Wait for Firebase to be initialized
         */
        waitForFirebase: function() {
            return new Promise((resolve) => {
                if (window.firebaseAuth) {
                    resolve();
                    return;
                }
                
                // Listen for firebase-ready event
                window.addEventListener('firebase-ready', () => {
                    resolve();
                }, { once: true });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (!window.firebaseAuth) {
                        console.error('[AuthGuard] Firebase initialization timeout');
                        resolve(); // Resolve anyway to show error
                    }
                }, 10000);
            });
        },
        
        /**
         * Check if user is authenticated
         */
        checkAuth: function() {
            return new Promise((resolve) => {
                // Check session storage first for faster initial load
                const sessionData = sessionStorage.getItem('assiduousUser');
                const localData = localStorage.getItem('assiduousUser');
                
                if (sessionData || localData) {
                    const data = JSON.parse(sessionData || localData);
                    console.log('[AuthGuard] Found cached session:', data.email);
                }
                
                // Always verify with Firebase
                const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
                    unsubscribe(); // Only check once
                    resolve(user);
                });
            });
        },
        
        /**
         * Get user data from Firestore
         */
        getUserData: async function(uid) {
            try {
                const doc = await window.firebaseDb.collection('users').doc(uid).get();
                if (doc.exists) {
                    return { id: doc.id, ...doc.data() };
                }
                return null;
            } catch (error) {
                console.error('[AuthGuard] Error fetching user data:', error);
                return null;
            }
        },
        
        /**
         * Redirect to login page
         */
        redirectToLogin: function(loginUrl) {
            const currentPath = window.location.pathname + window.location.search;
            const returnUrl = encodeURIComponent(currentPath);
            window.location.href = `${loginUrl}?returnUrl=${returnUrl}`;
        },
        
        /**
         * Redirect to user's appropriate dashboard based on role
         */
        redirectToRoleDashboard: function(role, userData) {
            const redirects = {
                admin: '/admin/dashboard.html',
                agent: userData.agentInfo?.status === 'approved' ? '/agent/dashboard.html' : '/agent-pending.html',
                client: '/client/dashboard.html',
                investor: '/client/dashboard.html'
            };
            
            const url = redirects[role] || '/client/dashboard.html';
            console.log('[AuthGuard] Redirecting to role dashboard:', url);
            window.location.href = url;
        },
        
        /**
         * Show email verification required message
         */
        showEmailVerificationRequired: function() {
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, sans-serif;">
                    <div style="text-align: center; max-width: 500px; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                        <div style="font-size: 48px; margin-bottom: 20px;">✉️</div>
                        <h2 style="color: #1e293b; margin-bottom: 16px; font-size: 24px;">Email Verification Required</h2>
                        <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">
                            Please verify your email address to access this page.
                            Check your inbox for the verification link.
                        </p>
                        <button onclick="window.location.href='/'" style="
                            padding: 12px 24px;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 15px;
                        ">Back to Home</button>
                    </div>
                </div>
            `;
        },
        
        /**
         * Update UI with user information
         */
        updateUI: function(user) {
            // Update elements with data-user-* attributes
            const elements = {
                '[data-user-email]': user.email,
                '[data-user-name]': user.displayName || user.email.split('@')[0],
                '[data-user-initials]': this.getInitials(user.displayName || user.email)
            };
            
            Object.entries(elements).forEach(([selector, value]) => {
                document.querySelectorAll(selector).forEach(el => {
                    el.textContent = value;
                });
            });
        },
        
        /**
         * Get user initials from display name
         */
        getInitials: function(name) {
            if (!name) return '?';
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return name[0].toUpperCase();
        },
        
        /**
         * Sign out helper
         */
        signOut: async function() {
            try {
                await window.firebaseAuth.signOut();
                sessionStorage.removeItem('assiduousUser');
                localStorage.removeItem('assiduousUser');
                localStorage.removeItem('assiduousRememberMe');
                console.log('[AuthGuard] Signed out');
                window.location.href = '/';
            } catch (error) {
                console.error('[AuthGuard] Sign out error:', error);
            }
        }
    };
    
    // Export globally
    window.authGuard = authGuard;
    
    // Auto-protect if data-auth-protect attribute is present
    if (document.documentElement.hasAttribute('data-auth-protect')) {
        const roles = document.documentElement.getAttribute('data-auth-protect');
        const roleArray = roles ? roles.split(',').map(r => r.trim()) : null;
        
        // Protect on DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                authGuard.protect(roleArray);
            });
        } else {
            authGuard.protect(roleArray);
        }
    }
    
    console.log('[AuthGuard] \ud83d\udee1\ufe0f Loaded and ready');
})();
