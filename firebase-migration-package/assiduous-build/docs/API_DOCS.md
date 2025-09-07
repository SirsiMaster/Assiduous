# Assiduous Realty API Documentation

## Overview

The Assiduous Realty API provides programmatic access to the platform's functionality, enabling integration with the unified client portal and agent dashboard. This RESTful API uses JWT authentication and returns JSON responses.

## Authentication

### Token-based Authentication

All API requests must include a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Obtaining Tokens

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

Response:
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600
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
