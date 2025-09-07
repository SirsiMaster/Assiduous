/**
 * GitHub Webhook Cloud Function
 * 
 * Processes GitHub webhook events and syncs development data to Firebase
 * Maintains GitHub as single source of truth while populating Firebase metrics
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Verify GitHub webhook signature
 */
function verifyGitHubSignature(payload, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const calculatedSignature = `sha256=${hmac.digest('hex')}`;
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
    );
}

/**
 * Extract development session data from commit messages
 */
function extractSessionData(commit) {
    const message = commit.message || '';
    const timestamp = commit.timestamp || new Date().toISOString();
    
    // Look for session markers in commit messages
    const sessionMatch = message.match(/\[session:(\d+\.?\d*)\]/);
    const costMatch = message.match(/\[cost:\$?(\d+\.?\d*)\]/);
    const typeMatch = message.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([^)]+\))?:/);
    
    return {
        commitId: commit.id,
        message: commit.message,
        author: commit.author?.name || commit.committer?.name || 'Unknown',
        timestamp: timestamp,
        url: commit.url,
        sessionHours: sessionMatch ? parseFloat(sessionMatch[1]) : 0,
        estimatedCost: costMatch ? parseFloat(costMatch[1]) : 0,
        type: typeMatch ? typeMatch[1] : 'unknown',
        scope: typeMatch && typeMatch[2] ? typeMatch[2].slice(1, -1) : null,
        filesChanged: commit.added?.length + commit.removed?.length + commit.modified?.length || 0,
        linesAdded: 0, // GitHub webhook doesn't provide this, would need API call
        linesDeleted: 0 // GitHub webhook doesn't provide this, would need API call
    };
}

/**
 * Calculate development metrics from commits
 */
