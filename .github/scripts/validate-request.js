// Validate database operation requests
const VALID_OPERATIONS = ['read', 'create', 'update', 'delete'];
const VALID_COLLECTIONS = ['users', 'properties', 'transactions'];

// Get inputs from environment
const operation = process.env.OPERATION;
const collection = process.env.COLLECTION;
const query = process.env.QUERY;
const data = process.env.DATA;

// Validate operation
if (!VALID_OPERATIONS.includes(operation)) {
  console.error(`Invalid operation: ${operation}`);
  process.exit(1);
}

// Validate collection
if (!VALID_COLLECTIONS.includes(collection)) {
  console.error(`Invalid collection: ${collection}`);
  process.exit(1);
}

// Validate query for read/update/delete
if (['read', 'update', 'delete'].includes(operation) && !query) {
  console.error('Query required for read/update/delete operations');
  process.exit(1);
}

// Validate data for create/update
if (['create', 'update'].includes(operation) && !data) {
  console.error('Data required for create/update operations');
  process.exit(1);
}

// Parse and validate JSON
try {
  if (query) JSON.parse(query);
  if (data) JSON.parse(data);
} catch (error) {
  console.error('Invalid JSON in query or data');
  process.exit(1);
}

console.log('Request validation successful');
process.exit(0);
