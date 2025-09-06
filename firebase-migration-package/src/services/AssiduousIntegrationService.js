/**
 * Assiduous Integration Service
 * Bridges the Firebase migration package with existing Assiduous platform services
 */

import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

class AssiduousIntegrationService {
  constructor() {
    this.auth = getAuth();
    this.db = getFirestore();
    this.baseURL = process.env.REACT_APP_API_URL || 'https://assiduous-prod.web.app/api';
  }

  /**
   * Create a verification for a property transaction
   * Integrates with Assiduous property and transaction flow
   */
  async createPropertyVerification(propertyId, buyerId, agentId, amount, transactionType = 'traditional') {
    try {
      // Get auth token for API call
      const token = await this.auth.currentUser?.getIdToken();
      
      // Determine if this is a micro-flip (under $50K)
      const isMicroFlip = amount <= 50000;
      
      const response = await fetch(`${this.baseURL}/v1/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Idempotency-Key': this.generateIdempotencyKey()
        },
        body: JSON.stringify({
          buyerId,
          propertyId,
          agentId,
          amountCents: Math.round(amount * 100),
          transactionType: isMicroFlip ? 'micro-flip' : transactionType,
          currency: 'USD',
          jurisdiction: 'US'
        })
      });

      if (!response.ok) {
        throw new Error(`Verification creation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store verification reference in local transaction
      await this.linkVerificationToTransaction(propertyId, result.verificationId);
      
      // Notify agent if assigned
      if (agentId) {
        await this.notifyAgent(agentId, result.verificationId, propertyId);
      }
      
      return result;
    } catch (error) {
      console.error('Error creating property verification:', error);
      throw error;
    }
  }

  /**
   * Link verification to existing Assiduous transaction
   */
  async linkVerificationToTransaction(propertyId, verificationId) {
    try {
      // This would integrate with existing transaction service
      const transactionUpdate = {
        verificationId,
        verificationStatus: 'IN_PROGRESS',
        verificationStartedAt: new Date().toISOString()
      };
      
      // Update in local storage or existing service
      const existingData = JSON.parse(localStorage.getItem('transactions') || '{}');
      if (existingData[propertyId]) {
        existingData[propertyId] = {
          ...existingData[propertyId],
          ...transactionUpdate
        };
        localStorage.setItem('transactions', JSON.stringify(existingData));
      }
      
      return true;
    } catch (error) {
      console.error('Error linking verification to transaction:', error);
      return false;
    }
  }

  /**
   * Notify assigned agent about verification
   */
  async notifyAgent(agentId, verificationId, propertyId) {
    try {
      // This would integrate with existing notification service
      const notification = {
        type: 'VERIFICATION_STARTED',
        agentId,
        verificationId,
        propertyId,
        message: `New buyer verification started for property ${propertyId}`,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Store in notifications (would be Firestore in production)
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));
      
      // Could also trigger SMS/email via Twilio/SendGrid here
      return true;
    } catch (error) {
      console.error('Error notifying agent:', error);
      return false;
    }
  }

  /**
   * Check verification status and update transaction
   */
  async checkVerificationStatus(verificationId) {
    try {
      const response = await fetch(`${this.baseURL}/v1/verification/${verificationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.auth.currentUser?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch verification status: ${response.statusText}`);
      }

      const verification = await response.json();
      
      // Update local transaction status based on verification
      if (verification.status === 'PASS' || verification.status === 'FAST_TRACK') {
        await this.updateTransactionStatus(verification.propertyId, 'VERIFIED');
        
        // Calculate commission if agent assigned
        if (verification.agentId) {
          await this.calculateAgentCommission(verification);
        }
      }
      
      return verification;
    } catch (error) {
      console.error('Error checking verification status:', error);
      throw error;
    }
  }

  /**
   * Calculate agent commission for verified transaction
   */
  async calculateAgentCommission(verification) {
    try {
      const amount = verification.amountCents / 100;
      let commissionRate = 0.03; // 3% default
      
      // Higher commission for micro-flips
      if (verification.transactionType === 'micro-flip') {
        commissionRate = 0.05; // 5% for micro-flips
      }
      
      // Bonus for fast-track deals
      if (verification.status === 'FAST_TRACK') {
        commissionRate += 0.01; // 1% bonus
      }
      
      const commission = amount * commissionRate;
      
      // Store commission data
      const commissionData = {
        agentId: verification.agentId,
        verificationId: verification.id,
        propertyId: verification.propertyId,
        transactionAmount: amount,
        commissionRate,
        commissionAmount: commission,
        status: 'PENDING',
        calculatedAt: new Date().toISOString()
      };
      
      // Would store in Firestore in production
      const commissions = JSON.parse(localStorage.getItem('commissions') || '[]');
      commissions.push(commissionData);
      localStorage.setItem('commissions', JSON.stringify(commissions));
      
      return commissionData;
    } catch (error) {
      console.error('Error calculating commission:', error);
      return null;
    }
  }

  /**
   * Get verification analytics for dashboard
   */
  async getVerificationAnalytics(timeRange = '30d') {
    try {
      // This would query Firestore for verification metrics
      const analytics = {
        totalVerifications: 0,
        passedVerifications: 0,
        failedVerifications: 0,
        pendingVerifications: 0,
        averageProcessingTime: 0,
        microFlipVerifications: 0,
        traditionalVerifications: 0,
        fastTrackCount: 0,
        totalValue: 0
      };
      
      // In production, this would be a Firestore query
      // For now, return mock data
      return {
        ...analytics,
        totalVerifications: 45,
        passedVerifications: 38,
        failedVerifications: 3,
        pendingVerifications: 4,
        averageProcessingTime: 4.5, // minutes
        microFlipVerifications: 28,
        traditionalVerifications: 17,
        fastTrackCount: 15,
        totalValue: 2850000 // $2.85M
      };
    } catch (error) {
      console.error('Error fetching verification analytics:', error);
      return null;
    }
  }

  /**
   * Generate idempotency key for API calls
   */
  generateIdempotencyKey() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update transaction status based on verification
   */
  async updateTransactionStatus(propertyId, status) {
    try {
      const transactions = JSON.parse(localStorage.getItem('transactions') || '{}');
      if (transactions[propertyId]) {
        transactions[propertyId].verificationStatus = status;
        transactions[propertyId].verificationCompletedAt = new Date().toISOString();
        localStorage.setItem('transactions', JSON.stringify(transactions));
      }
      return true;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new AssiduousIntegrationService();
