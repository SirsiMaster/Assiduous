import React, { useState } from 'react';
import { useEncryptedUpload } from '../hooks/useEncryptedUpload';

interface Props {
  apiBaseURL: string;
  collection: string;
  storagePrefix: string;
}

const DocumentUploader: React.FC<Props> = ({ apiBaseURL, collection, storagePrefix }) => {
  const { upload, isUploading, error } = useEncryptedUpload({
    apiBaseURL,
    collection,
    storagePrefix,
  });

  const [file, setFile] = useState<File | null>(null);
  const [lastUploadId, setLastUploadId] = useState<string | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      const result = await upload(file);
      setLastUploadId(result.id);
      setDownloadURL(result.downloadURL);
    } catch (e) {
      // error is already captured in hook state
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <h2 className="font-semibold text-slate-100">Encrypted Document Upload</h2>
      <p className="text-slate-300 text-xs">
        Files uploaded here are encrypted client-side with AES-256-GCM using a DEK issued by the Go
        API and wrapped with Cloud KMS. Ciphertext is stored in Firebase Storage; encryption
        metadata and wrapped DEKs live in Firestore.
      </p>

      <div className="flex items-center gap-3">
        <input
          type="file"
          className="text-xs text-slate-200 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-brand-accent/10 file:text-brand-accent hover:file:bg-brand-accent/20"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <button
          type="button"
          disabled={!file || isUploading}
          onClick={handleUpload}
          className="px-3 py-1.5 rounded-md bg-brand-accent text-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Encrypting…' : 'Upload Encrypted'}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {lastUploadId && (
        <div className="mt-2 rounded-md border border-slate-700 bg-slate-900/60 p-2 text-xs text-slate-200 space-y-1">
          <div>
            <span className="font-mono text-slate-400">documentId:</span> {lastUploadId}
          </div>
          {downloadURL && (
            <div className="truncate">
              <span className="font-mono text-slate-400">downloadURL:</span>{' '}
              <a
                href={downloadURL}
                target="_blank"
                rel="noreferrer"
                className="text-brand-accent hover:underline"
              >
                {downloadURL}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
