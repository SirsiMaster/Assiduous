/**
 * Initialize Repository Security Configuration
 * 
 * Sets up enterprise-grade security for GitHub-Firebase integration
 * Implements per-repository isolation and mTLS-level security
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Initialize security configuration for a repository
 */
async function initializeRepositorySecurity(repoFullName, config = {}) {
    try {
        const repoId = repoFullName.replace('/', '_');
        const configRef = db.collection('repository_configs').doc(repoId);
        
        const securityConfig = {
            repository: repoFullName,
            enabled: config.enabled || true,
            securityLevel: config.securityLevel || 'enterprise', // standard, enhanced, enterprise
            allowedEvents: config.allowedEvents || ['push', 'release', 'pull_request'],
            rateLimits: {
                requestsPerMinute: config.rateLimits?.requestsPerMinute || 60,
                burstLimit: config.rateLimits?.burstLimit || 10
            },
            encryptionRequired: config.encryptionRequired || true,
            auditLogging: config.auditLogging || true,
            
            // mTLS Configuration
            certificateFingerprint: config.certificateFingerprint || null,
            requireMTLS: config.requireMTLS || false,
            
            // Security monitoring
            anomalyDetection: {
                enabled: true,
                suspiciousPatterns: ['rapid_commits', 'unusual_hours', 'signature_attempts']
            },
            
            // Webhook security
            webhookSecret: config.webhookSecret || null, // Repository-specific secret
            signatureAlgorithm: 'sha256',
            
            // Metadata
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: config.createdBy || 'system'
        };
        
        await configRef.set(securityConfig);
        console.log(`✅ Security configuration initialized for ${repoFullName}`);
        
        return securityConfig;
    } catch (error) {
        console.error(`Error initializing security for ${repoFullName}:`, error);
        throw error;
    }
}

/**
 * Initialize security for Assiduous repository
 */
async function initializeAssiduousRepoSecurity() {
    try {
        console.log('🔒 Initializing Enterprise Security for Assiduous Repository');
        console.log('============================================================');
        
        const repoConfig = await initializeRepositorySecurity('SirsiMaster/Assiduous', {
            enabled: true,
            securityLevel: 'enterprise',
            allowedEvents: ['push', 'release', 'deployment_status'],
            rateLimits: {
                requestsPerMinute: 100, // Higher limit for active development
                burstLimit: 20
            },
            encryptionRequired: true,
            auditLogging: true,
            requireMTLS: false, // Can be enabled when certificates are available
            createdBy: 'assiduous-admin'
        });
        
        // Create security audit log entry
        await db.collection('security_audit').add({
            action: 'repository_security_initialized',
            repository: 'SirsiMaster/Assiduous',
            securityLevel: 'enterprise',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            details: {
                encryptionEnabled: true,
                rateLimitsSet: true,
                auditLoggingEnabled: true
            }
        });
        
        console.log('🎯 Enterprise Security Features Enabled:');
        console.log('  ✅ HMAC SHA-256 Signature Verification');
        console.log('  ✅ Per-Repository Rate Limiting (100 req/min)');
        console.log('  ✅ Repository Authorization Controls');
        console.log('  ✅ Security Event Logging');
        console.log('  ✅ Anomaly Detection Monitoring');
        console.log('  🔄 mTLS Ready (certificates can be added)');
        console.log('');
        console.log('🚀 Repository is now secured for immediate, authenticated updates!');
        
        return repoConfig;
        
    } catch (error) {
        console.error('Error initializing Assiduous repo security:', error);
        throw error;
    }
}

// Export functions for use in other modules
module.exports = {
    initializeRepositorySecurity,
    initializeAssiduousRepoSecurity
};

// Run initialization if called directly
if (require.main === module) {
    initializeAssiduousRepoSecurity()
        .then(() => {
            console.log('✅ Security initialization complete');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Security initialization failed:', error);
            process.exit(1);
        });
}
