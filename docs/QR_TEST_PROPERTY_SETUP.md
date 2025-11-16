# Quick Setup: Add Test Property for QR Email Testing

**Goal:** Create one test property in Firestore so you can test the QR email sharing feature

**Time Required:** 2 minutes

---

## Option 1: Use Firebase Console (Easiest)

### Steps:

1. **Open Firestore Console:**
   - Go to https://console.firebase.google.com/project/assiduous-prod/firestore
   - Sign in if needed

2. **Create Test Property Document:**
   - Click on `properties` collection
   - Click "Add document" button
   - Set **Document ID** to: `TEST-PROPERTY-001`

3. **Add Fields:**
   Copy and paste each field below:

   | Field Name | Type | Value |
   |------------|------|-------|
   | `id` | string | `TEST-PROPERTY-001` |
   | `address` | map | (create sub-fields below) |
   | `address.street` | string | `123 Test Street` |
   | `address.city` | string | `Philadelphia` |
   | `address.state` | string | `PA` |
   | `address.zip` | string | `19103` |
   | `neighborhood` | string | `Center City` |
   | `status` | string | `available` |
   | `details` | map | (create sub-fields) |
   | `details.bedrooms` | number | `3` |
   | `details.bathrooms` | number | `2.5` |
   | `details.sqft` | number | `2400` |
   | `details.type` | string | `single_family` |
   | `details.year` | number | `1920` |
   | `price` | map | (create sub-fields) |
   | `price.list` | number | `450000` |
   | `price.arv` | number | `550000` |
   | `price.repair` | number | `75000` |
   | `features` | array | (type: string, add 2 items) |
   | `features[0]` | string | `garage` |
   | `features[1]` | string | `basement` |
   | `images` | array | (type: map, add 1 item) |
   | `images[0].url` | string | `https://via.placeholder.com/400x300?text=Front+View` |
   | `images[0].caption` | string | `Front View` |
   | `flipEstimate` | map | (create sub-fields) |
   | `flipEstimate.profit` | number | `25000` |
   | `flipEstimate.roi` | number | `5.5` |
   | `flipEstimate.holdingTime` | number | `6` |

4. **Click "Save"**

---

## Option 2: Copy-Paste JSON to Console

If Firebase Console UI is too cumbersome, use the JavaScript console in your browser:

1. **Open Admin Portal:** https://assiduous-prod.web.app/admin/dashboard.html
2. **Open DevTools Console** (right-click → Inspect → Console tab)
3. **Paste this code:**

```javascript
// Test if Firebase is loaded
if (!firebase || !firebase.firestore) {
  console.error('Firebase not initialized');
} else {
  const db = firebase.firestore();
  
  const testProperty = {
    id: 'TEST-PROPERTY-001',
    address: {
      street: '123 Test Street',
      city: 'Philadelphia',
      state: 'PA',
      zip: '19103'
    },
    neighborhood: 'Center City',
    details: {
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 2400,
      lot: 0.25,
      year: 1920,
      type: 'single_family'
    },
    price: {
      list: 450000,
      arv: 550000,
      repair: 75000
    },
    images: [{
      url: 'https://via.placeholder.com/400x300?text=Front+View',
      thumbnail: 'https://via.placeholder.com/100x100?text=Front',
      caption: 'Front View'
    }],
    features: ['garage', 'basement', 'hardwood_floors', 'fireplace'],
    status: 'available',
    flipEstimate: {
      profit: 25000,
      roi: 5.5,
      holdingTime: 6
    }
  };
  
  db.collection('properties').doc('TEST-PROPERTY-001').set(testProperty)
    .then(() => console.log('✅ Test property created!'))
    .catch(err => console.error('❌ Error:', err));
}
```

---

## Verification

Once created, you should see:
- Property appears in Admin Portal → Properties list
- Property ID: `TEST-PROPERTY-001`
- Address: `123 Test Street, Philadelphia, PA 19103`

---

## Next: Test QR Email Sharing

Once test property exists:

1. Click on the property in the list
2. Open property detail page
3. Scroll to **QR Widget** on the right sidebar
4. Click **Share** button
5. Select **Email** tab
6. Enter your email address
7. Click **Send Email**
8. Check your inbox (and spam folder) within 30 seconds

---

**Stuck?** Let me know and I'll create it for you programmatically.
