/**
 * OpenSign Integration Service
 * Handles all interactions with OpenSign API for document signing
 */

import { firebaseservice } from '/assets/js/firebaseservice.js';
import { encryptionservice } from '/assets/js/encryptionservice.js';

export class OpenSignService {
  constructor() {
    this.firebaseService = new firebaseservice();
    this.encryptionService = new encryptionservice();
    
    // OpenSign API configuration
    this.apiBaseUrl = process.env.OPENSIGN_API_URL || 'http://localhost:1337/parse';
    this.applicationId = process.env.OPENSIGN_APP_ID || 'assiduous-opensign-app';
    this.masterKey = process.env.OPENSIGN_MASTER_KEY;
    this.webhookSecret = process.env.OPENSIGN_WEBHOOK_SECRET;
    
    // Collection names
    this.collections = {
      signingTemplates: 'signingTemplates',
      signingSessions: 'signingSessions',
      transactions: 'transactions'
    };
  }

  /**
   * Initialize OpenSign connection and verify API availability
   */
  async initialize() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('OpenSign API is not available');
      }
      
      console.log('OpenSign API connection established');
      return true;
    } catch (error) {
      console.error('Failed to initialize OpenSign connection:', error);
      return false;
    }
  }

  /**
   * Get standard headers for OpenSign API requests
   */
  getHeaders(includeSession = false) {
    const headers = {
      'X-Parse-Application-Id': this.applicationId,
      'X-Parse-Master-Key': this.masterKey,
      'Content-Type': 'application/json'
    };
    
    if (includeSession && this.sessionToken) {
      headers['X-Parse-Session-Token'] = this.sessionToken;
    }
    
    return headers;
  }

  /**
   * Create a new signing session for a transaction
   */
  async createSigningSession(transactionId, templateId, signers, options = {}) {
    try {
      // Get the template from Firestore
      const template = await this.firebaseService.getDocument(
        this.collections.signingTemplates,
        templateId
      );
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Create envelope in OpenSign
      const envelope = await this.createEnvelope({
        name: options.name || `Contract - Transaction ${transactionId}`,
        templateId: template.opensignTemplateId,
        signers: signers.map(signer => ({
          email: signer.email,
          name: signer.name,
          role: signer.role || 'Signer',
          order: signer.order || 1
        })),
        expirationDays: options.expirationDays || 7,
        reminderDays: options.reminderDays || 2,
        subject: options.emailSubject || 'Document Ready for Signature',
        message: options.emailMessage || 'Please review and sign the attached document.'
      });
      
      // Store signing session in Firestore
      const sessionData = {
        transactionId,
        templateId,
        envelopeId: envelope.objectId,
        status: 'pending',
        signers: signers.map(s => ({
          ...s,
          status: 'pending',
          signedAt: null,
          otpVerified: false
        })),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (options.expirationDays || 7) * 24 * 60 * 60 * 1000),
        webhookUrl: `${process.env.FIREBASE_FUNCTIONS_URL}/opensignWebhook`,
        metadata: options.metadata || {}
      };
      
      const sessionId = await this.firebaseService.createDocument(
        this.collections.signingSessions,
        sessionData
      );
      
      // Update transaction with signing session reference
      await this.firebaseService.updateDocument(
        this.collections.transactions,
        transactionId,
        { currentSigningSessionId: sessionId }
      );
      
      return {
        sessionId,
        envelopeId: envelope.objectId,
        signingUrls: envelope.signingUrls
      };
    } catch (error) {
      console.error('Error creating signing session:', error);
      throw error;
    }
  }

  /**
   * Create envelope in OpenSign
   */
  async createEnvelope(envelopeData) {
    const response = await fetch(`${this.apiBaseUrl}/classes/Envelope`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...envelopeData,
        webhookUrl: `${process.env.FIREBASE_FUNCTIONS_URL}/opensignWebhook`,
        webhookEvents: ['envelope.sent', 'envelope.viewed', 'envelope.signed', 'envelope.completed', 'envelope.declined']
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create envelope: ${error.error || 'Unknown error'}`);
    }
    
    return response.json();
  }

  /**
   * Get signing URL for a specific signer
   */
  async getSigningUrl(sessionId, signerEmail, generateOtp = true) {
    try {
      // Get session from Firestore
      const session = await this.firebaseService.getDocument(
        this.collections.signingSessions,
        sessionId
      );
      
      if (!session) {
        throw new Error('Signing session not found');
      }
      
      // Find signer
      const signer = session.signers.find(s => s.email === signerEmail);
      if (!signer) {
        throw new Error('Signer not found in session');
      }
      
      // Generate OTP if required
      let otp = null;
      if (generateOtp && !signer.otpVerified) {
        otp = await this.generateAndSendOtp(sessionId, signerEmail);
      }
      
      // Get signing URL from OpenSign
      const response = await fetch(`${this.apiBaseUrl}/functions/getSigningUrl`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          envelopeId: session.envelopeId,
          signerEmail
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get signing URL');
      }
      
      const data = await response.json();
      
      return {
        url: data.result.url,
        otp,
        requiresOtp: generateOtp && !signer.otpVerified
      };
    } catch (error) {
      console.error('Error getting signing URL:', error);
      throw error;
    }
  }

  /**
   * Generate and send OTP for signer verification
   */
  async generateAndSendOtp(sessionId, signerEmail) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await this.hashOtp(otp);
    
    // Store hashed OTP in session
    const session = await this.firebaseService.getDocument(
      this.collections.signingSessions,
      sessionId
    );
    
    const signerIndex = session.signers.findIndex(s => s.email === signerEmail);
    if (signerIndex === -1) {
      throw new Error('Signer not found');
    }
    
    session.signers[signerIndex].otpHash = hashedOtp;
    session.signers[signerIndex].otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await this.firebaseService.updateDocument(
      this.collections.signingSessions,
      sessionId,
      { signers: session.signers }
    );
    
    // Send OTP via email (using existing email service)
    await this.sendOtpEmail(signerEmail, otp);
    
    return true;
  }

  /**
   * Verify OTP for signer
   */
  async verifyOtp(sessionId, signerEmail, otp) {
    try {
      const session = await this.firebaseService.getDocument(
        this.collections.signingSessions,
        sessionId
      );
      
      const signerIndex = session.signers.findIndex(s => s.email === signerEmail);
      if (signerIndex === -1) {
        throw new Error('Signer not found');
      }
      
      const signer = session.signers[signerIndex];
      
      // Check OTP expiry
      if (new Date() > new Date(signer.otpExpiry)) {
        throw new Error('OTP has expired');
      }
      
      // Verify OTP
      const hashedOtp = await this.hashOtp(otp);
      if (hashedOtp !== signer.otpHash) {
        throw new Error('Invalid OTP');
      }
      
      // Mark as verified
      session.signers[signerIndex].otpVerified = true;
      session.signers[signerIndex].otpHash = null;
      session.signers[signerIndex].otpExpiry = null;
      
      await this.firebaseService.updateDocument(
        this.collections.signingSessions,
        sessionId,
        { signers: session.signers }
      );
      
      return true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Hash OTP for secure storage
   */
  async hashOtp(otp) {
    const encoder = new TextEncoder();
    const data = encoder.encode(otp + this.webhookSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(email, otp) {
    // This would integrate with your existing email service (SendGrid)
    const emailData = {
      to: email,
      subject: 'Your Signature Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Signature Verification Required</h2>
          <p>Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        </div>
      `
    };
    
    // Call your email service here
    console.log('Sending OTP email to:', email);
    return true;
  }

  /**
   * Handle webhook from OpenSign
   */
  async handleWebhook(payload, signature) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }
      
      const event = JSON.parse(payload);
      
      // Find session by envelope ID
      const sessions = await this.firebaseService.queryDocuments(
        this.collections.signingSessions,
        [['envelopeId', '==', event.envelopeId]]
      );
      
      if (sessions.length === 0) {
        console.warn('No session found for envelope:', event.envelopeId);
        return;
      }
      
      const session = sessions[0];
      
      // Update session based on event type
      switch (event.type) {
        case 'envelope.viewed':
          await this.handleEnvelopeViewed(session.id, event);
          break;
          
        case 'envelope.signed':
          await this.handleEnvelopeSigned(session.id, event);
          break;
          
        case 'envelope.completed':
          await this.handleEnvelopeCompleted(session.id, event);
          break;
          
        case 'envelope.declined':
          await this.handleEnvelopeDeclined(session.id, event);
          break;
          
        default:
          console.log('Unhandled webhook event type:', event.type);
      }
      
      return true;
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Handle envelope viewed event
   */
  async handleEnvelopeViewed(sessionId, event) {
    const session = await this.firebaseService.getDocument(
      this.collections.signingSessions,
      sessionId
    );
    
    const signerIndex = session.signers.findIndex(s => s.email === event.signerEmail);
    if (signerIndex !== -1) {
      session.signers[signerIndex].viewedAt = new Date(event.timestamp);
      
      await this.firebaseService.updateDocument(
        this.collections.signingSessions,
        sessionId,
        { signers: session.signers }
      );
    }
  }

  /**
   * Handle envelope signed event
   */
  async handleEnvelopeSigned(sessionId, event) {
    const session = await this.firebaseService.getDocument(
      this.collections.signingSessions,
      sessionId
    );
    
    const signerIndex = session.signers.findIndex(s => s.email === event.signerEmail);
    if (signerIndex !== -1) {
      session.signers[signerIndex].status = 'signed';
      session.signers[signerIndex].signedAt = new Date(event.timestamp);
      session.signers[signerIndex].ipAddress = event.ipAddress;
      
      await this.firebaseService.updateDocument(
        this.collections.signingSessions,
        sessionId,
        { signers: session.signers }
      );
      
      // Send notification
      await this.sendSignedNotification(session, event.signerEmail);
    }
  }

  /**
   * Handle envelope completed event
   */
  async handleEnvelopeCompleted(sessionId, event) {
    // Update session status
    await this.firebaseService.updateDocument(
      this.collections.signingSessions,
      sessionId,
      { 
        status: 'completed',
        completedAt: new Date(event.timestamp)
      }
    );
    
    // Download and store signed documents
    await this.storeSignedDocuments(sessionId, event);
    
    // Send completion notifications
    const session = await this.firebaseService.getDocument(
      this.collections.signingSessions,
      sessionId
    );
    await this.sendCompletionNotifications(session);
  }

  /**
   * Handle envelope declined event
   */
  async handleEnvelopeDeclined(sessionId, event) {
    await this.firebaseService.updateDocument(
      this.collections.signingSessions,
      sessionId,
      { 
        status: 'declined',
        declinedAt: new Date(event.timestamp),
        declineReason: event.reason || 'No reason provided'
      }
    );
    
    // Send decline notifications
    const session = await this.firebaseService.getDocument(
      this.collections.signingSessions,
      sessionId
    );
    await this.sendDeclineNotifications(session, event);
  }

  /**
   * Store signed documents in Firebase Storage
   */
  async storeSignedDocuments(sessionId, event) {
    try {
      // Download signed PDF from OpenSign
      const signedPdfUrl = event.documents.signed;
      const auditPdfUrl = event.documents.audit;
      
      // Download documents
      const [signedPdf, auditPdf] = await Promise.all([
        fetch(signedPdfUrl).then(r => r.blob()),
        fetch(auditPdfUrl).then(r => r.blob())
      ]);
      
      // Encrypt documents
      const encryptedSigned = await this.encryptionService.encryptFile(signedPdf);
      const encryptedAudit = await this.encryptionService.encryptFile(auditPdf);
      
      // Store in Firebase Storage
      const session = await this.firebaseService.getDocument(
        this.collections.signingSessions,
        sessionId
      );
      
      const storagePaths = {
        signed: `contracts/${session.transactionId}/${sessionId}/signed.pdf`,
        audit: `contracts/${session.transactionId}/${sessionId}/audit.pdf`
      };
      
      // Upload to Firebase Storage (implementation depends on your storage service)
      await Promise.all([
        this.firebaseService.uploadFile(storagePaths.signed, encryptedSigned),
        this.firebaseService.uploadFile(storagePaths.audit, encryptedAudit)
      ]);
      
      // Update session with document paths
      await this.firebaseService.updateDocument(
        this.collections.signingSessions,
        sessionId,
        { 
          documents: storagePaths,
          documentsStoredAt: new Date()
        }
      );
    } catch (error) {
      console.error('Error storing signed documents:', error);
      throw error;
    }
  }

  /**
   * Send notification when document is signed
   */
  async sendSignedNotification(session, signerEmail) {
    // Create notification in Firestore
    await this.firebaseService.createDocument('notifications', {
      type: 'document_signed',
      sessionId: session.id,
      transactionId: session.transactionId,
      signerEmail,
      message: `${signerEmail} has signed the document`,
      createdAt: new Date(),
      read: false
    });
  }

  /**
   * Send completion notifications
   */
  async sendCompletionNotifications(session) {
    // Notify all participants
    const notifications = session.signers.map(signer => ({
      type: 'document_completed',
      sessionId: session.id,
      transactionId: session.transactionId,
      recipientEmail: signer.email,
      message: 'All parties have signed the document',
      createdAt: new Date(),
      read: false
    }));
    
    await Promise.all(
      notifications.map(n => this.firebaseService.createDocument('notifications', n))
    );
  }

  /**
   * Send decline notifications
   */
  async sendDeclineNotifications(session, event) {
    await this.firebaseService.createDocument('notifications', {
      type: 'document_declined',
      sessionId: session.id,
      transactionId: session.transactionId,
      declinedBy: event.signerEmail,
      reason: event.reason,
      message: `${event.signerEmail} has declined to sign the document`,
      createdAt: new Date(),
      read: false
    });
  }

  /**
   * Get signing session status
   */
  async getSessionStatus(sessionId) {
    const session = await this.firebaseService.getDocument(
      this.collections.signingSessions,
      sessionId
    );
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    return {
      status: session.status,
      signers: session.signers.map(s => ({
        email: s.email,
        name: s.name,
        status: s.status,
        signedAt: s.signedAt
      })),
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt
    };
  }

  /**
   * Cancel a signing session
   */
  async cancelSession(sessionId, reason) {
    try {
      const session = await this.firebaseService.getDocument(
        this.collections.signingSessions,
        sessionId
      );
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Cancel in OpenSign
      await fetch(`${this.apiBaseUrl}/functions/cancelEnvelope`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          envelopeId: session.envelopeId,
          reason
        })
      });
      
      // Update session status
      await this.firebaseService.updateDocument(
        this.collections.signingSessions,
        sessionId,
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  /**
   * Resend signature reminder
   */
  async resendReminder(sessionId, signerEmail) {
    try {
      const session = await this.firebaseService.getDocument(
        this.collections.signingSessions,
        sessionId
      );
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Send reminder via OpenSign
      await fetch(`${this.apiBaseUrl}/functions/sendReminder`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          envelopeId: session.envelopeId,
          signerEmail
        })
      });
      
      // Log reminder sent
      await this.firebaseService.createDocument('notifications', {
        type: 'reminder_sent',
        sessionId,
        signerEmail,
        message: `Reminder sent to ${signerEmail}`,
        createdAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }
}

export default OpenSignService;
