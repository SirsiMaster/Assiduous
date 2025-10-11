# GoDaddy DNS Configuration Checklist

## ✅ Required DNS Records (Already Set)

### A Records for Root Domain (@)
```
Type: A
Name: @
Value: 15.197.148.33
TTL: 600

Type: A
Name: @
Value: 3.33.130.190
TTL: 600
```

### CNAME for WWW
```
Type: CNAME
Name: www
Value: assiduousflip.com
TTL: 600
```

## 🔧 Additional Recommended Settings

### 1. **Email Configuration (If Needed)**
If you want email@assiduousflip.com:

**Option A: GoDaddy Email**
```
Type: MX
Name: @
Value: mailstore1.secureserver.net
Priority: 10
TTL: 3600

Type: MX
Name: @
Value: smtp.secureserver.net
Priority: 0
TTL: 3600
```

**Option B: Google Workspace**
```
Type: MX
Name: @
Value: aspmx.l.google.com
Priority: 1
TTL: 3600

(Plus additional Google MX records)
```

### 2. **CAA Records (Extra Security)**
Specify which CAs can issue certificates:
```
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
TTL: 3600
```

### 3. **TXT Records**

**Domain Verification (if needed):**
```
Type: TXT
Name: @
Value: [Firebase/Google verification string]
TTL: 3600
```

**SPF Record (for email):**
```
Type: TXT
Name: @
Value: v=spf1 include:secureserver.net ~all
TTL: 3600
```

### 4. **Subdomain Setup (Optional)**

**For app.assiduousflip.com:**
```
Type: CNAME
Name: app
Value: assiduousflip.com
TTL: 600
```

**For api.assiduousflip.com:**
```
Type: CNAME
Name: api
Value: assiduousflip.com
TTL: 600
```

## 🛡️ Security Settings in GoDaddy

### ✅ Already Enabled:
- **DNSSEC**: Enabled ✅
- **Domain Lock**: Check if enabled
- **2FA**: HIGHLY RECOMMENDED

### 📝 To Enable in GoDaddy Account:

1. **Domain Protection Plus** (Optional - $9.99/year)
   - Prevents domain hijacking
   - Private registration
   - Malware scanning

2. **Auto-Renewal**
   - Prevents accidental expiration
   - Go to: Domain Settings → Auto-renew → On

3. **Domain Locking**
   - Go to: Domain Settings → Domain lock → On
   - Prevents unauthorized transfers

4. **Two-Factor Authentication**
   - Go to: Account Security → 2-Step Verification
   - Enable with phone or authenticator app

## 🔍 Monitoring Settings

### Domain Expiration
- **Current Expiry**: Check in GoDaddy dashboard
- **Auto-renew**: Should be ON
- **Backup payment method**: Add secondary card

### DNS Monitoring
- Enable alerts for DNS changes
- Go to: Domain Settings → Notifications → On

## ✅ Final Verification Steps

1. **Check Domain Lock Status**
   ```
   Domain Settings → Privacy & Protection → Domain lock
   ```

2. **Verify Auto-Renewal**
   ```
   Domain Settings → Auto-renew → Should be ON
   ```

3. **Enable 2FA**
   ```
   Account Settings → Security → 2-Step Verification
   ```

4. **Add Backup Payment Method**
   ```
   Payment Methods → Add backup card
   ```

5. **Set Contact Email**
   ```
   Account Settings → Contact Info → Verify email
   ```

## 📊 Current Status Summary

| Setting | Status | Action Required |
|---------|--------|----------------|
| DNS Records | ✅ Configured | None |
| DNSSEC | ✅ Enabled | None |
| SSL Certificate | ⏳ Provisioning | Wait 1-4 hours |
| Domain Lock | ❓ Check | Enable if not on |
| Auto-Renewal | ❓ Check | Enable if not on |
| 2FA | ❓ Check | ENABLE ASAP |
| Email (MX) | ❌ Not set | Only if needed |

## 🚨 Most Important Actions

1. **Enable 2FA immediately** - Protects your domain from hijacking
2. **Enable domain lock** - Prevents unauthorized transfers
3. **Enable auto-renewal** - Prevents accidental expiration
4. **Add backup payment** - Ensures renewal goes through

---

**Note**: The DNS records for Firebase hosting are already working correctly. The additional settings above are for enhanced security and functionality.