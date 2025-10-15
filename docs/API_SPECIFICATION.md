# API SPECIFICATION DOCUMENT
## RESTful API Endpoints and Contracts

**Document Type:** API Specification
**Version:** 2.1.0
**Last Updated:** October 12, 2025
**Status:** Authoritative API Document
**Consolidation Note:** Renamed from api_docs.md
**Day 3 Update:** Added Firebase Auth API and Auth Guard documentation

---
# Assiduous Realty API Documentation

## Overview

The Assiduous Realty API provides programmatic access to the platform's functionality, enabling integration with the unified client portal and agent dashboard. This RESTful API uses JWT authentication and returns JSON responses.

## Authentication

### Overview
Assiduous uses **Firebase Authentication** for user authentication, combined with Firestore for role-based access control (RBAC).

### Firebase Auth API
**Implementation Status**: ✅ Fully operational (Day 3 - October 12, 2025)

#### User Registration (Signup)
```javascript
// Frontend: index.html signup form
firebase.auth().createUserWithEmailAndPassword(email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    
    // Store user profile in Firestore
    return firebase.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      displayName: `${firstName} ${lastName}`,
      role: selectedRole, // 'admin' | 'agent' | 'client' | 'investor'
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      profileComplete: true,
      emailVerified: false,
      
      // Agent-specific fields (if role === 'agent')
      agentInfo: {
        status: 'pending_approval',
        licenseNumber: licenseNumber,
        licenseState: licenseState,
        brokerageName: brokerageName,
        appliedAt: firebase.firestore.FieldValue.serverTimestamp()
      }
    });
  });
```

**Response**:
- Success: User object with `uid`, `email`, `displayName`
- Error codes:
  - `auth/email-already-in-use` - Email already registered
  - `auth/weak-password` - Password too weak (< 6 characters)
  - `auth/invalid-email` - Invalid email format

#### User Login (Sign In)
```javascript
// Frontend: index.html login form
firebase.auth().signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    
    // Fetch user profile from Firestore to get role
    return firebase.firestore().collection('users').doc(user.uid).get();
  })
  .then((doc) => {
    if (doc.exists) {
      const userData = doc.data();
      const role = userData.role;
      
      // Store session
      const sessionData = {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName,
        role: role,
        loginTime: new Date().toISOString()
      };
      
      sessionStorage.setItem('assiduousUser', JSON.stringify(sessionData));
      if (rememberMe) {
        localStorage.setItem('assiduousUser', JSON.stringify(sessionData));
      }
      
      // Redirect based on role
      redirectToRoleDashboard(role, userData);
    }
  });
```

**Response**:
- Success: User object + Firestore profile data
- Error codes:
  - `auth/user-not-found` - No account with this email
  - `auth/wrong-password` - Incorrect password
  - `auth/invalid-email` - Invalid email format
  - `auth/too-many-requests` - Too many failed attempts

#### Role-Based Redirects
```javascript
function redirectToRoleDashboard(role, userData) {
  switch (role) {
    case 'admin':
      window.location.href = '/admin/dashboard.html';
      break;
    case 'agent':
      if (userData.agentInfo?.status === 'approved') {
        window.location.href = '/agent/dashboard.html';
      } else if (userData.agentInfo?.status === 'pending_approval') {
        window.location.href = '/agent-pending.html';
      } else {
        alert('Your agent application was rejected.');
        window.location.href = '/';
      }
      break;
    case 'client':
    case 'investor':
      window.location.href = '/client/dashboard.html';
      break;
  }
}
```

#### Session Management
```javascript
// Check current auth state
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log('Authenticated:', user.email);
  } else {
    // User is signed out
    console.log('Not authenticated');
  }
});

// Sign out
firebase.auth().signOut().then(() => {
  sessionStorage.removeItem('assiduousUser');
  localStorage.removeItem('assiduousUser');
  window.location.href = '/';
});
```

### Auth Guard API
**Implementation Status**: ✅ Fully operational (Day 3 - October 12, 2025)
**Location**: `/components/auth-guard-simple.js`

The Auth Guard provides page-level access control based on user roles.

#### Auto-Protect via HTML Attribute (Recommended)
```html
<!DOCTYPE html>
<html data-auth-protect="admin,agent">
<head>
  <title>Admin Dashboard</title>
  <script src="/components/auth-guard-simple.js"></script>
</head>
<body>
  <!-- Page automatically protected -->
  <!-- Only admins and agents can access -->
</body>
</html>
```

