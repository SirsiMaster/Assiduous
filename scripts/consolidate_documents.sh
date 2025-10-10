#!/bin/bash

# Document Consolidation Script
# Consolidates 43+ markdown files into 19 canonical documents

cd /Users/thekryptodragon/Development/assiduous

echo "Starting document consolidation..."
echo "Creating 19 canonical documents from 43 source files..."

# 1. REQUIREMENTS_SPECIFICATION.md
echo "Creating REQUIREMENTS_SPECIFICATION.md..."
cat > docs/REQUIREMENTS_SPECIFICATION.md << 'EOF'
# REQUIREMENTS SPECIFICATION DOCUMENT
## Assiduous AI-Powered Real Estate Platform

**Document Type:** Requirements Specification  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Requirements Document
**Consolidation Note:** Merged from assiduous_technical_blueprint.md and README.md

---

EOF
cat docs/assiduous_technical_blueprint.md >> docs/REQUIREMENTS_SPECIFICATION.md
echo -e "\n\n---\n# Appendix: README Content\n---\n" >> docs/REQUIREMENTS_SPECIFICATION.md
cat README.md >> docs/REQUIREMENTS_SPECIFICATION.md

# 2. PROJECT_SCOPE.md
echo "Creating PROJECT_SCOPE.md..."
cat > docs/PROJECT_SCOPE.md << 'EOF'
# PROJECT SCOPE DOCUMENT
## Assiduous Platform Scope and Boundaries

**Document Type:** Project Scope  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Scope Document
**Consolidation Note:** Merged from 10_DAY_MVP_PLAN.md

---

EOF
cat docs/10_DAY_MVP_PLAN.md >> docs/PROJECT_SCOPE.md

# 3. ARCHITECTURE_DESIGN.md
echo "Creating ARCHITECTURE_DESIGN.md..."
cat > docs/ARCHITECTURE_DESIGN.md << 'EOF'
# ARCHITECTURE DESIGN DOCUMENT
## System Architecture and Design Patterns

**Document Type:** Architecture Design  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Architecture Document
**Consolidation Note:** Merged from CI_CD_CORRECTED_ARCHITECTURE.md and technical sections of WARP.md

---

EOF
cat docs/CI_CD_CORRECTED_ARCHITECTURE.md >> docs/ARCHITECTURE_DESIGN.md
echo -e "\n\n---\n# Firebase Multi-Environment Architecture\n---\n" >> docs/ARCHITECTURE_DESIGN.md
cat docs/FIREBASE_MULTI_ENVIRONMENT_SETUP.md >> docs/ARCHITECTURE_DESIGN.md

# 4. TECHNICAL_DESIGN.md
echo "Creating TECHNICAL_DESIGN.md..."
cat > docs/TECHNICAL_DESIGN.md << 'EOF'
# TECHNICAL DESIGN DOCUMENT
## Technical Implementation Details

**Document Type:** Technical Design  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Technical Document
**Consolidation Note:** Merged from COMPONENT_LIBRARY_MIGRATION.md, SIRSIMASTER_UI_IMPLEMENTATION.md, and technical sections

---

EOF
cat docs/COMPONENT_LIBRARY_MIGRATION.md >> docs/TECHNICAL_DESIGN.md
echo -e "\n\n---\n# UI Implementation\n---\n" >> docs/TECHNICAL_DESIGN.md
cat docs/SIRSIMASTER_UI_IMPLEMENTATION.md >> docs/TECHNICAL_DESIGN.md
echo -e "\n\n---\n# Development Pipeline\n---\n" >> docs/TECHNICAL_DESIGN.md
cat docs/DEVELOPMENT_PIPELINE.md >> docs/TECHNICAL_DESIGN.md

# 5. DATA_MODEL.md
echo "Creating DATA_MODEL.md..."
cat > docs/DATA_MODEL.md << 'EOF'
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

EOF

# 6. API_SPECIFICATION.md
echo "Creating API_SPECIFICATION.md..."
cp docs/api_docs.md docs/API_SPECIFICATION.md
sed -i '' '1i\
# API SPECIFICATION DOCUMENT\
## RESTful API Endpoints and Contracts\
\
**Document Type:** API Specification\
**Version:** 2.0.0\
**Last Updated:** October 9, 2025\
**Status:** Authoritative API Document\
**Consolidation Note:** Renamed from api_docs.md\
\
---\
' docs/API_SPECIFICATION.md

# 7. USER_STORIES.md
echo "Creating USER_STORIES.md..."
cat > docs/USER_STORIES.md << 'EOF'
# USER STORIES AND USE CASES DOCUMENT
## User Requirements and Scenarios

