# DATA MODEL DOCUMENT
## Complete Database Schema, Relationships, and Data Architecture

**Document Type:** Data Model  
**Version:** 3.1.0  
**Last Updated:** October 12, 2025  
**Status:** Comprehensive Data Model Documentation  
**Implementation Status:** Users collection implemented (Day 3), properties partial  
**Reality Check:** Authentication schema live in production, property data pending Day 4

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
**Implementation Status**: ✅ Fully implemented in production (Day 3 - October 12, 2025)

```javascript
{
  // Core Identity Fields
  uid: string,                    // Firebase Auth user ID
  email: string,                  // User email (unique)
  firstName: string,              // User first name
  lastName: string,               // User last name
  displayName: string,            // Full name (firstName + lastName)
  phone?: string,                 // Optional phone number
  
  // Role and Permissions
  role: 'admin' | 'agent' | 'client' | 'investor',
  
  // Timestamps
  createdAt: timestamp,           // Account creation timestamp
  updatedAt: timestamp,           // Last profile update
  
  // Account Status
  profileComplete: boolean,       // Whether user completed onboarding
  emailVerified: boolean,         // Whether email is verified
  
  // User Preferences (Optional)
  preferences?: {
    priceRange: {min: number, max: number},
    locations: string[],          // Preferred neighborhoods/cities
    propertyTypes: string[]       // e.g., ['single_family', 'condo']
  },
  
  // Favorites and Activity
  favorites?: string[],           // Array of property IDs
  recentlyViewed?: string[],      // Last 10 viewed property IDs
  
  // Agent-Specific Fields (only present if role === 'agent')
  agentInfo?: {
    status: 'pending_approval' | 'approved' | 'rejected',
    licenseNumber: string,        // Real estate license number
    licenseState: string,         // State of license (e.g., 'PA', 'NJ')
    brokerageName: string,        // Name of brokerage firm
    appliedAt: timestamp,         // When agent applied for approval
    approvedAt?: timestamp,       // When admin approved agent
    rejectedAt?: timestamp,       // When admin rejected agent
    rejectionReason?: string,     // Reason for rejection (if rejected)
    approvedBy?: string,          // Admin UID who approved/rejected
    specialties?: string[],       // e.g., ['luxury', 'commercial']
    bio?: string,                 // Agent bio/description
    websiteUrl?: string,          // Agent personal website
    socialLinks?: {               // Social media profiles
      linkedin?: string,
      facebook?: string,
      instagram?: string
    }
  }
}
```

**Implementation Notes (Day 3)**:
- ✅ Signup flow creates user profiles with role selection
- ✅ Agent approval workflow implemented (pending → approved/rejected)
- ✅ Session management stores user data in sessionStorage
- ✅ Auth guards verify role before granting page access
- ✅ Firebase Auth + Firestore combined for complete user management

**Agent Approval Workflow**:
1. User signs up with role = 'agent' and fills agent-specific fields
2. User profile created with `agentInfo.status = 'pending_approval'`
3. Agent redirected to `/agent-pending.html` (awaiting admin approval)
4. Admin reviews agent in Admin Portal and approves/rejects
5. If approved: `status = 'approved'`, agent can access `/agent/dashboard.html`
6. If rejected: `status = 'rejected'`, agent sees rejection reason

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

---

## Extended Collection Schemas

### Analytics Collection
```javascript
{
  id: string,
  userId: string,
  propertyId: string,
  event: 'view' | 'save' | 'share' | 'inquiry' | 'tour',
  metadata: {
    source: string,
    device: string,
    location: geopoint,
    referrer: string,
    duration: number // seconds on page
  },
  timestamp: timestamp
}
```

### Messages Collection
```javascript
{
  id: string,
  conversationId: string,
  senderId: string,
  recipientId: string,
  propertyId: string, // optional
  message: string,
  attachments: string[],
  read: boolean,
  createdAt: timestamp
}
```

### Documents Collection  
```javascript
{
  id: string,
  transactionId: string,
  userId: string,
  type: 'contract' | 'disclosure' | 'inspection' | 'financial',
  name: string,
  url: string, // Cloud Storage URL
  status: 'draft' | 'pending' | 'signed' | 'expired',
  signatures: [
    {
      userId: string,
      signedAt: timestamp,
      ipAddress: string
    }
  ],
  createdAt: timestamp,
  expiresAt: timestamp
}
```

### Appointments Collection
```javascript
{
  id: string,
  propertyId: string,
  agentId: string,
  clientId: string,
  type: 'showing' | 'inspection' | 'closing',
  scheduledFor: timestamp,
  duration: number, // minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled',
  location: {
    address: string,
    coordinates: geopoint
  },
  notes: string,
  reminders: [
    {
      type: 'email' | 'sms',
      sentAt: timestamp
    }
  ],
  createdAt: timestamp
}
```

### Offers Collection
```javascript
{
  id: string,
  propertyId: string,
  buyerId: string,
  sellerId: string,
  agentId: string,
  amount: number,
  type: 'cash' | 'conventional' | 'fha' | 'va',
  contingencies: string[],
  earnestMoney: number,
  closingDate: date,
  status: 'draft' | 'submitted' | 'countered' | 'accepted' | 'rejected' | 'expired',
  counterHistory: [
    {
      amount: number,
      terms: string,
      counteredBy: string,
      timestamp: timestamp
    }
  ],
  expiresAt: timestamp,
  createdAt: timestamp
}
```

