# PROJECT SCOPE DOCUMENT
## Assiduous Platform Scope and Boundaries

**Document Type:** Project Scope  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Scope Document
**Consolidation Note:** Merged from 10_DAY_MVP_PLAN.md

---

# MVP Development Plan & Progress Tracker
**Target**: Functional micro-flipping platform with three portals (Admin, Client, Agent)  
**Current Phase**: Phase 3 - Agent Portal Development  
**Last Updated**: October 9, 2025  
**Status**: Phase 1 & 2 Partially Complete (~60%), Phase 3 Not Started  
**Recalibration Note**: Status corrected on October 9, 2025 to reflect actual project state

---

## Reality Check: Blueprint vs 10 Days

### Current Blueprint Scope
The technical blueprint envisions:
- Advanced AI/ML matching (6-12 weeks)
- Multi-market expansion (3-6 months)
- Mobile apps (8-12 weeks)
- Complex integrations (MLS, CRM, etc.) (4-8 weeks)
- Enterprise-grade infrastructure (ongoing)

### What's Actually Possible in 10 Days
**One focused developer working 12-14 hour days** can deliver a functional MVP with:
- Basic backend API (Firebase Cloud Functions)
- Real property database (Firestore)
- Functional property search and display
- User authentication and profiles
- Lead capture and management
- Basic analytics
- **No AI/ML** (future phase)
- **No MLS integration** (future phase)
- **No mobile apps** (future phase)

---

## 10-Day MVP Scope (October 6-15)

### Core Value Proposition
**AssiduousFlip**: A micro-flipping platform that helps buyers find flip-ready properties, estimate profits, and connect with experts.

### ⚠️ PHASE 1-2 PARTIALLY COMPLETED (~60% - October 9, 2025)

#### Admin Portal - COMPLETE
1. ✅ **Admin Dashboard** - Full analytics and metrics
2. ✅ **Properties Management** - List view with filters
3. ✅ **Property Detail** - Full detail view with actions
4. ✅ **Property Form** - Add/edit with live calculations
5. ✅ **Property CRUD** - Create, read, update, delete, status change
6. ✅ **Agents Management** - Agent directory and metrics
7. ✅ **Clients Management** - Client tracking
8. ✅ **Transactions** - Deal pipeline
9. ✅ **Analytics** - Real-time insights
10. ✅ **Market Analysis** - Neighborhood metrics

#### Client Portal - COMPLETE  
1. ✅ **Client Dashboard** - Personal metrics and widgets
2. ✅ **Properties Browse** - Grid view with filters
3. ✅ **Property Detail** - Full details with actions
4. ✅ **Save Properties** - Favorites with localStorage
5. ✅ **Schedule Viewing** - Date/time picker modal
6. ✅ **Contact Agent** - Contact form modal
7. ✅ **Recently Viewed** - Auto-tracking last 10 properties
8. ✅ **Saved Properties Widget** - Dashboard display
9. ✅ **Search & Filters** - Neighborhood, type, price, bedrooms
10. ✅ **Mobile Responsive** - All pages work on mobile

#### Technical Infrastructure - COMPLETE
1. ✅ **PropertyService** - Full CRUD API client (with getProperty fix)
2. ✅ **Firebase Hosting** - Deployed to assiduousflip.web.app
3. ✅ **Design System** - Consistent UI across portals
4. ✅ **localStorage Integration** - Client-side persistence
5. ✅ **Backend API** - Cloud Functions at us-central1
6. ✅ **Firestore Database** - Real property data
7. ✅ **QA/QC Framework** - RULE 4 in WARP.md

### Explicitly Out of Scope (Post-Oct 15)
- ❌ AI property matching
- ❌ Automated property valuation (ML model)
- ❌ MLS integration
- ❌ CRM integrations
- ❌ Mobile applications
- ❌ Virtual tours/3D
- ❌ Document management/e-signing
- ❌ Payment processing
- ❌ Advanced market analysis
- ❌ Chatbot/NLP
- ❌ Multi-language support

---

## Day-by-Day Development Plan

### Day 1-2 (Oct 6-7): Backend Foundation
**Goal**: Firebase Cloud Functions + Firestore setup

#### Tasks:
1. **Firebase Functions Setup** (4 hours)
   - Initialize Cloud Functions project
   - Set up TypeScript/JavaScript structure
   - Configure environment variables
   - Deploy hello-world function

2. **Firestore Data Models** (6 hours)
   - Design collections schema:
     - `properties` collection
     - `users` collection
     - `leads` collection
     - `favorites` collection
   - Create Firestore security rules
   - Set up compound indexes
   - Seed test data (10-20 properties)

