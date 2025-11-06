/**
 * Firebase Cloud Functions for Business Metrics
 * 
 * Automatically updates metrics when data changes in Firestore
 * Triggered by: onCreate, onUpdate, onDelete events
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Update business metrics aggregation
 * Called by all triggers to keep counts in sync
 */
async function updateBusinessMetrics() {
    try {
        const [usersSnap, agentsSnap, propertiesSnap, transactionsSnap] = await Promise.all([
            db.collection('users').get(),
            db.collection('users').where('role', '==', 'agent').get(),
            db.collection('properties').get(),
            db.collection('transactions').get()
        ]);

        // Calculate metrics
        const metrics = {
            users: {
                total: usersSnap.size,
                clients: usersSnap.docs.filter(d => d.data().role === 'client').length,
                agents: agentsSnap.size,
                admins: usersSnap.docs.filter(d => d.data().role === 'admin').length
            },
            properties: {
                total: propertiesSnap.size,
                active: propertiesSnap.docs.filter(d => d.data().status === 'active').length,
                pending: propertiesSnap.docs.filter(d => d.data().status === 'pending').length,
                sold: propertiesSnap.docs.filter(d => d.data().status === 'sold').length
            },
            transactions: {
                total: transactionsSnap.size,
                pending: transactionsSnap.docs.filter(d => d.data().status === 'pending').length,
                completed: transactionsSnap.docs.filter(d => d.data().status === 'completed').length,
                totalValue: transactionsSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0)
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Write to business_metrics collection
        await db.collection('business_metrics').doc('current').set(metrics, { merge: true });
        
        console.log('✅ Business metrics updated:', metrics);
        return metrics;
        
    } catch (error) {
        console.error('❌ Error updating business metrics:', error);
        throw error;
    }
}

// ============================================================================
// USER TRIGGERS
// ============================================================================

exports.onUserCreated = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
        console.log('🆕 New user created:', context.params.userId);
        const userData = snap.data();
        
        // Update metrics
        await updateBusinessMetrics();
        
        // Log activity
        await db.collection('business_activity').add({
            type: 'user_created',
            userId: context.params.userId,
            role: userData.role,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return null;
    });

exports.onUserDeleted = functions.firestore
    .document('users/{userId}')
    .onDelete(async (snap, context) => {
        console.log('🗑️ User deleted:', context.params.userId);
        await updateBusinessMetrics();
        return null;
    });

// ============================================================================
// PROPERTY TRIGGERS
// ============================================================================

exports.onPropertyCreated = functions.firestore
    .document('properties/{propertyId}')
    .onCreate(async (snap, context) => {
        console.log('🏠 New property created:', context.params.propertyId);
        const propertyData = snap.data();
        
        // Update metrics
        await updateBusinessMetrics();
        
        // Log activity
        await db.collection('business_activity').add({
            type: 'property_created',
            propertyId: context.params.propertyId,
            address: propertyData.address,
            price: propertyData.price,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return null;
    });

exports.onPropertyUpdated = functions.firestore
    .document('properties/{propertyId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        // If status changed, update metrics
        if (before.status !== after.status) {
            console.log(`🏠 Property ${context.params.propertyId} status: ${before.status} → ${after.status}`);
            await updateBusinessMetrics();
        }
        
        return null;
    });

exports.onPropertyDeleted = functions.firestore
    .document('properties/{propertyId}')
    .onDelete(async (snap, context) => {
        console.log('🗑️ Property deleted:', context.params.propertyId);
        await updateBusinessMetrics();
        return null;
    });

// ============================================================================
// TRANSACTION TRIGGERS
// ============================================================================

exports.onTransactionCreated = functions.firestore
    .document('transactions/{transactionId}')
    .onCreate(async (snap, context) => {
        console.log('💰 New transaction created:', context.params.transactionId);
        const txData = snap.data();
        
        // Update metrics
        await updateBusinessMetrics();
        
        // Log activity
        await db.collection('business_activity').add({
            type: 'transaction_created',
            transactionId: context.params.transactionId,
            amount: txData.amount,
            propertyId: txData.propertyId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return null;
    });

exports.onTransactionUpdated = functions.firestore
    .document('transactions/{transactionId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        // If status changed, update metrics
        if (before.status !== after.status) {
            console.log(`💰 Transaction ${context.params.transactionId} status: ${before.status} → ${after.status}`);
            await updateBusinessMetrics();
        }
        
        return null;
    });

// ============================================================================
// SCHEDULED METRICS UPDATE (Backup - runs every hour)
// ============================================================================

exports.scheduledMetricsUpdate = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
        console.log('⏰ Scheduled metrics update running...');
        await updateBusinessMetrics();
        return null;
    });

// ============================================================================
// MANUAL METRICS REFRESH (Callable function)
// ============================================================================

exports.refreshBusinessMetrics = functions.https.onCall(async (data, context) => {
    console.log('🔄 Manual metrics refresh requested');
    const metrics = await updateBusinessMetrics();
    return { success: true, metrics };
});
