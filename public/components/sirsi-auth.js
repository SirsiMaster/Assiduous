/**
 * Sirsi Universal Authentication Component (LEGACY)
 * ------------------------------------------------
 * This class belongs to the legacy SirsiAuth stack and is currently QUARANTINED.
 *
 * - Do NOT wire new production pages directly to `SirsiAuth`.
 * - All active auth flows must use the modal-based AuthService from
 *   `public/assets/js/firebase-init.js`.
 * - Once the new auth flows are fully stabilized, SirsiAuth will be updated
 *   to consume the canonical Firebase/app behavior and can become the
 *   reusable reference component for future apps.
 *
 * @module SirsiAuth
 * @version 1.0.0
 * @author Sirsi Development Team
 */

class SirsiAuth {
    constructor(config = {}) {
        this.config = {
            firebaseConfig: config.firebaseConfig || null,
            redirects: {
                admin: '/admin/dashboard.html',
                agent: '/agent/dashboard.html',
                client: '/client/dashboard.html',
                investor: '/investor/dashboard.html',
                pending: '/agent-pending.html',
                login: '/#login',
                signup: '/#signup',
                ...config.redirects
            },
            styles: {
                primaryColor: '#667eea',
                secondaryColor: '#764ba2',
                successColor: '#10b981',
                errorColor: '#ef4444',
                ...config.styles
            },
            validation: {
                passwordMinLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                ...config.validation
            },
            features: {
                enable2FA: true,
                emailVerification: true,
                rememberMe: true,
                socialLogin: false,
                ...config.features
            }
        };

        this.currentUser = null;
        this.authStateListeners = [];
        this.initialized = false;
    }

    /**
     * Initialize Firebase and authentication
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config.firebaseConfig);
            }

            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.storage = firebase.storage();

            // Set up auth state listener
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // Fetch additional user data from Firestore
                    const userDoc = await this.db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        this.currentUser = {
                            ...user,
                            ...userDoc.data()
                        };
                    } else {
                        this.currentUser = user;
                    }
                } else {
                    this.currentUser = null;
                }

                // Notify all listeners
                this.authStateListeners.forEach(listener => listener(this.currentUser));
            });

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize SirsiAuth:', error);
            throw error;
        }
    }

    /**
     * Register auth state change listener
     */
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        // Immediately call with current state
        if (this.initialized) {
            callback(this.currentUser);
        }
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        const errors = [];
        const { validation } = this.config;

