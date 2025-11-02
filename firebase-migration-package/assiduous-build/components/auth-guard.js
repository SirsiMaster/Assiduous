/**
 * Auth Guard Middleware
 * Protects routes and ensures proper authentication across all pages
 * Part of the Sirsi Authentication System
 */

class AuthGuard {
    constructor(config = {}) {
        this.auth = null;
        
        // Dynamic environment detection
        this.environment = this.detectEnvironment();
        
        this.config = {
            checkInterval: 30000, // Check session every 30 seconds
            sessionTimeout: 3600000, // 1 hour
            ...config
        };
        
        this.lastActivity = Date.now();
        this.sessionCheckInterval = null;
    }
    
    /**
     * Detect current environment (staging or production)
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('staging')) {
            return 'staging';
        } else if (hostname.includes('prod') || hostname === 'assiduousflip.com' || hostname === 'www.assiduousflip.com') {
            return 'production';
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        
        return 'production'; // default
    }

    /**
     * Initialize auth guard with SirsiAuth instance
     */
    async initialize(sirsiAuthInstance) {
        if (!sirsiAuthInstance) {
            throw new Error('SirsiAuth instance is required');
        }
        
        this.auth = sirsiAuthInstance;
        
        // Initialize Firebase if not already done
        if (!this.auth.initialized) {
            await this.auth.initialize();
        }
        
        // Start session monitoring
        this.startSessionMonitoring();
        
        // Track user activity
        this.trackUserActivity();
        
        return true;
    }

    /**
     * Protect a page with authentication
     * @param {Object} options - Protection options
     * @param {Array} options.allowedRoles - Array of roles that can access this page
     * @param {Function} options.onSuccess - Callback when authentication succeeds
     * @param {Function} options.onFailure - Callback when authentication fails
     */
    async protect(options = {}) {
        const {
            allowedRoles = null,
            onSuccess = null,
            onFailure = null,
            requireEmailVerification = false,
            requireCompleteProfile = false
        } = options;

        return new Promise((resolve) => {
            this.auth.onAuthStateChanged(async (user) => {
                // Check if user is authenticated
                if (!user) {
                    if (onFailure) onFailure('Not authenticated');
                    this.redirectToLogin();
                    resolve(false);
                    return;
                }

                // Check email verification if required
                if (requireEmailVerification && !user.emailVerified) {
                    if (onFailure) onFailure('Email not verified');
                    this.showEmailVerificationRequired();
                    resolve(false);
                    return;
                }

                // Check profile completion if required
                if (requireCompleteProfile && !user.profileComplete) {
                    if (onFailure) onFailure('Profile incomplete');
                    this.redirectToProfileCompletion();
                    resolve(false);
                    return;
                }

                // Check role permissions
                if (allowedRoles && !allowedRoles.includes(user.role)) {
                    if (onFailure) onFailure('Unauthorized role');
                    this.handleUnauthorized(user.role);
                    resolve(false);
                    return;
                }

                // Check agent approval status
                if (user.role === 'agent' && user.agentInfo?.status !== 'approved') {
                    if (onFailure) onFailure('Agent not approved');
                    this.handleUnapprovedAgent(user.agentInfo);
                    resolve(false);
                    return;
                }

                // Authentication successful
                if (onSuccess) onSuccess(user);
                
                // Update UI with user info
                this.updateUIWithUserInfo(user);
                
                resolve(true);
            });
        });
    }

    /**
     * Protect admin routes
     */
    async protectAdmin(onSuccess = null) {
        return this.protect({
            allowedRoles: ['admin'],
            onSuccess,
            requireEmailVerification: true
        });
    }

    /**
     * Protect agent routes
     */
    async protectAgent(onSuccess = null) {
        return this.protect({
            allowedRoles: ['agent'],
            onSuccess,
            requireEmailVerification: true,
            requireCompleteProfile: true
        });
    }

    /**
     * Protect client routes
     */
    async protectClient(onSuccess = null) {
        return this.protect({
            allowedRoles: ['client'],
            onSuccess,
            requireEmailVerification: true
        });
    }

    /**
     * Protect investor routes
     */
    async protectInvestor(onSuccess = null) {
        return this.protect({
            allowedRoles: ['investor'],
            onSuccess,
            requireEmailVerification: true
        });
    }

    /**
     * Protect any authenticated route (any role)
     */
    async protectAuthenticated(onSuccess = null) {
        return this.protect({
            onSuccess,
            requireEmailVerification: false
        });
    }

    /**
     * Start session monitoring
     */
    startSessionMonitoring() {
        // Clear any existing interval
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }

        // Check session periodically
        this.sessionCheckInterval = setInterval(() => {
            this.checkSession();
        }, this.config.checkInterval);
    }

    /**
     * Check if session is still valid
     */
    checkSession() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;

        // Check if session has timed out
        if (timeSinceLastActivity > this.config.sessionTimeout) {
            this.handleSessionTimeout();
        }

        // Check if user is still authenticated with Firebase
        const user = this.auth.getCurrentUser();
        if (!user) {
            this.redirectToLogin();
        }
    }

    /**
     * Track user activity to keep session alive
     */
    trackUserActivity() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            });
        });
    }

    /**
     * Handle session timeout
     */
    async handleSessionTimeout() {
        // Show timeout warning
        if (confirm('Your session has expired. Would you like to continue?')) {
            // Refresh the session
            this.lastActivity = Date.now();
        } else {
            // Sign out and redirect
            await this.auth.signOut();
            this.redirectToLogin();
        }
    }

    /**
     * Handle login requirement - dynamically based on current page
     */
    redirectToLogin() {
        const currentPath = window.location.pathname;
        
        // If already on landing page, trigger login modal
        if (currentPath === '/' || currentPath === '/index.html') {
            this.triggerLoginModal();
            return;
        }
        
        // If on a protected page, go to landing page (modals will be available)
        const returnUrl = encodeURIComponent(currentPath);
        window.location.href = `/?return=${returnUrl}`;
    }
    
    /**
     * Trigger the login modal on landing page
     */
    triggerLoginModal() {
        // Try to trigger the existing modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('active');
            return;
        }
        
        // If modal doesn't exist, show a simple prompt
        alert('Please sign in to continue. You will be redirected to the sign-in page.');
        window.location.href = '/';
    }

    /**
     * Redirect to profile completion
     */
    redirectToProfileCompletion() {
        window.location.href = '/profile/complete.html';
    }

    /**
     * Handle unauthorized access
     */
    handleUnauthorized(userRole) {
        // Redirect to user's appropriate dashboard
        const redirectUrl = this.auth.getRedirectUrl(userRole);
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = this.config.unauthorizedUrl;
        }
    }

    /**
     * Handle unapproved agent
     */
    handleUnapprovedAgent(agentInfo) {
        if (agentInfo?.status === 'pending_approval') {
            window.location.href = '/agent-pending.html';
        } else if (agentInfo?.status === 'rejected') {
            alert(`Your agent application was rejected: ${agentInfo.rejectionReason || 'Contact support'}`);
            window.location.href = '/';
        } else {
            alert('Your agent account requires approval. Please complete your profile.');
            window.location.href = '/signup.html';
        }
    }

    /**
     * Show email verification required message
     */
    showEmailVerificationRequired() {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
                <div style="text-align: center; max-width: 400px;">
                    <h2 style="color: #1e293b; margin-bottom: 16px;">Email Verification Required</h2>
                    <p style="color: #64748b; margin-bottom: 24px;">
                        Please verify your email address to access this page.
                        Check your inbox for the verification link.
                    </p>
                    <button onclick="resendVerification()" style="
                        padding: 12px 24px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-right: 12px;
                    ">Resend Verification Email</button>
                    <a href="/" style="
                        display: inline-block;
                        padding: 12px 24px;
                        background: #e2e8f0;
                        color: #475569;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                    ">Back to Home</a>
                </div>
            </div>
        `;

        window.resendVerification = async () => {
            const user = this.auth.getCurrentUser();
            if (user) {
                try {
                    await window.auth.currentUser.sendEmailVerification();
                    alert('Verification email sent! Please check your inbox.');
                } catch (error) {
                    alert('Failed to send verification email. Please try again.');
                }
            }
        };
    }

    /**
     * Update UI with user information
     */
    updateUIWithUserInfo(user) {
        // Update any user-specific elements in the UI
        const userNameElements = document.querySelectorAll('[data-user-name]');
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        const userRoleElements = document.querySelectorAll('[data-user-role]');
        const userInitialsElements = document.querySelectorAll('[data-user-initials]');

        userNameElements.forEach(el => {
            el.textContent = `${user.firstName} ${user.lastName}`;
        });

        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });

        userRoleElements.forEach(el => {
            el.textContent = user.role;
        });

        userInitialsElements.forEach(el => {
            const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
            el.textContent = initials;
        });

        // Show/hide role-specific elements
        document.querySelectorAll('[data-show-for-role]').forEach(el => {
            const allowedRoles = el.dataset.showForRole.split(',');
            el.style.display = allowedRoles.includes(user.role) ? '' : 'none';
        });

        document.querySelectorAll('[data-hide-for-role]').forEach(el => {
            const hiddenRoles = el.dataset.hideForRole.split(',');
            el.style.display = hiddenRoles.includes(user.role) ? 'none' : '';
        });
    }

    /**
     * Cleanup on page unload
     */
    destroy() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
    }
}

// Export for use as ES6 module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthGuard;
}

// Make available globally
window.AuthGuard = AuthGuard;

// Auto-initialize if sirsi-auth is already loaded
if (window.SirsiAuth) {
    window.authGuard = new AuthGuard();
}