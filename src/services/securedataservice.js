import { encryptionService, SENSITIVE_FIELDS } from './encryptionservice';
import { dataService } from './dataservice';

/**
 * Secure wrapper around dataservice that handles encryption
 */
export class Securedataservice {
  constructor() {
    this.dataService = dataService;
  }

  /**
   * Securely store data
   */
  async create(collection, data) {
    // Encrypt sensitive fields
    const encryptedData = encryptionService.encryptFields(
      data,
      SENSITIVE_FIELDS[collection] || []
    );

    // Add metadata
    encryptedData.metadata = {
      ...encryptedData.metadata,
      isEncrypted: true,
      encryptedFields: SENSITIVE_FIELDS[collection] || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store encrypted data
    return await this.dataService.create(collection, encryptedData);
  }

  /**
   * Securely retrieve data
   */
  async find(collection, query = {}) {
    // Get encrypted data
    const encryptedDocs = await this.dataService.find(collection, query);

    // Decrypt if needed
    return encryptedDocs.map(doc => {
      if (doc.metadata?.isEncrypted) {
        return encryptionService.decryptFields(
          doc,
          doc.metadata.encryptedFields
        );
      }
      return doc;
    });
  }

  /**
   * Securely update data
   */
  async update(collection, query, data) {
    // Get existing document to preserve encryption
    const existing = await this.dataService.find(collection, query);
    if (!existing.length) {
      throw new Error('Document not found');
    }

    const doc = existing[0];
    const sensitiveFields = doc.metadata?.encryptedFields || SENSITIVE_FIELDS[collection] || [];

    // Encrypt new data
    const encryptedData = encryptionService.encryptFields(
      data,
      sensitiveFields
    );

    // Update metadata
    encryptedData.metadata = {
      ...doc.metadata,
      updatedAt: new Date().toISOString()
    };

    // Store updated data
    return await this.dataService.update(collection, query, encryptedData);
  }

  /**
   * Securely delete data
   */
  async delete(collection, query) {
    // Permanently delete data
    return await this.dataService.delete(collection, query);
  }

  /**
   * Securely handle offline data
   */
  async syncOfflineData() {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    
    for (const operation of offlineData) {
      try {
        switch (operation.type) {
          case 'create':
            await this.create(
              operation.collection,
              operation.data
            );
            break;
          case 'update':
            await this.update(
              operation.collection,
              operation.query,
              operation.data
            );
            break;
          case 'delete':
            await this.delete(
              operation.collection,
              operation.query
            );
            break;
        }
      } catch (error) {
        console.error('Sync failed for operation:', operation, error);
      }
    }
    
    localStorage.removeItem('offlineData');
  }

  /**
   * Queue encrypted offline operation
   */
  queueOfflineOperation(type, collection, query, data) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    
    // Encrypt data if needed
    if (data && SENSITIVE_FIELDS[collection]) {
      data = encryptionService.encryptFields(
        data,
        SENSITIVE_FIELDS[collection]
      );
    }

    offlineData.push({ type, collection, query, data });
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  }
}

// Export singleton instance
export const securedataservice = new Securedataservice();