3. **Core API Endpoints** (8 hours)
   ```
   GET  /api/properties - List properties
   GET  /api/properties/:id - Get property details
   POST /api/properties/search - Search properties
   POST /api/leads - Submit lead
   GET  /api/user/favorites - Get user favorites
   POST /api/user/favorites - Add favorite
   ```

4. **Authentication Integration** (4 hours)
   - Firebase Auth setup
   - Email/password authentication
   - Auth middleware for protected routes
   - User profile creation on signup

**Deliverable**: Working backend API deployed to Firebase

---

### Day 3-4 (Oct 8-9): Frontend-Backend Integration
**Goal**: Connect existing UI to real backend

#### Tasks:
1. **Property Service Layer** (6 hours)
   - Create `PropertyService.js`
   - Implement Firestore queries
   - Add caching layer
   - Error handling

2. **Auth Service Integration** (4 hours)
   - Update `auth.js` with Firebase Auth
   - Add login/signup flows
   - Session management
   - Protected routes

3. **Property Listing Page** (6 hours)
   - Replace mockup data with Firestore
   - Implement real-time search
   - Add filtering (price, location, type)
   - Pagination

4. **Property Detail Page** (4 hours)
   - Fetch property by ID
   - Display all property information
   - Add to favorites functionality
   - Contact form integration

**Deliverable**: Functional property browsing with real data

---

### ⚡ PHASE 3: Agent Portal - NOT STARTED ❌
**Goal**: Complete agent workflows for listing and client management  
**Status**: Not Started - Only redirect stub exists  
**Completion Date**: None - Work not done  
**Time Needed**: Estimated 10-14 hours

#### Pages to Create:
1. **Agent Dashboard** (`/agent/dashboard.html`) - 2-3 hours
   - Agent sidebar navigation
   - Personal metrics (listings, clients, commission)
   - Leaderboard position
   - Recent listings grid
   - Upcoming viewings calendar
   - New leads notification
   - Quick action buttons
   - Performance charts

2. **Agent Listings** (`/agent/listings.html`) - 2-3 hours
   - My properties grid view
   - Filter by status (available, pending, sold)
   - Quick edit actions
   - Status change dropdown
   - Add new listing button
   - Performance metrics per listing
   - Sort by price, date, views

3. **Agent Clients** (`/agent/clients.html`) - 2-3 hours
   - My clients list view
   - Communication history
   - Scheduled viewings
   - Follow-up reminders
   - Client notes
   - Contact information
   - Client status tracking

4. **Agent Leads** (`/agent/leads.html`) - 2-3 hours
   - New leads queue
   - Lead scoring display
   - Qualification form
   - Assign to me button
   - Lead status tracking
   - Conversion funnel
   - Follow-up scheduler

**Success Criteria**:
- [ ] All 4 agent pages created and deployed
- [ ] Agent sidebar navigation working
- [ ] PropertyService integration functional
- [ ] Mobile responsive verified
- [ ] RULE 4 QA/QC assessment passed
- [ ] Zero console errors in browser
- [ ] All workflows tested end-to-end

**Deliverable**: Functional agent portal with complete workflows

---

### PHASE 4: Authentication System (CRITICAL)
**Goal**: Add user authentication and role-based access  
**Status**: Not started  
**Estimated Time**: 6-8 hours  
**Dependencies**: Phase 3 complete

#### Tasks:
1. **Firebase Authentication Setup** (2 hours)
   - Initialize Firebase Auth
   - Configure auth providers
   - Set up security rules

2. **Login/Signup Pages** (2 hours)
   - Create `/login.html`
   - Create `/signup.html` with role selection
   - Password reset flow

3. **Role-Based Access Control** (2-3 hours)
   - Implement RBAC middleware
   - Store user roles in Firestore
   - Redirect based on role
   - Protect routes by role

4. **Session Management** (1-2 hours)
   - Persistent sessions
   - Auto-redirect on login
   - Logout functionality

### PHASE 5: Backend API Development (CRITICAL)
**Goal**: Replace mock data with real Cloud Functions  
**Status**: Not started  
**Estimated Time**: 12-16 hours  
**Dependencies**: Auth system complete

#### Endpoints to Create:
1. **Property Operations** (4-6 hours)
   - GET /api/properties
   - GET /api/properties/:id
   - POST /api/properties
   - PATCH /api/properties/:id
   - DELETE /api/properties/:id

2. **User Operations** (3-4 hours)
   - POST /api/users (create profile)
   - GET /api/users/:id
   - PATCH /api/users/:id
   - POST /api/users/:id/favorites
   - DELETE /api/users/:id/favorites/:propertyId

3. **Lead Operations** (3-4 hours)
   - POST /api/leads/contact
   - POST /api/leads/viewing
   - GET /api/leads (for agents)
   - PATCH /api/leads/:id

