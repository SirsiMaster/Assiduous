/**
 * Cloud Functions for OpenSign Integration
 * Handles all server-side operations for document signing
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const fetch = require('node-fetch');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// OpenSign configuration
const OPENSIGN_CONFIG = {
  apiUrl: process.env.OPENSIGN_API_URL || 'http://localhost:1337/parse',
  appId: process.env.OPENSIGN_APP_ID || 'assiduous-opensign-app',
  masterKey: process.env.OPENSIGN_MASTER_KEY,
  webhookSecret: process.env.OPENSIGN_WEBHOOK_SECRET,
};

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Create a new signing session
 */
exports.createSigningSession = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { transactionId, templateId, signers, options = {} } = data;

  // Validate input
  if (!transactionId || !templateId || !signers || signers.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    // Get user role
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userRole = userDoc.data()?.role;

    // Check authorization (only agents and admins can create signing sessions)
    if (userRole !== 'agent' && userRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Get template from Firestore
    const templateDoc = await admin.firestore().collection('signingTemplates').doc(templateId).get();
    if (!templateDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Template not found');
    }

    const template = templateDoc.data();

    // Create envelope in OpenSign
    const envelope = await createOpenSignEnvelope({
      name: options.name || `Contract - Transaction ${transactionId}`,
      templateId: template.opensignTemplateId,
      signers: signers.map((signer, index) => ({
        email: signer.email,
        name: signer.name,
        role: signer.role || 'Signer',
        order: signer.order || index + 1,
      })),
      expirationDays: options.expirationDays || 7,
      reminderDays: options.reminderDays || 2,
      subject: options.emailSubject || 'Document Ready for Signature',
      message: options.emailMessage || 'Please review and sign the attached document.',
      webhookUrl: `${process.env.FIREBASE_FUNCTIONS_URL}/opensignWebhook`,
      webhookEvents: ['envelope.sent', 'envelope.viewed', 'envelope.signed', 'envelope.completed', 'envelope.declined'],
    });

    // Create signing session in Firestore
    const sessionData = {
      transactionId,
      templateId,
      envelopeId: envelope.objectId,
      status: 'pending',
      signers: signers.map(s => ({
        ...s,
        status: 'pending',
        signedAt: null,
        viewedAt: null,
        otpVerified: false,
      })),
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + (options.expirationDays || 7) * 24 * 60 * 60 * 1000),
      metadata: options.metadata || {},
    };

    const sessionRef = await admin.firestore().collection('signingSessions').add(sessionData);

    // Update transaction with signing session reference
    await admin.firestore().collection('transactions').doc(transactionId).update({
      currentSigningSessionId: sessionRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send email notifications to signers
    await sendSignatureRequestEmails(signers, envelope, sessionRef.id);

    // Create in-app notifications
    await createSigningNotifications(signers, transactionId, sessionRef.id);

    return {
      sessionId: sessionRef.id,
      envelopeId: envelope.objectId,
      signingUrls: envelope.signingUrls || {},
      success: true,
    };
  } catch (error) {
    console.error('Error creating signing session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Webhook handler for OpenSign events
 */
exports.opensignWebhook = functions.https.onRequest(async (req, res) => {
  // Verify webhook signature
  const signature = req.headers['x-opensign-signature'];
  if (!verifyWebhookSignature(JSON.stringify(req.body), signature)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  console.log('Received OpenSign webhook:', event.type);

  try {
    // Find session by envelope ID
    const sessionsSnapshot = await admin.firestore()
      .collection('signingSessions')
      .where('envelopeId', '==', event.envelopeId)
      .limit(1)
      .get();

    if (sessionsSnapshot.empty) {
      console.warn('No session found for envelope:', event.envelopeId);
      return res.status(404).send('Session not found');
    }

    const sessionDoc = sessionsSnapshot.docs[0];
    const sessionId = sessionDoc.id;
    const sessionData = sessionDoc.data();

    // Handle different event types
    switch (event.type) {
      case 'envelope.viewed':
        await handleEnvelopeViewed(sessionId, sessionData, event);
        break;

      case 'envelope.signed':
        await handleEnvelopeSigned(sessionId, sessionData, event);
        break;

      case 'envelope.completed':
        await handleEnvelopeCompleted(sessionId, sessionData, event);
        break;

      case 'envelope.declined':
        await handleEnvelopeDeclined(sessionId, sessionData, event);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal error');
  }
});

/**
 * Verify OTP for guest signers
 */
exports.verifyOtp = functions.https.onCall(async (data, context) => {
  const { sessionId, email, otp } = data;

  if (!sessionId || !email || !otp) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    const sessionDoc = await admin.firestore().collection('signingSessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();
    const signerIndex = sessionData.signers.findIndex(s => s.email === email);
    
    if (signerIndex === -1) {
      throw new functions.https.HttpsError('not-found', 'Signer not found');
    }

    const signer = sessionData.signers[signerIndex];

    // Check OTP expiry
    if (!signer.otpExpiry || new Date() > new Date(signer.otpExpiry.toDate())) {
      throw new functions.https.HttpsError('failed-precondition', 'OTP has expired');
    }

    // Verify OTP
    const hashedOtp = hashOtp(otp);
    if (hashedOtp !== signer.otpHash) {
      // Increment failed attempts
      const failedAttempts = (signer.failedOtpAttempts || 0) + 1;
      sessionData.signers[signerIndex].failedOtpAttempts = failedAttempts;
      
      if (failedAttempts >= 3) {
        sessionData.signers[signerIndex].otpLocked = true;
        await admin.firestore().collection('signingSessions').doc(sessionId).update({
          signers: sessionData.signers,
        });
        throw new functions.https.HttpsError('permission-denied', 'Too many failed attempts');
      }

      await admin.firestore().collection('signingSessions').doc(sessionId).update({
        signers: sessionData.signers,
      });
      
      throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP');
    }

    // Mark as verified
    sessionData.signers[signerIndex].otpVerified = true;
    sessionData.signers[signerIndex].otpHash = null;
    sessionData.signers[signerIndex].otpExpiry = null;
    sessionData.signers[signerIndex].failedOtpAttempts = 0;

    await admin.firestore().collection('signingSessions').doc(sessionId).update({
      signers: sessionData.signers,
    });

    // Get signing URL from OpenSign
    const signingUrl = await getOpenSignSigningUrl(sessionData.envelopeId, email);

    return {
      success: true,
      signingUrl,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Generate and send OTP
 */
exports.generateOtp = functions.https.onCall(async (data, context) => {
  const { sessionId, email } = data;

  if (!sessionId || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    const sessionDoc = await admin.firestore().collection('signingSessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();
    const signerIndex = sessionData.signers.findIndex(s => s.email === email);
    
    if (signerIndex === -1) {
      throw new functions.https.HttpsError('not-found', 'Signer not found');
    }

    // Check if locked
    if (sessionData.signers[signerIndex].otpLocked) {
      throw new functions.https.HttpsError('permission-denied', 'OTP locked due to too many failed attempts');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashOtp(otp);

    // Update session with hashed OTP
    sessionData.signers[signerIndex].otpHash = hashedOtp;
    sessionData.signers[signerIndex].otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await admin.firestore().collection('signingSessions').doc(sessionId).update({
      signers: sessionData.signers,
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    return {
      success: true,
      message: 'OTP sent to your email',
    };
  } catch (error) {
    console.error('Error generating OTP:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Resend signature reminder
 */
exports.resendReminder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sessionId, signerEmail } = data;

  try {
    const sessionDoc = await admin.firestore().collection('signingSessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();
    
    // Check authorization
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userRole = userDoc.data()?.role;
    
    if (userRole !== 'agent' && userRole !== 'admin' && context.auth.uid !== sessionData.createdBy) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Send reminder via OpenSign
    await sendOpenSignReminder(sessionData.envelopeId, signerEmail);

    // Send custom reminder email
    await sendReminderEmail(signerEmail, sessionId, sessionData);

    // Log reminder
    await admin.firestore().collection('notifications').add({
      type: 'reminder_sent',
      sessionId,
      signerEmail,
      message: `Reminder sent to ${signerEmail}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending reminder:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Scheduled function to expire old sessions
 */
exports.scheduledExpireSessions = functions.pubsub.schedule('0 2 * * *').onRun(async (context) => {
  console.log('Running scheduled session expiration check');
  
  const now = new Date();
  const expiredSessionsSnapshot = await admin.firestore()
    .collection('signingSessions')
    .where('status', '==', 'pending')
    .where('expiresAt', '<=', now)
    .get();

  const batch = admin.firestore().batch();
  let expiredCount = 0;

  for (const doc of expiredSessionsSnapshot.docs) {
    const sessionData = doc.data();
    
    // Cancel in OpenSign
    try {
      await cancelOpenSignEnvelope(sessionData.envelopeId, 'Session expired');
    } catch (error) {
      console.error(`Failed to cancel envelope ${sessionData.envelopeId}:`, error);
    }

    // Update session status
    batch.update(doc.ref, {
      status: 'expired',
      expiredAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create notification
    await admin.firestore().collection('notifications').add({
      type: 'session_expired',
      sessionId: doc.id,
      transactionId: sessionData.transactionId,
      message: 'Signing session has expired',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    expiredCount++;
  }

  if (expiredCount > 0) {
    await batch.commit();
    console.log(`Expired ${expiredCount} sessions`);
  }

  return null;
});

/**
 * Create a template from an uploaded document
 */
exports.createTemplateFromUpload = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { documentId, documentName, documentURL, category } = data;

  if (!documentId || !documentName || !documentURL) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    // Create template in OpenSign
    const response = await fetch(`${OPENSIGN_CONFIG.apiUrl}/classes/Template`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': OPENSIGN_CONFIG.appId,
        'X-Parse-Master-Key': OPENSIGN_CONFIG.masterKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: documentName,
        documentUrl: documentURL,
        category: category || 'other',
        fields: [],
        createdBy: context.auth.uid,
        metadata: {
          documentId,
          uploadedAt: new Date().toISOString()
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create template: ${error.error || 'Unknown error'}`);
    }

    const template = await response.json();

    // Store template reference in Firestore
    const templateData = {
      name: documentName,
      category,
      opensignTemplateId: template.objectId,
      documentId,
      documentURL,
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
    };

    const templateRef = await admin.firestore().collection('signingTemplates').add(templateData);

    return {
      templateId: templateRef.id,
      opensignTemplateId: template.objectId,
    };
  } catch (error) {
    console.error('Error creating template from upload:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Download signed document
 */
exports.downloadSignedDocument = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sessionId, documentType } = data; // documentType: 'signed' or 'audit'

  try {
    const sessionDoc = await admin.firestore().collection('signingSessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();

    // Check authorization
    const userEmail = context.auth.token.email;
    const isSigner = sessionData.signers.some(s => s.email === userEmail);
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userRole = userDoc.data()?.role;
    
    if (!isSigner && userRole !== 'agent' && userRole !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Get document path
    const documentPath = sessionData.documents?.[documentType];
    if (!documentPath) {
      throw new functions.https.HttpsError('not-found', 'Document not found');
    }

    // Generate signed URL for download
    const bucket = admin.storage().bucket();
    const file = bucket.file(documentPath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return { url };
  } catch (error) {
    console.error('Error downloading document:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== Helper Functions =====

/**
 * Create envelope in OpenSign
 */
async function createOpenSignEnvelope(envelopeData) {
  const response = await fetch(`${OPENSIGN_CONFIG.apiUrl}/classes/Envelope`, {
    method: 'POST',
    headers: {
      'X-Parse-Application-Id': OPENSIGN_CONFIG.appId,
      'X-Parse-Master-Key': OPENSIGN_CONFIG.masterKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envelopeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create envelope: ${error.error || 'Unknown error'}`);
  }

  return response.json();
}

/**
 * Get signing URL from OpenSign
 */
async function getOpenSignSigningUrl(envelopeId, signerEmail) {
  const response = await fetch(`${OPENSIGN_CONFIG.apiUrl}/functions/getSigningUrl`, {
    method: 'POST',
    headers: {
      'X-Parse-Application-Id': OPENSIGN_CONFIG.appId,
      'X-Parse-Master-Key': OPENSIGN_CONFIG.masterKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ envelopeId, signerEmail }),
  });

  if (!response.ok) {
    throw new Error('Failed to get signing URL');
  }

  const data = await response.json();
  return data.result.url;
}

/**
 * Send reminder via OpenSign
 */
async function sendOpenSignReminder(envelopeId, signerEmail) {
  const response = await fetch(`${OPENSIGN_CONFIG.apiUrl}/functions/sendReminder`, {
    method: 'POST',
    headers: {
      'X-Parse-Application-Id': OPENSIGN_CONFIG.appId,
      'X-Parse-Master-Key': OPENSIGN_CONFIG.masterKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ envelopeId, signerEmail }),
  });

  if (!response.ok) {
    throw new Error('Failed to send reminder');
  }

  return response.json();
}

/**
 * Cancel envelope in OpenSign
 */
async function cancelOpenSignEnvelope(envelopeId, reason) {
  const response = await fetch(`${OPENSIGN_CONFIG.apiUrl}/functions/cancelEnvelope`, {
    method: 'POST',
    headers: {
      'X-Parse-Application-Id': OPENSIGN_CONFIG.appId,
      'X-Parse-Master-Key': OPENSIGN_CONFIG.masterKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ envelopeId, reason }),
  });

  if (!response.ok) {
    throw new Error('Failed to cancel envelope');
  }

  return response.json();
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', OPENSIGN_CONFIG.webhookSecret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Hash OTP for secure storage
 */
function hashOtp(otp) {
  return crypto
    .createHash('sha256')
    .update(otp + OPENSIGN_CONFIG.webhookSecret)
    .digest('hex');
}

/**
 * Handle envelope viewed event
 */
async function handleEnvelopeViewed(sessionId, sessionData, event) {
  const signerIndex = sessionData.signers.findIndex(s => s.email === event.signerEmail);
  if (signerIndex !== -1) {
    sessionData.signers[signerIndex].viewedAt = event.timestamp;
    
    await admin.firestore().collection('signingSessions').doc(sessionId).update({
      signers: sessionData.signers,
    });
  }
}

/**
 * Handle envelope signed event
 */
async function handleEnvelopeSigned(sessionId, sessionData, event) {
  const signerIndex = sessionData.signers.findIndex(s => s.email === event.signerEmail);
  if (signerIndex !== -1) {
    sessionData.signers[signerIndex].status = 'signed';
    sessionData.signers[signerIndex].signedAt = event.timestamp;
    sessionData.signers[signerIndex].ipAddress = event.ipAddress;
    
    await admin.firestore().collection('signingSessions').doc(sessionId).update({
      signers: sessionData.signers,
    });
    
    // Create notification
    await admin.firestore().collection('notifications').add({
      type: 'document_signed',
      sessionId,
      transactionId: sessionData.transactionId,
      signerEmail: event.signerEmail,
      message: `${event.signerEmail} has signed the document`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Handle envelope completed event
 */
async function handleEnvelopeCompleted(sessionId, sessionData, event) {
  // Update session status
  await admin.firestore().collection('signingSessions').doc(sessionId).update({
    status: 'completed',
    completedAt: event.timestamp,
  });

  // Download and store signed documents
  await storeSignedDocuments(sessionId, sessionData, event);

  // Send completion notifications
  await sendCompletionNotifications(sessionId, sessionData);
}

/**
 * Handle envelope declined event
 */
async function handleEnvelopeDeclined(sessionId, sessionData, event) {
  await admin.firestore().collection('signingSessions').doc(sessionId).update({
    status: 'declined',
    declinedAt: event.timestamp,
    declineReason: event.reason || 'No reason provided',
  });

  // Create notification
  await admin.firestore().collection('notifications').add({
    type: 'document_declined',
    sessionId,
    transactionId: sessionData.transactionId,
    declinedBy: event.signerEmail,
    reason: event.reason,
    message: `${event.signerEmail} has declined to sign the document`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Store signed documents in Firebase Storage
 */
async function storeSignedDocuments(sessionId, sessionData, event) {
  try {
    // Download documents from OpenSign
    const [signedDoc, auditDoc] = await Promise.all([
      fetch(event.documents.signed),
      fetch(event.documents.audit),
    ]);

    const [signedBuffer, auditBuffer] = await Promise.all([
      signedDoc.buffer(),
      auditDoc.buffer(),
    ]);

    // Encrypt documents
    const encryptedSigned = encryptDocument(signedBuffer);
    const encryptedAudit = encryptDocument(auditBuffer);

    // Store in Firebase Storage
    const bucket = admin.storage().bucket();
    const signedPath = `contracts/${sessionData.transactionId}/${sessionId}/signed.pdf`;
    const auditPath = `contracts/${sessionData.transactionId}/${sessionId}/audit.pdf`;

    await Promise.all([
      bucket.file(signedPath).save(encryptedSigned, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            encrypted: 'true',
            sessionId,
            transactionId: sessionData.transactionId,
            completedAt: event.timestamp,
          },
        },
      }),
      bucket.file(auditPath).save(encryptedAudit, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            encrypted: 'true',
            sessionId,
            transactionId: sessionData.transactionId,
            completedAt: event.timestamp,
          },
        },
      }),
    ]);

    // Update session with document paths
    await admin.firestore().collection('signingSessions').doc(sessionId).update({
      documents: {
        signed: signedPath,
        audit: auditPath,
      },
      documentsStoredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error storing signed documents:', error);
    throw error;
  }
}

/**
 * Encrypt document
 */
function encryptDocument(buffer) {
  const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([tag, encrypted]);
}

/**
 * Send signature request emails
 */
async function sendSignatureRequestEmails(signers, envelope, sessionId) {
  const emails = signers.map(signer => ({
    to: signer.email,
    from: process.env.FROM_EMAIL || 'contracts@assiduousflip.com',
    subject: 'Document Ready for Your Signature',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Signature Request</h2>
        <p>Hello ${signer.name},</p>
        <p>A document is waiting for your signature.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL}/sign/${sessionId}?email=${encodeURIComponent(signer.email)}" 
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Sign Document
          </a>
        </div>
        <p>This document will expire in 7 days.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
      </div>
    `,
  }));

  await Promise.all(emails.map(email => sgMail.send(email)));
}

/**
 * Send OTP email
 */
async function sendOtpEmail(email, otp) {
  await sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL || 'contracts@assiduousflip.com',
    subject: 'Your Signature Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Signature Verification Required</h2>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send reminder email
 */
async function sendReminderEmail(email, sessionId, sessionData) {
  await sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL || 'contracts@assiduousflip.com',
    subject: 'Reminder: Document Awaiting Your Signature',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Signature Reminder</h2>
        <p>This is a friendly reminder that a document is still waiting for your signature.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL}/sign/${sessionId}?email=${encodeURIComponent(email)}" 
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Sign Document Now
          </a>
        </div>
        <p>This document will expire soon. Please sign at your earliest convenience.</p>
      </div>
    `,
  });
}

/**
 * Send completion notifications
 */
async function sendCompletionNotifications(sessionId, sessionData) {
  const emails = sessionData.signers.map(signer => ({
    to: signer.email,
    from: process.env.FROM_EMAIL || 'contracts@assiduousflip.com',
    subject: 'Document Signing Complete',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>All Parties Have Signed</h2>
        <p>Hello ${signer.name},</p>
        <p>All required parties have now signed the document.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL}/documents/${sessionId}" 
             style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Signed Document
          </a>
        </div>
        <p>A copy of the fully executed document is available for download from your account.</p>
      </div>
    `,
  }));

  await Promise.all(emails.map(email => sgMail.send(email)));
}

/**
 * Create in-app notifications
 */
async function createSigningNotifications(signers, transactionId, sessionId) {
  const batch = admin.firestore().batch();
  
  signers.forEach(signer => {
    const notificationRef = admin.firestore().collection('notifications').doc();
    batch.set(notificationRef, {
      type: 'signature_request',
      recipientEmail: signer.email,
      transactionId,
      sessionId,
      message: 'You have a new document to sign',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}