#### Manual Protection
```javascript
// Protect current page for specific roles
await authGuard.protect(['admin'], {
  requireEmailVerification: false,
  onSuccess: (user) => {
    console.log('Authorized:', user.email);
    initializeDashboard(user);
  },
  onUnauthorized: (role) => {
    alert(`Access denied. This page requires admin role.`);
  }
});
```

#### Auth Guard Global API
```javascript
// Available on window.authGuard

// 1. Protect current page
await authGuard.protect(allowedRoles, options);

// 2. Check if user is authenticated
const user = await authGuard.checkAuth();
if (user) {
  console.log('User:', user.email, user.uid);
}

// 3. Get user data from Firestore
const userData = await authGuard.getUserData(user.uid);
console.log('Role:', userData.role);

// 4. Sign out
await authGuard.signOut();

// 5. Redirect to login
authGuard.redirectToLogin('/admin/dashboard.html');

// 6. Redirect to role dashboard
authGuard.redirectToRoleDashboard('admin');

// 7. Update UI with user data
authGuard.updateUI(user);
```

#### Auto-Update UI Elements
```html
<!-- These elements automatically populate when auth guard runs -->
<span data-user-email></span>        <!-- Displays: user.email -->
<span data-user-name></span>         <!-- Displays: user.displayName -->
<span data-user-initials></span>     <!-- Displays: user initials (e.g., "JD") -->
```

### Token-based Authentication (Legacy/Deprecated)

All Cloud Functions API requests should include Firebase Auth token:

```http
Authorization: Bearer <firebase_id_token>
```

### Obtaining Tokens (Legacy)

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

Response:
{
  "access_token": "firebase_id_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "role": "client"
  }
}
```

## API Endpoints

### Client Management

#### Create Client Account
```http
POST /api/v1/clients
Content-Type: application/json

{
  "email": "client@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "preferences": {
    "preferred_locations": ["San Francisco", "Oakland"],
    "property_types": ["single_family", "condo"],
    "price_range": {
      "min": 500000,
      "max": 1000000
    }
  }
}