4. **Agent Operations** (2-3 hours)
   - GET /api/agents/:id/dashboard
   - GET /api/agents/:id/listings
   - GET /api/agents/:id/clients
   - GET /api/agents/:id/leads

### PHASE 6-9: Enhanced Features
**Status**: Planned for future

- **Phase 6**: Real-time Firestore listeners
- **Phase 7**: Image upload to Cloud Storage
- **Phase 8**: Email notifications (SendGrid)
- **Phase 9**: Analytics tracking (Firebase + GA4)
   - Touch-friendly interactions
   - Mobile menu

**Deliverable**: Polished, fast, functional platform

---

### Day 9 (Oct 14): Testing & Bug Fixes
**Goal**: Comprehensive testing and issue resolution

#### Tasks:
1. **Functional Testing** (6 hours)
   - Test all user flows
   - Test admin functions
   - Test edge cases
   - Cross-browser testing
   - Mobile testing

2. **Security Review** (4 hours)
   - Review Firestore rules
   - Check authentication flows
   - Input sanitization
   - XSS prevention
   - Rate limiting

3. **Performance Testing** (2 hours)
   - Load time testing
   - Database query performance
   - Image loading
   - API response times

4. **Bug Fixes** (6 hours)
   - Fix critical bugs
   - Address UX issues
   - Polish interactions
   - Final adjustments

**Deliverable**: Production-ready platform

---

### Day 10 (Oct 15): Deployment & Launch
**Goal**: Production deployment and go-live

#### Tasks:
1. **Final Deployment** (4 hours)
   - Deploy Cloud Functions
   - Update Firestore rules
   - Configure custom domain
   - SSL certificate
   - CDN setup

2. **Data Population** (4 hours)
   - Add real properties (50-100)
   - Optimize images
   - Verify data quality
   - Test with production data

3. **Monitoring Setup** (2 hours)
   - Error tracking (Sentry)
   - Uptime monitoring
   - Performance monitoring
   - Alert configuration

4. **Documentation** (3 hours)
   - User guide
   - Admin manual
   - API documentation
   - Deployment notes

5. **Launch** (3 hours)
   - Final smoke tests
   - Announce launch
   - Monitor initial traffic
   - Quick response to issues

**Deliverable**: Live, functional AssiduousFlip platform

---

## Technical Architecture (MVP)

### Backend Stack
```
Firebase Cloud Functions (Node.js)
├── /api/properties - Property management
├── /api/users - User management
├── /api/leads - Lead capture
└── /api/search - Search functionality

Firestore Collections
├── properties/
│   ├── {propertyId}
│   ├── address, price, details
│   ├── images[], features[]
│   └── flipEstimate{}
├── users/
│   ├── {userId}
│   ├── profile, preferences
│   └── favorites[]
└── leads/
    ├── {leadId}
    ├── property, user, timestamp
    └── status, notes
```

### Frontend Integration
```
Existing HTML/CSS/JS Frontend
├── Updated with real API calls
├── Firebase SDK integration
├── Real-time Firestore queries
└── Firebase Auth integration
```

### Deployment
```
Production Environment
├── Firebase Hosting (frontend)
├── Cloud Functions (backend)
├── Firestore (database)
├── Cloud Storage (images)
└── Firebase Analytics
```

---

## Firestore Schema (MVP)

### Properties Collection
```javascript
properties/{propertyId}
{
  id: string,
  address: {
    street: string,
    city: string,
    state: string,
    zip: string,
    coordinates: GeoPoint
  },
  price: {
    list: number,
    arv: number,  // After Repair Value
    repair: number
  },
  details: {
    bedrooms: number,
    bathrooms: number,
    sqft: number,
    lot: number,
    year: number,
    type: string  // single_family, condo, townhouse
  },
  images: [
    {
      url: string,
      thumbnail: string,
      caption: string
    }
  ],
  features: string[],  // pool, garage, basement, etc.
  status: string,  // available, pending, sold
  flipEstimate: {
    profit: number,
    roi: number,
    holdingTime: number
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Users Collection
```javascript
users/{userId}
{
  id: string,
  email: string,
  profile: {
    name: string,
    phone: string,
    role: string  // buyer, agent, admin
  },
  preferences: {
    locations: string[],
    priceRange: {min: number, max: number},
    propertyTypes: string[]
  },
  favorites: string[],  // property IDs
  createdAt: timestamp,
  lastLogin: timestamp
}
```

### Leads Collection
```javascript
leads/{leadId}
{
  id: string,
  propertyId: string,
  user: {
    name: string,
    email: string,
    phone: string
  },
  message: string,
  type: string,  // viewing, offer, question
  status: string,  // new, contacted, qualified, closed
  createdAt: timestamp
}
```

---

## API Endpoints (MVP)

### Properties API
```typescript
// GET /api/properties
// Query: ?limit=20&offset=0&city=Philadelphia&minPrice=100000&maxPrice=300000
Response: {
  properties: Property[],
  total: number,
  hasMore: boolean
}

