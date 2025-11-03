/**
 * Bulk Operations Module
 * Handles bulk operations for properties, agents, and clients in admin portal
 */

class BulkOperations {
    constructor() {
        this.selectedItems = new Set();
        this.itemType = null; // 'properties', 'agents', or 'clients'
    }

    /**
     * Initialize bulk operations for a specific entity type
     */
    init(itemType) {
        this.itemType = itemType;
        this.setupEventListeners();
        this.updateBulkActionsUI();
    }

    /**
     * Setup event listeners for checkboxes and bulk actions
     */
    setupEventListeners() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }

        // Individual item checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-checkbox')) {
                this.handleItemSelect(e.target);
            }
        });

        // Bulk action buttons
        const bulkDeleteBtn = document.getElementById('bulk-delete');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDelete());
        }

        const bulkStatusBtn = document.getElementById('bulk-status');
        if (bulkStatusBtn) {
            bulkStatusBtn.addEventListener('click', () => this.bulkStatusChange());
        }

        const bulkExportBtn = document.getElementById('bulk-export');
        if (bulkExportBtn) {
            bulkExportBtn.addEventListener('click', () => this.bulkExport());
        }
    }

    /**
     * Handle select all checkbox
     */
    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            if (checked) {
                this.selectedItems.add(checkbox.value);
            } else {
                this.selectedItems.delete(checkbox.value);
            }
        });
        this.updateBulkActionsUI();
    }

    /**
     * Handle individual item selection
     */
    handleItemSelect(checkbox) {
        if (checkbox.checked) {
            this.selectedItems.add(checkbox.value);
        } else {
            this.selectedItems.delete(checkbox.value);
        }
        this.updateSelectAllState();
        this.updateBulkActionsUI();
    }

    /**
     * Update select-all checkbox state based on individual selections
     */
    updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('select-all');
        const checkboxes = document.querySelectorAll('.item-checkbox');
        if (selectAllCheckbox && checkboxes.length > 0) {
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            const someChecked = Array.from(checkboxes).some(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;
        }
    }

    /**
     * Update bulk actions UI visibility and count
     */
    updateBulkActionsUI() {
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const selectedCount = document.getElementById('selected-count');
        
        if (bulkActionsBar) {
            if (this.selectedItems.size > 0) {
                bulkActionsBar.style.display = 'flex';
                if (selectedCount) {
                    selectedCount.textContent = `${this.selectedItems.size} item${this.selectedItems.size > 1 ? 's' : ''} selected`;
                }
            } else {
                bulkActionsBar.style.display = 'none';
            }
        }
    }

    /**
     * Bulk delete selected items
     */
    async bulkDelete() {
        if (this.selectedItems.size === 0) return;

        const confirmed = confirm(`Are you sure you want to delete ${this.selectedItems.size} ${this.itemType}? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            const itemIds = Array.from(this.selectedItems);
            
            // Delete from Firebase
            for (const id of itemIds) {
                await firebase.firestore().collection(this.itemType).doc(id).delete();
            }

            // Show success message
            this.showNotification('success', `Successfully deleted ${itemIds.length} ${this.itemType}`);
            
            // Clear selection and reload
            this.clearSelection();
            window.location.reload();
        } catch (error) {
            console.error('Bulk delete error:', error);
            this.showNotification('error', `Failed to delete items: ${error.message}`);
        }
    }

    /**
     * Bulk status change
     */
    async bulkStatusChange() {
        if (this.selectedItems.size === 0) return;

        const newStatus = prompt('Enter new status (active, pending, inactive):');
        if (!newStatus) return;

        const validStatuses = ['active', 'pending', 'inactive'];
        if (!validStatuses.includes(newStatus.toLowerCase())) {
            alert('Invalid status. Must be: active, pending, or inactive');
            return;
        }

        try {
            const itemIds = Array.from(this.selectedItems);
            
            // Update status in Firebase
            for (const id of itemIds) {
                await firebase.firestore().collection(this.itemType).doc(id).update({
                    status: newStatus.toLowerCase(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Show success message
            this.showNotification('success', `Successfully updated status for ${itemIds.length} ${this.itemType}`);
            
            // Clear selection and reload
            this.clearSelection();
            window.location.reload();
        } catch (error) {
            console.error('Bulk status change error:', error);
            this.showNotification('error', `Failed to update status: ${error.message}`);
        }
    }

    /**
     * Bulk export to CSV
     */
    async bulkExport() {
        if (this.selectedItems.size === 0) return;

        try {
            const itemIds = Array.from(this.selectedItems);
            const items = [];
            
            // Fetch selected items from Firebase
            for (const id of itemIds) {
                const doc = await firebase.firestore().collection(this.itemType).doc(id).get();
                if (doc.exists) {
                    items.push({ id: doc.id, ...doc.data() });
                }
            }

            // Convert to CSV
            const csv = this.convertToCSV(items);
            
            // Download CSV
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.itemType}-export-${Date.now()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            this.showNotification('success', `Exported ${items.length} ${this.itemType} to CSV`);
        } catch (error) {
            console.error('Bulk export error:', error);
            this.showNotification('error', `Failed to export: ${error.message}`);
        }
    }

    /**
     * Convert array of objects to CSV
     */
    convertToCSV(items) {
        if (items.length === 0) return '';

        // Get headers from first item
        const headers = Object.keys(items[0]);
        const csvRows = [];

        // Add header row
        csvRows.push(headers.join(','));

        // Add data rows
        for (const item of items) {
            const values = headers.map(header => {
                const value = item[header];
                // Handle values that might contain commas
                return typeof value === 'string' && value.includes(',') 
                    ? `"${value}"` 
                    : value;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedItems.clear();
        const checkboxes = document.querySelectorAll('.item-checkbox, #select-all');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateBulkActionsUI();
    }

    /**
     * Show notification message
     */
    showNotification(type, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#059669' : '#DC2626'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Export for use in admin pages
window.BulkOperations = BulkOperations;
