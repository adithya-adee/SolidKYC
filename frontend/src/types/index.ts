/**
 * Core types for the SolidKYC application
 */

export interface Credential {
  id: string;
  type: CredentialType;
  issuer: string;
  subject: string;
  issuedAt: number;
  expiresAt?: number;
  claims: Record<string, unknown>;
  proof: {
    type: string;
    signature: string;
    publicKey: string;
  };
}

export type CredentialType = 
  | 'identity'
  | 'age_verification'
  | 'kyc'
  | 'custom';

export interface Vault {
  id: string;
  name: string;
  createdAt: number;
  credentials: number[]; // IDs of encrypted credentials in IndexedDB
  metadata?: {
    description?: string;
    tags?: string[];
  };
}

export interface ZKProof {
  proof: string;
  publicSignals: string[];
  verificationKey: string;
}

export interface User {
  publicKey: string;
  vaults: string[];
  createdAt: number;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
  encryptedDataId: number; // Reference to IndexedDB
}
