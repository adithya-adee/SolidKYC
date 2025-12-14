/**
 * Master Password Management
 * 
 * This module handles the master password system for the encrypted vault.
 * It stores a test encrypted value in localStorage to validate passwords.
 */

import { encryptData, decryptData } from './encryptedDB';

const MASTER_PASSWORD_KEY = 'solidkyc_master_password_test';
const TEST_DATA = 'SOLIDKYC_VAULT_UNLOCKED';

/**
 * Check if a master password has been set
 */
export function hasMasterPassword(): boolean {
  const stored = localStorage.getItem(MASTER_PASSWORD_KEY);
  return stored !== null;
}

/**
 * Create a new master password
 */
export async function createMasterPassword(password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Encrypt test data with the password
  const { encryptedData, iv, salt } = await encryptData(TEST_DATA, password);

  // Store the encrypted test data
  const testCredential = {
    encryptedData: Array.from(new Uint8Array(encryptedData)),
    iv: Array.from(iv),
    salt: Array.from(salt),
  };

  localStorage.setItem(MASTER_PASSWORD_KEY, JSON.stringify(testCredential));
}

/**
 * Validate a master password
 */
export async function validateMasterPassword(password: string): Promise<boolean> {
  const stored = localStorage.getItem(MASTER_PASSWORD_KEY);
  
  if (!stored) {
    return false;
  }

  try {
    const testCredential = JSON.parse(stored);
    
    // Convert arrays back to Uint8Arrays
    const encryptedData = new Uint8Array(testCredential.encryptedData).buffer;
    const iv = new Uint8Array(testCredential.iv);
    const salt = new Uint8Array(testCredential.salt);

    // Try to decrypt the test data
    const decrypted = await decryptData(encryptedData, password, iv, salt);
    
    return decrypted === TEST_DATA;
  } catch (error) {
    return false;
  }
}

/**
 * Reset the master password (use with caution - will require re-encryption of all data)
 */
export function resetMasterPassword(): void {
  localStorage.removeItem(MASTER_PASSWORD_KEY);
}
