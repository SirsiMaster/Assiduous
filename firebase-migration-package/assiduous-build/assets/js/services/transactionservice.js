/**
 * Transaction Service - Transaction and document management
 * Day 5: Transaction pipeline, commission tracking, document uploads
 */

const API_BASE = 'https://us-central1-assiduous-prod.cloudfunctions.net/app/api/v1';

/**
 * Get authentication token
 */
async function getAuthToken() {
  try {
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Not authenticated');
    }
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Auth token error:', error);
    throw error;
  }
}

/**
 * Create a new transaction
 * @param {Object} transactionData - Transaction details
 */
export async function createTransaction(transactionData) {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create transaction');
    }

    return await res.json();
  } catch (error) {
    console.error('Create transaction error:', error);
    throw error;
  }
}

/**
 * Get transaction by ID
 * @param {string} transactionId - Transaction ID
 */
export async function getTransaction(transactionId) {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to get transaction');
    }

    return await res.json();
  } catch (error) {
    console.error('Get transaction error:', error);
    throw error;
  }
}

/**
 * List transactions with optional filters
 * @param {Object} filters - Query filters
 */
export async function listTransactions(filters = {}) {
  try {
    const token = await getAuthToken();
    const params = new URLSearchParams(filters).toString();
    const url = `${API_BASE}/transactions${params ? `?${params}` : ''}`;
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to list transactions');
    }

    const { data } = await res.json();
    return data;
  } catch (error) {
    console.error('List transactions error:', error);
    throw error;
  }
}

/**
 * Update transaction
 * @param {string} transactionId - Transaction ID
 * @param {Object} updates - Fields to update
 */
export async function updateTransaction(transactionId, updates) {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/transactions/${transactionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update transaction');
    }

    return await res.json();
  } catch (error) {
    console.error('Update transaction error:', error);
    throw error;
  }
}

/**
 * Delete transaction (admin only)
 * @param {string} transactionId - Transaction ID
 */
export async function deleteTransaction(transactionId) {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to delete transaction');
    }

    return await res.json();
  } catch (error) {
    console.error('Delete transaction error:', error);
    throw error;
  }
}

/**
 * Get signed upload URL for transaction document
 * @param {string} transactionId - Transaction ID
 * @param {File} file - File to upload
 * @param {string} type - Document type (contract, disclosure, etc.)
 */
export async function getDocumentUploadUrl(transactionId, file, type = 'general') {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/transactions/${transactionId}/documents:signedUpload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        type
      })
    });

    if (!res.ok) {
      throw new Error('Failed to get upload URL');
    }

    return await res.json();
  } catch (error) {
    console.error('Get upload URL error:', error);
    throw error;
  }
}

/**
 * Upload document to signed URL
 * @param {string} uploadUrl - Signed upload URL
 * @param {File} file - File to upload
 */
export async function uploadDocument(uploadUrl, file) {
  try {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!res.ok) {
      throw new Error('Failed to upload document');
    }

    return true;
  } catch (error) {
    console.error('Upload document error:', error);
    throw error;
  }
}

/**
 * Save document metadata after upload
 * @param {string} transactionId - Transaction ID
 * @param {Object} metadata - Document metadata
 */
export async function saveDocumentMetadata(transactionId, metadata) {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/transactions/${transactionId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!res.ok) {
      throw new Error('Failed to save document metadata');
    }

    return await res.json();
  } catch (error) {
    console.error('Save document metadata error:', error);
    throw error;
  }
}

/**
 * Complete document upload workflow
 * @param {string} transactionId - Transaction ID
 * @param {File} file - File to upload
 * @param {string} type - Document type
 */
export async function uploadTransactionDocument(transactionId, file, type = 'general') {
  try {
    // Step 1: Get signed upload URL
    const { uploadUrl, storagePath } = await getDocumentUploadUrl(transactionId, file, type);
    
    // Step 2: Upload file to Storage
    await uploadDocument(uploadUrl, file);
    
    // Step 3: Save metadata to Firestore
    const metadata = {
      fileName: file.name,
      storagePath,
      type,
      size: file.size
    };
    
    const result = await saveDocumentMetadata(transactionId, metadata);
    
    console.log('Document uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('Upload transaction document error:', error);
    throw error;
  }
}

/**
 * List transaction documents
 * @param {string} transactionId - Transaction ID
 */
export async function listDocuments(transactionId) {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/transactions/${transactionId}/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to list documents');
    }

    const { data } = await res.json();
    return data;
  } catch (error) {
    console.error('List documents error:', error);
    throw error;
  }
}

/**
 * Delete transaction document
 * @param {string} transactionId - Transaction ID
 * @param {string} documentId - Document ID
 */
export async function deleteDocument(transactionId, documentId) {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/transactions/${transactionId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to delete document');
    }

    return await res.json();
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
}

/**
 * Calculate commission amount
 * @param {number} agreedPrice - Agreed property price
 * @param {number} commissionRate - Commission rate (default 0.03 = 3%)
 */
export function calculateCommission(agreedPrice, commissionRate = 0.03) {
  return Math.round(agreedPrice * commissionRate);
}

/**
 * Format transaction status for display
 * @param {string} status - Transaction status
 */
export function formatStatus(status) {
  const statusMap = {
    'offer': 'Offer Submitted',
    'pending': 'Pending',
    'inspection': 'Under Inspection',
    'appraisal': 'Appraisal',
    'financing': 'Financing',
    'closing': 'Closing',
    'closed': 'Closed',
    'canceled': 'Canceled'
  };
  
  return statusMap[status] || status;
}
