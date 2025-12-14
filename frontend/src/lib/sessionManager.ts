/**
 * Session Management with Encrypted Password Storage
 * 
 * Manages user session persistence in localStorage with encrypted password
 */

const SESSION_KEY = 'solidkyc_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export interface Session {
  encryptedPassword: string; // Encrypted password
  iv: string; // Initialization vector for decryption
  salt: string; // Salt for key derivation
  expiresAt: number; // Timestamp when session expires
}

/**
 * Encrypt password for storage using Web Crypto API
 */
async function encryptPassword(password: string): Promise<{
  encryptedPassword: string;
  iv: string;
  salt: string;
}> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from a static secret (in production, use a better approach)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode('solidkyc-session-key'), // Static key for session
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(password)
  );
  
  return {
    encryptedPassword: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  };
}

/**
 * Decrypt password from storage
 */
async function decryptPassword(
  encryptedPassword: string,
  ivStr: string,
  saltStr: string
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Convert from base64
  const encrypted = Uint8Array.from(atob(encryptedPassword), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivStr), c => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
  
  // Derive same key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode('solidkyc-session-key'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

/**
 * Create a new session with encrypted password
 */
export async function createSession(password: string): Promise<void> {
  const { encryptedPassword, iv, salt } = await encryptPassword(password);
  const expiresAt = Date.now() + SESSION_DURATION;
  
  const session: Session = {
    encryptedPassword,
    iv,
    salt,
    expiresAt,
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Get the current session if valid
 */
export function getSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    
    const session: Session = JSON.parse(stored);
    
    // Check if session has expired
    if (Date.now() >= session.expiresAt) {
      clearSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Restore password from session
 */
export async function restorePasswordFromSession(): Promise<string | null> {
  const session = getSession();
  if (!session) return null;
  
  try {
    const password = await decryptPassword(
      session.encryptedPassword,
      session.iv,
      session.salt
    );
    return password;
  } catch (error) {
    console.error('Failed to restore password from session:', error);
    clearSession();
    return null;
  }
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if a valid session exists
 */
export function hasValidSession(): boolean {
  return getSession() !== null;
}

/**
 * Extend the current session (refresh expiry time)
 */
export function extendSession(): void {
  const session = getSession();
  if (session) {
    session.expiresAt = Date.now() + SESSION_DURATION;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}
