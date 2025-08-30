const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const COLLECTIONS = ['users', 'properties', 'transactions'];

// Utility functions
const readCollection = (collection) => {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeCollection = (collection, data) => {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const generateId = (collection) => {
  const prefix = collection.slice(0, 3);
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
};

// Database operations
const operations = {
  read: async (collection, query = {}) => {
    const data = readCollection(collection);
    if (!query || Object.keys(query).length === 0) {
      return data[collection];
    }
    return _.filter(data[collection], query);
  },

  create: async (collection, data) => {
    const collectionData = readCollection(collection);
    const newItem = {
      _id: generateId(collection),
      ...data,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    collectionData[collection].push(newItem);
    writeCollection(collection, collectionData);
    return newItem;
  },

  update: async (collection, query, data) => {
    const collectionData = readCollection(collection);
    const index = _.findIndex(collectionData[collection], query);
    if (index === -1) {
      throw new Error('Document not found');
    }
    const updatedItem = {
      ...collectionData[collection][index],
      ...data,
      metadata: {
        ...collectionData[collection][index].metadata,
        updatedAt: new Date().toISOString()
      }
    };
    collectionData[collection][index] = updatedItem;
    writeCollection(collection, collectionData);
    return updatedItem;
  },

  delete: async (collection, query) => {
    const collectionData = readCollection(collection);
    const filteredData = _.reject(collectionData[collection], query);
    writeCollection(collection, { [collection]: filteredData });
    return { success: true };
  }
};

// Main execution
async function main() {
  try {
    const { operation, collection, query, data } = process.env;

    // Validate inputs
    if (!COLLECTIONS.includes(collection)) {
      throw new Error(`Invalid collection: ${collection}`);
    }

    if (!operations[operation]) {
      throw new Error(`Invalid operation: ${operation}`);
    }

    // Parse inputs
    const parsedQuery = query ? JSON.parse(query) : {};
    const parsedData = data ? JSON.parse(data) : {};

    // Perform operation
    const result = await operations[operation](collection, parsedQuery, parsedData);

    // Output result
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
