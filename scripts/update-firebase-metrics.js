#!/usr/bin/env node

/**
 * Unified Firebase Metrics Updater
 * 
 * Single source of truth: Firebase Firestore
 * Called by git hook after every commit
 * 
 * Flow: Git Commit → This Script → Firebase → Real-time Dashboard Update
 */

const { execSync } = require('child_process');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../firebase-admin-key.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Firebase service account key not found at:', serviceAccountPath);
    console.log('📝 Create one at: https://console.firebase.google.com/project/assiduous-prod/settings/serviceaccounts/adminsdk');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://assiduous-prod-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Execute git command and return output
 */
function git(command) {
    try {
        return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
    } catch (error) {
        return '';
    }
}

/**
 * Get latest commit info
 */
function getLatestCommit() {
    const hash = git('rev-parse HEAD');
    const message = git('log -1 --pretty=%B');
    const author = git('log -1 --pretty=%an');
    const timestamp = git('log -1 --pretty=%cI');
    const filesChanged = git('diff-tree --no-commit-id --name-only -r HEAD').split('\n').filter(Boolean).length;
    const stats = git('log -1 --shortstat').match(/(\d+) file[s]? changed(?:, (\d+) insertion[s]?\(\+\))?(?:, (\d+) deletion[s]?\(-\))?/);
    
    return {
        hash,
        message,
        author,
        timestamp: new Date(timestamp),
        filesChanged,
        linesAdded: stats ? parseInt(stats[2] || 0) : 0,
        linesDeleted: stats ? parseInt(stats[3] || 0) : 0
    };
}

/**
 * Get project statistics
 */
function getProjectStats() {
    const totalCommits = parseInt(git('rev-list --count HEAD') || 0);
    const totalFiles = git('ls-files').split('\n').filter(Boolean).length;
    const firstCommitDate = git('log --reverse --format=%cI | head -1');
    const startDate = firstCommitDate ? new Date(firstCommitDate).toISOString().split('T')[0] : getToday();
    
    const now = new Date();
    const start = new Date(startDate);
    const totalDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    
    // Get commits per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCommits = parseInt(git(`rev-list --count --since="${thirtyDaysAgo.toISOString()}" HEAD`) || 0);
    const velocity = totalDays > 0 ? (totalCommits / totalDays).toFixed(1) : '0';
    
    return {
        totalCommits,
        totalFiles,
        totalDays,
        velocity: parseFloat(velocity),
        actualStartDate: startDate
    };
}

/**
 * Update Firebase collections
 */
async function updateFirebase() {
    console.log('🚀 Updating Firebase metrics...');
    
    const today = getToday();
    const commit = getLatestCommit();
    const stats = getProjectStats();
    
    try {
        // 1. Add this commit to git_commits collection
        console.log('📝 Adding commit to Firebase...');
        await db.collection('git_commits').doc(commit.hash).set({
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            timestamp: admin.firestore.Timestamp.fromDate(commit.timestamp),
            filesChanged: commit.filesChanged,
            linesAdded: commit.linesAdded,
            linesDeleted: commit.linesDeleted
        });
        
        // 2. Update today's metrics in development_metrics collection
        console.log('📊 Updating daily metrics...');
        const todayRef = db.collection('development_metrics').doc(today);
        const todayDoc = await todayRef.get();
        const todayData = todayDoc.exists ? todayDoc.data() : { commits: 0, hours: 0, cost: 0 };
        
        await todayRef.set({
            date: today,
            commits: (todayData.commits || 0) + 1,
            hours: todayData.hours || 0,
            cost: todayData.cost || 0,
            deployments: todayData.deployments || 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // 3. Update project metadata
        console.log('📋 Updating project metadata...');
        await db.collection('project_metadata').doc('current').set({
            totalCommits: stats.totalCommits,
            totalFiles: stats.totalFiles,
            totalDays: stats.totalDays,
            velocity: stats.velocity,
            actualStartDate: stats.actualStartDate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('✅ Firebase metrics updated successfully!');
        console.log(`   📝 Commit: ${commit.hash.substring(0, 7)} - ${commit.message.split('\n')[0]}`);
        console.log(`   📊 Total commits: ${stats.totalCommits}`);
        console.log(`   🚀 Velocity: ${stats.velocity} commits/day`);
        
    } catch (error) {
        console.error('❌ Error updating Firebase:', error);
        process.exit(1);
    }
}

// Run the update
updateFirebase()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
