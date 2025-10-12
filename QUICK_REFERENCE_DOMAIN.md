# Custom Domain Quick Reference - assiduousflip.com

## 🚀 Quick Status Check
```bash
./scripts/check-domain-status.sh
```

## 📋 Current Configuration

**GoDaddy DNS (Configured ✅)**:
- A Record: `@ → 199.36.158.100`
- A Record: `www → 199.36.158.100`

**Firebase (Pending ⏳)**:
- Project: assiduous-prod
- Custom domain: Not yet added
- SSL: Will auto-provision after domain added

## ⏭️ Next Steps (In Order)

### 1. Wait for DNS Propagation (1-2 hours)
Check status periodically:
```bash
./scripts/check-domain-status.sh
```

When it shows "DNS FULLY PROPAGATED", proceed to step 2.

### 2. Add Domain in Firebase Console
```bash
# Open Firebase Console
open https://console.firebase.google.com/project/assiduous-prod/hosting/sites
```

Steps:
1. Click "assiduous-prod"
2. Click "Add custom domain"
3. Enter: `assiduousflip.com`
4. Follow verification prompts
5. Wait for SSL certificate (24-48 hours)

### 3. Verify Domain Works
```bash
curl -I https://assiduousflip.com       # Should return 200 or 301
curl -I https://www.assiduousflip.com   # Should return 200 or 301
```

## 📊 Success Criteria

All must be ✅ before domain is fully operational:

- [x] GoDaddy A record configured
- [x] WWW subdomain DNS propagated
- [ ] Root domain DNS propagated
- [ ] Custom domain added in Firebase
- [ ] Firebase DNS verification complete
- [ ] SSL certificate provisioned
- [ ] https://assiduousflip.com returns HTTP 200
- [ ] https://www.assiduousflip.com returns HTTP 200

**Progress**: 2/8 (25%)

## 🔗 Important Links

- **Check DNS**: `./scripts/check-domain-status.sh`
- **Firebase Console**: https://console.firebase.google.com/project/assiduous-prod/hosting/sites
- **GoDaddy DNS**: https://dcc.godaddy.com/control/assiduousflip.com/dns
- **Status Doc**: `DOMAIN_STATUS.md`
- **Setup Guide**: `CUSTOM_DOMAIN_SETUP.md`

## 🆘 Troubleshooting

**DNS not propagated yet?**
→ Wait 1-2 hours, run `./scripts/check-domain-status.sh` again

**Domain returns 500 error?**
→ Normal during DNS propagation, wait for DNS to complete

**Can't add domain in Firebase?**
→ Ensure DNS shows 199.36.158.100 when you run:
  `dig +short assiduousflip.com @8.8.8.8`

**SSL certificate not working?**
→ Takes 24-48 hours after Firebase domain verification

## ⏱️ Expected Timeline

- **Now**: GoDaddy DNS configured, WWW working
- **1-2 hours**: Root domain DNS propagated
- **1-2 hours**: Add domain in Firebase Console
- **24-48 hours**: SSL certificate active
- **Complete**: https://assiduousflip.com fully operational

---

**Last Updated**: 2025-10-12 @ 20:35 UTC  
**Status**: DNS propagation in progress, check back in 1-2 hours
