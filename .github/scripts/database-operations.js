const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Get operation parameters from environment
const operation = process.env.OPERATION;
const collection = process.env.COLLECTION;
const query = process.env.QUERY && process.env.QUERY !== 'undefined' 
  ? JSON.parse(process.env.QUERY) 
  : null;
const data = process.env.DATA && process.env.DATA !== 'undefined'
  ? JSON.parse(process.env.DATA)
  : null;

// Get encryption key from environment
const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;
if (!encryptionKey) {
  console.error('Error: DATABASE_ENCRYPTION_KEY environment variable is required');
  process.exit(1);
}

// Debug output
console.log('Operation params:', {
  operation,
  collection,
  query: query ? '[QUERY]' : null,
  data: data ? '[DATA]' : null
});

// Sensitive fields that need encryption
const SENSITIVE_FIELDS = {
  users: ['email', 'phone', 'password', 'profile.email', 'profile.phone'],
  properties: ['owner.contact'],
  transactions: ['financialDetails']
};

// Encryption functions
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'base64'),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: authTag.toString('base64')
  };
}

function decrypt(data) {
  try {
    const iv = Buffer.from(data.iv, 'base64');
    const authTag = Buffer.from(data.tag, 'base64');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'base64'),
      iv
    );
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Validate input
function validateInput() {
  if (!operation) {
    throw new Error('Operation is required');
  }
  if (!['create', 'read', 'update', 'delete'].includes(operation)) {
    throw new Error(`Invalid operation: ${operation}`);
  }
  if (!collection) {
    throw new Error('Collection is required');
  }
  if (!Object.keys(SENSITIVE_FIELDS).includes(collection)) {
    throw new Error(`Invalid collection: ${collection}`);
  }
  if (['create', 'update'].includes(operation) && !data) {
    throw new Error('Data is required for create/update operations');
  }
  if (['update', 'delete'].includes(operation) && !query) {
    throw new Error('Query is required for update/delete operations');
  }
}

// Data file operations
function getDataFilePath(collection) {
  return path.join(process.cwd(), 'data', `${collection}.json`);
}

function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readCollection(collection) {
  const filePath = getDataFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return { documents: [] };
  }
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  return data.documents ? data : { documents: [] };
}

function writeCollection(collection, data) {
  ensureDataDirectory();
  const filePath = getDataFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Encrypt/decrypt document fields
function processDocument(doc, operation = 'encrypt') {
  const sensitiveFields = SENSITIVE_FIELDS[collection];
  const result = { ...doc };

  for (const field of sensitiveFields) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], result);
    if (value) {
      let processed;
      if (operation === 'encrypt') {
        processed = encrypt(value.toString());
      } else {
        processed = decrypt(value);
      }

      // Update nested field
      const keys = field.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((obj, key) => {
        if (!obj[key]) obj[key] = {};
        return obj[key];
      }, result);
      target[lastKey] = processed;
    }
  }

  return result;
}

// Database operations
async function performOperation() {
  try {
    validateInput();
    let result;
    const { documents } = readCollection(collection);

    switch (operation) {
      case 'create': {
        const newDoc = processDocument(data, 'encrypt');
        newDoc._id = `${collection}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        documents.push(newDoc);
        writeCollection(collection, { documents });
        result = processDocument(newDoc, 'decrypt');
        break;
      }

      case 'read': {
        result = documents
          .filter(doc => {
            if (!query) return true;
            return Object.entries(query).every(([key, value]) => doc[key] === value);
          })
          .map(doc => processDocument(doc, 'decrypt'));
        break;
      }

      case 'update': {
        const updatedDocs = documents.map(doc => {
          if (Object.entries(query).every(([key, value]) => doc[key] === value)) {
            return processDocument({ ...doc, ...data }, 'encrypt');
          }
          return doc;
        });
        writeCollection(collection, { documents: updatedDocs });
        result = updatedDocs
          .filter(doc => Object.entries(query).every(([key, value]) => doc[key] === value))
          .map(doc => processDocument(doc, 'decrypt'));
        break;
      }

      case 'delete': {
        const remainingDocs = documents.filter(
          doc => !Object.entries(query).every(([key, value]) => doc[key] === value)
        );
        writeCollection(collection, { documents: remainingDocs });
        result = {
          deleted: documents.length - remainingDocs.length
        };
        break;
      }
    }

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (error) {
    console.error('Operation failed:', error.message);
    process.exit(1);
  }
}

// Run the operation
performOperation().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
