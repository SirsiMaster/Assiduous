// Authentication Service for Assiduous Realty

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password validation rules
const PASSWORD_RULES = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
};

// License number validation rules per state
const LICENSE_RULES = {
    CA: /^\d{8}$/,  // California format
    NY: /^\d{7}$/,  // New York format
    // Add more states as needed
    DEFAULT: /^[A-Z0-9-]{4,}$/  // Generic format
};

// API endpoints
const API_ENDPOINTS = {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    verifyEmail: '/api/auth/verify-email'
};

// Authentication service
const AuthService = {
    /**
     * User authentication
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {string} role - User's role (buyer, seller, agent)
     * @returns {Promise} Authentication result
     */
    async login(email, password, role) {
        try {
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Authentication failed');
            }

            const data = await response.json();
            
            // Store authentication token
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_role', role);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            return {
                success: true,
                user: data.user,
                token: data.token
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message || 'Authentication failed'
            };
        }
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    },

    /**
     * Get current user role
     * @returns {string|null}
     */
    getCurrentRole() {
        return localStorage.getItem('user_role');
    },

    /**
     * Get current user data
     * @returns {Object|null}
     */
    getCurrentUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * User signup
     * @param {Object} userData - User signup data
     * @param {string} userData.name - User's full name
     * @param {string} userData.email - User's email
     * @param {string} userData.password - User's password
     * @param {string} userData.role - User's role (buyer, seller, agent)
     * @param {string} [userData.licenseNumber] - Agent's license number (required for agents)
     * @returns {Promise} Signup result
     */
    async signup(userData) {
        try {
            // Validate input
            if (!userData.name || !userData.email || !userData.password || !userData.role) {
                throw new Error('All required fields must be filled');
            }

            // Validate email format
            if (!EMAIL_REGEX.test(userData.email)) {
                throw new Error('Invalid email format');
            }

            // Validate password strength
            if (userData.password.length < PASSWORD_RULES.minLength) {
                throw new Error(`Password must be at least ${PASSWORD_RULES.minLength} characters`);
            }

            const hasUpperCase = /[A-Z]/.test(userData.password);
            const hasLowerCase = /[a-z]/.test(userData.password);
            const hasNumbers = /\d/.test(userData.password);
            const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(userData.password);

            if (PASSWORD_RULES.requireUppercase && !hasUpperCase) {
                throw new Error('Password must contain at least one uppercase letter');
            }
            if (PASSWORD_RULES.requireLowerCase && !hasLowerCase) {
                throw new Error('Password must contain at least one lowercase letter');
            }
            if (PASSWORD_RULES.requireNumbers && !hasNumbers) {
                throw new Error('Password must contain at least one number');
            }
            if (PASSWORD_RULES.requireSpecialChars && !hasSpecialChars) {
                throw new Error('Password must contain at least one special character');
            }

            // Validate agent license if applicable
            if (userData.role === 'agent') {
                if (!userData.licenseNumber) {
                    throw new Error('License number is required for agents');
                }

                // Use DEFAULT license format if state-specific format is not found
                const licenseFormat = LICENSE_RULES.DEFAULT;
                if (!licenseFormat.test(userData.licenseNumber)) {
                    throw new Error('Invalid license number format');
                }
            }

            const response = await fetch(API_ENDPOINTS.signup, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Signup failed');
            }

            const data = await response.json();
            return {
                success: true,
                message: 'Account created successfully',
                user: data.user
            };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: error.message || 'Failed to create account'
            };
        }
    },

    /**
     * User logout
     */
    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_data');
        window.location.href = '/';
    }
};

export default AuthService;
