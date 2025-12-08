const snarkjs = require('snarkjs');
import * as fs from 'fs';
import * as path from 'path';

interface ProofData {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

interface VerificationResult {
  verified: boolean;
  error?: string;
}

/**
 * Verify a Groth16 proof using snarkjs
 * @param proof - The proof object from snarkjs
 * @param publicInputs - Array of public input values
 * @returns Verification result
 */
export async function verifyProof(
  proof: ProofData,
  publicInputs: string[]
): Promise<VerificationResult> {
  try {
    // Load verification key
    const vkPath = path.join(__dirname, '../public/verification_key.json');
    
    if (!fs.existsSync(vkPath)) {
      return {
        verified: false,
        error: 'Verification key not found',
      };
    }

    const vKey = JSON.parse(fs.readFileSync(vkPath, 'utf-8'));

    // Verify the proof using snarkjs
    const verified = await snarkjs.groth16.verify(vKey, publicInputs, proof);

    return {
      verified,
      error: verified ? undefined : 'Proof verification failed',
    };
  } catch (error) {
    console.error('Error during proof verification:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification error',
    };
  }
}

/**
 * Test function to verify the existing proof.json and public.json files
 */
export async function testVerification(): Promise<void> {
  try {
    const proofPath = path.join(__dirname, '../proof.json');
    const publicPath = path.join(__dirname, '../public.json');

    const proof = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
    const publicInputs = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));

    console.log('Testing proof verification...');
    const result = await verifyProof(proof, publicInputs);
    
    console.log('Verification result:', result);
    
    if (result.verified) {
      console.log('✓ Proof verified successfully!');
    } else {
      console.log('✗ Proof verification failed:', result.error);
    }
  } catch (error) {
    console.error('Test verification error:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testVerification();
}