**Document Type:** User Stories  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative User Stories Document
**Consolidation Note:** Extracted from technical blueprint and scope documents

---

## User Personas

### 1. Home Buyer (Sarah)
- First-time buyer looking for affordable properties
- Wants to compare neighborhoods and get pre-approval
- Needs guidance through the buying process

### 2. Property Investor (Mike)
- Experienced flipper looking for undervalued properties
- Needs quick access to ARV and ROI calculations
- Wants off-market deals and wholesale opportunities

### 3. Real Estate Agent (Jennifer)
- Managing multiple clients and listings
- Needs CRM integration and lead management
- Wants automated marketing and follow-ups

### 4. Wholesaler (David)
- Finding distressed properties to assign
- Needs instant buyer matching
- Wants automated contract generation

## User Stories

### Buyer Stories
- As a buyer, I want to search properties by location and price so I can find homes in my budget
- As a buyer, I want to save favorite properties so I can review them later
- As a buyer, I want to schedule viewings online so I don't have to call
- As a buyer, I want to see estimated monthly payments so I know what I can afford
- As a buyer, I want to contact agents directly through the platform

### Investor Stories
- As an investor, I want to see flip profit estimates so I can evaluate deals quickly
- As an investor, I want to filter by distressed properties so I can find opportunities
- As an investor, I want to access off-market deals so I have less competition
- As an investor, I want to analyze comparable sales so I can determine ARV
- As an investor, I want to track my portfolio performance

### Agent Stories
- As an agent, I want to manage my listings in one place so I save time
- As an agent, I want to track client interactions so I can follow up effectively
- As an agent, I want to generate market reports so I can show expertise
- As an agent, I want automated lead nurturing so I don't miss opportunities
- As an agent, I want commission tracking so I know my earnings

### Admin Stories
- As an admin, I want to monitor platform metrics so I can track growth
- As an admin, I want to manage user accounts so I can control access
- As an admin, I want to moderate listings so I ensure quality
- As an admin, I want to generate revenue reports so I track business performance
- As an admin, I want to configure system settings so I can customize the platform

EOF

# 8. TEST_PLAN.md
echo "Creating TEST_PLAN.md..."
cat > docs/TEST_PLAN.md << 'EOF'
# TEST PLAN AND TEST CASES DOCUMENT
## Testing Strategy and Test Cases

**Document Type:** Test Plan  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Test Document
**Consolidation Note:** Merged from QA reports

---

EOF
cat docs/AGENT_PORTAL_QA_FAILURE_REPORT.md >> docs/TEST_PLAN.md
echo -e "\n\n---\n# Phase 3 QA Report\n---\n" >> docs/TEST_PLAN.md
cat docs/PHASE3_QA_REPORT.md >> docs/TEST_PLAN.md

# 9. QA_PLAN.md
echo "Creating QA_PLAN.md..."
cat > docs/QA_PLAN.md << 'EOF'
# QUALITY ASSURANCE PLAN
## QA Procedures and Standards

**Document Type:** QA Plan  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative QA Document
**Consolidation Note:** Extracted from WARP.md RULE 4

---

EOF
# Extract QA sections from WARP.md
grep -A 500 "RULE 4: MANDATORY HARSH QA" ../WARP.md >> docs/QA_PLAN.md

# 10. CHANGELOG.md - Already exists, just copy
echo "Keeping CHANGELOG.md..."
cp ../CHANGELOG.md docs/CHANGELOG.md

# 11. DEPLOYMENT_GUIDE.md
echo "Creating DEPLOYMENT_GUIDE.md..."
cat > docs/DEPLOYMENT_GUIDE.md << 'EOF'
# DEPLOYMENT GUIDE
## Deployment Procedures and Configuration

**Document Type:** Deployment Guide  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Deployment Document
**Consolidation Note:** Merged from CI/CD guides and Firebase setup

---

EOF
cat docs/CICD_SETUP_GUIDE.md >> docs/DEPLOYMENT_GUIDE.md
echo -e "\n\n---\n# Firebase Quick Reference\n---\n" >> docs/DEPLOYMENT_GUIDE.md
cat docs/FIREBASE_QUICK_REFERENCE.md >> docs/DEPLOYMENT_GUIDE.md
echo -e "\n\n---\n# CI/CD Setup Complete\n---\n" >> docs/DEPLOYMENT_GUIDE.md
cat docs/CI_CD_SETUP_COMPLETE.md >> docs/DEPLOYMENT_GUIDE.md