### Commissions Collection
```javascript
{
  id: string,
  transactionId: string,
  agentId: string,
  propertyId: string,
  salePrice: number,
  commissionRate: number, // percentage
  commissionAmount: number,
  splits: [
    {
      agentId: string,
      percentage: number,
      amount: number
    }
  ],
  status: 'pending' | 'approved' | 'paid',
  paidAt: timestamp,
  createdAt: timestamp
}
```

---

## Database Relationships

### Primary Relationships
```
Users (1) ---- (*) Properties (via agentId)
Users (1) ---- (*) Leads (via agentId)
Users (1) ---- (*) Transactions (buyer/seller/agent)
Properties (1) ---- (*) Offers
Properties (1) ---- (*) Appointments
Transactions (1) ---- (*) Documents
Transactions (1) ---- (1) Commissions
```

### Data Flow Diagram
```
User Registration
    ↓
Profile Creation → Role Assignment
    ↓
Property Search → Analytics Tracking
    ↓
Property View → Lead Generation
    ↓
Appointment Scheduling → Calendar Sync
    ↓
Offer Submission → Document Generation
    ↓
Transaction Creation → Commission Calculation
    ↓
Closing → Payment Processing
```

---

## Firestore Indexes

### Composite Indexes Required
```javascript
// Properties - search and filter
properties: [
  ['status', 'price', 'createdAt'],
  ['type', 'bedrooms', 'price'],
  ['agentId', 'status', 'createdAt'],
  ['location.city', 'price', 'squareFeet']
]

// Leads - agent management
leads: [
  ['agentId', 'status', 'createdAt'],
  ['propertyId', 'status', 'createdAt']
]

// Transactions - tracking
transactions: [
  ['agentId', 'status', 'closedAt'],
  ['buyerId', 'status', 'createdAt'],
  ['propertyId', 'status']
]

// Analytics - reporting
analytics: [
  ['propertyId', 'event', 'timestamp'],
  ['userId', 'event', 'timestamp']
]
```

---

## Data Validation Rules

### Field Validation
```javascript
// Email validation
email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Phone validation (US)
phone: /^\+1[0-9]{10}$/

// Price ranges
price: { min: 0, max: 100000000 }

// Required fields by collection
required: {
  properties: ['address', 'price', 'type', 'agentId'],
  users: ['email', 'displayName', 'role'],
  transactions: ['propertyId', 'buyerId', 'amount'],
  leads: ['name', 'email', 'agentId']
}
```

---

## Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Properties are public read, agent write
    match /properties/{propertyId} {
      allow read: if true;
      allow create, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['agent', 'admin'];
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Transactions require authentication
    match /transactions/{transactionId} {
      allow read: if request.auth != null && 
        (resource.data.buyerId == request.auth.uid || 
         resource.data.sellerId == request.auth.uid ||
         resource.data.agentId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['agent', 'admin'];
    }
  }
}
```

---

## Data Migration Strategy

### From Mock to Production
1. **Phase 1:** Create Firestore collections
2. **Phase 2:** Import mock data with validation
3. **Phase 3:** Connect frontend to Firestore
4. **Phase 4:** Enable real-time listeners
5. **Phase 5:** Implement security rules
6. **Phase 6:** Create backup procedures

### Data Seeding Script
```javascript
// Sample data seeding for development
const seedData = {
  users: 50,        // Generate 50 test users
  properties: 200,  // Generate 200 properties
  leads: 100,       // Generate 100 leads
  transactions: 30  // Generate 30 transactions
};
```

---

## Performance Considerations

### Query Optimization
- Use composite indexes for complex queries
- Limit results to 20-50 per page
- Implement cursor-based pagination
- Cache frequently accessed data
- Use Firestore bundles for static data

### Data Denormalization
- Store user names in transactions (avoid joins)
- Cache property counts per agent
- Duplicate critical fields to avoid lookups
- Pre-calculate aggregates (totals, averages)

---

## Backup & Recovery

### Backup Strategy
- **Daily:** Automated Firestore exports to Cloud Storage
- **Weekly:** Full database backup with point-in-time recovery
- **Monthly:** Archive to cold storage

### Recovery Procedures
1. Point-in-time recovery (last 7 days)
2. Full restore from backup
3. Selective collection restore
4. Document-level recovery

---

## Implementation Checklist

### Priority 1 (Week 1)
- [ ] Create Firestore project structure
- [ ] Define security rules
- [ ] Create composite indexes
- [ ] Implement Users collection
- [ ] Connect authentication

### Priority 2 (Week 2)  
- [ ] Implement Properties collection
- [ ] Create property CRUD operations
- [ ] Add search functionality
- [ ] Connect to frontend

### Priority 3 (Week 3)
- [ ] Implement Leads collection
- [ ] Create Transactions collection
- [ ] Add Offers functionality
- [ ] Commission calculations

### Current Status: 0% Implemented
**Reality:** All data is currently hardcoded or mocked in frontend. No actual database connections exist.

