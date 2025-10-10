# MAINTENANCE AND SUPPORT DOCUMENT
## Comprehensive System Maintenance, Monitoring, and Support Procedures

**Document Type:** Maintenance & Support  
**Version:** 3.0.0  
**Last Updated:** October 10, 2025  
**Status:** Complete Maintenance & Support Documentation  
**Implementation Status:** Partially implemented (monitoring active, procedures defined)  
**Reality Check:** GitHub Actions monitoring works, manual procedures not tested

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

---

## COMPREHENSIVE MONITORING PROCEDURES

### Real-Time Monitoring Dashboard
**URL:** https://assiduousflip.web.app/admin/development  
**Frequency:** Check every 4 hours during business hours

#### Key Metrics to Monitor
```
✅ Green Indicators (Healthy)
- Response time < 2s
- Error rate < 1%
- Active users > 0
- Database connections stable

⚠️ Yellow Indicators (Warning)
- Response time 2-5s
- Error rate 1-5%
- Memory usage > 80%
- Queue backlog > 100

🔴 Red Indicators (Critical)
- Response time > 5s
- Error rate > 5%
- Service unavailable
- Database disconnected
```

### Automated Monitoring Systems

#### 1. GitHub Actions Site Monitor
**File:** `.github/workflows/site-monitor.yml`  
**Frequency:** Every 15 minutes  
**Checks:**
- Production site (https://assiduousflip.web.app)
- Admin portal (/admin)
- Client portal (/client)
- API endpoints health

**Actions on Failure:**
- Creates GitHub issue automatically
- Tags: `site-down`, `urgent`, `automated`
- Notifications sent to repository watchers

#### 2. Firebase Performance Monitoring
**Console:** https://console.firebase.google.com/project/assiduous-prod/performance  
**Key Metrics:**
- Page load time
- Network request latency
- JavaScript errors
- Custom traces for critical paths

#### 3. Error Tracking
**Firebase Crashlytics:** Enabled for production  
**Sentry.io:** (Future integration planned)  

### Manual Monitoring Checklist

#### Daily (9 AM PST)
- [ ] Check production site availability
- [ ] Review Firebase Console for errors
- [ ] Check GitHub Actions status
- [ ] Monitor active user count
- [ ] Review error logs from last 24h
- [ ] Check Dependabot alerts

#### Weekly (Monday 10 AM PST)
- [ ] Run full site crawler test
- [ ] Review performance metrics trends
- [ ] Check SSL certificate expiry (30 day warning)
- [ ] Analyze user behavior patterns
- [ ] Review security scan results
- [ ] Update dependency versions

#### Monthly (1st Monday)
- [ ] Full backup verification
- [ ] Load testing (simulate 100 concurrent users)
- [ ] Security audit
- [ ] Review Firebase billing
- [ ] Update documentation
- [ ] Team retrospective meeting

---

## TROUBLESHOOTING GUIDES

### Common Issues and Solutions

#### Issue 1: Site Returns 404 Errors
**Symptoms:** Pages not loading, 404 errors  
**Likely Cause:** Firebase hosting misconfiguration  
**Solution:**
```bash
cd firebase-migration-package
firebase deploy --only hosting:production
```
**Verification:** `curl -I https://assiduousflip.web.app`

#### Issue 2: Authentication Not Working
**Symptoms:** Users can't log in, "Auth failed" errors  
**Likely Cause:** Firebase Auth service issue or wrong config  
**Solution:**
1. Check Firebase Console → Authentication
2. Verify environment variables:
   ```bash
   cat .env | grep FIREBASE
   ```
3. Restart auth service:
   ```bash
   firebase deploy --only functions:auth
   ```

#### Issue 3: Database Connection Failed
**Symptoms:** "Cannot read properties" errors, no data loading  
**Likely Cause:** Firestore rules or network issue  
**Solution:**
1. Check Firestore rules in console
2. Verify indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
3. Check service account permissions

#### Issue 4: High Latency/Slow Performance
**Symptoms:** Pages loading > 5 seconds  
**Likely Cause:** Unoptimized queries or CDN issues  
**Solution:**
1. Check Firebase Performance dashboard
2. Enable caching:
   ```javascript
   firebase.firestore().enablePersistence()
   ```
3. Implement pagination for large datasets
4. Check CDN status: https://status.firebase.google.com

#### Issue 5: Payment Processing Failed
**Symptoms:** Stripe payments not going through  
**Likely Cause:** API key issue or webhook misconfiguration  
**Solution:**
1. Verify Stripe keys in environment
2. Check webhook endpoints in Stripe dashboard
3. Review Stripe logs for detailed errors
4. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

---

## BACKUP AND RECOVERY PROCEDURES

### Automated Backups

#### Firestore Automated Backups
**Schedule:** Daily at 2 AM PST  
**Retention:** 30 days  
**Location:** gs://assiduous-backups  

**Setup Command:**
```bash
gcloud firestore export gs://assiduous-backups/$(date +%Y%m%d)
```

**Automation Script:** `scripts/backup-firestore.sh`
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BUCKET="gs://assiduous-backups"

# Export Firestore
gcloud firestore export ${BUCKET}/${DATE} \
  --project=assiduous-prod

# Clean old backups (keep 30 days)
gsutil ls ${BUCKET} | \
  while read backup; do
    AGE=$(gsutil stat $backup | grep 'Creation time' | awk '{print $3}')
    # Delete if older than 30 days
  done
```

#### Code Repository Backup
**Primary:** GitHub (automatic)  
**Secondary:** Weekly local backup  
```bash
# Weekly local backup script
tar -czf ~/backups/assiduous-$(date +%Y%m%d).tar.gz \
  --exclude node_modules \
  --exclude .next \
  /Users/thekryptodragon/Development/assiduous
```

### Recovery Procedures

#### Scenario 1: Complete Data Loss
**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours  

**Steps:**
1. **Hour 1:** Assess damage and notify stakeholders
2. **Hour 2:** Restore Firestore from backup:
   ```bash
   gcloud firestore import gs://assiduous-backups/20251010
   ```
3. **Hour 3:** Redeploy application:
   ```bash
   cd firebase-migration-package
   ./deploy.sh production
   ```
4. **Hour 4:** Verify all services and run tests

#### Scenario 2: Partial Data Corruption
**Steps:**
1. Identify affected collections
2. Export current data for analysis
3. Restore specific collections:
   ```bash
   gcloud firestore import \
     gs://assiduous-backups/20251010 \
     --collection-ids='properties,users'
   ```
4. Verify data integrity

#### Scenario 3: Code Rollback Needed
**Steps:**
1. Identify last known good commit:
   ```bash
   git log --oneline -20
   ```
2. Create rollback branch:
   ```bash
   git checkout -b hotfix/rollback
   git revert HEAD~N  # N = number of commits to revert
   ```
3. Deploy rollback:
   ```bash
   firebase deploy --project assiduous-prod
   ```

---

## MAINTENANCE PROCEDURES

### Routine Maintenance Tasks

#### Database Maintenance
**Frequency:** Weekly  
**Tasks:**
1. Remove orphaned documents:
   ```javascript
   // Clean up orphaned property images
   const orphanedImages = await db.collection('images')
     .where('propertyId', '==', null).get();
   
   const batch = db.batch();
   orphanedImages.forEach(doc => batch.delete(doc.ref));
   await batch.commit();
   ```

2. Optimize indexes:
   ```bash
   firebase firestore:indexes > indexes.json
   # Review and optimize
   firebase deploy --only firestore:indexes
   ```

3. Archive old data (> 1 year):
   ```javascript
   // Move to cold storage
   const oldTransactions = await db.collection('transactions')
     .where('createdAt', '<', oneYearAgo).get();
   ```

#### Security Maintenance
**Frequency:** Bi-weekly  
**Tasks:**
1. Update dependencies:
   ```bash
   npm audit fix
   npm update --save
   ```

2. Rotate API keys:
   - Firebase Admin SDK keys (quarterly)
   - Stripe API keys (monthly)
   - Third-party service keys (quarterly)

3. Review access logs:
   ```bash
   gcloud logging read "resource.type=gae_app" \
     --limit 100 \
     --format json | jq '.[] | select(.severity=="ERROR")'
   ```

#### Performance Maintenance
**Frequency:** Monthly  
**Tasks:**
1. Clear CDN cache:
   ```bash
   firebase hosting:channel:deploy production --expires 1h
   ```

2. Optimize images:
   ```bash
   # Compress all images > 100KB
   find public/images -size +100k -exec convert {} -quality 85 {} \;
   ```

3. Bundle size analysis:
   ```bash
   npm run build
   npm run analyze
   ```

---

## INCIDENT RESPONSE PLAN

### Severity Levels

#### SEV1 - Critical (Production Down)
**Response Time:** 15 minutes  
**Examples:** Site completely down, data breach, payment system failure  
**Actions:**
1. Page on-call engineer immediately
2. Create war room Slack channel
3. Begin incident timeline documentation
4. Notify executive team within 30 minutes

#### SEV2 - High (Major Feature Broken)
**Response Time:** 1 hour  
**Examples:** Login not working, search broken, slow performance  
**Actions:**
1. Create GitHub issue with `sev2` label
2. Assign to feature owner
3. Update status page
4. Communicate ETA to stakeholders

#### SEV3 - Medium (Minor Feature Issue)
**Response Time:** 4 hours  
**Examples:** UI glitch, non-critical API error  
**Actions:**
1. Log in issue tracker
2. Schedule for next sprint
3. Workaround documentation if available

#### SEV4 - Low (Cosmetic Issue)
**Response Time:** Next business day  
**Examples:** Typo, alignment issue, color inconsistency  
**Actions:**
1. Add to backlog
2. Fix in next release

### Incident Response Checklist

#### During Incident
- [ ] Identify severity level
- [ ] Create incident channel/issue
- [ ] Assign incident commander
- [ ] Start incident timeline
- [ ] Implement immediate mitigation
- [ ] Communicate status every 30 minutes
- [ ] Document all actions taken

#### Post-Incident
- [ ] Write incident report (within 24 hours)
- [ ] Conduct blameless postmortem (within 72 hours)
- [ ] Create follow-up tickets for improvements
- [ ] Update runbooks based on learnings
- [ ] Share learnings with team

---

## SUPPORT PROCEDURES

### User Support Channels

#### Primary Support (GitHub Issues)
**URL:** https://github.com/SirsiMaster/Assiduous/issues  
**Response Time SLA:**
- Critical: 2 hours
- High: 8 hours
- Medium: 24 hours
- Low: 72 hours

#### Support Ticket Template
```markdown
## Issue Type
- [ ] Bug
- [ ] Feature Request
- [ ] Question
- [ ] Other

## Description
[Clear description of the issue]

## Steps to Reproduce (for bugs)
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser:
- OS:
- User Role:
- Time/Date:

## Screenshots
[If applicable]
```

### Internal Support Procedures

#### Escalation Path
1. **Level 1:** GitHub issue triage (community/automated)
2. **Level 2:** Development team review
3. **Level 3:** Technical lead intervention
4. **Level 4:** Executive escalation

#### Knowledge Base Articles
Location: `/docs/kb/`  
Format: Markdown with screenshots  
Categories:
- Getting Started
- Account Management
- Property Management
- Troubleshooting
- FAQs

---

## DEPLOYMENT PROCEDURES

### Production Deployment Checklist

#### Pre-Deployment (1 day before)
- [ ] Code freeze announced
- [ ] All PRs merged to main
- [ ] Tests passing (100% required)
- [ ] Security scan completed
- [ ] Release notes drafted
- [ ] Rollback plan documented

#### Deployment Day
- [ ] Backup current production
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Get approval from QA
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Monitor for 2 hours
- [ ] Send deployment notification

#### Post-Deployment
- [ ] Update documentation
- [ ] Close related issues
- [ ] Update status page
- [ ] Team retrospective

### Deployment Commands

#### Standard Deployment
```bash
# From project root
cd firebase-migration-package

# Deploy everything
./deploy.sh production

# Or deploy specific services
firebase deploy --only hosting --project assiduous-prod
firebase deploy --only functions --project assiduous-prod
firebase deploy --only firestore --project assiduous-prod
```

#### Emergency Hotfix
```bash
# Create hotfix branch
git checkout -b hotfix/critical-fix

# Make fix and test locally
npm test

# Deploy directly to production (bypass staging)
firebase deploy --project assiduous-prod --force

# Merge back to main
git checkout main
git merge hotfix/critical-fix
git push origin main
```

---

## MONITORING ALERTS CONFIGURATION

### Alert Rules

```yaml
# alerts.yaml
alerts:
  - name: "Site Down"
    condition: "response_code != 200"
    threshold: 2  # failures
    window: 5m
    severity: critical
    notify:
      - github_issue
      - email
      - slack

  - name: "High Error Rate"
    condition: "error_rate > 5%"
    threshold: 5  # minutes
    window: 10m
    severity: high
    notify:
      - github_issue
      - slack

  - name: "Slow Response"
    condition: "response_time > 3000ms"
    threshold: 10  # requests
    window: 15m
    severity: medium
    notify:
      - slack

  - name: "Low Disk Space"
    condition: "disk_usage > 90%"
    threshold: 1
    window: 5m
    severity: high
    notify:
      - email
```

---

## MAINTENANCE WINDOWS

### Scheduled Maintenance
**Regular Window:** Sundays 2-4 AM PST  
**Notification:** 72 hours in advance  
**Duration:** Maximum 2 hours  

### Emergency Maintenance
**Notification:** As soon as possible  
**Duration:** Minimum necessary  
**Approval:** Technical lead required  

### Maintenance Communication Template
```
Subject: [Scheduled/Emergency] Maintenance - [Date] [Time] PST

Dear Users,

We will be performing [scheduled/emergency] maintenance on the Assiduous platform.

Date: [Date]
Time: [Start] - [End] PST
Expected Downtime: [Duration]

Affected Services:
- [ ] Main website
- [ ] Admin portal
- [ ] Agent portal
- [ ] Client portal
- [ ] API services

During this time, you may experience:
- Intermittent connectivity
- Slow response times
- Limited functionality

We apologize for any inconvenience.

Status Updates: https://assiduousflip.web.app/status

Thank you for your patience.

The Assiduous Team
```

---

## TOOLS AND RESOURCES

### Monitoring Tools
- **Firebase Console:** https://console.firebase.google.com/project/assiduous-prod
- **GitHub Actions:** https://github.com/SirsiMaster/Assiduous/actions
- **Status Page:** https://assiduousflip.web.app/status.html
- **Metrics Dashboard:** https://assiduousflip.web.app/admin/development

### Command Line Tools
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Install GitHub CLI
brew install gh
```

### Useful Scripts
- `scripts/backup-firestore.sh` - Backup database
- `scripts/deploy.sh` - Deployment automation
- `scripts/update-metrics-enhanced.js` - Update metrics
- `scripts/health-check.sh` - Quick health check

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub Actions Documentation](https://docs.github.com/actions)

---

## APPENDIX: QUICK REFERENCE

### Critical Commands
```bash
# Check site status
curl -I https://assiduousflip.web.app

# View recent errors
firebase functions:log --limit 50

# Emergency rollback
git revert HEAD && git push origin main

# Clear CDN cache
firebase hosting:clone production:staging --project assiduous-prod

# Database backup
gcloud firestore export gs://assiduous-backups/emergency-$(date +%Y%m%d)

# Check GitHub issues
gh issue list --label urgent
```

### Key Contacts
- **GitHub Issues:** https://github.com/SirsiMaster/Assiduous/issues
- **Firebase Support:** https://firebase.google.com/support
- **Status Page:** https://status.firebase.google.com

### Service Dependencies
- Firebase Hosting
- Firebase Authentication
- Cloud Firestore
- Cloud Functions
- Cloud Storage
- GitHub Actions
- Stripe API (future)

---

**Document Status:** This maintenance document provides comprehensive procedures for monitoring, maintaining, and supporting the Assiduous platform. Regular updates should be made based on operational experience and incident learnings.

