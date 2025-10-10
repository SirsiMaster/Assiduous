# DATA MODEL DOCUMENT
## Database Schema and Data Structures

**Document Type:** Data Model  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Data Model Document
**Consolidation Note:** Extracted from technical blueprint and MVP plan

---

## Firestore Collections Schema

### Properties Collection
```javascript
{
  id: string,
  address: string,
  price: number,
  bedrooms: number,
  bathrooms: number,
  squareFeet: number,
  type: string,
  status: 'available' | 'pending' | 'sold',
  images: string[],
  features: string[],
  description: string,
  agentId: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  flipEstimate: {
    purchasePrice: number,
    rehabCost: number,
    arvPrice: number,
    profit: number,
    roi: number
  }
}
```

### Users Collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'client' | 'agent' | 'admin',
  phone: string,
  createdAt: timestamp,
  preferences: {
    priceRange: {min: number, max: number},
    locations: string[],
    propertyTypes: string[]
  },
  favorites: string[] // property IDs
}
```

### Transactions Collection
```javascript
{
  id: string,
  propertyId: string,
  buyerId: string,
  sellerId: string,
  agentId: string,
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
  amount: number,
  commission: number,
  createdAt: timestamp,
  closedAt: timestamp,
  documents: string[]
}
```

### Leads Collection
```javascript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  propertyId: string,
  agentId: string,
  status: 'new' | 'contacted' | 'qualified' | 'converted',
  source: string,
  notes: string,
  createdAt: timestamp
}
```

