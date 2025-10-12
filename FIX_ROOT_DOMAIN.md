# Fix Root Domain (assiduousflip.com) - Quick Guide

## Current Status
✅ **www.assiduousflip.com** - Working perfectly!
❌ **assiduousflip.com** (without www) - Returns 404

## The Fix (2 minutes)

### Step 1: Open Firebase Console
1. Click this link: https://console.firebase.google.com/project/assiduous-prod/hosting/sites
2. Sign in with your Google account

### Step 2: Find Your Domain Settings
You'll see two hosting sites:
- `assiduous-prod`
- `assiduousflip`

One of them will show `www.assiduousflip.com` in the "Custom domains" section.

### Step 3: Add the Root Domain
1. Click on the site that has `www.assiduousflip.com`
2. Click the **"Add custom domain"** button
3. Enter: `assiduousflip.com` (without www)
4. Click **Continue**

### Step 4: Skip DNS Setup
Since your DNS is already configured correctly (pointing to 199.36.158.100), Firebase will:
- Automatically verify the domain (instant)
- Start provisioning SSL certificate (takes 30 min - 3 hours)

### Step 5: That's it!
Once the SSL certificate is ready, both domains will work:
- `assiduousflip.com` ✅
- `www.assiduousflip.com` ✅

## What's Already Done
✅ DNS is correctly configured in GoDaddy
✅ Both domains point to Firebase (199.36.158.100)
✅ The www version is working perfectly
✅ All you need is to add the root domain in Firebase Console

## Timeline
- Domain verification: Instant (DNS already points to Firebase)
- SSL certificate: 30 minutes to 3 hours
- After that: Both domains will work!

---
*Note: This can ONLY be done through the Firebase web console - there's no command-line option.*