Response: 201 Created
{
  "id": "client_uuid",
  "email": "client@example.com",
  "name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Update Client Profile
```http
PUT /api/v1/clients/{client_id}
Content-Type: application/json

{
  "phone": "+1987654321",
  "preferences": {
    "preferred_locations": ["San Jose", "Mountain View"],
    "price_range": {
      "min": 600000,
      "max": 1200000
    }
  }
}

Response: 200 OK
{
  "id": "client_uuid",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

### Property Management

#### List Properties
```http
GET /api/v1/properties?status=active&type=single_family&min_price=500000&max_price=1000000

Response: 200 OK
{
  "properties": [
    {
      "id": "property_uuid",
      "address": "123 Main St, San Francisco, CA",
      "price": 750000,
      "status": "active",
      "features": {
        "bedrooms": 3,
        "bathrooms": 2,
        "square_feet": 1500
      }
    }
  ],
  "total": 45,
  "page": 1,
  "per_page": 20
}
```

#### Create Property Listing
```http
POST /api/v1/properties
Content-Type: application/json

{
  "address": "456 Oak St, San Francisco, CA",
  "price": 850000,
  "property_type": "single_family",
  "features": {
    "bedrooms": 4,
    "bathrooms": 3,
    "square_feet": 2000,
    "lot_size": 5000,
    "year_built": 1990
  },
  "description": "Beautiful renovated home..."
}

Response: 201 Created
{
  "id": "property_uuid",
  "created_at": "2024-01-03T00:00:00Z"
}
```

### Transaction Management

#### Start Transaction
```http
POST /api/v1/transactions
Content-Type: application/json

{
  "property_id": "property_uuid",
  "client_id": "client_uuid",
  "type": "purchase",  // or "sale"
  "offer_price": 745000
}

Response: 201 Created
{
  "id": "transaction_uuid",
  "status": "pending",
  "created_at": "2024-01-04T00:00:00Z"
}
```

#### Update Transaction Status
```http
PUT /api/v1/transactions/{transaction_id}/status
Content-Type: application/json

{
  "status": "accepted",
  "notes": "Offer accepted by seller"
}

Response: 200 OK
{
  "id": "transaction_uuid",
  "status": "accepted",
  "updated_at": "2024-01-05T00:00:00Z"
}
```

### Agent Management

#### List Agents
```http
GET /api/v1/agents?specialty=luxury&location=san_francisco

Response: 200 OK
{
  "agents": [
    {
      "id": "agent_uuid",
      "name": "Jane Smith",
      "specialty": "luxury",
      "location": "San Francisco",
      "ratings": 4.9,
      "transactions_completed": 50
    }
  ],
  "total": 10,
  "page": 1,
  "per_page": 20
}
```

### Market Analytics

#### Get Market Insights
```http
GET /api/v1/analytics/market?location=san_francisco&property_type=single_family

Response: 200 OK
{
  "median_price": 1200000,
  "price_trend": {
    "1_month": 2.5,
    "3_month": 5.8,
    "12_month": 12.3
  },
  "inventory_levels": {
    "current": 450,
    "trend": "decreasing"
  },
  "days_on_market": {
    "average": 25,
    "trend": "stable"
  }
}
```

### Property Ingestion API (v2.1.0)

**Purpose**: Bulk import properties from external sources (MLS feeds, scrapers, third-party platforms) with automatic image processing.

#### Create API Key (Admin Only)
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createApiKey = httpsCallable(functions, 'createApiKey');

const result = await createApiKey({
  organizationId: 'your-org-id',
  name: 'MLS Feed Integration',
  permissions: ['ingest', 'delete']
});

console.log('API Key:', result.data.apiKey);
```

#### Ingest Properties
```http
POST /api/v1/properties/ingest
Content-Type: application/json
X-API-Key: your-api-key

{
  "properties": [
    {
      "externalId": "MLS-12345",
      "title": "Modern 3BR Home",
      "price": 450000,
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102"
      },
      "bedrooms": 3,
      "bathrooms": 2,
      "squareFeet": 1800,
      "images": [
        "https://example.com/image1.jpg",
        "data:image/jpeg;base64,/9j/4AAQ..."
      ],
      "metadata": {
        "mlsNumber": "12345",
        "listingAgent": "agent-id"
      }
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "processed": 1,
  "successful": 1,
  "failed": 0,
  "results": [
    {
      "success": true,
      "propertyId": "firebase-doc-id",
      "externalId": "MLS-12345",
      "action": "created",
      "imagesProcessed": 2
    }
  ]
}
```

**Image Processing**:
- Remote URLs: Automatically downloaded and compressed
- Base64: Decoded and uploaded to Firebase Storage  
- Compression: Max 2048x2048, 80% quality
- Thumbnails: Auto-generated (200x200, 400x400)
- Limits: 50MB max per image, 30s timeout

#### Bulk Delete Properties
```http
DELETE /api/v1/properties/bulk
Content-Type: application/json
X-API-Key: your-api-key

{
  "externalIds": ["MLS-12345", "MLS-12346"]
}

Response: 200 OK
{
  "success": true,
  "deleted": 2
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid property type specified",
    "details": {
      "field": "property_type",
      "allowed_values": ["single_family", "condo", "townhouse", "multi_family"]
    }
  }
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 500: Internal Server Error

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated clients
- 30 requests per minute for unauthenticated requests

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

The API supports webhooks for real-time notifications:

```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "events": [
    "transaction.status_changed",
    "property.price_updated",
    "client.preference_updated"
  ]
}

Response: 201 Created
{
  "id": "webhook_uuid",
  "status": "active"
}
```

## SDK Support

Official SDKs are available for:
- JavaScript
- Python
- Ruby
- PHP

Example using JavaScript SDK:
```javascript
const AssidiousAPI = require('assiduous-sdk');

const client = new AssidiousAPI({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Get client profile
const profile = await client.clients.get('client_id');

// List properties
const properties = await client.properties.list({
  status: 'active',
  type: 'single_family',
  minPrice: 500000,
  maxPrice: 1000000
});
```

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Basic CRUD operations for properties, clients, and transactions
- Authentication and authorization system

### v1.1.0 (2024-01-15)
- Added market analytics endpoints
- Enhanced property search capabilities
- Improved error handling and validation

### v1.2.0 (2024-02-01)
- Unified client role implementation
- Enhanced transaction management
- Added webhook support
- Improved rate limiting

### v2.1.0 (2025-10-15)
- **Property Ingestion API** - Bulk import from external sources (MLS, feeds)
- **Remote Image Processing** - Automatic download, compression, upload
- **API Key Management** - Secure authentication for integrations
- **Base64 Image Support** - Direct image uploads without URLs
