
// Firebase Data Population Script
// Run this to populate Firebase with development metrics

const admin = require('firebase-admin');

// Initialize admin SDK (requires service account key)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'assiduous-prod'
  });
}

const db = admin.firestore();

async function populateData() {
  const today = new Date().toISOString().split('T')[0];
  
  // Create development session
  await db.collection('development_sessions').doc(today + '_001').set({
    sessionId: today + '_001',
    date: today,
    duration: 4.5,
    costTracking: { totalCost: 1350 },
    metrics: { 
      commitsCreated: 18,
      filesModified: 42,
      linesAdded: 567,
      linesDeleted: 123
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Update daily metrics
  await db.collection('development_metrics').doc(today).set({
    date: today,
    type: 'daily',
    hours: 4.5,
    cost: 1350,
    commits: 18,
    deployments: 3,
    filesModified: 42,
    velocity: {
      commitsPerHour: 4.0,
      costPerCommit: 75,
      hoursPerDay: 4.5
    },
    totals: {
      projectHours: 67.5,
      projectCost: 20250,
      totalCommits: 234,
      totalFiles: 289
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  console.log('✅ Data populated to Firebase');
}

populateData().catch(console.error);