# 12. MAINTENANCE_SUPPORT.md
echo "Creating MAINTENANCE_SUPPORT.md..."
cat > docs/MAINTENANCE_SUPPORT.md << 'EOF'
# MAINTENANCE AND SUPPORT DOCUMENT
## System Maintenance and Support Procedures

**Document Type:** Maintenance & Support  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Maintenance Document
**Consolidation Note:** New document created from operational sections

---

## Maintenance Schedule

### Daily Tasks
- Monitor Firebase Console for errors
- Check GitHub Actions for failed workflows
- Review Dependabot security alerts
- Verify production site availability

### Weekly Tasks
- Update dependencies
- Run security scans
- Review performance metrics
- Backup Firestore database

### Monthly Tasks
- Review and update documentation
- Analyze usage patterns
- Update SSL certificates (if needed)
- Review Firebase billing

## Support Procedures

### Issue Triage
1. Check error logs in Firebase Console
2. Review GitHub Issues
3. Prioritize by severity
4. Assign to appropriate team member

### Emergency Response
- Production down: Follow rollback procedures
- Security breach: Disable affected services
- Data loss: Restore from backup
- Performance issues: Scale Firebase resources

### Contact Information
- Technical Lead: Via GitHub Issues
- Emergency: Create urgent GitHub Issue with 'urgent' label

EOF

# 13. SECURITY_COMPLIANCE.md
echo "Creating SECURITY_COMPLIANCE.md..."
cat > docs/SECURITY_COMPLIANCE.md << 'EOF'
# SECURITY AND COMPLIANCE DOCUMENT
## Security Requirements and Compliance Standards

**Document Type:** Security & Compliance  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Security Document
**Consolidation Note:** Merged from all security documents

---

EOF
cat docs/SECURITY_AUDIT_REPORT.md >> docs/SECURITY_COMPLIANCE.md
echo -e "\n\n---\n# Security Implementation Summary\n---\n" >> docs/SECURITY_COMPLIANCE.md
cat docs/SECURITY_IMPLEMENTATION_SUMMARY.md >> docs/SECURITY_COMPLIANCE.md
echo -e "\n\n---\n# KMS Implementation\n---\n" >> docs/SECURITY_COMPLIANCE.md
cat docs/GOOGLE_KMS_IMPLEMENTATION.md >> docs/SECURITY_COMPLIANCE.md

# 14. RISK_MANAGEMENT.md
echo "Creating RISK_MANAGEMENT.md..."
cat > docs/RISK_MANAGEMENT.md << 'EOF'
# RISK MANAGEMENT PLAN
## Risk Assessment and Mitigation Strategies

**Document Type:** Risk Management  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Risk Document
**Consolidation Note:** Extracted from PROJECT_STATUS.md risk register

---

## Risk Register

### High Priority Risks

#### 1. Technical Debt Accumulation
- **Probability:** 70%
- **Impact:** High - Development slowdown
- **Mitigation:** Dedicate 20% sprint capacity to refactoring
- **Status:** Active monitoring

#### 2. Security Vulnerabilities
- **Probability:** 60%
- **Impact:** Critical - Data breach risk
- **Mitigation:** Weekly dependency updates, security scans
- **Status:** 52 Dependabot alerts pending

#### 3. Incomplete Backend Integration
- **Probability:** 90%
- **Impact:** Critical - Platform not functional
- **Mitigation:** Prioritize API development
- **Status:** Major risk - only 27% complete

### Medium Priority Risks

#### 4. Scalability Issues
- **Probability:** 40%
- **Impact:** Medium - Performance degradation
- **Mitigation:** Load testing before launch
- **Status:** Not yet addressed

#### 5. Budget Overrun
- **Probability:** 50%
- **Impact:** Medium - Project delay
- **Mitigation:** Track hours carefully
- **Status:** Currently at $18K of estimated $30K

### Low Priority Risks

#### 6. Documentation Gaps
- **Probability:** 30%
- **Impact:** Low - Developer confusion
- **Mitigation:** Regular documentation updates
- **Status:** Being addressed with consolidation

## Risk Response Strategies

1. **Avoid:** Eliminate risk by changing project approach
2. **Mitigate:** Reduce probability or impact
3. **Transfer:** Move risk to third party (insurance, contracts)
4. **Accept:** Acknowledge and monitor

EOF

# 15. CHANGE_MANAGEMENT.md
echo "Creating CHANGE_MANAGEMENT.md..."
cat > docs/CHANGE_MANAGEMENT.md << 'EOF'
# CHANGE MANAGEMENT PLAN
## Change Control Procedures

**Document Type:** Change Management  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Change Document
**Consolidation Note:** Merged from rollback_registry.md and CANONICAL_DOCS.md