        if (password.length < validation.passwordMinLength) {
            errors.push(`Password must be at least ${validation.passwordMinLength} characters`);
        }
        if (validation.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (validation.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (validation.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (validation.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Universal sign up method
     */
    async signUp(userData) {
        try {
            // Validate required fields
            if (!userData.email || !userData.password || !userData.firstName || 
                !userData.lastName || !userData.role) {
                throw new Error('Missing required fields');
            }

            // Validate password
            const passwordValidation = this.validatePassword(userData.password);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.errors.join('. '));
            }

            // Create Firebase Auth user
            const { user } = await this.auth.createUserWithEmailAndPassword(
                userData.email, 
                userData.password
            );

            // Prepare user data for Firestore
            const firestoreData = {
                uid: user.uid,
                email: userData.email.toLowerCase(),
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone || '',
                role: userData.role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: false,
                profileComplete: false
            };

            // Add role-specific data
            if (userData.role === 'agent') {
                firestoreData.agentInfo = {
                    licenseNumber: userData.licenseNumber,
                    licenseState: userData.licenseState,
                    licenseExpiry: userData.licenseExpiry,
                    brokerageName: userData.brokerageName,
                    brokerageAddress: userData.brokerageAddress,
                    brokeragePhone: userData.brokeragePhone || '',
                    brokerageEmail: userData.brokerageEmail || '',
                    status: 'pending_approval',
                    enable2FA: userData.enable2FA !== false,
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Handle license document upload
                if (userData.licenseFile) {
                    const fileRef = this.storage.ref()
                        .child(`licenses/${user.uid}/${userData.licenseFile.name}`);
                    await fileRef.put(userData.licenseFile);
                    const fileUrl = await fileRef.getDownloadURL();
                    firestoreData.agentInfo.licenseDocUrl = fileUrl;
                    firestoreData.agentInfo.licenseDocName = userData.licenseFile.name;
                }
            }

            // Store user data in Firestore
            await this.db.collection('users').doc(user.uid).set(firestoreData);

            // Send email verification if enabled
            if (this.config.features.emailVerification) {
                await user.sendEmailVerification();
            }

            return {
                success: true,
                user: user,
                requiresApproval: userData.role === 'agent',
                message: userData.role === 'agent' 
                    ? 'Account created. Pending admin approval.' 
                    : 'Account created successfully.'
            };

        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Universal sign in method
     */
    async signIn(email, password, rememberMe = false) {
        try {
            // Set persistence based on remember me
            await this.auth.setPersistence(
                rememberMe 
                    ? firebase.auth.Auth.Persistence.LOCAL 
                    : firebase.auth.Auth.Persistence.SESSION
            );

            // Sign in with Firebase Auth
            const { user } = await this.auth.signInWithEmailAndPassword(email, password);

            // Get user data from Firestore
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                throw new Error('User profile not found');
            }

            const userData = userDoc.data();

            // Update last login
            await this.db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Check agent approval status
            if (userData.role === 'agent' && userData.agentInfo?.status !== 'approved') {
                return {
                    success: false,
                    needsApproval: true,
                    status: userData.agentInfo?.status,
                    message: this.getAgentStatusMessage(userData.agentInfo)
                };
            }

            return {
                success: true,
                user: { ...user, ...userData },
                redirect: this.getRedirectUrl(userData.role)
            };

        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error) 
            };
        }
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            return {
                success: true,
                message: 'Password reset email sent'
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            await this.db.collection('users').doc(this.currentUser.uid).update(updates);

            // Update local user object
            this.currentUser = { ...this.currentUser, ...updates };

            return {
                success: true,
                user: this.currentUser
            };
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get user role
     */
    getUserRole() {
        return this.currentUser?.role || null;
    }

    /**
     * Check if user has role
     */
    hasRole(role) {
        return this.currentUser?.role === role;
    }

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(roles) {
        return roles.includes(this.currentUser?.role);
    }

    /**
     * Get redirect URL for role
     */
    getRedirectUrl(role) {
        return this.config.redirects[role] || this.config.redirects.client;
    }

    /**
     * Get agent status message
     */
    getAgentStatusMessage(agentInfo) {
        if (!agentInfo) return 'Agent profile incomplete';
        
        switch (agentInfo.status) {
            case 'pending_approval':
                return 'Your agent account is pending admin approval';
            case 'rejected':
                return `Application rejected: ${agentInfo.rejectionReason || 'Contact support'}`;
            case 'additional_info_required':
                return `Additional information required: ${agentInfo.infoRequestMessage}`;
            default:
                return 'Agent status unknown';
        }
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        if (typeof error === 'string') return error;
        
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/email-already-in-use': 'Email already registered',
            'auth/weak-password': 'Password is too weak',
            'auth/invalid-email': 'Invalid email address',
            'auth/operation-not-allowed': 'Operation not allowed',
            'auth/account-exists-with-different-credential': 'Account exists with different credentials',
            'auth/network-request-failed': 'Network error. Please check your connection',
            'auth/too-many-requests': 'Too many attempts. Please try again later',
            'auth/user-disabled': 'This account has been disabled'
        };

        return errorMessages[error.code] || error.message || 'An error occurred';
    }

    /**
     * Auth guard for protected routes
     */
    async requireAuth(allowedRoles = null) {
        return new Promise((resolve) => {
            this.onAuthStateChanged((user) => {
                if (!user) {
                    window.location.href = this.config.redirects.login;
                    resolve(false);
                } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                    // Redirect to appropriate dashboard if wrong role
                    window.location.href = this.getRedirectUrl(user.role);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    /**
     * Create login form HTML
     */
    createLoginForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="sirsi-auth-container">
                <div class="sirsi-auth-card">
                    <div class="sirsi-auth-logo">
                        <h1>Welcome Back</h1>
                        <p>Sign in to your account</p>
                    </div>
                    
                    <div id="sirsi-auth-error" class="sirsi-auth-error" style="display: none;"></div>
                    <div id="sirsi-auth-success" class="sirsi-auth-success" style="display: none;"></div>
                    
                    <form id="sirsi-login-form" class="sirsi-auth-form">
                        <div class="sirsi-form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" name="email" required 
                                   placeholder="you@example.com" class="sirsi-input">
                        </div>
                        
                        <div class="sirsi-form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" required 
                                   placeholder="Enter your password" class="sirsi-input">
                        </div>
                        
                        <div class="sirsi-form-group sirsi-form-row">
                            <label class="sirsi-checkbox">
                                <input type="checkbox" id="rememberMe" name="rememberMe">
                                <span>Remember me</span>
                            </label>
                            <a href="#" id="forgotPassword" class="sirsi-link">Forgot password?</a>
                        </div>
                        
                        <button type="submit" class="sirsi-btn sirsi-btn-primary sirsi-btn-block">
                            Sign In
                        </button>
                    </form>
                    
                    <div class="sirsi-auth-footer">
                        <p>Don't have an account? <a href="${this.config.redirects.signup}" class="sirsi-link">Sign up</a></p>
                    </div>
                </div>
            </div>
        `;

        // Attach event listeners
        this.attachLoginFormListeners();
    }

    /**
     * Attach login form event listeners
     */
    attachLoginFormListeners() {
        const form = document.getElementById('sirsi-login-form');
        const forgotLink = document.getElementById('forgotPassword');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = form.email.value;
                const password = form.password.value;
                const rememberMe = form.rememberMe.checked;

                // Show loading state
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Signing in...';
                submitBtn.disabled = true;

                const result = await this.signIn(email, password, rememberMe);

                if (result.success) {
                    this.showSuccess('Login successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = result.redirect;
                    }, 1000);
                } else if (result.needsApproval) {
                    this.showError(result.message);
                    if (result.status === 'pending_approval') {
                        setTimeout(() => {
                            window.location.href = this.config.redirects.pending;
                        }, 2000);
                    }
                } else {
                    this.showError(result.error);
                }

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        }

        if (forgotLink) {
            forgotLink.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = prompt('Enter your email address:');
                if (email) {
                    const result = await this.resetPassword(email);
                    if (result.success) {
                        this.showSuccess(result.message);
                    } else {
                        this.showError(result.error);
                    }
                }
            });
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = document.getElementById('sirsi-auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successEl = document.getElementById('sirsi-auth-success');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Inject default styles
     */
    injectStyles() {
        const styleId = 'sirsi-auth-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            .sirsi-auth-container {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: linear-gradient(135deg, ${this.config.styles.primaryColor} 0%, ${this.config.styles.secondaryColor} 100%);
            }
            
            .sirsi-auth-card {
                background: white;
                border-radius: 20px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.3);
                padding: 40px;
                width: 100%;
                max-width: 450px;
            }
            
            .sirsi-auth-logo {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .sirsi-auth-logo h1 {
                font-size: 28px;
                font-weight: 800;
                background: linear-gradient(135deg, ${this.config.styles.primaryColor} 0%, ${this.config.styles.secondaryColor} 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 8px;
            }
            
            .sirsi-auth-logo p {
                color: #64748b;
            }
            
            .sirsi-auth-form {
                margin-bottom: 24px;
            }
            
            .sirsi-form-group {
                margin-bottom: 20px;
            }
            
            .sirsi-form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #334155;
                font-size: 14px;
            }
            
            .sirsi-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 10px;
                font-size: 15px;
                transition: all 0.2s;
            }
            
            .sirsi-input:focus {
                outline: none;
                border-color: ${this.config.styles.primaryColor};
                box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
            }
            
            .sirsi-form-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .sirsi-checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 14px;
                color: #475569;
            }
            
            .sirsi-checkbox input {
                width: auto;
            }
            
            .sirsi-link {
                color: ${this.config.styles.primaryColor};
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
            }
            
            .sirsi-link:hover {
                text-decoration: underline;
            }
            
            .sirsi-btn {
                padding: 14px 24px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .sirsi-btn-primary {
                background: linear-gradient(135deg, ${this.config.styles.primaryColor} 0%, ${this.config.styles.secondaryColor} 100%);
                color: white;
            }
            
            .sirsi-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(102,126,234,0.3);
            }
            
            .sirsi-btn-primary:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .sirsi-btn-block {
                width: 100%;
            }
            
            .sirsi-auth-error {
                background: #fee2e2;
                border: 1px solid #fca5a5;
                color: #991b1b;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            .sirsi-auth-success {
                background: #dcfce7;
                border: 1px solid #86efac;
                color: #166534;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            .sirsi-auth-footer {
                text-align: center;
                font-size: 14px;
                color: #64748b;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.id = styleId;
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Export for use as ES6 module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SirsiAuth;
}

// Make available globally
window.SirsiAuth = SirsiAuth;