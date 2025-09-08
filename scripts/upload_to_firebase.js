#!/usr/bin/env node

/**
 * Firebase Upload Script for Complete Development History
 * 
 * This script takes the output from sync_all_development_history.js and
 * uploads it to Firebase using the existing developmentmetricsservice structure.
 * 
 * Usage:
 *   node scripts/upload_to_firebase.js --data-dir path/to/data [--batch-size 50] [--dry-run]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

class FirebaseHistoryUploader {
    constructor() {
        this.db = null;
        this.batchSize = 50;
        this.uploadStats = {
            sessions: 0,
            metrics: 0,
            commits: 0,
            deployments: 0,
            errors: 0
        };
    }

    /**
     * Initialize Firebase Admin SDK
     */
    async initialize() {
        try {
            // Initialize Firebase Admin (you'll need to set up service account)
            if (!admin.apps.length) {
                // You would normally use a service account key file
                // For now, we'll assume it's initialized elsewhere or use environment variables
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: process.env.FIREBASE_PROJECT_ID || 'assiduous-dev'
                });
            }

            this.db = admin.firestore();
            console.log('✅ Firebase Admin SDK initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Firebase:', error);
            return false;
        }
    }

    /**
     * Upload all historical data to Firebase
     */
    async uploadAllData(dataDir, options = {}) {
        console.log('🚀 Starting Firebase upload of complete development history...');
        
        if (!await this.initialize()) {
            throw new Error('Failed to initialize Firebase');
        }

        this.batchSize = options.batchSize || 50;

        try {
            // Find the most recent data files
            const dataFiles = this.findDataFiles(dataDir);
            
            if (!dataFiles.sessions || !dataFiles.metrics || !dataFiles.commits) {
                throw new Error('Required data files not found in directory');
            }

            // Load all data
            console.log('📁 Loading data files...');
            const sessions = JSON.parse(fs.readFileSync(dataFiles.sessions, 'utf8'));
            const metrics = JSON.parse(fs.readFileSync(dataFiles.metrics, 'utf8'));
            const deployments = dataFiles.deployments ? 
                JSON.parse(fs.readFileSync(dataFiles.deployments, 'utf8')) : [];

            console.log(`📊 Loaded:`);
            console.log(`  - ${sessions.length} development sessions`);
            console.log(`  - ${Object.keys(metrics).length} daily metrics`);
            console.log(`  - ${deployments.length} deployments`);

            if (options.dryRun) {
                console.log('🧪 DRY RUN - No data will be uploaded to Firebase');
                return this.simulateUpload(sessions, metrics, deployments);
            }

            // Upload in order: sessions first, then metrics, then deployments
            await this.uploadSessions(sessions);
            await this.uploadDailyMetrics(metrics);
            await this.uploadDeployments(deployments);
            
            // Generate and upload project analytics
            await this.uploadProjectAnalytics(sessions, metrics, deployments);

            console.log('✅ All historical data uploaded successfully!');
            this.printUploadStats();

        } catch (error) {
            console.error('❌ Upload failed:', error);
            throw error;
        }
    }

    /**
     * Find the most recent data files in directory
     */
    findDataFiles(dataDir) {
        const files = fs.readdirSync(dataDir);
        
        const findLatest = (pattern) => {
            return files
                .filter(f => f.match(pattern))
                .sort()
                .pop();
        };

        return {
            sessions: findLatest(/^sessions_/) ? path.join(dataDir, findLatest(/^sessions_/)) : null,
            metrics: findLatest(/^daily_metrics_/) ? path.join(dataDir, findLatest(/^daily_metrics_/)) : null,
            deployments: findLatest(/^deployments_/) ? path.join(dataDir, findLatest(/^deployments_/)) : null,
            fileChanges: findLatest(/^file_changes_/) ? path.join(dataDir, findLatest(/^file_changes_/)) : null,
            costBreakdown: findLatest(/^cost_breakdown_/) ? path.join(dataDir, findLatest(/^cost_breakdown_/)) : null
        };
    }

    /**
     * Upload development sessions with proper error handling
     */
    async uploadSessions(sessions) {
        console.log('📝 Uploading development sessions...');
        
        const batches = this.createBatches(sessions, this.batchSize);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`  Processing batch ${i + 1}/${batches.length} (${batch.length} sessions)`);
            
            try {
                await this.uploadSessionBatch(batch);
                this.uploadStats.sessions += batch.length;
            } catch (error) {
                console.error(`  ❌ Batch ${i + 1} failed:`, error);
                this.uploadStats.errors++;
                
                // Try individual uploads for failed batch
                await this.uploadSessionsIndividually(batch);
            }
            
            // Add delay between batches to avoid rate limits
            if (i < batches.length - 1) {
                await this.delay(1000);
            }
        }
        
        console.log(`✅ Uploaded ${this.uploadStats.sessions} development sessions`);
    }

    /**
     * Upload a batch of sessions using Firestore batch writes
     */
    async uploadSessionBatch(sessions) {
        const batch = this.db.batch();
        
        for (const session of sessions) {
            const docRef = this.db.collection('development_sessions').doc(session.sessionId);
            batch.set(docRef, {
                ...session,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                syncedAt: admin.firestore.FieldValue.serverTimestamp(),
                historicalImport: true
            });
        }
        
        await batch.commit();
    }

    /**
     * Upload sessions individually (fallback for batch failures)
     */
    async uploadSessionsIndividually(sessions) {
        console.log(`    🔄 Retrying ${sessions.length} sessions individually...`);
        
        for (const session of sessions) {
            try {
                await this.db.collection('development_sessions').doc(session.sessionId).set({
                    ...session,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    syncedAt: admin.firestore.FieldValue.serverTimestamp(),
                    historicalImport: true
                });
                this.uploadStats.sessions++;
            } catch (error) {
                console.error(`    ❌ Failed to upload session ${session.sessionId}:`, error);
                this.uploadStats.errors++;
            }
        }
    }

    /**
     * Upload daily metrics
     */
    async uploadDailyMetrics(metricsData) {
        console.log('📊 Uploading daily metrics...');
        
        const metricsArray = Object.entries(metricsData).map(([date, data]) => ({
            date,
            ...data
        }));
        
        const batches = this.createBatches(metricsArray, this.batchSize);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`  Processing batch ${i + 1}/${batches.length} (${batch.length} metrics)`);
            
            try {
                await this.uploadMetricsBatch(batch);
                this.uploadStats.metrics += batch.length;
            } catch (error) {
                console.error(`  ❌ Batch ${i + 1} failed:`, error);
                this.uploadStats.errors++;
                await this.uploadMetricsIndividually(batch);
            }
            
            if (i < batches.length - 1) {
                await this.delay(1000);
            }
        }
        
        console.log(`✅ Uploaded ${this.uploadStats.metrics} daily metrics`);
    }

    /**
     * Upload metrics batch
     */
    async uploadMetricsBatch(metrics) {
        const batch = this.db.batch();
        
        for (const metric of metrics) {
            const docRef = this.db.collection('development_metrics').doc(metric.date);
            batch.set(docRef, {
                ...metric,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                syncedAt: admin.firestore.FieldValue.serverTimestamp(),
                historicalImport: true
            });
        }
        
        await batch.commit();
    }

    /**
     * Upload metrics individually (fallback)
     */
    async uploadMetricsIndividually(metrics) {
        console.log(`    🔄 Retrying ${metrics.length} metrics individually...`);
        
        for (const metric of metrics) {
            try {
                await this.db.collection('development_metrics').doc(metric.date).set({
                    ...metric,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    syncedAt: admin.firestore.FieldValue.serverTimestamp(),
                    historicalImport: true
                });
                this.uploadStats.metrics++;
            } catch (error) {
                console.error(`    ❌ Failed to upload metric ${metric.date}:`, error);
                this.uploadStats.errors++;
            }
        }
    }

    /**
     * Upload deployment history
     */
    async uploadDeployments(deployments) {
        if (!deployments || deployments.length === 0) {
            console.log('⏭️  No deployments to upload');
            return;
        }

        console.log('🚀 Uploading deployment history...');
        
        const batches = this.createBatches(deployments, this.batchSize);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`  Processing batch ${i + 1}/${batches.length} (${batch.length} deployments)`);
            
            try {
                await this.uploadDeploymentBatch(batch);
                this.uploadStats.deployments += batch.length;
            } catch (error) {
                console.error(`  ❌ Batch ${i + 1} failed:`, error);
                this.uploadStats.errors++;
                await this.uploadDeploymentsIndividually(batch);
            }
            
            if (i < batches.length - 1) {
                await this.delay(1000);
            }
        }
        
        console.log(`✅ Uploaded ${this.uploadStats.deployments} deployments`);
    }

    /**
     * Upload deployment batch
     */
    async uploadDeploymentBatch(deployments) {
        const batch = this.db.batch();
        
        for (const deployment of deployments) {
            const docRef = this.db.collection('deployment_logs').doc(deployment.deploymentId);
            batch.set(docRef, {
                ...deployment,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                historicalImport: true
            });
        }
        
        await batch.commit();
    }

    /**
     * Upload deployments individually (fallback)
     */
    async uploadDeploymentsIndividually(deployments) {
        console.log(`    🔄 Retrying ${deployments.length} deployments individually...`);
        
        for (const deployment of deployments) {
            try {
                await this.db.collection('deployment_logs').doc(deployment.deploymentId).set({
                    ...deployment,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    historicalImport: true
                });
                this.uploadStats.deployments++;
            } catch (error) {
                console.error(`    ❌ Failed to upload deployment ${deployment.deploymentId}:`, error);
                this.uploadStats.errors++;
            }
        }
    }

    /**
     * Generate and upload project analytics summary
     */
    async uploadProjectAnalytics(sessions, metrics, deployments) {
        console.log('📈 Generating and uploading project analytics...');
        
        const analytics = {
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            historicalImport: true,
            
            summary: {
                totalSessions: sessions.length,
                totalMetrics: Object.keys(metrics).length,
                totalDeployments: deployments.length,
                
                totalCost: sessions.reduce((sum, s) => sum + s.costTracking.totalCost, 0),
                totalHours: sessions.reduce((sum, s) => sum + s.duration, 0),
                totalCommits: sessions.reduce((sum, s) => sum + s.metrics.commitsCreated, 0),
                
                dateRange: {
                    start: sessions.length > 0 ? sessions[0].date : null,
                    end: sessions.length > 0 ? sessions[sessions.length - 1].date : null
                }
            },
            
            breakdown: {
                byAuthor: this.calculateAuthorStats(sessions),
                byType: this.calculateTypeStats(sessions),
                byMonth: this.calculateMonthlyStats(sessions),
                technologies: this.extractTechnologies(sessions)
            },
            
            quality: {
                averageCommitsPerSession: sessions.length > 0 ? 
                    sessions.reduce((sum, s) => sum + s.metrics.commitsCreated, 0) / sessions.length : 0,
                averageHoursPerSession: sessions.length > 0 ?
                    sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0,
                averageCostPerCommit: (() => {
                    const totalCommits = sessions.reduce((sum, s) => sum + s.metrics.commitsCreated, 0);
                    const totalCost = sessions.reduce((sum, s) => sum + s.costTracking.totalCost, 0);
                    return totalCommits > 0 ? totalCost / totalCommits : 0;
                })(),
                deploymentSuccessRate: deployments.length > 0 ? 
                    deployments.filter(d => d.success).length / deployments.length : 1
            }
        };

        try {
            await this.db.collection('project_analytics').doc('historical_summary').set(analytics);
            console.log('✅ Project analytics uploaded');
        } catch (error) {
            console.error('❌ Failed to upload project analytics:', error);
            this.uploadStats.errors++;
        }
    }

    /**
     * Helper methods for analytics calculation
     */
    calculateAuthorStats(sessions) {
        const stats = {};
        for (const session of sessions) {
            if (!stats[session.author]) {
                stats[session.author] = { cost: 0, hours: 0, commits: 0, sessions: 0 };
            }
            stats[session.author].cost += session.costTracking.totalCost;
            stats[session.author].hours += session.duration;
            stats[session.author].commits += session.metrics.commitsCreated;
            stats[session.author].sessions++;
        }
        return stats;
    }

    calculateTypeStats(sessions) {
        const stats = {};
        for (const session of sessions) {
            for (const type of session.metrics.typesWorked) {
                if (!stats[type]) {
                    stats[type] = { cost: 0, hours: 0, commits: 0, sessions: 0 };
                }
                const portion = 1 / session.metrics.typesWorked.length;
                stats[type].cost += session.costTracking.totalCost * portion;
                stats[type].hours += session.duration * portion;
                stats[type].commits += session.metrics.commitsCreated * portion;
                stats[type].sessions++;
            }
        }
        return stats;
    }

    calculateMonthlyStats(sessions) {
        const stats = {};
        for (const session of sessions) {
            const month = session.date.substring(0, 7);
            if (!stats[month]) {
                stats[month] = { cost: 0, hours: 0, commits: 0, sessions: 0 };
            }
            stats[month].cost += session.costTracking.totalCost;
            stats[month].hours += session.duration;
            stats[month].commits += session.metrics.commitsCreated;
            stats[month].sessions++;
        }
        return stats;
    }

    extractTechnologies(sessions) {
        const techSet = new Set();
        for (const session of sessions) {
            for (const tech of session.technologies || []) {
                techSet.add(tech);
            }
        }
        return Array.from(techSet);
    }

    /**
     * Utility methods
     */
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    simulateUpload(sessions, metrics, deployments) {
        console.log('🧪 SIMULATION - Would upload:');
        console.log(`  - ${sessions.length} development sessions`);
        console.log(`  - ${Object.keys(metrics).length} daily metrics`);
        console.log(`  - ${deployments.length} deployments`);
        console.log(`  - 1 project analytics summary`);
        
        return {
            sessions: sessions.length,
            metrics: Object.keys(metrics).length,
            deployments: deployments.length,
            analytics: 1,
            errors: 0
        };
    }

    printUploadStats() {
        console.log('\n🎉 FIREBASE UPLOAD COMPLETE');
        console.log('=' .repeat(50));
        console.log(`📝 Development Sessions: ${this.uploadStats.sessions}`);
        console.log(`📊 Daily Metrics: ${this.uploadStats.metrics}`);
        console.log(`🚀 Deployments: ${this.uploadStats.deployments}`);
        console.log(`❌ Errors: ${this.uploadStats.errors}`);
        console.log('=' .repeat(50));
        
        if (this.uploadStats.errors > 0) {
            console.log('⚠️  Some uploads failed. Check the logs above for details.');
        }
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    const getArgValue = (flag) => {
        const index = args.indexOf(flag);
        return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
    };

    const options = {
        dataDir: getArgValue('--data-dir') || path.join(__dirname, '../data/development_history'),
        batchSize: parseInt(getArgValue('--batch-size')) || 50,
        dryRun: args.includes('--dry-run')
    };

    console.log('🚀 Assiduous Firebase Historical Data Upload');
    console.log(`Options: data-dir=${options.dataDir}, batch-size=${options.batchSize}, dry-run=${options.dryRun}`);

    if (!fs.existsSync(options.dataDir)) {
        console.error(`❌ Data directory does not exist: ${options.dataDir}`);
        console.error('Run sync_all_development_history.js first to generate data files');
        process.exit(1);
    }

    const uploader = new FirebaseHistoryUploader();

    try {
        await uploader.uploadAllData(options.dataDir, options);
        console.log('✅ Upload completed successfully!');
    } catch (error) {
        console.error('❌ Upload failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = FirebaseHistoryUploader;
