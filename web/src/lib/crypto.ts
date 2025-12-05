/**
 * Web Crypto API wrapper for client-side AES-256-GCM encryption/decryption.
 * Uses DEKs (Data Encryption Keys) fetched from the backend, which are wrapped
 * by Cloud KMS and never stored in plaintext on the server.
 */

const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
const KEY_LENGTH = 256; // AES-256

export interface EncryptedPayload {
  ciphertext: string; // base64-encoded ciphertext
  iv: string; // base64-encoded initialization vector
  salt: string; // base64-encoded salt (for PBKDF2, if applicable)
  authTag?: string; // GCM auth tag is included in ciphertext
}

export interface DEK {
  plaintext: string; // base64-encoded 256-bit key
  wrapped: string; // base64-encoded wrapped DEK (for storage in Firestore)
  keyName: string; // KMS key resource name
  keyVersion: string;
}

/**
 * Convert base64 string to Uint8Array.
 */
function base64ToBytes(b64: string): Uint8Array {
  const binString = atob(b64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

/**
 * Convert Uint8Array to base64 string.
 */
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('');
  return btoa(binString);
}

/**
 * Generate a random IV for AES-GCM.
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Generate a random salt.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Import a raw 256-bit key into a CryptoKey for AES-GCM.
 */
async function importKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM with a provided DEK.
 * @param plaintext - The data to encrypt (string or Uint8Array).
 * @param dek - The Data Encryption Key (base64-encoded 256-bit key).
 * @returns Encrypted payload with ciphertext, IV, and salt.
 */
export async function encrypt(
  plaintext: string | Uint8Array,
  dek: string
): Promise<EncryptedPayload> {
  const keyBytes = base64ToBytes(dek);
  const cryptoKey = await importKey(keyBytes);

  const iv = generateIV();
  const salt = generateSalt();

  const plaintextBytes =
    typeof plaintext === 'string' ? new TextEncoder().encode(plaintext) : plaintext;

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintextBytes
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
  };
}

/**
 * Decrypt data using AES-256-GCM with a provided DEK.
 * @param payload - The encrypted payload (ciphertext, IV, salt).
 * @param dek - The Data Encryption Key (base64-encoded 256-bit key).
 * @returns Decrypted plaintext as a string.
 */
export async function decrypt(
  payload: EncryptedPayload,
  dek: string
): Promise<string> {
  const keyBytes = base64ToBytes(dek);
  const cryptoKey = await importKey(keyBytes);

  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuffer);
}

/**
 * Encrypt a file (Blob or File) using AES-256-GCM.
 * @param file - The file to encrypt.
 * @param dek - The Data Encryption Key.
 * @returns Encrypted payload.
 */
export async function encryptFile(
  file: Blob | File,
  dek: string
): Promise<EncryptedPayload> {
  const arrayBuffer = await file.arrayBuffer();
  return encrypt(new Uint8Array(arrayBuffer), dek);
}

/**
 * Decrypt a file and return as a Blob.
 * @param payload - The encrypted payload.
 * @param dek - The Data Encryption Key.
 * @param mimeType - Optional MIME type for the returned Blob.
 * @returns Decrypted file as a Blob.
 */
export async function decryptFile(
  payload: EncryptedPayload,
  dek: string,
  mimeType = 'application/octet-stream'
): Promise<Blob> {
  const keyBytes = base64ToBytes(dek);
  const cryptoKey = await importKey(keyBytes);

  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );

  return new Blob([plaintextBuffer], { type: mimeType });
}

/**
 * Fetch a new DEK from the backend API. The backend generates a random 256-bit key,
 * wraps it with Cloud KMS, and returns both the plaintext DEK (for immediate use)
 * and the wrapped DEK (for storage in Firestore).
 *
 * If an ID token is provided, it is sent as Authorization: Bearer <token> to
 * satisfy the Go API's auth requirements.
 */
export async function fetchDEK(apiBaseURL: string, idToken?: string): Promise<DEK> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(`${apiBaseURL}/api/crypto/dek`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch DEK: ${response.status} ${err.message || response.statusText}`
    );
  }

  return response.json();
}
