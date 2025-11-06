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

// ============================================================================
// AGENT PROPERTY MANAGEMENT API
// ============================================================================

/**
 * Create a new property listing
 * Callable by agents only
 */
exports.createProperty = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is an agent
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'agent') {
        throw new functions.https.HttpsError('permission-denied', 'Only agents can create properties');
    }

    try {
        const propertyData = {
            ...data,
            agentId: context.auth.uid,
            agentName: userDoc.data().displayName || userDoc.data().email,
            status: data.status || 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('properties').add(propertyData);
        
        console.log(`✅ Property created by agent ${context.auth.uid}:`, docRef.id);
        return { success: true, propertyId: docRef.id };
        
    } catch (error) {
        console.error('❌ Error creating property:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Update an existing property
 * Agent can only update their own properties
 */
exports.updateProperty = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { propertyId, updates } = data;

    if (!propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId is required');
    }

    try {
        const propertyRef = db.collection('properties').doc(propertyId);
        const propertyDoc = await propertyRef.get();

        if (!propertyDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Property not found');
        }

        const propertyData = propertyDoc.data();

        // Check if user is agent who owns this property OR an admin
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userRole = userDoc.data()?.role;
        
        if (propertyData.agentId !== context.auth.uid && userRole !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'You can only update your own properties');
        }

        await propertyRef.update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Property ${propertyId} updated by ${context.auth.uid}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error updating property:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Delete a property
 * Agent can only delete their own properties
 */
exports.deleteProperty = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { propertyId } = data;

    if (!propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId is required');
    }

    try {
        const propertyRef = db.collection('properties').doc(propertyId);
        const propertyDoc = await propertyRef.get();

        if (!propertyDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Property not found');
        }

        const propertyData = propertyDoc.data();

        // Check if user is agent who owns this property OR an admin
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const userRole = userDoc.data()?.role;
        
        if (propertyData.agentId !== context.auth.uid && userRole !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'You can only delete your own properties');
        }

        await propertyRef.delete();

        console.log(`✅ Property ${propertyId} deleted by ${context.auth.uid}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error deleting property:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Get agent's properties
 * Returns all properties owned by the authenticated agent
 */
exports.getAgentProperties = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        const { status, limit } = data;
        
        let query = db.collection('properties').where('agentId', '==', context.auth.uid);
        
        if (status) {
            query = query.where('status', '==', status);
        }
        
        query = query.orderBy('createdAt', 'desc');
        
        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();
        const properties = [];
        
        snapshot.forEach(doc => {
            properties.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, properties };
        
    } catch (error) {
        console.error('❌ Error getting agent properties:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
