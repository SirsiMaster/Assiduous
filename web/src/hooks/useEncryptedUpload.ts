import { useState, useCallback } from 'react';
import {
  storage,
  db,
  ref,
  uploadBytes,
  getDownloadURL,
  doc,
  setDoc,
  serverTimestamp,
  auth,
} from '../lib/firebase';
import { encryptFile, fetchDEK, type EncryptedPayload } from '../lib/crypto';

export interface EncryptedUploadOptions {
  /** Base URL of the Go API (e.g. https://assiduous-api-xxxx.a.run.app) */
  apiBaseURL: string;
  /** Firestore collection for document metadata (e.g. 'documents') */
  collection: string;
  /**
   * Logical path under the storage bucket where encrypted blobs are stored.
   * Example: `uploads/documents` → uploads/documents/<docId>.bin
   */
  storagePrefix: string;
}

export interface EncryptedUploadResult {
  id: string;
  downloadURL: string;
  payload: EncryptedPayload;
}

export function useEncryptedUpload(options: EncryptedUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<EncryptedUploadResult> => {
      setIsUploading(true);
      setError(null);

      try {
        // 1) Ensure we have an authenticated Firebase user and ID token
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User must be authenticated before uploading encrypted files');
        }

        const idToken = await user.getIdToken();

        // 2) Request a fresh DEK from the Go API (wrapped with Cloud KMS on the server)
        const dek = await fetchDEK(options.apiBaseURL, idToken);

        // 2) Encrypt the file client-side with Web Crypto (AES-256-GCM)
        const encrypted = await encryptFile(file, dek.plaintext);

        // 3) Upload ciphertext blob to Firebase Storage
        const id = crypto.randomUUID();
        const storagePath = `${options.storagePrefix}/${id}.bin`;
        const storageRef = ref(storage, storagePath);

        const ciphertextBytes = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));
        await uploadBytes(storageRef, ciphertextBytes, {
          contentType: 'application/octet-stream',
          customMetadata: {
            alg: 'AES-256-GCM',
          },
        });

        const downloadURL = await getDownloadURL(storageRef);

        // 4) Persist metadata (wrapped DEK + iv/salt) in Firestore
        const docRef = doc(db, options.collection, id);
        await setDoc(docRef, {
          storagePath,
          downloadURL,
          encryption: {
            algorithm: 'AES-256-GCM',
            wrappedDek: dek.wrapped,
            keyName: dek.keyName,
            keyVersion: dek.keyVersion,
            iv: encrypted.iv,
            salt: encrypted.salt,
          },
          originalFilename: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return { id, downloadURL, payload: encrypted };
      } catch (e: any) {
        const message = e?.message || 'Failed to upload file';
        console.error('[useEncryptedUpload] error', e);
        setError(message);
        throw e;
      } finally {
        setIsUploading(false);
      }
    },
    [options.apiBaseURL, options.collection, options.storagePrefix],
  );

  return { upload, isUploading, error };
}
