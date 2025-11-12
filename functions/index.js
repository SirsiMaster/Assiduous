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

// ============================================================================
// QR CODE & INVITATION SYSTEM
// ============================================================================

/**
 * Generate unique referral code and QR code URL for user
 * Triggered when user profile is created or when manually requested
 */
exports.generateReferralCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        const userId = context.auth.uid;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }

        const userData = userDoc.data();
        
        // Generate unique referral code (8 char alphanumeric)
        const referralCode = generateUniqueCode(8);
        
        // QR code URL using QR Server API (free, no API key needed)
        const baseUrl = 'https://assiduous-prod.web.app';
        const signupUrl = `${baseUrl}/signup.html?ref=${referralCode}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(signupUrl)}`;
        
        // Update user profile with referral code and QR code URL
        await userRef.update({
            referralCode: referralCode,
            qrCodeUrl: qrCodeUrl,
            referralSignupUrl: signupUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Generated referral code for user ${userId}: ${referralCode}`);
        
        return { 
            success: true, 
            referralCode, 
            qrCodeUrl,
            signupUrl 
        };
        
    } catch (error) {
        console.error('❌ Error generating referral code:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Send client invitation via email
 * Creates temp user account and sends invitation with QR code
 */
exports.sendClientInvitation = functions
    .runWith({
        secrets: ['SENDGRID_API_KEY']
    })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { clientEmail, clientName, personalMessage } = data;

    if (!clientEmail || !clientName) {
        throw new functions.https.HttpsError('invalid-argument', 'clientEmail and clientName are required');
    }

    try {
        const agentId = context.auth.uid;
        const agentDoc = await db.collection('users').doc(agentId).get();
        
        if (!agentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Agent not found');
        }

        const agentData = agentDoc.data();
        const agentName = agentData.displayName || agentData.email;
        const agentReferralCode = agentData.referralCode;

        if (!agentReferralCode) {
            throw new functions.https.HttpsError('failed-precondition', 'Agent must have referral code. Call generateReferralCode first.');
        }

        // Create temporary client record
        const tempToken = generateUniqueCode(16);
        const invitationData = {
            email: clientEmail,
            name: clientName,
            agentId: agentId,
            agentName: agentName,
            agentReferralCode: agentReferralCode,
            tempToken: tempToken,
            status: 'invited',
            invitedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
        };

        await db.collection('client_invitations').add(invitationData);

        // Send email via SendGrid
        const sgMail = require('@sendgrid/mail');
        const sendGridApiKey = process.env.SENDGRID_API_KEY;
        
        if (!sendGridApiKey) {
            console.warn('⚠️ SendGrid API key not configured. Email not sent.');
            return { success: true, emailSent: false, tempToken };
        }

        sgMail.setApiKey(sendGridApiKey);

        const signupUrl = `https://assiduous-prod.web.app/signup.html?token=${tempToken}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(signupUrl)}`;

        const emailHtml = `
            <h2>Welcome to Assiduous Real Estate</h2>
            <p>Hi ${clientName},</p>
            <p>${agentName} has invited you to join Assiduous.</p>
            ${personalMessage ? `<p><em>${personalMessage}</em></p>` : ''}
            <p>Click the link below to complete your registration:</p>
            <p><a href="${signupUrl}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Complete Registration</a></p>
            <p>Or scan this QR code:</p>
            <img src="${qrCodeUrl}" alt="Registration QR Code" style="max-width:200px;" />
            <p style="color:#666;font-size:12px;margin-top:24px;">This invitation expires in 7 days.</p>
        `;

        const msg = {
            to: clientEmail,
            from: 'noreply@assiduous.com', // TODO: Configure verified sender
            subject: `${agentName} invited you to Assiduous`,
            html: emailHtml
        };

        await sgMail.send(msg);

        console.log(`✅ Invitation sent to ${clientEmail} from agent ${agentId}`);
        
        return { 
            success: true, 
            emailSent: true, 
            tempToken,
            signupUrl
        };
        
    } catch (error) {
        console.error('❌ Error sending client invitation:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Process QR code signup
 * Links new user to agent via referral code
 */
exports.processQRSignup = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { referralCode } = data;

    if (!referralCode) {
        throw new functions.https.HttpsError('invalid-argument', 'referralCode is required');
    }

    try {
        const userId = context.auth.uid;
        
        // Find agent with this referral code
        const agentQuery = await db.collection('users')
            .where('referralCode', '==', referralCode)
            .limit(1)
            .get();

        if (agentQuery.empty) {
            throw new functions.https.HttpsError('not-found', 'Invalid referral code');
        }

        const agentDoc = agentQuery.docs[0];
        const agentId = agentDoc.id;
        const agentData = agentDoc.data();

        // Update user with affinity
        await db.collection('users').doc(userId).update({
            affiliatedAgentId: agentId,
            affiliatedAgentName: agentData.displayName || agentData.email,
            referralSource: 'qr_code',
            referralCode: referralCode,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Track referral
        await db.collection('referrals').add({
            agentId: agentId,
            clientId: userId,
            referralCode: referralCode,
            source: 'qr_code',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ QR signup processed: User ${userId} linked to agent ${agentId}`);
        
        return { 
            success: true, 
            agentId,
            agentName: agentData.displayName || agentData.email
        };
        
    } catch (error) {
        console.error('❌ Error processing QR signup:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Activate temp account from invitation token
 * Converts invitation to full user account with affinity
 */
exports.activateTempAccount = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { tempToken } = data;

    if (!tempToken) {
        throw new functions.https.HttpsError('invalid-argument', 'tempToken is required');
    }

    try {
        const userId = context.auth.uid;
        
        // Find invitation
        const invitationQuery = await db.collection('client_invitations')
            .where('tempToken', '==', tempToken)
            .where('status', '==', 'invited')
            .limit(1)
            .get();

        if (invitationQuery.empty) {
            throw new functions.https.HttpsError('not-found', 'Invalid or expired invitation token');
        }

        const invitationDoc = invitationQuery.docs[0];
        const invitationData = invitationDoc.data();

        // Check expiration
        if (invitationData.expiresAt.toDate() < new Date()) {
            await invitationDoc.ref.update({ status: 'expired' });
            throw new functions.https.HttpsError('failed-precondition', 'Invitation has expired');
        }

        // Update user with affinity
        await db.collection('users').doc(userId).update({
            affiliatedAgentId: invitationData.agentId,
            affiliatedAgentName: invitationData.agentName,
            referralSource: 'email_invitation',
            referralCode: invitationData.agentReferralCode,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Mark invitation as accepted
        await invitationDoc.ref.update({
            status: 'accepted',
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
            clientId: userId
        });

        // Track referral
        await db.collection('referrals').add({
            agentId: invitationData.agentId,
            clientId: userId,
            referralCode: invitationData.agentReferralCode,
            source: 'email_invitation',
            invitationId: invitationDoc.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Temp account activated: User ${userId} linked to agent ${invitationData.agentId}`);
        
        return { 
            success: true, 
            agentId: invitationData.agentId,
            agentName: invitationData.agentName
        };
        
    } catch (error) {
        console.error('❌ Error activating temp account:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Share QR code via email or SMS
 * Agent shares their referral QR with clients
 */
exports.shareQRCode = functions
    .runWith({
        secrets: ['SENDGRID_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
    })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { recipientEmail, recipientPhone, method } = data;

    if (!recipientEmail && !recipientPhone) {
        throw new functions.https.HttpsError('invalid-argument', 'recipientEmail or recipientPhone is required');
    }

    try {
        const agentId = context.auth.uid;
        const agentDoc = await db.collection('users').doc(agentId).get();
        
        if (!agentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Agent not found');
        }

        const agentData = agentDoc.data();
        const agentName = agentData.displayName || agentData.email;
        const qrCodeUrl = agentData.qrCodeUrl;
        const signupUrl = agentData.referralSignupUrl;

        if (!qrCodeUrl || !signupUrl) {
            throw new functions.https.HttpsError('failed-precondition', 'Agent must have QR code. Call generateReferralCode first.');
        }

        if (method === 'email' && recipientEmail) {
            const sgMail = require('@sendgrid/mail');
            const sendGridApiKey = process.env.SENDGRID_API_KEY;
            
            if (!sendGridApiKey) {
                console.warn('⚠️ SendGrid API key not configured. Email not sent.');
                return { success: true, sent: false };
            }

            sgMail.setApiKey(sendGridApiKey);

            const emailHtml = `
                <h2>Join ${agentName} on Assiduous</h2>
                <p>Scan this QR code to get started:</p>
                <img src="${qrCodeUrl}" alt="QR Code" style="max-width:250px;" />
                <p>Or click here: <a href="${signupUrl}">${signupUrl}</a></p>
            `;

            const msg = {
                to: recipientEmail,
                from: 'noreply@assiduous.com',
                subject: `Connect with ${agentName} on Assiduous`,
                html: emailHtml
            };

            await sgMail.send(msg);
            
            console.log(`✅ QR code shared via email to ${recipientEmail} by agent ${agentId}`);
        }

        // Send SMS via Twilio
        if (method === 'sms' && recipientPhone) {
            const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
            const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
            const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
            
            if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
                console.warn('⚠️ Twilio credentials not configured. SMS not sent.');
                return { success: true, sent: false, method: 'sms' };
            }
            
            const twilio = require('twilio')(twilioAccountSid, twilioAuthToken);
            
            const smsBody = `${agentName} invited you to Assiduous! Sign up here: ${signupUrl}`;
            
            await twilio.messages.create({
                body: smsBody,
                from: twilioPhoneNumber,
                to: recipientPhone
            });
            
            console.log(`✅ QR code shared via SMS to ${recipientPhone} by agent ${agentId}`);
        }
        
        return { success: true, sent: true };
        
    } catch (error) {
        console.error('❌ Error sharing QR code:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique alphanumeric code
 */
function generateUniqueCode(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
