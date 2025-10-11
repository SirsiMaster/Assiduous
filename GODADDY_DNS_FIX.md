# URGENT: Fix GoDaddy DNS Configuration

## ❌ DELETE These Records First:
- Any "Forwarding" entries
- Any "Parked" entries  
- Any A records pointing to GoDaddy IPs (like 34.102.136.180)
- Any CNAME for @ (root domain)

## ✅ ADD These Records EXACTLY:

### For Root Domain (assiduousflip.com):
```
Type: A
Name: @
Value: 151.101.1.195
TTL: 600

Type: A
Name: @  
Value: 151.101.65.195
TTL: 600
```

### For WWW Subdomain:
```
Type: A
Name: www
Value: 151.101.1.195
TTL: 600

Type: A
Name: www
Value: 151.101.65.195  
TTL: 600
```

## ⚠️ IMPORTANT:
- Do NOT use Domain Forwarding
- Do NOT use Domain Parking
- Do NOT use CNAME for root domain (@)
- These are Firebase's official IP addresses

## Steps in GoDaddy:

1. **Go to DNS Management**
   - My Products → Domains → assiduousflip.com → Manage → DNS

2. **Delete Bad Records**
   - Look for any A records with GoDaddy IPs
   - Delete any forwarding
   - Delete any parking

3. **Add Firebase A Records**
   - Click "Add" → Type: A → Name: @ → Value: 151.101.1.195
   - Click "Add" → Type: A → Name: @ → Value: 151.101.65.195
   - Click "Add" → Type: A → Name: www → Value: 151.101.1.195
   - Click "Add" → Type: A → Name: www → Value: 151.101.65.195

4. **Save All Changes**

5. **Turn OFF Domain Forwarding**
   - Go to Domain Settings → Forwarding → Turn OFF
   - Make sure "Forward to" is DISABLED

## After Making Changes:
- Wait 5-30 minutes for DNS to update
- Clear browser cache
- Test again

## Verify It's Working:
Run this command:
```bash
nslookup www.assiduousflip.com
```

Should return:
- 151.101.1.195
- 151.101.65.195

NOT GoDaddy IPs!