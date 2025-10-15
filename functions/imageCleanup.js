const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Cloud Function: Automatically delete property images when property is deleted
 * Triggered by Firestore document deletion
 */
exports.cleanupPropertyImages = functions.firestore
  .document('properties/{propertyId}')
  .onDelete(async (snap, context) => {
    const propertyId = context.params.propertyId;
    const propertyData = snap.data();
    
    console.log(`Property ${propertyId} deleted, cleaning up images...`);
    
    try {
      const bucket = admin.storage().bucket();
      const imagePath = `properties/${propertyId}/images/`;
      
      // List all files in the property's image directory
      const [files] = await bucket.getFiles({
        prefix: imagePath
      });
      
      if (files.length === 0) {
        console.log(`No images found for property ${propertyId}`);
        return null;
      }
      
      // Delete all images
      const deletePromises = files.map(file => file.delete());
      await Promise.all(deletePromises);
      
      console.log(`Successfully deleted ${files.length} images for property ${propertyId}`);
      
      // Log cleanup activity to Firestore (optional)
      await admin.firestore().collection('cleanup_logs').add({
        propertyId,
        imagesDeleted: files.length,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        imagePaths: files.map(f => f.name)
      });
      
      return { success: true, imagesDeleted: files.length };
    } catch (error) {
      console.error(`Error cleaning up images for property ${propertyId}:`, error);
      
      // Log error to Firestore for tracking
      await admin.firestore().collection('cleanup_errors').add({
        propertyId,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      throw error;
    }
  });

/**
 * Cloud Function: Delete specific image and update property document
 * Callable function for deleting individual property images
 */
exports.deletePropertyImage = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to delete images'
    );
  }
  
  const { propertyId, imagePath } = data;
  
  if (!propertyId || !imagePath) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Property ID and image path are required'
    );
  }
  
  try {
    // Verify user has permission (agent or admin)
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .get();
    
    const userRole = userDoc.data()?.role;
    
    if (!['agent', 'admin'].includes(userRole)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only agents and admins can delete property images'
      );
    }
    
    // Delete image from Storage
    const bucket = admin.storage().bucket();
    await bucket.file(imagePath).delete();
    
    // Update property document to remove image reference
    const propertyRef = admin.firestore().collection('properties').doc(propertyId);
    const propertyDoc = await propertyRef.get();
    
    if (propertyDoc.exists) {
      const propertyData = propertyDoc.data();
      const updatedImages = (propertyData.images || []).filter(
        img => img.path !== imagePath
      );
      
      await propertyRef.update({
        images: updatedImages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`Image ${imagePath} deleted for property ${propertyId} by user ${context.auth.uid}`);
    
    return { success: true, message: 'Image deleted successfully' };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Cleanup orphaned images (images without associated properties)
 * Scheduled to run daily
 */
exports.cleanupOrphanedImages = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Starting orphaned images cleanup...');
    
    try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({
        prefix: 'properties/'
      });
      
      let orphanedCount = 0;
      const deletePromises = [];
      
      // Check each image to see if its property still exists
      for (const file of files) {
        // Extract property ID from path: properties/{propertyId}/images/{filename}
        const pathParts = file.name.split('/');
        if (pathParts.length >= 3 && pathParts[0] === 'properties') {
          const propertyId = pathParts[1];
          
          // Check if property exists
          const propertyDoc = await admin.firestore()
            .collection('properties')
            .doc(propertyId)
            .get();
          
          if (!propertyDoc.exists) {
            // Property doesn't exist, image is orphaned
            console.log(`Found orphaned image: ${file.name}`);
            deletePromises.push(file.delete());
            orphanedCount++;
          }
        }
      }
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`Deleted ${orphanedCount} orphaned images`);
        
        // Log cleanup activity
        await admin.firestore().collection('cleanup_logs').add({
          type: 'orphaned_images',
          imagesDeleted: orphanedCount,
          cleanedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        console.log('No orphaned images found');
      }
      
      return { success: true, orphanedImagesDeleted: orphanedCount };
    } catch (error) {
      console.error('Error cleaning up orphaned images:', error);
      throw error;
    }
  });

/**
 * Cloud Function: Cleanup temp uploads older than 24 hours
 * Scheduled to run hourly
 */
exports.cleanupTempUploads = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    console.log('Starting temp uploads cleanup...');
    
    try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({
        prefix: 'temp/'
      });
      
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const deletePromises = [];
      
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const createdTime = new Date(metadata.timeCreated).getTime();
        const age = now - createdTime;
        
        if (age > maxAge) {
          console.log(`Deleting old temp file: ${file.name}`);
          deletePromises.push(file.delete());
        }
      }
      
      await Promise.all(deletePromises);
      console.log(`Deleted ${deletePromises.length} temp files`);
      
      return { success: true, tempFilesDeleted: deletePromises.length };
    } catch (error) {
      console.error('Error cleaning up temp uploads:', error);
      throw error;
    }
  });

/**
 * Cloud Function: Generate thumbnail on image upload
 * Triggered when image is uploaded to Storage
 */
exports.generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    
    // Only process images
    if (!contentType?.startsWith('image/')) {
      console.log('Not an image, skipping thumbnail generation');
      return null;
    }
    
    // Don't process thumbnails
    if (filePath.includes('thumb_')) {
      console.log('Already a thumbnail, skipping');
      return null;
    }
    
    // Only process property images
    if (!filePath.startsWith('properties/')) {
      console.log('Not a property image, skipping thumbnail generation');
      return null;
    }
    
    console.log(`Generating thumbnail for ${filePath}`);
    
    try {
      const sharp = require('sharp');
      const path = require('path');
      const os = require('os');
      const fs = require('fs-extra');
      
      const bucket = admin.storage().bucket();
      const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
      const thumbFilePath = path.join(os.tmpdir(), `thumb_${path.basename(filePath)}`);
      
      // Download file
      await bucket.file(filePath).download({ destination: tempFilePath });
      
      // Generate thumbnails of different sizes
      const sizes = [
        { name: '200x200', width: 200, height: 200 },
        { name: '400x400', width: 400, height: 400 }
      ];
      
      for (const size of sizes) {
        const sizedThumbPath = path.join(os.tmpdir(), `thumb_${size.name}_${path.basename(filePath)}`);
        
        // Resize image
        await sharp(tempFilePath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center'
          })
          .toFile(sizedThumbPath);
        
        // Upload thumbnail
        const thumbDir = path.dirname(filePath);
        const thumbFileName = `thumb_${size.name}_${path.basename(filePath)}`;
        const thumbStoragePath = `${thumbDir}/${thumbFileName}`;
        
        await bucket.upload(sizedThumbPath, {
          destination: thumbStoragePath,
          metadata: {
            contentType: contentType,
            metadata: {
              thumbnail: 'true',
              originalImage: filePath,
              size: size.name
            }
          }
        });
        
        // Clean up temp file
        await fs.remove(sizedThumbPath);
      }
      
      // Clean up original temp file
      await fs.remove(tempFilePath);
      
      console.log(`Thumbnails generated successfully for ${filePath}`);
      return { success: true };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return { success: false, error: error.message };
    }
  });

module.exports = {
  cleanupPropertyImages: exports.cleanupPropertyImages,
  deletePropertyImage: exports.deletePropertyImage,
  cleanupOrphanedImages: exports.cleanupOrphanedImages,
  cleanupTempUploads: exports.cleanupTempUploads,
  generateThumbnail: exports.generateThumbnail
};
