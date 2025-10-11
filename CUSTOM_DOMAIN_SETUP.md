# Setting Up www.assiduousflip.com with Firebase (FREE) - For assiduous-prod.web.app

## ✅ No Additional Costs!
Firebase custom domain hosting is **FREE** - you only pay for your GoDaddy domain registration.

---

## Step 1: Add Custom Domain to Firebase (2 minutes)

Run this command to add your domain to Firebase:

```bash
# Your production site is now assiduous-prod (the default site)
# No need to create a new site, just add the domain to the existing one
firebase hosting:site:domain:add www.assiduousflip.com --project assiduous-prod
```

---

## Step 2: Connect Domain in Firebase Console (3 minutes)

1. Go to: https://console.firebase.google.com/project/assiduous-prod/hosting/sites
2. Click on `assiduous-prod` (your main production site)
3. Click "Add custom domain"
4. Enter: `www.assiduousflip.com`
5. Click "Continue"
6. Firebase will show you DNS records - KEEP THIS PAGE OPEN

---

## Step 3: Update GoDaddy DNS (5 minutes)

1. Go to: https://dcc.godaddy.com/control/assiduousflip.com/dns
2. Sign in to your GoDaddy account
3. Delete any existing A records for "www"
4. Add these records:

### A Records (for www subdomain):
```
Type: A
Name: www
Value: 151.101.1.195
TTL: 600
```

```
Type: A
Name: www  
Value: 151.101.65.195
TTL: 600
```

### For root domain redirect (assiduousflip.com → www.assiduousflip.com):
```
Type: A
Name: @
Value: 151.101.1.195
TTL: 600
```

```
Type: A
Name: @
Value: 151.101.65.195
TTL: 600
```

### TXT Record (for SSL verification):
```
Type: TXT
Name: _acme-challenge.www
Value: [Firebase will provide this in the console]
TTL: 600
```

---

## Step 4: Verify in Firebase (5-10 minutes)

1. Go back to Firebase Console
2. Click "Verify" 
3. Firebase will check DNS propagation
4. Once verified, Firebase automatically provisions SSL certificate (FREE via Let's Encrypt)

---

## Step 5: Update Firebase Configuration

```bash
cd firebase-migration-package
```

Edit `.firebaserc`:
```json
{
  "projects": {
    "default": "assiduous-prod",
    "production": "assiduous-prod"
  },
  "targets": {
    "assiduous-prod": {
      "hosting": {
        "production": ["assiduous-prod"]
      }
    }
  }
}
```

---

## Step 6: Deploy to Your Custom Domain

```bash
firebase deploy --only hosting --project assiduous-prod
```

Your site will now be live at:
- https://www.assiduousflip.com (primary custom domain)
- https://assiduousflip.com (redirects to www)
- https://assiduous-prod.web.app (Firebase URL - still works)

---

## DNS Propagation Timeline

- **5-15 minutes**: Site accessible for most users
- **1-4 hours**: SSL certificate fully active
- **24-48 hours**: Complete global DNS propagation

During propagation, both URLs work:
- https://assiduous-prod.web.app (immediate)
- https://www.assiduousflip.com (after DNS updates)

---

## Testing Your Domain

```bash
# Check DNS propagation
nslookup www.assiduousflip.com

# Test site availability  
curl -I https://www.assiduousflip.com

# Check SSL certificate
openssl s_client -connect www.assiduousflip.com:443 -servername www.assiduousflip.com
```

---

## Troubleshooting

### "DNS not propagated" error
- Wait 15 more minutes
- Clear browser cache
- Try different browser/incognito mode

### SSL Certificate Warning
- Normal during first 1-4 hours
- Firebase auto-provisions certificate
- No action needed, just wait

### Site not loading
- Verify DNS records in GoDaddy
- Check Firebase Console for domain status
- Ensure deployment completed successfully

---

## Benefits of This Setup

✅ **FREE** - No additional Firebase costs  
✅ **Professional** - Custom domain looks better  
✅ **Secure** - Free SSL certificate included  
✅ **Fast** - Firebase CDN serves globally  
✅ **Reliable** - 99.95% uptime SLA  
✅ **Simple** - One deployment serves all URLs  

---

## Quick Reference

### Your URLs After Setup:
- **Production**: https://www.assiduousflip.com
- **Firebase URL**: https://assiduous-prod.web.app  
- **Root redirect**: https://assiduousflip.com → www

### GoDaddy DNS Management:
https://dcc.godaddy.com/control/assiduousflip.com/dns

### Firebase Hosting Console:
https://console.firebase.google.com/project/assiduous-prod/hosting/sites

### Deploy Command:
```bash
firebase deploy --only hosting --project assiduous-prod
```

---

*Setup Time: 15-20 minutes*  
*Cost: $0 (just your existing GoDaddy domain fee)*  
*Result: Professional website at www.assiduousflip.com*