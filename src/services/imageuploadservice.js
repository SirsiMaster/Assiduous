import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { getAuth } from 'firebase/auth';

/**
 * Service for handling image uploads to Firebase Storage
 * Features: Multi-file upload, compression, progress tracking, CDN URLs
 */
export class imageuploadservice {
  constructor() {
    this.storage = getStorage();
    this.auth = getAuth();
    this.compressionQuality = 0.8; // 80% quality
    this.maxImageSize = 10 * 1024 * 1024; // 10MB
    this.maxWidth = 2048;
    this.maxHeight = 2048;
  }

  /**
   * Upload multiple images with compression and progress tracking
   * @param {File[]} files - Array of image files
   * @param {string} path - Storage path (e.g., 'properties/prop123/images')
   * @param {Function} onProgress - Callback for progress updates
   * @returns {Promise<Array>} Array of uploaded image metadata
   */
  async uploadImages(files, path, onProgress = null) {
    if (!this.auth.currentUser) {
      throw new Error('User must be authenticated to upload images');
    }

    const uploadPromises = files.map((file, index) => 
      this.uploadSingleImage(file, path, index, files.length, onProgress)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Upload a single image with compression
   * @param {File} file - Image file
   * @param {string} path - Storage path
   * @param {number} index - File index (for progress tracking)
   * @param {number} total - Total files being uploaded
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Uploaded image metadata
   */
  async uploadSingleImage(file, path, index = 0, total = 1, onProgress = null) {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error(`File ${file.name} is not an image`);
    }

    if (file.size > this.maxImageSize) {
      throw new Error(`Image ${file.name} exceeds ${this.maxImageSize / 1024 / 1024}MB limit`);
    }

    // Compress image
    const compressedBlob = await this.compressImage(file);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const fullPath = `${path}/${filename}`;

    // Create storage reference
    const storageRef = ref(this.storage, fullPath);

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: this.auth.currentUser.uid,
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        originalSize: file.size.toString(),
        compressedSize: compressedBlob.size.toString()
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          if (onProgress) {
            onProgress({
              fileIndex: index,
              fileName: file.name,
              progress: progress,
              totalFiles: total,
              overallProgress: ((index + (progress / 100)) / total) * 100
            });
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload complete, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          resolve({
            url: downloadURL,
            path: fullPath,
            filename: filename,
            originalName: file.name,
            size: compressedBlob.size,
            contentType: file.type,
            uploadedAt: new Date().toISOString(),
            uploadedBy: this.auth.currentUser.uid
          });
        }
      );
    });
  }

  /**
   * Compress image using Canvas API
   * @param {File} file - Image file to compress
   * @returns {Promise<Blob>} Compressed image blob
   */
  async compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > this.maxWidth || height > this.maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = this.maxWidth;
              height = width / aspectRatio;
            } else {
              height = this.maxHeight;
              width = height * aspectRatio;
            }
          }

          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            file.type,
            this.compressionQuality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Delete a single image from storage
   * @param {string} path - Full storage path to image
   * @returns {Promise<void>}
   */
  async deleteImage(path) {
    if (!this.auth.currentUser) {
      throw new Error('User must be authenticated to delete images');
    }

    const imageRef = ref(this.storage, path);
    await deleteObject(imageRef);
  }

  /**
   * Delete all images in a directory
   * @param {string} path - Directory path (e.g., 'properties/prop123/images')
   * @returns {Promise<number>} Number of images deleted
   */
  async deleteAllImages(path) {
    if (!this.auth.currentUser) {
      throw new Error('User must be authenticated to delete images');
    }

    const dirRef = ref(this.storage, path);
    const listResult = await listAll(dirRef);
    
    const deletePromises = listResult.items.map(itemRef => 
      deleteObject(itemRef)
    );
    
    await Promise.all(deletePromises);
    return listResult.items.length;
  }

  /**
   * Get all image URLs from a directory
   * @param {string} path - Directory path
   * @returns {Promise<Array>} Array of image URLs
   */
  async getImageUrls(path) {
    const dirRef = ref(this.storage, path);
    const listResult = await listAll(dirRef);
    
    const urlPromises = listResult.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        url,
        path: itemRef.fullPath,
        name: itemRef.name
      };
    });
    
    return Promise.all(urlPromises);
  }

  /**
   * Validate image files before upload
   * @param {FileList|Array} files - Files to validate
   * @returns {Object} Validation result with valid files and errors
   */
  validateFiles(files) {
    const valid = [];
    const errors = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push({
          file: file.name,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
        });
      } else if (file.size > this.maxImageSize) {
        errors.push({
          file: file.name,
          error: `File size exceeds ${this.maxImageSize / 1024 / 1024}MB limit.`
        });
      } else {
        valid.push(file);
      }
    });

    return { valid, errors };
  }

  /**
   * Generate thumbnail URL (Firebase automatically creates thumbnails with Cloud Functions)
   * @param {string} url - Original image URL
   * @param {string} size - Thumbnail size (e.g., '200x200')
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(url, size = '200x200') {
    // Replace the token with thumb_ prefix for Firebase generated thumbnails
    // This assumes you have Cloud Functions set up for thumbnail generation
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const thumbFilename = `thumb_${size}_${filename}`;
    parts[parts.length - 1] = thumbFilename;
    return parts.join('/');
  }

  /**
   * Get storage reference for a path
   * @param {string} path - Storage path
   * @returns {StorageReference}
   */
  getReference(path) {
    return ref(this.storage, path);
  }

  /**
   * Check if user has permission to upload to path
   * @param {string} path - Storage path
   * @returns {boolean}
   */
  canUpload(path) {
    if (!this.auth.currentUser) return false;
    
    const token = this.auth.currentUser.getIdTokenResult();
    const role = token?.claims?.role;
    
    // Agents and admins can upload property images
    if (path.startsWith('properties/') && ['agent', 'admin'].includes(role)) {
      return true;
    }
    
    // Users can upload their own profile images
    if (path.startsWith(`users/${this.auth.currentUser.uid}/`)) {
      return true;
    }
    
    return role === 'admin';
  }
}

export default imageuploadservice;
