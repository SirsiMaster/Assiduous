import { dataService } from './dataservice';

/**
 * Database utilities for indexing and migration
 */
export class databaseutils {
  constructor() {
    this.indexes = new Map();
    this.initialized = false;
  }

  /**
   * Initialize database indexes
   */
  async initialize() {
    if (this.initialized) return;

    // Define indexes for each collection
    await Promise.all([
      this.createIndex('properties', 'basic.price'),
      this.createIndex('properties', 'basic.status'),
      this.createIndex('properties', 'basic.type'),
      this.createIndex('properties', ['location.coordinates', '2dsphere']),
      this.createIndex('properties', 'metadata.ownerId'),
      this.createIndex('properties', 'metadata.agentId'),
      
      this.createIndex('users', 'email', { unique: true }),
      this.createIndex('users', 'role'),
      this.createIndex('users', 'licenseNumber', { sparse: true }),
      
      this.createIndex('transactions', 'propertyId'),
      this.createIndex('transactions', 'buyerId'),
      this.createIndex('transactions', 'sellerId'),
      this.createIndex('transactions', 'status'),
      this.createIndex('transactions', 'timeline.created')
    ]);

    this.initialized = true;
  }

  /**
   * Create an index on a collection
   */
  async createIndex(collection, fields, options = {}) {
    const fieldKey = Array.isArray(fields) ? fields[0] : fields;
    const indexKey = `${collection}:${fieldKey}`;
    
    if (!this.indexes.has(collection)) {
      this.indexes.set(collection, new Map());
    }

    const collectionIndexes = this.indexes.get(collection);
    const index = new Map();

    // Load all documents
    const documents = await dataService.find(collection);

    // Build index
    for (const doc of documents) {
      const value = this.getNestedValue(doc, fieldKey);
      if (value === undefined) continue;

      if (options.unique && index.has(value)) {
        throw new Error(`Duplicate value for unique index: ${value}`);
      }

      if (!index.has(value)) {
        index.set(value, new Set());
      }
      index.get(value).add(doc._id);
    }

    collectionIndexes.set(fieldKey, { index, options });
  }

  /**
   * Get a value from a nested object path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Find documents using an index
   */
  async findByIndex(collection, field, value) {
    await this.initialize();
    
    const collectionIndexes = this.indexes.get(collection);
    if (!collectionIndexes) return [];

    const indexData = collectionIndexes.get(field);
    if (!indexData) return [];

    const ids = indexData.index.get(value);
    if (!ids) return [];

    return await dataService.find(collection, { _id: { $in: Array.from(ids) } });
  }

  /**
   * Export collection data for migration
   */
  async exportCollection(collection) {
    const data = await dataService.find(collection);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import collection data from migration
   */
  async importCollection(collection, data) {
    const documents = JSON.parse(data);
    for (const doc of documents) {
      await dataService.create(collection, doc);
    }
  }

  /**
   * Generate MongoDB migration script
   */
  async generateMongoMigration() {
    const collections = ['users', 'properties', 'transactions'];
    let script = '// MongoDB Migration Script\n\n';

    for (const collection of collections) {
      const data = await this.exportCollection(collection);
      script += `db.createCollection("${collection}");\n\n`;
      script += `db.${collection}.insertMany(${data});\n\n`;

      // Add indexes
      const collectionIndexes = this.indexes.get(collection);
      if (collectionIndexes) {
        for (const [field, { options }] of collectionIndexes) {
          const indexDef = { [field]: 1, ...options };
          script += `db.${collection}.createIndex(${JSON.stringify(indexDef)});\n`;
        }
      }
      script += '\n';
    }

    return script;
  }

  /**
   * Create database backup
   */
  async createBackup() {
    const backup = {};
    const collections = ['users', 'properties', 'transactions'];

    for (const collection of collections) {
      backup[collection] = await dataService.find(collection);
    }

    return {
      timestamp: new Date().toISOString(),
      data: backup
    };
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backup) {
    for (const [collection, data] of Object.entries(backup.data)) {
      // Clear existing data
      await dataService.delete(collection, {});
      
      // Insert backup data
      for (const doc of data) {
        await dataService.create(collection, doc);
      }
    }
  }

  /**
   * Validate data integrity
   */
  async validateIntegrity() {
    const issues = [];

    // Check for orphaned references
    const properties = await dataService.find('properties');
    const users = await dataService.find('users');
    const transactions = await dataService.find('transactions');

    // Check property references
    for (const property of properties) {
      if (property.metadata.ownerId && !users.find(u => u._id === property.metadata.ownerId)) {
        issues.push(`Property ${property._id} has invalid owner reference`);
      }
      if (property.metadata.agentId && !users.find(u => u._id === property.metadata.agentId)) {
        issues.push(`Property ${property._id} has invalid agent reference`);
      }
    }

    // Check transaction references
    for (const transaction of transactions) {
      if (!properties.find(p => p._id === transaction.propertyId)) {
        issues.push(`Transaction ${transaction._id} has invalid property reference`);
      }
      if (!users.find(u => u._id === transaction.buyerId)) {
        issues.push(`Transaction ${transaction._id} has invalid buyer reference`);
      }
      if (!users.find(u => u._id === transaction.sellerId)) {
        issues.push(`Transaction ${transaction._id} has invalid seller reference`);
      }
    }

    return issues;
  }
}

// Export singleton instance
export const databaseUtils = new databaseutils();
