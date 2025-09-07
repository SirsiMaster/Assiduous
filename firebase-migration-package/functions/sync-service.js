/**
 * Real-time GitHub to Firebase Sync Service
 * 
 * Provides automated synchronization between GitHub repository data
 * and Firebase development metrics collections
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

class GitHubFirebaseSync {
    constructor() {
        this.hourlyRate = 300;
    }

    /**
     * Sync GitHub repository data to Firebase (batch processing)
     */
    async syncRepositoryToFirebase(githubToken = null, daysBack = 30) {
        try {
            console.log(`Starting repository sync for last ${daysBack} days`);
            
            // Fetch commits from GitHub
            const commits = await this.fetchGitHubCommits(githubToken, daysBack);
            
            if (commits.length === 0) {
                return { success: true, message: 'No commits to sync' };
            }

            // Group commits by date
            const commitsByDate = this.groupCommitsByDate(commits);
            
            // Process each day
            let syncedSessions = 0;
            let syncedMetrics = 0;
            
            for (const [date, dayCommits] of Object.entries(commitsByDate)) {
                // Process session data
                const sessionData = this.processCommitsIntoSession(dayCommits, date);
                
                if (sessionData) {
                    // Store session
                    await this.storeSession(sessionData);
                    syncedSessions++;
                    
                    // Update daily metrics
                    await this.updateDailyMetrics(date, sessionData);
                    syncedMetrics++;
                    
                    // Store individual commits
                    await this.storeCommits(dayCommits, date);
                }
            }
            
            // Update project totals
            await this.updateProjectTotals();
            
            console.log(`Repository sync completed: ${syncedSessions} sessions, ${syncedMetrics} daily metrics`);
            
            return {
                success: true,
                syncedSessions,
                syncedMetrics,
                totalCommits: commits.length,
                dateRange: Object.keys(commitsByDate)
            };
            
        } catch (error) {
            console.error('Repository sync error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Fetch commits from GitHub API
     */
    async fetchGitHubCommits(githubToken, daysBack) {
        const since = new Date();
        since.setDate(since.getDate() - daysBack);
        
        const url = `https://api.github.com/repos/SirsiMaster/Assiduous/commits`;
        const params = new URLSearchParams({
            since: since.toISOString(),
            per_page: 100
        });

        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Assiduous-Firebase-Sync'
        };

        if (githubToken) {
            headers['Authorization'] = `token ${githubToken}`;
        }

        const response = await fetch(`${url}?${params}`, { headers });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Group commits by date
     */
    groupCommitsByDate(commits) {
        const grouped = {};
        
        commits.forEach(commit => {
            const date = commit.commit.committer.date.split('T')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(commit);
        });

        return grouped;
    }

    /**
     * Extract session metadata from commit message
     */
    extractSessionMetadata(message) {
        const sessionMatch = message.match(/\[session:(\d+\.?\d*)\]/);
        const costMatch = message.match(/\[cost:\$?(\d+\.?\d*)\]/);
        const typeMatch = message.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([^)]+\))?:/);
        
        return {
            sessionHours: sessionMatch ? parseFloat(sessionMatch[1]) : null,
            explicitCost: costMatch ? parseFloat(costMatch[1]) : null,
            type: typeMatch ? typeMatch[1] : 'unknown',
            scope: typeMatch && typeMatch[2] ? typeMatch[2].slice(1, -1) : null
        };
    }

    /**
     * Process commits into session data
     */
    processCommitsIntoSession(commits, date) {
        if (!commits || commits.length === 0) return null;

        let totalHours = 0;
        let totalCost = 0;
        let explicitData = false;

        // Extract session data from commits
        commits.forEach(commit => {
            const metadata = this.extractSessionMetadata(commit.commit.message);
            if (metadata.sessionHours) {
                totalHours += metadata.sessionHours;
                totalCost += metadata.explicitCost || (metadata.sessionHours * this.hourlyRate);
                explicitData = true;
            }
        });

        // If no explicit data, estimate
        if (!explicitData) {
            totalHours = this.estimateHours(commits);
            totalCost = totalHours * this.hourlyRate;
        }

        const filesChanged = commits.reduce((count, commit) => 
            count + (commit.files ? commit.files.length : 1), 0
        );

        return {
            sessionId: `${date}_${commits.length}_${totalHours}`,
            date,
            duration: Math.round(totalHours * 10) / 10,
            costTracking: {
                totalCost: Math.round(totalCost),
                hourlyRate: this.hourlyRate,
                estimatedFromPattern: !explicitData
            },
            metrics: {
                commitsCreated: commits.length,
                filesModified: filesChanged,
                linesAdded: 0, // Would need detailed API call
                linesDeleted: 0
            },
            velocity: {
                commitsPerHour: totalHours > 0 ? commits.length / totalHours : 0,
                costPerCommit: commits.length > 0 ? totalCost / commits.length : 0,
                hoursPerDay: totalHours,
                efficiency: Math.min((commits.length / Math.max(totalHours, 1)) * 10, 100)
            }
        };
    }

    /**
     * Estimate development hours from commit patterns
     */
    estimateHours(commits) {
        const commitCount = commits.length;
        
        // Base estimate on commit types
        let hours = 0;
        commits.forEach(commit => {
            const message = commit.commit.message;
            if (message.startsWith('feat')) {
                hours += 2; // Features take more time
            } else if (message.startsWith('fix')) {
                hours += 1; // Fixes take moderate time
            } else if (message.startsWith('docs')) {
                hours += 0.5; // Documentation is quicker
            } else {
                hours += 0.5; // Other commits
            }
        });

        // Cap at reasonable daily hours (8 max)
        return Math.min(hours, 8);
    }

    /**
     * Store session data in Firebase
     */
    async storeSession(sessionData) {
        try {
            const sessionRef = db.collection('development_sessions').doc(sessionData.sessionId);
            await sessionRef.set({
                ...sessionData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log(`Stored session: ${sessionData.sessionId}`);
        } catch (error) {
            console.error('Error storing session:', error);
            throw error;
        }
    }

    /**
     * Update daily metrics in Firebase
     */
    async updateDailyMetrics(date, sessionData) {
        try {
            const metricsRef = db.collection('development_metrics').doc(date);
            const doc = await metricsRef.get();

            const newMetrics = {
                date,
                hours: sessionData.duration,
                cost: sessionData.costTracking.totalCost,
                commits: sessionData.metrics.commitsCreated,
                deployments: 0,
                filesModified: sessionData.metrics.filesModified,
                velocity: sessionData.velocity,
                type: 'daily',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (doc.exists) {
                // Merge with existing data (take maximum values to avoid overwriting)
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
            } else {
                await metricsRef.set({
                    ...newMetrics,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            console.log(`Updated daily metrics for ${date}`);
        } catch (error) {
            console.error('Error updating daily metrics:', error);
            throw error;
        }
    }

    /**
     * Store individual commits
     */
    async storeCommits(commits, date) {
        try {
            const batch = db.batch();
            
            commits.forEach(commit => {
                const commitRef = db.collection('git_commits').doc(commit.sha);
                const metadata = this.extractSessionMetadata(commit.commit.message);
                
                batch.set(commitRef, {
                    commitId: commit.sha,
                    message: commit.commit.message,
                    author: commit.commit.author.name,
                    timestamp: commit.commit.committer.date,
                    url: commit.html_url,
                    date,
                    ...metadata,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            
            await batch.commit();
            console.log(`Stored ${commits.length} commits for ${date}`);
        } catch (error) {
            console.error('Error storing commits:', error);
            throw error;
        }
    }

    /**
     * Update project totals
     */
    async updateProjectTotals() {
        try {
            const metricsSnapshot = await db.collection('development_metrics')
                .where('type', '==', 'daily')
                .get();
            
            let totalHours = 0;
            let totalCost = 0;
            let totalCommits = 0;
            let activeDays = 0;
            let totalFiles = 0;
            
            metricsSnapshot.forEach(doc => {
                const data = doc.data();
                totalHours += data.hours || 0;
                totalCost += data.cost || 0;
                totalCommits += data.commits || 0;
                totalFiles = Math.max(totalFiles, data.filesModified || 0);
                if (data.commits > 0) activeDays++;
            });
            
            // Update the latest daily metrics with totals
            const today = new Date().toISOString().split('T')[0];
            const todayRef = db.collection('development_metrics').doc(today);
            
            await todayRef.update({
                totals: {
                    projectHours: totalHours,
                    projectCost: totalCost,
                    totalCommits: totalCommits,
                    totalFiles: totalFiles,
                    activeDays: activeDays
                }
            });
            
            console.log(`Updated project totals: $${totalCost}, ${totalCommits} commits, ${activeDays} active days`);
        } catch (error) {
            console.error('Error updating project totals:', error);
        }
    }
}

/**
 * Cloud Function for manual repository sync
 */
exports.syncGitHubData = functions.https.onRequest(async (req, res) => {
    try {
        const { daysBack = 30, githubToken } = req.body;
        
        const syncService = new GitHubFirebaseSync();
        const result = await syncService.syncRepositoryToFirebase(githubToken, daysBack);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
        
    } catch (error) {
        console.error('Sync function error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Scheduled function to sync data daily
 */
exports.scheduledSync = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    try {
        console.log('Starting scheduled GitHub sync');
        
        const syncService = new GitHubFirebaseSync();
        const result = await syncService.syncRepositoryToFirebase(null, 7); // Last 7 days
        
        console.log('Scheduled sync completed:', result);
        return result;
        
    } catch (error) {
        console.error('Scheduled sync error:', error);
        throw error;
    }
});

// Export sync service for testing
module.exports = { GitHubFirebaseSync };
