/**
 * Universal Document Upload Service with Automatic OpenSign Integration
 * Handles all document uploads across the platform and automatically triggers signing workflows
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    doc,
    addDoc,
    updateDoc,
    getDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js';
import { 
    getFunctions, 
    httpsCallable 
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-functions.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkF3QnTsxYajUkF3BVE7E9F7LdkGEKpV8",
    authDomain: "assiduous-prod.firebaseapp.com",
    projectId: "assiduous-prod",
    storageBucket: "assiduous-prod.appspot.com",
    messagingSenderId: "883040437562",
    appId: "1:883040437562:web:91a2e5c7d8d0c5a3f3d0e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const auth = getAuth(app);

// Cloud Functions
const createSigningSession = httpsCallable(functions, 'createSigningSession');
const createTemplateFromUpload = httpsCallable(functions, 'createTemplateFromUpload');

export class DocumentUploadService {
    constructor() {
        this.supportedFormats = [
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
            '.png', '.jpg', '.jpeg', '.txt', '.rtf'
        ];
        
        this.documentCategories = {
            'purchase_agreement': 'Purchase Agreement',
            'listing_agreement': 'Listing Agreement',
            'disclosure': 'Property Disclosure',
            'inspection': 'Inspection Report',
            'title': 'Title Document',
            'mortgage': 'Mortgage Document',
            'lease': 'Lease Agreement',
            'addendum': 'Contract Addendum',
            'other': 'Other Document'
        };

        this.initializeUploadZones();
        this.attachGlobalListeners();
    }

    /**
     * Initialize upload zones across the platform
     */
    initializeUploadZones() {
        // Find all existing upload zones and enhance them
        const uploadZones = document.querySelectorAll(
            '.upload-zone, .document-upload, [data-upload-zone], .contract-upload'
        );

        uploadZones.forEach(zone => {
            this.enhanceUploadZone(zone);
        });

        // Also enhance any "Add Document" buttons
        const addButtons = document.querySelectorAll(
            '[onclick*="upload"], [onclick*="Upload"], .add-document, .upload-btn'
        );

        addButtons.forEach(button => {
            this.enhanceUploadButton(button);
        });
    }

    /**
     * Enhance an upload zone with OpenSign integration
     */
    enhanceUploadZone(zone) {
        // Remove any existing click handlers
        zone.onclick = null;
        
        // Add our enhanced handler
        zone.addEventListener('click', (e) => {
            e.preventDefault();
            this.showUploadModal();
        });

        // Add drag and drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
    }

    /**
     * Enhance upload buttons
     */
    enhanceUploadButton(button) {
        // Clone the button to remove existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.showUploadModal();
        });
    }

    /**
     * Attach global listeners for document-related actions
     */
    attachGlobalListeners() {
        // Listen for any dynamically added upload elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's an upload element
                        if (node.matches && (
                            node.matches('.upload-zone, .document-upload, [data-upload-zone]') ||
                            node.querySelector('.upload-zone, .document-upload, [data-upload-zone]')
                        )) {
                            this.initializeUploadZones();
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Global keyboard shortcut for upload (Ctrl/Cmd + U)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                this.showUploadModal();
            }
        });
    }

    /**
     * Show the universal upload modal
     */
    showUploadModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('universal-upload-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modalHTML = `
            <div id="universal-upload-modal" class="upload-modal-overlay">
                <div class="upload-modal-content">
                    <div class="upload-modal-header">
                        <h2>Upload Document</h2>
                        <button class="upload-modal-close">&times;</button>
                    </div>
                    
                    <div class="upload-modal-body">
                        <!-- Upload Zone -->
                        <div class="upload-dropzone" id="universal-dropzone">
                            <svg class="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none">
                                <path d="M12 15V3m0 0l-4 4m4-4l4 4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" 
                                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <h3>Drop files here or click to browse</h3>
                            <p>Supports PDF, Word, Excel, Images, and more</p>
                            <input type="file" id="universal-file-input" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.rtf" hidden>
                        </div>

                        <!-- Document Details Form -->
                        <div id="document-details-form" style="display: none;">
                            <h3>Document Details</h3>
                            
                            <div class="form-group">
                                <label>Document Name</label>
                                <input type="text" id="doc-name" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label>Category</label>
                                <select id="doc-category" class="form-select" required>
                                    ${Object.entries(this.documentCategories).map(([value, label]) => 
                                        `<option value="${value}">${label}</option>`
                                    ).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Related Transaction (Optional)</label>
                                <select id="doc-transaction" class="form-select">
                                    <option value="">None - Standalone Document</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="requires-signature" checked>
                                    This document requires signatures
                                </label>
                            </div>

                            <div id="signature-config" class="signature-config">
                                <h4>Signature Requirements</h4>
                                
                                <div class="form-group">
                                    <label>Who needs to sign?</label>
                                    <div id="signers-list">
                                        <div class="signer-row">
                                            <input type="email" placeholder="Email" class="signer-email">
                                            <input type="text" placeholder="Name" class="signer-name">
                                            <select class="signer-role">
                                                <option>Buyer</option>
                                                <option>Seller</option>
                                                <option>Agent</option>
                                                <option>Witness</option>
                                                <option>Other</option>
                                            </select>
                                            <button type="button" class="remove-signer">&times;</button>
                                        </div>
                                    </div>
                                    <button type="button" id="add-signer-btn" class="add-signer-btn">+ Add Signer</button>
                                </div>

                                <div class="form-group">
                                    <label>Signature Deadline (days)</label>
                                    <input type="number" id="signature-deadline" value="7" min="1" max="30">
                                </div>

                                <div class="form-group">
                                    <label>Automatic Reminders</label>
                                    <select id="reminder-frequency">
                                        <option value="daily">Daily</option>
                                        <option value="every2days" selected>Every 2 Days</option>
                                        <option value="every3days">Every 3 Days</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="none">No Reminders</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Additional Notes (Optional)</label>
                                <textarea id="doc-notes" class="form-textarea" rows="3"></textarea>
                            </div>
                        </div>

                        <!-- File Preview -->
                        <div id="file-preview" style="display: none;">
                            <h4>Selected Files</h4>
                            <div id="preview-list"></div>
                        </div>
                    </div>

                    <div class="upload-modal-footer">
                        <button class="btn-secondary" id="cancel-upload">Cancel</button>
                        <button class="btn-primary" id="upload-btn" style="display: none;">
                            <span class="upload-btn-text">Upload & Process</span>
                            <span class="upload-spinner" style="display: none;">Processing...</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add styles if not already present
        if (!document.getElementById('upload-modal-styles')) {
            const styles = `
                <style id="upload-modal-styles">
                    .upload-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        animation: fadeIn 0.2s;
                    }

                    .upload-modal-content {
                        background: white;
                        border-radius: 12px;
                        width: 90%;
                        max-width: 700px;
                        max-height: 90vh;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        animation: slideUp 0.3s;
                    }

                    .upload-modal-header {
                        padding: 20px;
                        border-bottom: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .upload-modal-header h2 {
                        margin: 0;
                        font-size: 20px;
                        font-weight: 600;
                    }

                    .upload-modal-close {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #6b7280;
                        width: 32px;
                        height: 32px;
                        border-radius: 6px;
                        transition: all 0.15s;
                    }

                    .upload-modal-close:hover {
                        background: #f3f4f6;
                    }

                    .upload-modal-body {
                        padding: 20px;
                        overflow-y: auto;
                        flex: 1;
                    }

                    .upload-dropzone {
                        border: 2px dashed #d1d5db;
                        border-radius: 12px;
                        padding: 40px;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: #f9fafb;
                    }

                    .upload-dropzone:hover {
                        border-color: #60a5fa;
                        background: #eff6ff;
                    }

                    .upload-dropzone.drag-over {
                        border-color: #3b82f6;
                        background: #dbeafe;
                    }

                    .upload-icon {
                        color: #9ca3af;
                        margin-bottom: 16px;
                    }

                    .upload-dropzone h3 {
                        margin: 0 0 8px;
                        font-size: 18px;
                        font-weight: 600;
                        color: #1f2937;
                    }

                    .upload-dropzone p {
                        margin: 0;
                        color: #6b7280;
                        font-size: 14px;
                    }

                    .form-group {
                        margin-bottom: 20px;
                    }

                    .form-group label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 500;
                        color: #374151;
                        font-size: 14px;
                    }

                    .form-input, .form-select, .form-textarea {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        transition: border-color 0.15s;
                    }

                    .form-input:focus, .form-select:focus, .form-textarea:focus {
                        outline: none;
                        border-color: #3b82f6;
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }

                    .signature-config {
                        background: #f9fafb;
                        padding: 16px;
                        border-radius: 8px;
                        margin-top: 16px;
                    }

                    .signature-config h4 {
                        margin: 0 0 16px;
                        font-size: 16px;
                        font-weight: 600;
                    }

                    .signer-row {
                        display: grid;
                        grid-template-columns: 2fr 2fr 1fr auto;
                        gap: 8px;
                        margin-bottom: 8px;
                    }

                    .signer-email, .signer-name, .signer-role {
                        padding: 6px 10px;
                        border: 1px solid #d1d5db;
                        border-radius: 4px;
                        font-size: 14px;
                    }

                    .remove-signer {
                        background: #fee2e2;
                        color: #dc2626;
                        border: none;
                        border-radius: 4px;
                        width: 32px;
                        height: 32px;
                        cursor: pointer;
                        transition: all 0.15s;
                    }

                    .remove-signer:hover {
                        background: #dc2626;
                        color: white;
                    }

                    .add-signer-btn {
                        width: 100%;
                        padding: 8px;
                        border: 1px dashed #d1d5db;
                        background: white;
                        color: #3b82f6;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.15s;
                    }

                    .add-signer-btn:hover {
                        border-color: #3b82f6;
                        background: #eff6ff;
                    }

                    .upload-modal-footer {
                        padding: 20px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                    }

                    .btn-secondary, .btn-primary {
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.15s;
                        border: none;
                    }

                    .btn-secondary {
                        background: white;
                        color: #374151;
                        border: 1px solid #d1d5db;
                    }

                    .btn-secondary:hover {
                        background: #f3f4f6;
                    }

                    .btn-primary {
                        background: #3b82f6;
                        color: white;
                    }

                    .btn-primary:hover {
                        background: #2563eb;
                    }

                    .btn-primary:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                    }

                    #file-preview {
                        margin-top: 20px;
                        padding: 16px;
                        background: #f9fafb;
                        border-radius: 8px;
                    }

                    #file-preview h4 {
                        margin: 0 0 12px;
                        font-size: 14px;
                        font-weight: 600;
                    }

                    .file-preview-item {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 8px;
                        background: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 4px;
                        margin-bottom: 8px;
                    }

                    .file-preview-name {
                        font-size: 14px;
                        color: #374151;
                    }

                    .file-preview-size {
                        font-size: 12px;
                        color: #6b7280;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }

        // Attach event listeners
        this.attachModalListeners();
        
        // Load transactions for dropdown
        this.loadTransactions();
    }

    /**
     * Attach event listeners to modal elements
     */
    attachModalListeners() {
        const modal = document.getElementById('universal-upload-modal');
        const dropzone = document.getElementById('universal-dropzone');
        const fileInput = document.getElementById('universal-file-input');
        const closeBtn = modal.querySelector('.upload-modal-close');
        const cancelBtn = document.getElementById('cancel-upload');
        const uploadBtn = document.getElementById('upload-btn');
        const requiresSignature = document.getElementById('requires-signature');
        const signatureConfig = document.getElementById('signature-config');
        const addSignerBtn = document.getElementById('add-signer-btn');

        // Close modal
        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // File selection
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        // Signature requirement toggle
        requiresSignature.addEventListener('change', (e) => {
            signatureConfig.style.display = e.target.checked ? 'block' : 'none';
        });

        // Add signer
        addSignerBtn.addEventListener('click', () => {
            this.addSignerRow();
        });

        // Upload button
        uploadBtn.addEventListener('click', () => {
            this.processUpload();
        });
    }

    /**
     * Handle selected files
     */
    handleFiles(files) {
        // Validate files
        const validFiles = files.filter(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!this.supportedFormats.includes(ext)) {
                alert(`Unsupported file format: ${file.name}`);
                return false;
            }
            if (file.size > 20 * 1024 * 1024) { // 20MB limit
                alert(`File too large: ${file.name}`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // Store files for upload
        this.selectedFiles = validFiles;

        // Show document details form
        document.getElementById('universal-dropzone').style.display = 'none';
        document.getElementById('document-details-form').style.display = 'block';
        document.getElementById('upload-btn').style.display = 'block';

        // Show file preview
        const previewDiv = document.getElementById('file-preview');
        const previewList = document.getElementById('preview-list');
        previewDiv.style.display = 'block';
        
        previewList.innerHTML = validFiles.map(file => `
            <div class="file-preview-item">
                <span class="file-preview-name">${file.name}</span>
                <span class="file-preview-size">${(file.size / 1024).toFixed(2)} KB</span>
            </div>
        `).join('');

        // Set default document name from first file
        const docNameInput = document.getElementById('doc-name');
        if (!docNameInput.value) {
            docNameInput.value = validFiles[0].name.replace(/\.[^/.]+$/, '');
        }
    }

    /**
     * Load transactions for dropdown
     */
    async loadTransactions() {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Query transactions
            const transactionsRef = collection(db, 'transactions');
            const snapshot = await getDocs(transactionsRef);
            
            const select = document.getElementById('doc-transaction');
            snapshot.forEach(doc => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${data.propertyAddress || 'Transaction'} - ${data.status || 'Active'}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }

    /**
     * Add a new signer row
     */
    addSignerRow() {
        const signersList = document.getElementById('signers-list');
        const newRow = document.createElement('div');
        newRow.className = 'signer-row';
        newRow.innerHTML = `
            <input type="email" placeholder="Email" class="signer-email">
            <input type="text" placeholder="Name" class="signer-name">
            <select class="signer-role">
                <option>Buyer</option>
                <option>Seller</option>
                <option>Agent</option>
                <option>Witness</option>
                <option>Other</option>
            </select>
            <button type="button" class="remove-signer">&times;</button>
        `;
        
        signersList.appendChild(newRow);
        
        // Add remove listener
        newRow.querySelector('.remove-signer').addEventListener('click', () => {
            newRow.remove();
        });
    }

    /**
     * Process the document upload
     */
    async processUpload() {
        const uploadBtn = document.getElementById('upload-btn');
        const btnText = uploadBtn.querySelector('.upload-btn-text');
        const spinner = uploadBtn.querySelector('.upload-spinner');
        
        // Show loading state
        uploadBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline';

        try {
            // Gather form data
            const docName = document.getElementById('doc-name').value;
            const category = document.getElementById('doc-category').value;
            const transactionId = document.getElementById('doc-transaction').value;
            const requiresSignature = document.getElementById('requires-signature').checked;
            const notes = document.getElementById('doc-notes').value;

            // Upload files to Firebase Storage
            const uploadedFiles = [];
            for (const file of this.selectedFiles) {
                const timestamp = Date.now();
                const fileName = `${timestamp}_${file.name}`;
                const storagePath = `documents/${auth.currentUser.uid}/${fileName}`;
                
                const storageRef = ref(storage, storagePath);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                
                uploadedFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    storagePath,
                    downloadURL
                });
            }

            // Create document record in Firestore
            const documentData = {
                name: docName,
                category,
                transactionId: transactionId || null,
                files: uploadedFiles,
                requiresSignature,
                notes,
                uploadedBy: auth.currentUser.uid,
                uploadedAt: serverTimestamp(),
                status: requiresSignature ? 'pending_signature' : 'completed'
            };

            const docRef = await addDoc(collection(db, 'documents'), documentData);

            // If signatures are required, create signing session
            if (requiresSignature) {
                const signers = this.getSignersFromForm();
                
                if (signers.length > 0) {
                    // First, create a template from the uploaded document
                    const templateResult = await createTemplateFromUpload({
                        documentId: docRef.id,
                        documentName: docName,
                        documentURL: uploadedFiles[0].downloadURL,
                        category
                    });

                    // Then create the signing session
                    const sessionResult = await createSigningSession({
                        transactionId: transactionId || docRef.id,
                        templateId: templateResult.data.templateId,
                        signers,
                        options: {
                            name: docName,
                            expirationDays: parseInt(document.getElementById('signature-deadline').value),
                            reminderFrequency: document.getElementById('reminder-frequency').value,
                            metadata: {
                                documentId: docRef.id,
                                category,
                                uploadedBy: auth.currentUser.uid
                            }
                        }
                    });

                    // Update document with signing session reference
                    await updateDoc(doc(db, 'documents', docRef.id), {
                        signingSessionId: sessionResult.data.sessionId,
                        envelopeId: sessionResult.data.envelopeId
                    });

                    // Show success with signing info
                    alert(`Document uploaded successfully! Signature requests have been sent to ${signers.length} signer(s).`);
                } else {
                    alert('Document uploaded successfully! Please add signers to send for signature.');
                }
            } else {
                alert('Document uploaded successfully!');
            }

            // Close modal
            document.getElementById('universal-upload-modal').remove();
            
            // Refresh the page or update the UI
            this.refreshDocumentsList();
            
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Failed to upload document: ' + error.message);
        } finally {
            // Reset button state
            uploadBtn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    /**
     * Get signers from the form
     */
    getSignersFromForm() {
        const signerRows = document.querySelectorAll('#signers-list .signer-row');
        const signers = [];
        
        signerRows.forEach(row => {
            const email = row.querySelector('.signer-email').value;
            const name = row.querySelector('.signer-name').value;
            const role = row.querySelector('.signer-role').value;
            
            if (email && name) {
                signers.push({ email, name, role });
            }
        });
        
        return signers;
    }

    /**
     * Refresh the documents list on the page
     */
    refreshDocumentsList() {
        // Check if we're on a page with a documents grid
        const contractsGrid = document.querySelector('.contracts-grid');
        if (contractsGrid) {
            // Reload the page to show new document
            location.reload();
        }

        // Trigger any custom events that might refresh lists
        window.dispatchEvent(new CustomEvent('documentsUpdated'));
    }

    /**
     * Automatically process existing document links
     */
    processExistingDocuments() {
        // Find all document links
        const documentLinks = document.querySelectorAll(
            'a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], .contract-card'
        );

        documentLinks.forEach(link => {
            // Check if it's not already processed
            if (!link.dataset.opensignProcessed) {
                this.enhanceDocumentLink(link);
                link.dataset.opensignProcessed = 'true';
            }
        });
    }

    /**
     * Enhance existing document links with OpenSign actions
     */
    enhanceDocumentLink(link) {
        // Add a "Send for Signature" button if it doesn't exist
        const existingBtn = link.querySelector('.send-signature-btn');
        if (!existingBtn) {
            const signBtn = document.createElement('button');
            signBtn.className = 'send-signature-btn';
            signBtn.innerHTML = '✍️ Send for Signature';
            signBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 4px 8px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                z-index: 10;
            `;
            
            signBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.sendExistingDocumentForSignature(link);
            });

            // Make link container relative positioned
            link.style.position = 'relative';
            link.appendChild(signBtn);
        }
    }

    /**
     * Send an existing document for signature
     */
    async sendExistingDocumentForSignature(link) {
        const documentName = link.querySelector('.contract-title')?.textContent || 
                           link.textContent || 'Document';
        const documentUrl = link.href;

        // Show signature configuration modal
        this.showSignatureModal(documentName, documentUrl);
    }

    /**
     * Show signature configuration modal for existing documents
     */
    showSignatureModal(documentName, documentUrl) {
        // Similar to upload modal but focused on signature configuration
        // Implementation would be similar to showUploadModal but simplified
        // for just adding signers to existing documents
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.documentUploadService = new DocumentUploadService();
    });
} else {
    window.documentUploadService = new DocumentUploadService();
}

// Export for use in other modules
export default DocumentUploadService;
