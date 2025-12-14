/**
 * Zero-Knowledge Proof Generation Module
 * 
 * This module handles witness generation and proof generation using snarkjs.
 * It works with the age_verification circuit to prove age claims without revealing
 * the actual date of birth.
 */

// @ts-ignore - snarkjs doesn't have perfect TypeScript types
import * as snarkjs from 'snarkjs';

export interface CredentialData {
  // From backend response after issuing credential
  credential: {
    dob: number;  // Unix timestamp in seconds
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
  transaction_signature: string;
}

export interface ProofInput {
  // Private inputs
  dateOfBirth: string;
  signatureR8x: string;
  signatureR8y: string;
  signatureS: string;
  
  // Public inputs
  currentTime: string;
  expiresAt: string;
  credential_hash: string;
  issuerPublicKeyX: string;
  issuerPublicKeyY: string;
}

export interface GeneratedProof {
  proof: any;
  publicSignals: string[];
}

/**
 * Validate that the credential data has all required fields for proof generation
 */
export function validateCredentialData(data: any): data is CredentialData {
  if (!data) return false;
  
  // Check credential object
  if (!data.credential || typeof data.credential !== 'object') {
    return false;
  }
  
  if (!data.credential.dob || !data.credential.current_time || !data.credential.expires_at) {
    return false;
  }
  
  // Check credential_hash
  if (!data.credential_hash) {
    return false;
  }
  
  // Check signature
  if (!data.signature || typeof data.signature !== 'object') {
    return false;
  }
  
  if (!data.signature.R8x || !data.signature.R8y || !data.signature.S) {
    return false;
  }
  
  // Check issuer_public_key
  if (!data.issuer_public_key || typeof data.issuer_public_key !== 'object') {
    return false;
  }
  
  if (!data.issuer_public_key.x || !data.issuer_public_key.y) {
    return false;
  }
  
  return true;
}

/**
 * Prepare the input.json for the circuit from the credential data
 */
export function prepareCircuitInput(credentialData: CredentialData): ProofInput {
  // Get current time for the proof (user can also pass this if needed)
  const currentTime = Math.floor(Date.now() / 1000);
  
  return {
    // Private inputs - these will be hidden in the proof
    dateOfBirth: String(credentialData.credential.dob),
    signatureR8x: credentialData.signature.R8x,
    signatureR8y: credentialData.signature.R8y,
    signatureS: credentialData.signature.S,
    
    // Public inputs - these will be visible to verifiers
    currentTime: currentTime.toString(),
    expiresAt: String(credentialData.credential.expires_at),
    credential_hash: credentialData.credential_hash,
    issuerPublicKeyX: credentialData.issuer_public_key.x,
    issuerPublicKeyY: credentialData.issuer_public_key.y,
  };
}

/**
 * Generate a zero-knowledge proof using snarkjs
 * 
 * @param credentialData - The credential data retrieved from IndexedDB
 * @returns The generated proof and public signals
 */
export async function generateProof(
  credentialData: CredentialData
): Promise<GeneratedProof> {
  try {
    console.log('=== Starting ZK Proof Generation ===');
    console.log('Raw Credential Data:', JSON.stringify(credentialData, null, 2));
    
    // Step 1: Prepare input for the circuit
    const input = prepareCircuitInput(credentialData);
    
    console.log('=== Circuit Input (prepared for WASM) ===');
    console.log('Input object:', JSON.stringify(input, null, 2));
    console.log('Types check:');
    console.log('  dateOfBirth type:', typeof input.dateOfBirth, '- value:', input.dateOfBirth);
    console.log('  signatureR8x type:', typeof input.signatureR8x, '- value:', input.signatureR8x);
    console.log('  signatureR8y type:', typeof input.signatureR8y, '- value:', input.signatureR8y);
    console.log('  signatureS type:', typeof input.signatureS, '- value:', input.signatureS);
    console.log('  currentTime type:', typeof input.currentTime, '- value:', input.currentTime);
    console.log('  expiresAt type:', typeof input.expiresAt, '- value:', input.expiresAt);
    console.log('  credential_hash type:', typeof input.credential_hash, '- value:', input.credential_hash);
    console.log('  issuerPublicKeyX type:', typeof input.issuerPublicKeyX, '- value:', input.issuerPublicKeyX);
    console.log('  issuerPublicKeyY type:', typeof input.issuerPublicKeyY, '- value:', input.issuerPublicKeyY);
    
    // Step 2: Load WASM file and zkey from public folder
    const wasmPath = '/age_verification.wasm';
    const zkeyPath = '/circuit_0000.zkey';
    
    console.log('\n=== Generating Witness & Proof ===');
    console.log('WASM path:', wasmPath);
    console.log('ZKEY path:', zkeyPath);
    
    // Step 3: Generate witness using WASM
    // snarkjs.wtns.calculate will generate the witness from input
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );
    
    console.log('=== Proof Generated Successfully! ===');
    console.log('Public signals:', publicSignals);
    console.log('Proof:', proof);
    
    return {
      proof,
      publicSignals
    };
  } catch (error) {
    console.error('=== ZK Proof Generation ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to generate proof: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verify a proof locally (optional, mainly for testing)
 * The main verification happens on the backend
 */
export async function verifyProofLocally(
  proof: any,
  publicSignals: string[]
): Promise<boolean> {
  try {
    // Load verification key from public folder
    const vkeyResponse = await fetch('/verification_key.json');
    const vkey = await vkeyResponse.json();
    
    const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    
    return verified;
  } catch (error) {
    console.error('Error verifying proof:', error);
    return false;
  }
}

/**
 * Format proof and public signals for backend verification
 */
export function formatProofForBackend(
  proof: any,
  publicSignals: string[],
  holderPublicKey: string
) {
  return {
    proof,
    public: publicSignals,
    holderPublicKey
  };
}