// GET /api/properties/:id
Response: {
  property: Property
}

// POST /api/properties/search
Body: {
  location?: string,
  priceRange?: {min: number, max: number},
  bedrooms?: number,
  propertyType?: string
}
Response: {
  properties: Property[],
  count: number
}
```

### Leads API
```typescript
// POST /api/leads
Body: {
  propertyId: string,
  name: string,
  email: string,
  phone: string,
  message: string,
  type: string
}
Response: {
  leadId: string,
  success: boolean
}
```

### User API
```typescript
// GET /api/user/profile
Authorization: Bearer token
Response: {
  user: User
}

// PUT /api/user/profile
Authorization: Bearer token
Body: {
  profile: {...},
  preferences: {...}
}

// GET /api/user/favorites
Authorization: Bearer token
Response: {
  favorites: Property[]
}

// POST /api/user/favorites
Authorization: Bearer token
Body: {
  propertyId: string
}
```

---

## Success Criteria (Oct 15)

### Functional Requirements ✅
- [ ] Users can browse properties
- [ ] Users can search/filter properties
- [ ] Users can view property details
- [ ] Users can register/login
- [ ] Users can save favorite properties
- [ ] Users can submit leads
- [ ] Profit calculator works
- [ ] Admin can add/edit properties
- [ ] Analytics tracking active

### Performance Requirements ✅
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] Mobile responsive
- [ ] 99% uptime
- [ ] Images optimized

### Security Requirements ✅
- [ ] HTTPS enabled
- [ ] Firestore rules configured
- [ ] Authentication working
- [ ] Input validation
- [ ] XSS protection

---

## Post-Launch Roadmap (Phase 2+)

### Weeks 2-4 (Oct 16 - Nov 6)
- Add more properties (scale to 500+)
- Email notification system
- Advanced search filters
- Property comparison tool
- User reviews/ratings

### Months 2-3 (Nov 7 - Jan 6)
- Basic AI recommendations (simple algorithm)
- Automated property valuation (regression model)
- Agent matching system
- Document upload/management
- Payment integration (deposits)

### Months 4-6 (Jan 7 - Apr 6)
- MLS integration (start with one market)
- Mobile app (React Native)
- Advanced AI matching
- CRM integration
- Virtual tours

---

## Risk Mitigation

### High-Risk Items
1. **Time Constraint**
   - *Mitigation*: Strict scope control, no feature creep
   - *Backup*: Cut profit calculator or admin panel if needed

2. **Technical Complexity**
   - *Mitigation*: Use Firebase (managed services)
   - *Backup*: Simplify data models, fewer features

3. **Data Availability**
   - *Mitigation*: Manual data entry for initial properties
   - *Backup*: Start with 20-30 properties, scale post-launch

4. **Testing Time**
   - *Mitigation*: Test continuously, not just Day 9
   - *Backup*: Focus on critical paths only

### Contingency Plans
- **If behind by Day 5**: Cut admin panel, use Firebase console
- **If behind by Day 7**: Cut profit calculator enhancement
- **If behind by Day 9**: Launch with 20 properties, add more daily

---

## Resource Requirements

### Development
- **1 Full-stack Developer**: 120-140 hours over 10 days
- **Tools**: Firebase, VS Code, Postman, Git
- **Services**: Firebase Spark plan (free), upgrade to Blaze if needed

### Content
- **Property Data**: 50-100 Philadelphia properties
- **Images**: 5-10 per property (royalty-free or real)
- **Content Writing**: Property descriptions, site copy

### Budget
- **Firebase**: ~$25-50/month (Blaze plan for functions)
- **Domain**: $12/year (already have)
- **CDN**: Included in Firebase
- **Email**: SendGrid free tier
- **Total**: ~$50 for October

---

## Bottom Line

### What We're Building
A **functional micro-flipping platform** where users can:
- Browse real properties
- Search and filter
- Calculate flip profits
- Save favorites
- Submit leads
- Create accounts

### What We're NOT Building (Yet)
- AI/ML features
- Mobile apps
- MLS integration
- Complex integrations
- Advanced analytics

### Is This Achievable?
**Yes**, with focused execution and strict scope control. The plan is aggressive but realistic for a single developer working intensively for 10 days.

### Success Definition
By October 15, we have a **live, functional platform** that demonstrates value and can be iterated on post-launch.

---

**Created**: October 5, 2025  
**Deadline**: October 15, 2025  
**Status**: Ready to execute  
**Next Action**: Begin Day 1 implementation
