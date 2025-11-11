# Assiduous Components for Sirsi Library

This document tracks working CSS components from Assiduous that should be added to the Sirsi component library.

**Source**: Assiduous Real Estate Platform  
**Tag**: `assiduous`

---

## Buttons - Primary/Secondary/Action

### Primary Button (Add/Save)
**Origin**: `agent/clients.html` - Add Client & Save Client buttons  
**Use Case**: Primary actions, form submissions, create operations

```css
/* Primary Action Button - Assiduous */
button.btn-primary,
button.add-btn,
button.btn-save {
    padding: 12px 24px !important;
    background: #60A3D9 !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.2s !important;
    opacity: 1 !important;
    visibility: visible !important;
    display: inline-block !important;
}

button.btn-primary:hover,
button.add-btn:hover,
button.btn-save:hover {
    background: #4a8cc7 !important;
    transform: translateY(-1px) !important;
}
```

**HTML Usage:**
```html
<button class="add-btn" onclick="openModal()">+ Add Client</button>
<button class="btn-save" onclick="save()">Save Client</button>
```

---

### Secondary Button (Cancel)
**Origin**: `agent/clients.html` - Cancel button in modal  
**Use Case**: Secondary actions, cancel operations

```css
/* Secondary Button - Assiduous */
button.btn-secondary,
button.btn-cancel {
    padding: 10px 24px !important;
    background: #ffffff !important;
    color: #1f2937 !important;
    border: 1px solid #d1d5db !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    opacity: 1 !important;
    visibility: visible !important;
    display: inline-block !important;
}

button.btn-secondary:hover,
button.btn-cancel:hover {
    background: #f9fafb !important;
}
```

**HTML Usage:**
```html
<button class="btn-cancel" onclick="closeModal()">Cancel</button>
```

---

### Action Buttons (Edit/Delete in Tables)
**Origin**: `agent/clients.html` - Edit and Delete row actions  
**Use Case**: Row-level actions in data tables

```css
/* Action Button - Assiduous */
button.action-btn {
    padding: 6px 12px !important;
    margin-right: 8px !important;
    border: 1px solid var(--border) !important;
    background: var(--white) !important;
    border-radius: var(--radius) !important;
    cursor: pointer !important;
    font-size: 12px !important;
    transition: all 0.2s !important;
    opacity: 1 !important;
    visibility: visible !important;
}

button.action-btn:hover {
    background: var(--gray-50) !important;
}

/* Delete variant - Assiduous */
button.action-btn.delete {
    color: var(--danger) !important;
    border-color: var(--danger) !important;
}

button.action-btn.delete:hover {
    background: var(--danger) !important;
    color: var(--white) !important;
}
```

**HTML Usage:**
```html
<button class="action-btn" onclick="edit('id')">Edit</button>
<button class="action-btn delete" onclick="remove('id')">Delete</button>
```

---

## Modal Components

### Modal Container
**Origin**: `agent/clients.html` - Add/Edit Client modal  
**Use Case**: Overlay modals for forms and content

```css
/* Modal - Assiduous */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
    align-items: center;
    justify-content: center;
}

.modal.show {
    display: flex !important;
}

.modal-content {
    background: var(--white);
    border-radius: var(--radius-md);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-title {
    font-size: 20px;
    font-weight: 600;
}

.modal-close {
    background: none !important;
    border: none !important;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary);
}

.modal-body {
    padding: var(--space-lg);
}

.modal-footer {
    padding: var(--space-lg);
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
}
```

**HTML Usage:**
```html
<div id="myModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">Modal Title</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <!-- Content here -->
        </div>
        <div class="modal-footer">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-save">Save</button>
        </div>
    </div>
</div>
```

**JavaScript:**
```javascript
function openModal() {
    document.getElementById('myModal').classList.add('show');
}

function closeModal() {
    document.getElementById('myModal').classList.remove('show');
}

// Close on background click
document.getElementById('myModal').addEventListener('click', (e) => {
    if (e.target.id === 'myModal') closeModal();
});
```

---

## Form Components

### Form Groups and Inputs
**Origin**: `agent/clients.html` - Client form fields  
**Use Case**: Consistent form styling

```css
/* Form Components - Assiduous */
.form-group {
    margin-bottom: var(--space-md);
}

.form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: var(--space-xs);
    color: var(--dark);
}

.form-input,
.form-select,
.form-textarea {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 14px;
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
}
```

**HTML Usage:**
```html
<div class="form-group">
    <label class="form-label">First Name *</label>
    <input type="text" class="form-input" id="firstName" required>
</div>

<div class="form-group">
    <label class="form-label">Notes</label>
    <textarea class="form-textarea" id="notes"></textarea>
</div>
```

---

## Status Badges

### Status Indicators
**Origin**: `agent/clients.html` - Client status badges  
**Use Case**: Visual status indicators in tables

```css
/* Status Badges - Assiduous */
.status-badge {
    padding: 4px 12px;
    border-radius: var(--radius);
    font-size: 12px;
    font-weight: 600;
}

.status-active {
    background: rgba(5, 150, 105, 0.1);
    color: var(--success);
}

.status-inactive {
    background: rgba(107, 114, 128, 0.1);
    color: var(--text-secondary);
}

.status-pending {
    background: rgba(255, 217, 64, 0.1);
    color: var(--warning);
}
```

**HTML Usage:**
```html
<span class="status-badge status-active">Active</span>
<span class="status-badge status-inactive">Inactive</span>
<span class="status-badge status-pending">Pending</span>
```

---

## Implementation Notes

### CSS Load Order
**CRITICAL**: Assiduous CSS must load AFTER Sirsi CSS for proper overrides.

```html
<!-- Correct Order -->
<link rel="stylesheet" href="sirsi-ui.css">
<link rel="stylesheet" href="assiduous.css">

<!-- Assiduous CSS wins all conflicts -->
```

### Using !important
These components use `!important` flags to ensure they override any conflicting styles from base libraries. This is intentional and necessary for the Assiduous design system to work correctly.

### Browser Compatibility
- Tested in Chrome, Safari, Firefox
- Requires CSS custom properties (--variables)
- Modal uses flexbox for centering

---

## Next Steps for Sirsi Library

1. **Create assiduous.css variant** in Sirsi library
2. **Tag all components** with `data-origin="assiduous"`
3. **Add to component registry** with usage examples
4. **Version control** - tag as v1.0.0-assiduous
5. **Document** in Sirsi library README

---

**Last Updated**: 2025-11-11  
**Tested In**: Assiduous Agent Portal (https://assiduous-prod.web.app)  
**Status**: Production-ready ✅
