/**
 * Global OpenSign Integration Loader
 * This script ensures OpenSign is integrated across all pages with documents
 */

(function() {
    'use strict';

    // Configuration
    const OPENSIGN_CONFIG = {
        autoIntegrate: true,
        enhanceExistingDocuments: true,
        addUploadButtons: true,
        watchForChanges: true
    };

    /**
     * Initialize OpenSign integration
     */
    function initializeOpenSignIntegration() {
        console.log('🔐 Initializing OpenSign Integration...');

        // Load the Document Upload Service if not already loaded
        if (!window.documentUploadService) {
            loadDocumentUploadService();
        }

        // Enhance existing document areas
        enhanceDocumentAreas();

        // Add upload buttons where needed
        addUploadButtons();

        // Watch for dynamic content changes
        if (OPENSIGN_CONFIG.watchForChanges) {
            watchForDynamicContent();
        }

        // Add global keyboard shortcuts
        addKeyboardShortcuts();

        console.log('✅ OpenSign Integration Ready');
    }

    /**
     * Load the Document Upload Service
     */
    function loadDocumentUploadService() {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = '/assets/js/services/DocumentUploadService.js';
        document.head.appendChild(script);
    }

    /**
     * Enhance all document areas on the page
     */
    function enhanceDocumentAreas() {
        // Find all contract/document sections
        const documentSections = [
            '.contracts-grid',
            '.documents-list',
            '.contract-section',
            '[data-documents]',
            '.files-section',
            '.attachments'
        ];

        documentSections.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.dataset.opensignEnhanced) {
                    enhanceDocumentSection(element);
                    element.dataset.opensignEnhanced = 'true';
                }
            });
        });

        // Enhance individual document cards/links
        enhanceDocumentLinks();
    }

    /**
     * Enhance a document section with OpenSign features
     */
    function enhanceDocumentSection(section) {
        // Add a floating action button for quick upload
        if (!section.querySelector('.opensign-fab')) {
            const fab = createFloatingActionButton();
            section.style.position = 'relative';
            section.appendChild(fab);
        }

        // Enhance any existing upload areas
        const uploadAreas = section.querySelectorAll('[onclick*="upload"], .add-document, .upload-zone');
        uploadAreas.forEach(area => {
            enhanceUploadArea(area);
        });
    }

    /**
     * Create a floating action button for document upload
     */
    function createFloatingActionButton() {
        const fab = document.createElement('button');
        fab.className = 'opensign-fab';
        fab.title = 'Upload Document for Signature';
        fab.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        
        fab.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            cursor: pointer;
            z-index: 100;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        fab.addEventListener('mouseenter', () => {
            fab.style.transform = 'scale(1.1)';
            fab.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        });

        fab.addEventListener('mouseleave', () => {
            fab.style.transform = 'scale(1)';
            fab.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });

        fab.addEventListener('click', () => {
            if (window.documentUploadService) {
                window.documentUploadService.showUploadModal();
            } else {
                // Fallback: Load service then show modal
                loadDocumentUploadService();
                setTimeout(() => {
                    if (window.documentUploadService) {
                        window.documentUploadService.showUploadModal();
                    }
                }, 1000);
            }
        });

        return fab;
    }

    /**
     * Enhance upload areas
     */
    function enhanceUploadArea(area) {
        if (area.dataset.opensignEnhanced) return;

        // Remove old onclick handlers
        area.onclick = null;
        area.removeAttribute('onclick');

        // Add new enhanced click handler
        area.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.documentUploadService) {
                window.documentUploadService.showUploadModal();
            } else {
                alert('Document upload service is loading. Please try again in a moment.');
                loadDocumentUploadService();
            }
        });

        // Add visual indicator
        area.style.cursor = 'pointer';
        area.title = 'Click to upload document with OpenSign integration';
        
        // Add OpenSign badge
        if (!area.querySelector('.opensign-badge')) {
            const badge = document.createElement('span');
            badge.className = 'opensign-badge';
            badge.innerHTML = '🔐';
            badge.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #10b981;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
            `;
            
            if (area.style.position !== 'absolute' && area.style.position !== 'relative') {
                area.style.position = 'relative';
            }
            area.appendChild(badge);
        }

        area.dataset.opensignEnhanced = 'true';
    }

    /**
     * Enhance document links with signature options
     */
    function enhanceDocumentLinks() {
        const documentLinks = document.querySelectorAll(`
            a[href$=".pdf"],
            a[href$=".doc"],
            a[href$=".docx"],
            .contract-card,
            .document-link,
            [data-document]
        `);

        documentLinks.forEach(link => {
            if (!link.dataset.opensignEnhanced) {
                addSignatureButton(link);
                link.dataset.opensignEnhanced = 'true';
            }
        });
    }

    /**
     * Add signature button to a document link
     */
    function addSignatureButton(link) {
        // Don't add if it already has one
        if (link.querySelector('.opensign-sign-btn')) return;

        const signBtn = document.createElement('button');
        signBtn.className = 'opensign-sign-btn';
        signBtn.innerHTML = '✍️';
        signBtn.title = 'Send for Signature';
        signBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #3b82f6;
            color: white;
            border: none;
            font-size: 16px;
            cursor: pointer;
            z-index: 10;
            transition: all 0.2s;
            opacity: 0;
            transform: scale(0.8);
        `;

        // Make container relative if needed
        if (link.style.position !== 'absolute' && link.style.position !== 'relative') {
            link.style.position = 'relative';
        }

        // Show/hide on hover
        link.addEventListener('mouseenter', () => {
            signBtn.style.opacity = '1';
            signBtn.style.transform = 'scale(1)';
        });

        link.addEventListener('mouseleave', () => {
            signBtn.style.opacity = '0';
            signBtn.style.transform = 'scale(0.8)';
        });

        signBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendDocumentForSignature(link);
        });

        link.appendChild(signBtn);
    }

    /**
     * Send a document for signature
     */
    function sendDocumentForSignature(link) {
        const documentName = extractDocumentName(link);
        const documentUrl = link.href || link.dataset.documentUrl;

        if (window.documentUploadService) {
            window.documentUploadService.sendExistingDocumentForSignature({
                name: documentName,
                url: documentUrl,
                element: link
            });
        } else {
            alert('Loading signature service...');
            loadDocumentUploadService();
            setTimeout(() => sendDocumentForSignature(link), 1000);
        }
    }

    /**
     * Extract document name from a link
     */
    function extractDocumentName(link) {
        // Try various methods to get the document name
        return link.querySelector('.contract-title')?.textContent ||
               link.querySelector('.document-name')?.textContent ||
               link.getAttribute('title') ||
               link.textContent ||
               'Document';
    }

    /**
     * Add upload buttons to pages that need them
     */
    function addUploadButtons() {
        // Check if we're on a contracts/documents page
        const isDocumentPage = window.location.pathname.includes('contract') ||
                              window.location.pathname.includes('document') ||
                              document.querySelector('.contracts-grid, .documents-list');

        if (isDocumentPage) {
            // Add a header upload button if it doesn't exist
            addHeaderUploadButton();

            // Add empty state upload prompts
            addEmptyStateUpload();
        }
    }

    /**
     * Add upload button to page header
     */
    function addHeaderUploadButton() {
        const header = document.querySelector('header, .topbar, .page-header, .dashboard-header');
        if (header && !header.querySelector('.opensign-header-upload')) {
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'opensign-header-upload btn-primary';
            uploadBtn.innerHTML = '📄 Upload Document';
            uploadBtn.style.cssText = `
                padding: 8px 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                margin-left: auto;
            `;

            uploadBtn.addEventListener('click', () => {
                if (window.documentUploadService) {
                    window.documentUploadService.showUploadModal();
                }
            });

            header.appendChild(uploadBtn);
        }
    }

    /**
     * Add upload prompt to empty states
     */
    function addEmptyStateUpload() {
        const emptyStates = document.querySelectorAll('.empty-state, .no-documents, .no-results');
        emptyStates.forEach(empty => {
            if (!empty.querySelector('.opensign-empty-upload')) {
                const uploadPrompt = document.createElement('div');
                uploadPrompt.className = 'opensign-empty-upload';
                uploadPrompt.innerHTML = `
                    <button class="opensign-upload-cta">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15V3m0 0l-4 4m4-4l4 4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" 
                                  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Upload Your First Document</span>
                    </button>
                `;

                uploadPrompt.querySelector('button').addEventListener('click', () => {
                    if (window.documentUploadService) {
                        window.documentUploadService.showUploadModal();
                    }
                });

                empty.appendChild(uploadPrompt);
            }
        });
    }

    /**
     * Watch for dynamic content changes
     */
    function watchForDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            let shouldEnhance = false;

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if it contains documents or contracts
                        if (node.matches && (
                            node.matches('.contract-card, .document-link, [data-document]') ||
                            node.querySelector('.contract-card, .document-link, [data-document]')
                        )) {
                            shouldEnhance = true;
                        }
                    }
                });
            });

            if (shouldEnhance) {
                // Debounce the enhancement
                clearTimeout(window.opensignEnhanceTimeout);
                window.opensignEnhanceTimeout = setTimeout(() => {
                    enhanceDocumentAreas();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Add keyboard shortcuts
     */
    function addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + U for upload
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
                e.preventDefault();
                if (window.documentUploadService) {
                    window.documentUploadService.showUploadModal();
                }
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOpenSignIntegration);
    } else {
        initializeOpenSignIntegration();
    }

    // Also initialize on page navigation (for SPAs)
    window.addEventListener('popstate', initializeOpenSignIntegration);
    
    // Expose global function for manual initialization
    window.initializeOpenSign = initializeOpenSignIntegration;

})();