function calculateMetrics(commits, date) {
    const totalCommits = commits.length;
    const totalSessionHours = commits.reduce((sum, c) => sum + (c.sessionHours || 0), 0);
    const totalCost = commits.reduce((sum, c) => sum + (c.estimatedCost || 0), 0);
    const totalFiles = commits.reduce((sum, c) => sum + (c.filesChanged || 0), 0);
    
    // Estimate session hours if not provided (based on commit patterns)
    const estimatedHours = totalSessionHours > 0 ? totalSessionHours : Math.min(totalCommits * 0.5, 8);
    const estimatedCost = totalCost > 0 ? totalCost : estimatedHours * 300; // $300/hour rate
    
    return {
        date,
        hours: estimatedHours,
        cost: estimatedCost,
        commits: totalCommits,
        deployments: 0, // Will be updated by deployment events
        filesModified: totalFiles,
        velocity: {
            commitsPerHour: estimatedHours > 0 ? totalCommits / estimatedHours : 0,
            costPerCommit: totalCommits > 0 ? estimatedCost / totalCommits : 0,
            hoursPerDay: estimatedHours,
            efficiency: Math.min((totalCommits / Math.max(estimatedHours, 1)) * 10, 100)
        },
        type: 'daily',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
}

/**
 * Update or create daily metrics in Firebase
 */
async function updateDailyMetrics(date, commits) {
    try {
        const metricsRef = db.collection('development_metrics').doc(date);
        const doc = await metricsRef.get();
        
        const newMetrics = calculateMetrics(commits, date);
        
        if (doc.exists) {
            // Merge with existing data
            const existing = doc.data();
            const merged = {
                ...existing,
                hours: Math.max(existing.hours || 0, newMetrics.hours),
                cost: Math.max(existing.cost || 0, newMetrics.cost),
                commits: Math.max(existing.commits || 0, newMetrics.commits),
                filesModified: Math.max(existing.filesModified || 0, newMetrics.filesModified),
                velocity: newMetrics.velocity,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            await metricsRef.update(merged);
            console.log(`Updated daily metrics for ${date}`);
        } else {
            await metricsRef.set(newMetrics);
            console.log(`Created daily metrics for ${date}`);
        }
        
        return newMetrics;
    } catch (error) {
        console.error('Error updating daily metrics:', error);
        throw error;
    }
}

/**
 * Store individual commits in Firebase
 */
async function storeCommits(commits) {
    try {
        const batch = db.batch();
        
        commits.forEach(commit => {
            const commitRef = db.collection('git_commits').doc(commit.commitId);
            batch.set(commitRef, {
                ...commit,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        
        await batch.commit();
        console.log(`Stored ${commits.length} commits`);
    } catch (error) {
        console.error('Error storing commits:', error);
        throw error;
    }
}

/**
 * Update project totals
 */
async function updateProjectTotals(newMetrics) {
    try {
        // Get all daily metrics to calculate totals
        const metricsSnapshot = await db.collection('development_metrics')
            .where('type', '==', 'daily')
            .get();
        
        let totalHours = 0;
        let totalCost = 0;
        let totalCommits = 0;
        let activeDays = 0;
        
        metricsSnapshot.forEach(doc => {
            const data = doc.data();
            totalHours += data.hours || 0;
            totalCost += data.cost || 0;
            totalCommits += data.commits || 0;
            if (data.commits > 0) activeDays++;
        });
        
        // Update the latest daily metrics with project totals
        const today = new Date().toISOString().split('T')[0];
        const todayRef = db.collection('development_metrics').doc(today);
        
        await todayRef.update({
            totals: {
                projectHours: totalHours,
                projectCost: totalCost,
                totalCommits: totalCommits,
                totalFiles: newMetrics.filesModified || 0,
                activeDays: activeDays
            }
        });
        
        console.log(`Updated project totals: $${totalCost}, ${totalCommits} commits`);
    } catch (error) {
        console.error('Error updating project totals:', error);
    }
}

/**
 * Process push event from GitHub
 */
async function processPushEvent(payload) {
    try {
        const { commits, repository, pusher } = payload;
        
        if (!commits || commits.length === 0) {
            console.log('No commits in push event');
            return { success: true, message: 'No commits to process' };
        }
        
        console.log(`Processing ${commits.length} commits from ${repository.full_name}`);
        
        // Extract session data from commits
        const processedCommits = commits.map(extractSessionData);
        
        // Group commits by date
        const commitsByDate = {};
        processedCommits.forEach(commit => {
            const date = commit.timestamp.split('T')[0];
            if (!commitsByDate[date]) {
                commitsByDate[date] = [];
            }
            commitsByDate[date].push(commit);
        });
        
        // Store individual commits
        await storeCommits(processedCommits);
        
        // Update daily metrics for each date
        for (const [date, dateCommits] of Object.entries(commitsByDate)) {
            const metrics = await updateDailyMetrics(date, dateCommits);
            
            // Update project totals (only for today to avoid duplicates)
            if (date === new Date().toISOString().split('T')[0]) {
                await updateProjectTotals(metrics);
            }
        }
        
        // Log deployment if this is a push to main
        if (payload.ref === 'refs/heads/main') {
            const deploymentRef = db.collection('deployment_logs').doc();
            await deploymentRef.set({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                commitHash: payload.head_commit?.id || commits[0].id,
                committer: pusher?.name || 'Unknown',
                branch: 'main',
                success: true, // Assuming success for now
                type: 'github_push',
                commitsCount: commits.length
            });
        }
        
        return { 
            success: true, 
            message: `Processed ${commits.length} commits`,
            metricsUpdated: Object.keys(commitsByDate).length
        };
        
    } catch (error) {
        console.error('Error processing push event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Process release event from GitHub
 */
async function processReleaseEvent(payload) {
    try {
        const { action, release } = payload;
        
        if (action === 'published') {
            // Log project milestone
            const milestoneRef = db.collection('project_milestones').doc();
            await milestoneRef.set({
                version: release.tag_name,
                name: release.name || release.tag_name,
                description: release.body || 'Release published',
                releaseDate: release.published_at,
                author: release.author?.login || 'Unknown',
                url: release.html_url,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Logged milestone: ${release.tag_name}`);
        }
        
        return { success: true, message: `Processed release ${action}` };
    } catch (error) {
        console.error('Error processing release event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get repository-specific security configuration
 */
async function getRepositorySecurityConfig(repoFullName) {
    try {
        const configRef = db.collection('repository_configs').doc(repoFullName.replace('/', '_'));
        const configDoc = await configRef.get();
        
        if (!configDoc.exists) {
            // Default security config for unregistered repos
            return {
                authorized: false,
                reason: 'Repository not registered'
            };
        }
        
        const config = configDoc.data();
        return {
            authorized: config.enabled === true,
            securityLevel: config.securityLevel || 'standard',
            allowedEvents: config.allowedEvents || ['push', 'release'],
            rateLimits: config.rateLimits || { requestsPerMinute: 60 },
            encryptionRequired: config.encryptionRequired === true,
            reason: config.enabled ? 'Authorized' : 'Repository disabled'
        };
    } catch (error) {
        console.error('Error getting repository config:', error);
        return {
            authorized: false,
            reason: 'Configuration error'
        };
    }
}

/**
 * Rate limiting check per repository
 */
async function checkRateLimit(repoFullName) {
    const rateLimitKey = `rate_limit_${repoFullName.replace('/', '_')}_${Date.now().toString().slice(0, -4)}`; // Per minute
    const rateLimitRef = db.collection('rate_limits').doc(rateLimitKey);
    
    try {
        const doc = await rateLimitRef.get();
        if (doc.exists) {
            const count = doc.data().count || 0;
            if (count >= 60) { // 60 requests per minute limit
                return { allowed: false, count };
            }
            await rateLimitRef.update({ count: count + 1 });
            return { allowed: true, count: count + 1 };
        } else {
            await rateLimitRef.set({ count: 1, timestamp: admin.firestore.FieldValue.serverTimestamp() });
            return { allowed: true, count: 1 };
        }
    } catch (error) {
        console.error('Rate limit check error:', error);
        return { allowed: true, count: 0 }; // Allow on error
    }
}

/**
 * Main GitHub webhook handler with enterprise security
 */
exports.githubWebhook = functions.https.onRequest(async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Verify request method
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }
        
        // Get repository info early for security checks
        const repoFullName = req.body?.repository?.full_name;
        if (!repoFullName) {
            return res.status(400).json({ error: 'Repository information required' });
        }
        
        // Repository-specific security configuration
        const repoConfig = await getRepositorySecurityConfig(repoFullName);
        if (!repoConfig.authorized) {
            console.error(`Repository ${repoFullName} not authorized: ${repoConfig.reason}`);
            return res.status(403).json({ 
                error: 'Repository not authorized', 
                reason: repoConfig.reason 
            });
        }
        
        // Rate limiting per repository
        const rateCheck = await checkRateLimit(repoFullName);
        if (!rateCheck.allowed) {
            console.error(`Rate limit exceeded for ${repoFullName}`);
            return res.status(429).json({ 
                error: 'Rate limit exceeded', 
                requestCount: rateCheck.count 
            });
        }
        
        // Enhanced HMAC signature verification with repo-specific secrets
        const webhookSecret = functions.config().github?.webhook_secret || 
                             repoConfig.webhookSecret || 
                             process.env.GITHUB_WEBHOOK_SECRET;
        
        if (webhookSecret) {
            const signature = req.headers['x-hub-signature-256'];
            if (!signature || !verifyGitHubSignature(JSON.stringify(req.body), signature, webhookSecret)) {
                console.error(`Invalid GitHub signature for ${repoFullName}`);
                // Log security event
                await db.collection('security_events').add({
                    type: 'invalid_signature',
                    repository: repoFullName,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    headers: req.headers,
                    ip: req.ip
                });
                return res.status(401).json({ error: 'Unauthorized - invalid signature' });
            }
        } else {
            console.error(`No webhook secret configured for ${repoFullName}`);
            return res.status(401).json({ error: 'Webhook secret required' });
        }
        
        // Get event type
        const eventType = req.headers['x-github-event'];
        console.log(`Received GitHub webhook: ${eventType}`);
        
        let result;
        
        switch (eventType) {
            case 'push':
                result = await processPushEvent(req.body);
                break;
                
            case 'release':
                result = await processReleaseEvent(req.body);
                break;
                
            case 'ping':
                result = { success: true, message: 'Webhook ping received' };
                break;
                
            default:
                console.log(`Unhandled event type: ${eventType}`);
                result = { success: true, message: `Event ${eventType} not processed` };
        }
        
        // Send response
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
        
    } catch (error) {
        console.error('GitHub webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Export for testing
module.exports = {
    githubWebhook: exports.githubWebhook,
    extractSessionData,
    calculateMetrics,
    processPushEvent,
    processReleaseEvent
};
