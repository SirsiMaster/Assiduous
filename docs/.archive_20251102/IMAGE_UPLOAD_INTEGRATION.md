# Image Upload System Integration Guide

## Overview
Complete Firebase Storage-based image upload system with compression, thumbnails, automatic cleanup, and drag-drop UI.

## Quick Start

### 1. Add to HTML
```html path=null start=null
<!-- In your property form/page -->
<div id="property-image-uploader"></div>

<!-- Include required scripts -->
<script type="module">
  import { ImageUploader } from '../src/components/ImageUploader.js';
  
  // Initialize uploader
  const uploader = new ImageUploader('property-image-uploader', {
    storagePath: `properties/${propertyId}/images`,
    maxFiles: 20,
    onUploadComplete: (images) => {
      console.log('Uploaded:', images);
      // Save image metadata to Firestore
      saveImagesToProperty(propertyId, images);
    }
  });
  
  // Trigger upload on form submit
  document.getElementById('property-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const images = await uploader.uploadFiles();
    // Continue with form submission
  });
</script>
```

### 2. Backend Integration

#### Save Image Metadata to Firestore
```javascript path=null start=null
import { firebaseservice } from '../services/firebaseservice.js';

async function saveImagesToProperty(propertyId, images) {
  const firebaseService = new firebaseservice();
  
  await firebaseService.db.collection('properties').doc(propertyId).update({
    images: images.map(img => ({
      url: img.url,
      path: img.path,
      filename: img.filename,
      size: img.size,
      uploadedAt: img.uploadedAt,
      uploadedBy: img.uploadedBy
    })),
    updatedAt: new Date().toISOString()
  });
}
```

## Component API

### Constructor Options
```javascript path=null start=null
new ImageUploader(containerId, {
  maxFiles: 10,                    // Maximum images allowed
  storagePath: 'temp',             // Firebase Storage path
  allowMultiple: true,             // Allow multiple file selection
  showPreview: true,               // Show image previews
  onUploadComplete: (images) => {},  // Callback after upload
  onUploadError: (error) => {},     // Error callback
  onFileSelect: (files) => {}       // Callback on file selection
});
```

### Methods
```javascript path=null start=null
// Upload all selected files
const images = await uploader.uploadFiles();

// Get uploaded images
const uploaded = uploader.getUploadedImages();

// Clear all selections
uploader.clear();

// Remove specific file from selection
uploader.removeFile(index);

// Delete uploaded image
await uploader.deleteImage(index);
```

## Service API

### imageuploadservice Methods
```javascript path=null start=null
import { imageuploadservice } from '../services/imageuploadservice.js';

const service = new imageuploadservice();

// Upload multiple images
const images = await service.uploadImages(
  files,                          // File array
  'properties/prop123/images',   // Storage path
  (progress) => {                // Progress callback
    console.log(`${progress.overallProgress}% complete`);
  }
);

// Upload single image
const image = await service.uploadSingleImage(file, path);

// Delete image
await service.deleteImage('properties/prop123/images/image.jpg');

// Delete all images in directory
const count = await service.deleteAllImages('properties/prop123/images');

// Get all image URLs from directory
const images = await service.getImageUrls('properties/prop123/images');

// Validate files before upload
const { valid, errors } = service.validateFiles(fileList);

// Get thumbnail URL
const thumbUrl = service.getThumbnailUrl(imageUrl, '200x200');
```

## Storage Structure

```
firebase-storage-bucket/
├── properties/
│   ├── {propertyId}/
│   │   └── images/
│   │       ├── 1234567890_image1.jpg
│   │       ├── thumb_200x200_1234567890_image1.jpg
│   │       ├── thumb_400x400_1234567890_image1.jpg
│   │       └── ...
│   └── ...
├── users/
│   └── {userId}/
│       └── profile/
│           └── avatar.jpg
├── documents/
│   └── {documentId}/
│       └── contract.pdf
├── temp/
│   └── {userId}/
│       └── temp_file.jpg (auto-deleted after 24h)
└── public/
    └── logo.png
```

## Security Rules

Already configured in `storage.rules`:

```javascript path=null start=null
// Property images - agents/admins only
match /properties/{propertyId}/images/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null 
    && request.auth.token.role in ['agent', 'admin']
    && request.resource.size < 10 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
}
```

## Cloud Functions

### Automatic Image Cleanup
Automatically deployed with Firebase Functions:

- **cleanupPropertyImages**: Deletes all images when property is deleted (triggered)
- **deletePropertyImage**: Callable function to delete specific image
- **cleanupOrphanedImages**: Daily cleanup of orphaned images (scheduled)
- **cleanupTempUploads**: Hourly cleanup of temp files >24h (scheduled)
- **generateThumbnail**: Auto-generates thumbnails on upload (triggered)

### Using Callable Functions
```javascript path=null start=null
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const deleteImage = httpsCallable(functions, 'deletePropertyImage');

// Delete specific image
const result = await deleteImage({
  propertyId: 'prop123',
  imagePath: 'properties/prop123/images/image.jpg'
});
```

## Property Management Integration Example

