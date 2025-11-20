/**
 * Auth Guard for AssiduousFlip
 * Protects pages by checking Firebase Auth state and user roles
 * USAGE: Add to any protected page with:
 *   <script src="/components/auth-guard.js"></script>
 *   <script>authGuard.protect(['admin', 'agent']);</script>
 */

(function() {
    'use strict';
    
    // Determine app base path so redirects work in both production and local /public dev
    // - In production (Firebase Hosting): paths look like /admin/dashboard.html → base ''
    // - In local dev (python -m http.server from repo root): paths look like /public/admin/dashboard.html → base '/public'
    // - For alternate mounts (/assiduousflip/*): base '/assiduousflip'
    function getAppBasePath() {
        var path = window.location.pathname || '';
        if (path.indexOf('/public/') === 0) return '/public';
        if (path.indexOf('/assiduousflip/') === 0) return '/assiduousflip';
        return '';
    }

    const APP_BASE_PATH = getAppBasePath();
    // Base login URL without hash; redirectToLogin will append #login so returnUrl stays in the query
    const LOGIN_URL_DEFAULT = APP_BASE_PATH + '/index.html';
    const HOME_URL = APP_BASE_PATH + '/index.html';

    const DASHBOARD_PATHS = {
        admin: APP_BASE_PATH + '/admin/dashboard.html',
        agent: APP_BASE_PATH + '/agent/dashboard.html',
        agentPending: APP_BASE_PATH + '/agent-pending.html',
        client: APP_BASE_PATH + '/client/dashboard.html'
    };

    // Session management defaults (can be overridden by setting authGuard.SESSION_TIMEOUT_MS)
    const DEFAULT_SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
    const DEFAULT_SESSION_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds

    const authGuard = {
        // Exposed so pages can override if needed
        SESSION_TIMEOUT_MS: DEFAULT_SESSION_TIMEOUT_MS,
        SESSION_CHECK_INTERVAL_MS: DEFAULT_SESSION_CHECK_INTERVAL_MS,
        lastActivity: Date.now(),
        sessionCheckInterval: null,
        currentUser: null,
        currentUserRole: null,
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
                // Use environment-aware login URL so local dev points at /public/index.html#login
                loginUrl: LOGIN_URL_DEFAULT,
                requireEmailVerification: false,
                requireCompleteProfile: false,
                profileCompletionUrl: APP_BASE_PATH + '/client/onboarding.html',
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
                
                // Persist current user reference
                this.currentUser = user;
                
                // Check email verification if required
                if (opts.requireEmailVerification && !user.emailVerified) {
                    console.log('[AuthGuard] Email not verified');
                    this.showEmailVerificationRequired();
                    return false;
                }
                
                let userData = null;
                let userRole = 'client';

                // Get user data from Firestore if roles need checking
                if (allowedRoles && allowedRoles.length > 0) {
                    userData = await this.getUserData(user.uid);
                    
                    if (!userData) {
                        console.error('[AuthGuard] User data not found');
                        this.redirectToLogin(opts.loginUrl);
                        return false;
                    }
                    
                    userRole = userData.role || 'client';
                    console.log('[AuthGuard] User role:', userRole);
                    
                    // Persist role for UI helpers
                    this.currentUserRole = userRole;
                    
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
                        // Use environment-aware pending URL so local /public dev stays inside app
                        window.location.href = DASHBOARD_PATHS.agentPending;
                        return false;
                    }
                } else {
                    // We may still want user data for profile completion / role UI
                    userData = await this.getUserData(user.uid);
                    if (userData && userData.role) {
                        this.currentUserRole = userData.role;
                    }
                }

                // Profile completion enforcement (clients/investors)
                if (userData && (userRole === 'client' || userRole === 'investor')) {
                    const profileComplete = userData.profileComplete === true;
                    const path = window.location.pathname || '';
                    const isOnOnboarding = path.indexOf('/client/onboarding') !== -1;
                    if (!profileComplete && (opts.requireCompleteProfile || !isOnOnboarding)) {
                        console.log('[AuthGuard] Incomplete profile, redirecting to onboarding');
                        window.location.href = opts.profileCompletionUrl;
                        return false;
                    }
                }
                
                // Success - update UI with user info and role-based toggles
                console.log('[AuthGuard] \u2713 Access granted');
                this.updateUI(user);
                this.updateRoleUI(this.currentUserRole || (userData && userData.role) || null);
                
                // Start session monitoring / idle timeout handlers
                this.startSessionMonitoring();
                this.trackUserActivity();
                
                if (opts.onSuccess) {
                    opts.onSuccess(user);
                }
                
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
         * Start session monitoring (idle timeout + auth state)
         */
        startSessionMonitoring: function() {
            if (this.sessionCheckInterval) {
                clearInterval(this.sessionCheckInterval);
            }

            const self = this;
            this.sessionCheckInterval = setInterval(function() {
                self.checkSession();
            }, this.SESSION_CHECK_INTERVAL_MS || DEFAULT_SESSION_CHECK_INTERVAL_MS);
        },

        /**
         * Track user activity events to keep session alive
         */
        trackUserActivity: function() {
            const self = this;
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

            events.forEach(function(eventName) {
                document.addEventListener(eventName, function() {
                    self.lastActivity = Date.now();
                });
            });
        },

        /**
         * Periodic session check
         */
        checkSession: function() {
            const now = Date.now();
            const timeoutMs = this.SESSION_TIMEOUT_MS || DEFAULT_SESSION_TIMEOUT_MS;
            const timeSinceLastActivity = now - (this.lastActivity || now);

            // Idle timeout
            if (timeSinceLastActivity > timeoutMs) {
                this.handleSessionTimeout();
                return;
            }

            // Auth state sanity check
            try {
                const user = window.firebaseAuth && window.firebaseAuth.currentUser;
                if (!user) {
                    console.log('[AuthGuard] Session check: user signed out, redirecting to login');
                    this.redirectToLogin(LOGIN_URL_DEFAULT);
                }
            } catch (e) {
                console.warn('[AuthGuard] Session check error:', e);
            }
        },

        /**
         * Handle idle session timeout
         */
        handleSessionTimeout: async function() {
            try {
                // Simple confirm flow to avoid surprising users
                const staySignedIn = window.confirm('Your session has been idle for a while. Stay signed in?');
                if (staySignedIn) {
                    this.lastActivity = Date.now();
                    return;
                }

                // Sign out via Firebase if available
                if (window.firebaseAuth && typeof window.firebaseAuth.signOut === 'function') {
                    await window.firebaseAuth.signOut();
                }

                // Clear cached session data
                sessionStorage.removeItem('assiduousUser');
                localStorage.removeItem('assiduousUser');
                localStorage.removeItem('assiduousRememberMe');

                console.log('[AuthGuard] Session timed out, redirecting to login');
                this.redirectToLogin(LOGIN_URL_DEFAULT);
            } catch (error) {
                console.error('[AuthGuard] Error handling session timeout:', error);
                this.redirectToLogin(LOGIN_URL_DEFAULT);
            }
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

            // Ensure we append returnUrl before any hash so #login remains the fragment
            const hasHash = loginUrl.includes('#');
            let base = loginUrl;
            let hash = '';

            if (hasHash) {
                const parts = loginUrl.split('#');
                base = parts[0];
                hash = '#' + (parts[1] || 'login');
            }

            const separator = base.includes('?') ? '&' : '?';
            const urlWithReturn = `${base}${separator}returnUrl=${returnUrl}`;
            const finalHash = hasHash ? hash : '#login';
            const finalUrl = `${urlWithReturn}${finalHash}`;

            window.location.href = finalUrl;
        },
        
        /**
         * Redirect to user's appropriate dashboard based on role
         */
        redirectToRoleDashboard: function(role, userData) {
            const redirects = {
                admin: DASHBOARD_PATHS.admin,
                agent: userData.agentInfo?.status === 'approved'
                    ? DASHBOARD_PATHS.agent
                    : DASHBOARD_PATHS.agentPending,
                client: DASHBOARD_PATHS.client,
                investor: DASHBOARD_PATHS.client
            };
            
            const url = redirects[role] || DASHBOARD_PATHS.client;
            console.log('[AuthGuard] Redirecting to role dashboard:', url);
            window.location.href = url;
        },
        
        /**
         * Show email verification required message
         */
        showEmailVerificationRequired: function() {
            // Use HOME_URL so "Back to Home" works correctly in both prod and /public dev
            const home = HOME_URL;
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, sans-serif;">
                    <div style="text-align: center; max-width: 500px; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                        <div style="font-size: 48px; margin-bottom: 20px;">✉️</div>
                        <h2 style="color: #1e293b; margin-bottom: 16px; font-size: 24px;">Email Verification Required</h2>
                        <p style="color: #64748b; margin-bottom: 24px; line-height: 1.6;">
                            Please verify your email address to access this page.
                            Check your inbox for the verification link.
                        </p>
                        <button onclick="window.location.href='${home}'" style="
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
            if (!user) return;

            // Update elements with data-user-* attributes
            const elements = {
                '[data-user-email]': user.email,
                '[data-user-name]': user.displayName || (user.email && user.email.split('@')[0]) || '',
                '[data-user-initials]': this.getInitials(user.displayName || user.email),
            };

            if (this.currentUserRole) {
                elements['[data-user-role]'] = this.currentUserRole;
            }
            
            Object.entries(elements).forEach(([selector, value]) => {
                if (value == null) return;
                document.querySelectorAll(selector).forEach(el => {
                    el.textContent = value;
                });
            });
        },
        
        /**
         * Apply role-based UI toggles
         */
        updateRoleUI: function(role) {
            if (!role) return;

            // Elements that should be shown only for specific roles
            document.querySelectorAll('[data-show-for-role]').forEach(function(el) {
                const allowedRoles = (el.getAttribute('data-show-for-role') || '')
                    .split(',')
                    .map(function(r) { return r.trim(); })
                    .filter(Boolean);
                if (allowedRoles.length === 0) return;
                el.style.display = allowedRoles.indexOf(role) !== -1 ? '' : 'none';
            });

            // Elements that should be hidden for specific roles
            document.querySelectorAll('[data-hide-for-role]').forEach(function(el) {
                const hiddenRoles = (el.getAttribute('data-hide-for-role') || '')
                    .split(',')
                    .map(function(r) { return r.trim(); })
                    .filter(Boolean);
                if (hiddenRoles.length === 0) return;
                el.style.display = hiddenRoles.indexOf(role) !== -1 ? 'none' : '';
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
                window.location.href = HOME_URL;
            } catch (error) {
                console.error('[AuthGuard] Sign out error:', error);
            }
        }
    };
    
    // Expose base path & core URLs for other components (headers, nav, etc.)
    authGuard.APP_BASE_PATH = APP_BASE_PATH;
    authGuard.HOME_URL = HOME_URL;
    authGuard.DASHBOARD_PATHS = DASHBOARD_PATHS;
    
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
