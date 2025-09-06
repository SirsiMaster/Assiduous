# Firebase Storage Setup Steps

## In Firebase Console:

1. **Click "Get Started"** on the Storage page

2. **Location Selection:**
   - Choose: **"nam5 (us-central)"** or **"us-central1"**
   - This matches your Cloud Functions region

3. **Security Rules Dialog:**
   - Select: **"Start in production mode"**
   - (We'll deploy custom rules via CLI)
   - Click **"Done"**

4. **Wait for bucket creation** (10-30 seconds)

## After Setup Complete:

Run this command to deploy the security rules:
```bash
firebase deploy --only storage
```

## What the Rules Do:

- ✅ Authenticated users can read files
- ✅ Users can upload their own profile images (max 5MB)
- ✅ Agents can upload property images (max 10MB)
- ✅ Admins can manage documents (PDFs, max 25MB)
- ✅ Public folder for logos/banners
- ✅ Temp folder for processing uploads

## Storage Structure:
```
storage/
├── users/{userId}/profile/     # User profile pics
├── properties/{id}/images/     # Property photos
├── documents/{id}/             # Contracts, PDFs
├── public/                     # Public assets
└── temp/{userId}/             # Temporary uploads
```
