/**
 * Migrate metrics.json data to Firebase Firestore collections
 * 
 * This script ensures alignment between the existing metrics.json format
 * and the new real-time Firebase collections structure.
 * 
 * Run in browser console on: https://assiduous-prod.web.app/admin/development/dashboard.html
 */

async function migrateMetricsToFirebase() {
    console.log('🚀 Starting metrics migration to Firebase...');
    
    // Wait for Firebase to be ready
    if (!window.firebaseDb) {
        console.error('❌ Firebase not initialized. Please wait for Firebase to load.');
        return;
    }
    
    const db = window.firebaseDb;
    
    try {
        // Load metrics.json
        const response = await fetch('./metrics.json');
        if (!response.ok) throw new Error('Failed to load metrics.json');
        const metrics = await response.json();
        
        console.log('✅ Loaded metrics.json:', metrics);
        
        // 1. Migrate daily metrics (development_metrics collection)
        console.log('📊 Migrating daily metrics...');
        
        // Today's metrics
        if (metrics.today) {
            await db.collection('development_metrics').doc(metrics.today.date).set({
                date: metrics.today.date,
                hours: parseFloat(metrics.today.hours),
                cost: parseFloat(metrics.today.cost),
                commits: parseInt(metrics.today.commits),
                deployments: parseInt(metrics.today.deployments || 0),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('  ✅ Today\'s metrics migrated');
        }
        
        // 2. Migrate git commits (git_commits collection)
        console.log('📝 Migrating recent commits...');
        
        if (metrics.recentActivity && metrics.recentActivity.length > 0) {
            const batch = db.batch();
            let commitCount = 0;
            
            for (const commit of metrics.recentActivity) {
                const commitRef = db.collection('git_commits').doc(commit.hash);
                batch.set(commitRef, {
                    hash: commit.hash,
                    message: commit.message,
                    author: commit.author,
                    timestamp: new Date(commit.date),
                    filesChanged: 0, // Not in metrics.json, would need git log
                    linesAdded: 0,
                    linesDeleted: 0
                }, { merge: true });
                commitCount++;
            }
            
            await batch.commit();
            console.log(`  ✅ ${commitCount} commits migrated`);
        }
        
        // 3. Migrate feature progress (feature_progress collection)
        console.log('🎯 Migrating feature progress...');
        
        if (metrics.features) {
            const featureBatch = db.batch();
            
            for (const [featureId, feature] of Object.entries(metrics.features)) {
                const featureRef = db.collection('feature_progress').doc(featureId);
                featureBatch.set(featureRef, {
                    status: feature.status,
                    percentage: feature.percentage,
                    description: feature.description,
                    completedTasks: feature.completedTasks || [],
                    remainingTasks: feature.remainingTasks || [],
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            
            await featureBatch.commit();
            console.log(`  ✅ ${Object.keys(metrics.features).length} features migrated`);
        }
        
        // 4. Create project metadata (project_metadata collection)
        console.log('📋 Migrating project metadata...');
        
        if (metrics.project) {
            await db.collection('project_metadata').doc('current').set({
                totalHours: parseFloat(metrics.project.totalHours),
                avgHoursPerDay: parseFloat(metrics.project.avgHoursPerDay),
                totalCost: parseFloat(metrics.project.totalCost),
                laborCost: parseFloat(metrics.project.laborCost),
                toolsCost: parseFloat(metrics.project.toolsCost),
                totalCommits: parseInt(metrics.project.totalCommits),
                totalFiles: parseInt(metrics.project.totalFiles),
                activeDays: parseInt(metrics.project.activeDays),
                totalDays: parseInt(metrics.project.totalDays),
                velocity: parseFloat(metrics.project.velocity),
                completionPercentage: parseFloat(metrics.project.completionPercentage),
                actualStartDate: metrics.project.actualStartDate,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('  ✅ Project metadata migrated');
        }
        
        // 5. Create automation metadata
        console.log('⚙️ Migrating automation metadata...');
        
        if (metrics.automation) {
            await db.collection('automation_status').doc('current').set({
                lastRun: new Date(metrics.automation.lastRun),
                gitHookInstalled: metrics.automation.gitHookInstalled,
                scriptPath: metrics.automation.scriptPath,
                updateFrequency: metrics.automation.updateFrequency,
                version: metrics.automation.version,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('  ✅ Automation metadata migrated');
        }
        
        // 6. Create deployment metadata
        console.log('🚀 Migrating deployment metadata...');
        
        if (metrics.deployment) {
            await db.collection('deployment_status').doc('current').set({
                lastDeployment: new Date(metrics.deployment.lastDeployment),
                totalDeployments: parseInt(metrics.deployment.totalDeployments),
                deploymentFrequency: metrics.deployment.deploymentFrequency,
                environments: metrics.deployment.environments,
                cicd: metrics.deployment.cicd,
                uptime: metrics.deployment.uptime,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('  ✅ Deployment metadata migrated');
        }
        
        console.log('✅ ✅ ✅ Migration complete!');
        console.log('📊 Data is now available for real-time updates');
        console.log('🔄 Refresh the dashboard to see live metrics');
        
        return { success: true, message: 'Migration completed successfully' };
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return { success: false, error: error.message };
    }
}

// Auto-run if loaded in browser
if (typeof window !== 'undefined') {
    console.log('📦 Migration script loaded');
    console.log('💡 Run: migrateMetricsToFirebase()');
    window.migrateMetricsToFirebase = migrateMetricsToFirebase;
}
