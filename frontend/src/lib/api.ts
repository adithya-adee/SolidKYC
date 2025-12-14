/**
 * Backend API Client
 * 
 * This module handles communication with the SolidKYC backend.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface IssueCredentialRequest {
  dateOfBirth: number; // Unix timestamp
  holderPublicKey: string;
}

export interface IssueCredentialResponse {
  success: boolean;
  transaction_signature: string;
  credential: {
    dob: number;
    current_time: number;
    expires_at: number;
  };
  credential_hash: string;
  signature: {
    R8x: string;
    R8y: string;
    S: string;
  };
  issuer_public_key: {
    x: string;
    y: string;
  };
  holder: string;
  credential_pda: string;
}

/**
 * Issue a credential to the backend with real wallet public key
 */
export async function issueCredential(
  dateOfBirth: number,
  holderPublicKey: string
): Promise<IssueCredentialResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/issue_credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateOfBirth,
        holderPublicKey,
      } as IssueCredentialRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to issue credential');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error issuing credential:', error);
    throw error;
  }
}

export interface VerifyProofRequest {
  proof: any;
  public: string[];
  holderPublicKey: string;
}

export interface VerifyProofResponse {
  verified: boolean;
  error?: string;
  credential?: {
    holder: string;
    issuer: string;
    credentialHash: string;
    issuedAt: string;
    expiresAt: string;
    isRevoked: boolean;
  };
  issuer?: {
    authority: string;
    name: string;
    isActive: boolean;
    publicKeyX: string;
    publicKeyY: string;
  };
  message?: string;
}

/**
 * Verify a zero-knowledge proof
 */
export async function verifyProof(
  proof: any,
  publicSignals: string[],
  holderPublicKey: string
): Promise<VerifyProofResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proof,
        public: publicSignals,
        holderPublicKey,
      } as VerifyProofRequest),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying proof:', error);
    throw error;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: number; solana: string }> {
  const response = await fetch(`${BACKEND_URL}/health`);
  return response.json();
}
