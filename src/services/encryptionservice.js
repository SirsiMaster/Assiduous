import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Service for handling data encryption/decryption
 */
export class encryptionservice {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.key = Buffer.from(process.env.DATABASE_ENCRYPTION_KEY, 'base64');
  }

  /**
   * Encrypt data
   */
  encrypt(data) {
    try {
      // Generate initialization vector
      const iv = randomBytes(this.ivLength);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, this.key, iv);

      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(data), 'utf8'),
        cipher.final()
      ]);

      // Get auth tag
      const tag = cipher.getAuthTag();

      // Return encrypted data with IV and tag
      return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    try {
      // Convert from base64
      const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);

      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt sensitive fields in an object
   */
  encryptFields(data, sensitiveFields) {
    const result = { ...data };
    
    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = this.encrypt(result[field]);
      }
    }

    return result;
  }

  /**
   * Decrypt sensitive fields in an object
   */
  decryptFields(data, sensitiveFields) {
    const result = { ...data };
    
    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = this.decrypt(result[field]);
      }
    }

    return result;
  }
}

// Export singleton instance
export const encryptionService = new encryptionservice();

// Define sensitive fields for each collection
export const SENSITIVE_FIELDS = {
  users: [
    'profile.email',
    'profile.phone',
    'profile.ssn',
    'password',
    'securityQuestions'
  ],
  properties: [
    'owner.contactInfo',
    'documents.content'
  ],
  transactions: [
    'financialDetails',
    'documents.content'
  ]
};
