const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

// Get Firestore instance
const db = admin.firestore();

// Get operation parameters from environment
const operation = process.env.OPERATION;
const collection = process.env.COLLECTION;
const query = process.env.QUERY ? JSON.parse(process.env.QUERY) : null;
const data = process.env.DATA ? JSON.parse(process.env.DATA) : null;
const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');

// Fields requiring encryption per collection
const SENSITIVE_FIELDS = {
  users: ['email', 'phone', 'ssn', 'profile.email', 'profile.phone'],
  properties: ['ownerContact', 'accessCodes'],
  transactions: ['financialDetails']
};

// Encryption functions
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
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
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Process document fields (encrypt/decrypt)
function processDocument(doc, operation = 'encrypt') {
  const sensitiveFields = SENSITIVE_FIELDS[collection] || [];
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
    const collectionRef = db.collection(collection);
    let result;

    switch (operation) {
      case 'create': {
        if (!data) throw new Error('Data is required for create operation');
        
        const docData = processDocument(data, 'encrypt');
        docData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        docData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        const docRef = await collectionRef.add(docData);
        const newDoc = await docRef.get();
        
        result = {
          id: newDoc.id,
          ...processDocument(newDoc.data(), 'decrypt')
        };
        break;
      }

      case 'read': {
        let q = collectionRef;
        
        if (query) {
          Object.entries(query).forEach(([field, value]) => {
            q = q.where(field, '==', value);
          });
        }
        
        const snapshot = await q.get();
        result = snapshot.docs.map(doc => ({
          id: doc.id,
          ...processDocument(doc.data(), 'decrypt')
        }));
        break;
      }

      case 'update': {
        if (!data) throw new Error('Data is required for update operation');
        if (!query) throw new Error('Query is required for update operation');
        
        const snapshot = await collectionRef.where(query.field, '==', query.value).get();
        const docRef = snapshot.docs[0]?.ref;
        
        if (!docRef) {
          throw new Error('Document not found');
        }

        const docData = processDocument(data, 'encrypt');
        docData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        await docRef.update(docData);
        const updatedDoc = await docRef.get();
        
        result = {
          id: updatedDoc.id,
          ...processDocument(updatedDoc.data(), 'decrypt')
        };
        break;
      }

      case 'delete': {
        if (!query) throw new Error('Query is required for delete operation');
        
        const snapshot = await collectionRef.where(query.field, '==', query.value).get();
        const docRef = snapshot.docs[0]?.ref;
        
        if (!docRef) {
          throw new Error('Document not found');
        }

        await docRef.delete();
        result = { success: true };
        break;
      }

      default:
        throw new Error(`Invalid operation: ${operation}`);
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
