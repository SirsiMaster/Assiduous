import { imageuploadservice } from '../services/imageuploadservice.js';

/**
 * Reusable Image Upload Component
 * Features: Drag & drop, multi-file, preview, progress bars, validation
 */
export class ImageUploader {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }

    // Configuration options
    this.options = {
      maxFiles: options.maxFiles || 10,
      storagePath: options.storagePath || 'temp',
      allowMultiple: options.allowMultiple !== false,
      showPreview: options.showPreview !== false,
      onUploadComplete: options.onUploadComplete || null,
      onUploadError: options.onUploadError || null,
      onFileSelect: options.onFileSelect || null
    };

    this.uploadService = new imageuploadservice();
    this.selectedFiles = [];
    this.uploadedImages = [];
    
    this.init();
  }

  /**
   * Initialize the upload component
   */
  init() {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the upload interface
   */
  render() {
    this.container.innerHTML = `
      <div class="image-uploader">
        <!-- Upload Area -->
        <div class="upload-area" id="${this.container.id}-drop-zone">
          <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <h3>Upload Images</h3>
          <p>Drag & drop images here or click to browse</p>
          <p class="upload-limits">Max ${this.options.maxFiles} images, 10MB each</p>
          <input 
            type="file" 
            id="${this.container.id}-file-input" 
            accept="image/*" 
            ${this.options.allowMultiple ? 'multiple' : ''}
            style="display: none;"
          />
          <button type="button" class="btn-browse" id="${this.container.id}-browse-btn">
            <i class="fas fa-folder-open"></i> Browse Files
          </button>
        </div>

        <!-- File List -->
        <div class="file-list" id="${this.container.id}-file-list"></div>

        <!-- Upload Progress -->
        <div class="upload-progress" id="${this.container.id}-progress" style="display: none;">
          <div class="progress-header">
            <span class="progress-text">Uploading...</span>
            <span class="progress-percentage">0%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" id="${this.container.id}-progress-bar"></div>
          </div>
        </div>

        <!-- Uploaded Images Preview -->
        <div class="uploaded-images" id="${this.container.id}-uploaded" style="display: none;">
          <h4>Uploaded Images</h4>
          <div class="image-grid" id="${this.container.id}-image-grid"></div>
        </div>
      </div>
    `;

    this.injectStyles();
  }

  /**
   * Inject component styles
   */
  injectStyles() {
    if (document.getElementById('image-uploader-styles')) return;

    const style = document.createElement('style');
    style.id = 'image-uploader-styles';
    style.textContent = `
      .image-uploader {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .upload-area {
        border: 2px dashed #cbd5e0;
        border-radius: 12px;
        padding: 40px;
        text-align: center;
        background: #f7fafc;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .upload-area:hover,
      .upload-area.drag-over {
        border-color: #4299e1;
        background: #ebf8ff;
      }

      .upload-icon {
        font-size: 48px;
        color: #4299e1;
        margin-bottom: 16px;
      }

      .upload-area h3 {
        margin: 0 0 8px 0;
        color: #2d3748;
        font-size: 20px;
      }

      .upload-area p {
        margin: 8px 0;
        color: #718096;
      }

      .upload-limits {
        font-size: 12px;
        color: #a0aec0;
      }

      .btn-browse {
        margin-top: 16px;
        padding: 12px 24px;
        background: #4299e1;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: background 0.2s;
      }

      .btn-browse:hover {
        background: #3182ce;
      }

      .file-list {
        margin-top: 20px;
      }

      .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 8px;
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .file-preview {
        width: 50px;
        height: 50px;
        border-radius: 6px;
        object-fit: cover;
      }

      .file-details {
        flex: 1;
      }

      .file-name {
        font-weight: 500;
        color: #2d3748;
        margin-bottom: 4px;
      }

      .file-size {
        font-size: 12px;
        color: #718096;
      }

      .file-actions button {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
      }

      .btn-remove {
        background: #fc8181;
        color: white;
      }

      .btn-remove:hover {
        background: #f56565;
      }

      .upload-progress {
        margin-top: 20px;
        padding: 16px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .progress-text {
        font-weight: 500;
        color: #2d3748;
      }

      .progress-percentage {
        font-weight: 600;
        color: #4299e1;
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #4299e1, #3182ce);
        border-radius: 4px;
        transition: width 0.3s ease;
        width: 0%;
      }

      .uploaded-images {
        margin-top: 20px;
      }

      .uploaded-images h4 {
        margin-bottom: 16px;
        color: #2d3748;
      }

      .image-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
      }

      .uploaded-image-item {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }

      .uploaded-image-item img {
        width: 100%;
        height: 150px;
        object-fit: cover;
      }

      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .uploaded-image-item:hover .image-overlay {
        opacity: 1;
      }

      .image-actions {
        display: flex;
        gap: 8px;
      }

      .image-actions button {
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        color: white;
      }

      .btn-view {
        background: #4299e1;
      }

      .btn-delete {
        background: #fc8181;
      }

      .error-message {
        margin-top: 12px;
        padding: 12px;
        background: #fff5f5;
        border-left: 4px solid #fc8181;
        color: #c53030;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const dropZone = document.getElementById(`${this.container.id}-drop-zone`);
    const fileInput = document.getElementById(`${this.container.id}-file-input`);
    const browseBtn = document.getElementById(`${this.container.id}-browse-btn`);

    // Click to browse
    browseBtn.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('click', (e) => {
      if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

    // Drag & drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      this.handleFileSelect(e.dataTransfer.files);
    });
  }

  /**
   * Handle file selection
   */
  handleFileSelect(files) {
    const { valid, errors } = this.uploadService.validateFiles(files);

    if (errors.length > 0) {
      this.showErrors(errors);
    }

    if (valid.length > 0) {
      // Check max files limit
      if (this.selectedFiles.length + valid.length > this.options.maxFiles) {
        this.showError(`Maximum ${this.options.maxFiles} files allowed`);
        return;
      }

      this.selectedFiles.push(...valid);
      this.displayFileList();

      if (this.options.onFileSelect) {
        this.options.onFileSelect(this.selectedFiles);
      }
    }
  }

  /**
   * Display selected files
   */
  displayFileList() {
    const fileList = document.getElementById(`${this.container.id}-file-list`);
    
    fileList.innerHTML = this.selectedFiles.map((file, index) => `
      <div class="file-item" data-index="${index}">
        <div class="file-info">
          <img src="${URL.createObjectURL(file)}" alt="${file.name}" class="file-preview" />
          <div class="file-details">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${this.formatFileSize(file.size)}</div>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn-remove" onclick="imageUploader_${this.container.id}.removeFile(${index})">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
      </div>
    `).join('');

    // Store instance globally for onclick handlers
    window[`imageUploader_${this.container.id}`] = this;
  }

  /**
   * Remove a file from selection
   */
  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.displayFileList();
  }

  /**
   * Upload all selected files
   */
  async uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.showError('No files selected');
      return [];
    }

    const progressDiv = document.getElementById(`${this.container.id}-progress`);
    const progressBar = document.getElementById(`${this.container.id}-progress-bar`);
    const progressText = progressDiv.querySelector('.progress-percentage');
    
    progressDiv.style.display = 'block';

    try {
      const uploaded = await this.uploadService.uploadImages(
        this.selectedFiles,
        this.options.storagePath,
        (progress) => {
          const percent = Math.round(progress.overallProgress);
          progressBar.style.width = `${percent}%`;
          progressText.textContent = `${percent}%`;
        }
      );

      this.uploadedImages.push(...uploaded);
      this.selectedFiles = [];
      this.displayFileList();
      this.displayUploadedImages();
      
      progressDiv.style.display = 'none';

      if (this.options.onUploadComplete) {
        this.options.onUploadComplete(uploaded);
      }

      return uploaded;
    } catch (error) {
      console.error('Upload error:', error);
      progressDiv.style.display = 'none';
      this.showError(error.message);
      
      if (this.options.onUploadError) {
        this.options.onUploadError(error);
      }
      
      throw error;
    }
  }

  /**
   * Display uploaded images
   */
  displayUploadedImages() {
    const uploadedDiv = document.getElementById(`${this.container.id}-uploaded`);
    const imageGrid = document.getElementById(`${this.container.id}-image-grid`);

    if (this.uploadedImages.length === 0) {
      uploadedDiv.style.display = 'none';
      return;
    }

    uploadedDiv.style.display = 'block';
    imageGrid.innerHTML = this.uploadedImages.map((img, index) => `
      <div class="uploaded-image-item">
        <img src="${img.url}" alt="${img.originalName}" />
        <div class="image-overlay">
          <div class="image-actions">
            <button class="btn-view" onclick="window.open('${img.url}', '_blank')">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn-delete" onclick="imageUploader_${this.container.id}.deleteImage(${index})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Delete an uploaded image
   */
  async deleteImage(index) {
    if (!confirm('Delete this image?')) return;

    try {
      const image = this.uploadedImages[index];
      await this.uploadService.deleteImage(image.path);
      this.uploadedImages.splice(index, 1);
      this.displayUploadedImages();
    } catch (error) {
      console.error('Delete error:', error);
      this.showError('Failed to delete image');
    }
  }

  /**
   * Get all uploaded images
   */
  getUploadedImages() {
    return this.uploadedImages;
  }

  /**
   * Clear all selected and uploaded images
   */
  clear() {
    this.selectedFiles = [];
    this.uploadedImages = [];
    this.displayFileList();
    this.displayUploadedImages();
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showErrors([{ error: message }]);
  }

  /**
   * Show multiple errors
   */
  showErrors(errors) {
    const fileList = document.getElementById(`${this.container.id}-file-list`);
    const errorHtml = errors.map(err => `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        ${err.file ? `<strong>${err.file}:</strong> ` : ''}
        ${err.error}
      </div>
    `).join('');
    
    fileList.insertAdjacentHTML('beforebegin', errorHtml);
    
    setTimeout(() => {
      fileList.querySelectorAll('.error-message').forEach(el => el.remove());
    }, 5000);
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ImageUploader;