---

EOF
cat ../rollback_registry.md >> docs/CHANGE_MANAGEMENT.md
echo -e "\n\n---\n# Change Control Process\n---\n" >> docs/CHANGE_MANAGEMENT.md
grep -A 50 "Update Workflow" ../CANONICAL_DOCS.md >> docs/CHANGE_MANAGEMENT.md

# 16. COMMUNICATION_PLAN.md
echo "Creating COMMUNICATION_PLAN.md..."
cat > docs/COMMUNICATION_PLAN.md << 'EOF'
# COMMUNICATION PLAN
## Stakeholder Communication Strategy

**Document Type:** Communication Plan  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Communication Document
**Consolidation Note:** New document for stakeholder communication

---

## Stakeholder Matrix

| Stakeholder | Role | Communication Method | Frequency |
|------------|------|---------------------|-----------|
| Project Owner | Decision Maker | GitHub Issues, Direct | As needed |
| Development Team | Implementation | GitHub, Slack | Daily |
| Users | End Users | Documentation, Support | As needed |
| Investors | Funding | Reports, Demos | Monthly |

## Communication Channels

### Internal Communication
- **GitHub Issues:** Bug tracking, feature requests
- **GitHub Pull Requests:** Code reviews
- **Documentation:** Technical references
- **Comments:** Inline code documentation

### External Communication
- **Website:** Public information
- **Support:** User assistance
- **Release Notes:** Version updates
- **Status Page:** System availability

## Reporting Schedule

### Daily
- Development progress in dashboard
- Commit activity

### Weekly
- Sprint progress update
- Metrics review

### Monthly
- Project status report
- Financial summary
- Risk assessment update

## Escalation Path

1. Developer Issue → Technical Lead
2. Technical Issue → Project Owner
3. Business Issue → Stakeholders
4. Emergency → All parties via urgent GitHub Issue

EOF

# 17. TRAINING_DOCUMENTATION.md
echo "Creating TRAINING_DOCUMENTATION.md..."
cat > docs/TRAINING_DOCUMENTATION.md << 'EOF'
# TRAINING AND USER DOCUMENTATION
## Training Materials and User Guides

**Document Type:** Training Documentation  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Training Document
**Consolidation Note:** Merged from CLAUDE.md and user guides

---

EOF
cat ../CLAUDE.md >> docs/TRAINING_DOCUMENTATION.md
echo -e "\n\n---\n# GitHub Contributing Guide\n---\n" >> docs/TRAINING_DOCUMENTATION.md
cat ../.github/CONTRIBUTING.md >> docs/TRAINING_DOCUMENTATION.md

# 18. PROJECT_MANAGEMENT.md
echo "Creating PROJECT_MANAGEMENT.md..."
cat > docs/PROJECT_MANAGEMENT.md << 'EOF'
# PROJECT MANAGEMENT PLAN
## Project Planning and Tracking

**Document Type:** Project Management  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Project Document
**Consolidation Note:** Merged from PROJECT_STATUS.md and CANONICAL_DOCS.md

---

EOF
cat ../PROJECT_STATUS.md >> docs/PROJECT_MANAGEMENT.md
echo -e "\n\n---\n# Document Management\n---\n" >> docs/PROJECT_MANAGEMENT.md
cat ../CANONICAL_DOCS.md >> docs/PROJECT_MANAGEMENT.md
echo -e "\n\n---\n# Document Inventory\n---\n" >> docs/PROJECT_MANAGEMENT.md
cat docs/CANONICAL_DOCUMENTS_INVENTORY.md >> docs/PROJECT_MANAGEMENT.md

# 19. POST_IMPLEMENTATION_REVIEW.md
echo "Creating POST_IMPLEMENTATION_REVIEW.md..."
cat > docs/POST_IMPLEMENTATION_REVIEW.md << 'EOF'
# POST-IMPLEMENTATION REVIEW DOCUMENT
## Lessons Learned and Project Review

**Document Type:** Post-Implementation Review  
**Version:** 2.0.0  
**Last Updated:** October 9, 2025  
**Status:** Authoritative Review Document
**Consolidation Note:** Based on HONEST_PROJECT_ASSESSMENT_2025-10-09.md

---

EOF
cat docs/HONEST_PROJECT_ASSESSMENT_2025-10-09.md >> docs/POST_IMPLEMENTATION_REVIEW.md

echo "Consolidation complete! Created 19 canonical documents."
echo ""
echo "Next steps:"
echo "1. Delete old files"
echo "2. Update references"
echo "3. Verify completeness"