### Full Property Form with Images
```html path=null start=null
<!DOCTYPE html>
<html>
<head>
  <title>Add Property</title>
</head>
<body>
  <form id="property-form">
    <input type="text" id="property-title" placeholder="Property Title" required />
    <input type="number" id="property-price" placeholder="Price" required />
    <textarea id="property-description" placeholder="Description"></textarea>
    
    <!-- Image Upload Component -->
    <div id="property-images"></div>
    
    <button type="submit">Create Property</button>
  </form>

  <script type="module">
    import { ImageUploader } from '../src/components/ImageUploader.js';
    import { firebaseservice } from '../src/services/firebaseservice.js';

    const firebaseService = new firebaseservice();
    let propertyImages = [];

    // Generate temporary property ID for uploads
    const tempPropertyId = `temp_${Date.now()}`;

    // Initialize image uploader
    const imageUploader = new ImageUploader('property-images', {
      storagePath: `properties/${tempPropertyId}/images`,
      maxFiles: 20,
      onUploadComplete: (images) => {
        propertyImages = images;
        console.log('Images uploaded:', images);
      }
    });

    // Handle form submission
    document.getElementById('property-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        // Upload images first
        if (imageUploader.selectedFiles.length > 0) {
          propertyImages = await imageUploader.uploadFiles();
        }

        // Create property document
        const propertyData = {
          title: document.getElementById('property-title').value,
          price: parseFloat(document.getElementById('property-price').value),
          description: document.getElementById('property-description').value,
          images: propertyImages.map(img => ({
            url: img.url,
            path: img.path,
            filename: img.filename,
            uploadedAt: img.uploadedAt
          })),
          createdAt: new Date().toISOString(),
          createdBy: firebaseService.auth.currentUser.uid,
          status: 'draft'
        };

        // Save to Firestore
        const docRef = await firebaseService.db.collection('properties').add(propertyData);
        
        // Rename storage path to use actual property ID
        // (or implement path rename Cloud Function)
        
        alert('Property created successfully!');
        window.location.href = `/admin/properties.html?id=${docRef.id}`;
      } catch (error) {
        console.error('Error creating property:', error);
        alert('Failed to create property: ' + error.message);
      }
    });
  </script>
</body>
</html>
```

## Display Images in Property Listing

```javascript path=null start=null
// Fetch property with images
const property = await firebaseService.db
  .collection('properties')
  .doc(propertyId)
  .get();

const propertyData = property.data();

// Display main image
const mainImage = propertyData.images[0];
document.getElementById('main-image').src = mainImage.url;

// Display thumbnail grid
const thumbnailGrid = document.getElementById('thumbnail-grid');
propertyData.images.forEach(img => {
  const thumb = document.createElement('img');
  thumb.src = img.url;
  thumb.onclick = () => {
    document.getElementById('main-image').src = img.url;
  };
  thumbnailGrid.appendChild(thumb);
});
```

## Performance Optimization

### Image Compression Settings
Configured in `imageuploadservice.js`:
- **Max dimensions**: 2048x2048 pixels
- **Quality**: 80% (0.8)
- **Max file size**: 10MB
- **Thumbnails**: 200x200, 400x400

### Thumbnail Usage
```javascript path=null start=null
// Use thumbnails for lists/grids
<img src="${getThumbnailUrl(image.url, '200x200')}" />

// Use full size for detail view
<img src="${image.url}" />
```

## Error Handling

```javascript path=null start=null
const uploader = new ImageUploader('uploader', {
  storagePath: 'properties/123/images',
  onUploadError: (error) => {
    // Handle upload errors
    if (error.code === 'storage/unauthorized') {
      alert('You do not have permission to upload images');
    } else if (error.code === 'storage/quota-exceeded') {
      alert('Storage quota exceeded');
    } else {
      alert('Upload failed: ' + error.message);
    }
  }
});
```

## Testing

### Local Testing
```bash
# Start Firebase emulators
firebase emulators:start

# In browser console
const uploader = new ImageUploader('test-uploader', {
  storagePath: 'test/images'
});
```

### Production Testing
```bash
# Deploy functions
firebase deploy --only functions

# Deploy storage rules
firebase deploy --only storage

# Test in browser
open https://assiduous-prod.web.app
```

## Monitoring

### View Cleanup Logs
```javascript path=null start=null
// Check cleanup activity
const logs = await firebaseService.db
  .collection('cleanup_logs')
  .orderBy('cleanedAt', 'desc')
  .limit(10)
  .get();

logs.forEach(doc => {
  console.log(doc.data());
});
```

### View Upload Activity
```javascript path=null start=null
// Query images by uploader
const images = await firebaseService.storage
  .ref('properties')
  .listAll();

for (const item of images.items) {
  const metadata = await item.getMetadata();
  console.log('Uploaded by:', metadata.customMetadata.uploadedBy);
  console.log('Uploaded at:', metadata.customMetadata.uploadedAt);
}
```

## Next Steps

1. ✅ Image upload service created
2. ✅ UI component built
3. ✅ Cloud Functions deployed
4. ⏳ Integrate into property management pages
5. ⏳ Test in Firebase staging
6. ⏳ Deploy to production

## Support

For issues or questions:
- Check Firebase console logs
- Review `cleanup_errors` collection in Firestore
- Test with Firebase emulators locally
- Verify storage rules are deployed

## Related Files

- `/src/services/imageuploadservice.js` - Upload service
- `/src/components/ImageUploader.js` - UI component
- `/functions/imageCleanup.js` - Cloud Functions
- `/storage.rules` - Security rules
- `/firebase.json` - Firebase configuration
