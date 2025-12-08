/**
 * Encrypted IndexedDB Storage with AES-256-GCM
 * 
 * This module provides secure storage using IndexedDB with AES-256-GCM encryption.
 * Only users with the correct private key can decrypt and access the stored data.
 */

const DB_NAME = 'SolidKYC_Vault';
const DB_VERSION = 1;
const STORE_NAME = 'encrypted_credentials';

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

/**
 * Derive encryption key from private key using PBKDF2
 */
export async function deriveKey(privateKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(privateKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

/**
 * Generate a random IV for AES-GCM
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12))
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(
  data: any,
  privateKey: string
): Promise<{
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
}> {
  const salt = generateSalt()
  const iv = generateIV()
  const key = await deriveKey(privateKey, salt)

  const encoder = new TextEncoder()
  const dataString = JSON.stringify(data)
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoder.encode(dataString)
  )

  return { encryptedData, iv, salt }
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
  encryptedData: ArrayBuffer,
  privateKey: string,
  iv: Uint8Array,
  salt: Uint8Array
): Promise<any> {
  try {
    const key = await deriveKey(privateKey, salt)
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      encryptedData
    )

    const decoder = new TextDecoder()
    const dataString = decoder.decode(decryptedData)
    return JSON.parse(dataString)
  } catch (error) {
    throw new Error('Failed to decrypt data. Invalid private key or corrupted data.')
  }
}

export interface StoredCredential {
  id?: number;
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  timestamp: number;
  type: string;
  metadata?: {
    name?: string;
    description?: string;
  };
}

/**
 * Store encrypted data in IndexedDB
 */
export async function storeEncryptedData(
  data: any,
  privateKey: string,
  type: string,
  metadata?: { name?: string; description?: string }
): Promise<number> {
  const db = await initDB();
  const { encryptedData, iv, salt } = await encryptData(data, privateKey);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const credentialData: StoredCredential = {
      encryptedData,
      iv,
      salt,
      timestamp: Date.now(),
      type,
      metadata,
    };

    const request = store.add(credentialData);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Retrieve and decrypt data from IndexedDB
 */
export async function getEncryptedData(
  id: number,
  privateKey: string
): Promise<any> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = async () => {
      const result = request.result as StoredCredential;
      if (result) {
        try {
          const decrypted = await decryptData(
            result.encryptedData,
            privateKey,
            result.iv,
            result.salt
          );
          resolve(decrypted);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Data not found'));
      }
    };

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all encrypted credentials (metadata only, no decryption)
 */
export async function getAllCredentials(): Promise<Omit<StoredCredential, 'encryptedData'>[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const credentials = request.result.map((cred: StoredCredential) => ({
        id: cred.id,
        iv: cred.iv,
        salt: cred.salt,
        timestamp: cred.timestamp,
        type: cred.type,
        metadata: cred.metadata,
      }));
      resolve(credentials);
    };

    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete a credential from IndexedDB
 */
export async function deleteCredential(id: number): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Clear all credentials from IndexedDB
 */
export async function clearAllCredentials(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Check if a private key is valid by attempting to decrypt a credential
 */
export async function validatePrivateKey(
  id: number,
  privateKey: string
): Promise<boolean> {
  try {
    await getEncryptedData(id, privateKey);
    return true;
  } catch {
    return false;
  }
}
