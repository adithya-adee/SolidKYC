import { buildEddsa } from "circomlibjs";

/**
 * Verify an EdDSA signature on a credential hash
 * 
 * @param {bigint} credentialHash - The credential hash that was signed
 * @param {bigint} publicKeyX - Issuer's public key X coordinate
 * @param {bigint} publicKeyY - Issuer's public key Y coordinate
 * @param {bigint} R8x - Signature R8 X coordinate
 * @param {bigint} R8y - Signature R8 Y coordinate
 * @param {bigint} S - Signature S value
 * @returns {Promise<boolean>} True if signature is valid
 */
export async function verifyEdDSASignature(
  credentialHash: bigint,
  publicKeyX: bigint,
  publicKeyY: bigint,
  R8x: bigint,
  R8y: bigint,
  S: bigint
): Promise<boolean> {
  try {
    const eddsa = await buildEddsa();

    // Convert credential hash to Buffer (32 bytes, little-endian)
    const credentialHashBuffer = Buffer.alloc(32);
    let hashBigInt = credentialHash;
    for (let i = 0; i < 32; i++) {
      credentialHashBuffer[i] = Number(hashBigInt & 0xFFn);
      hashBigInt = hashBigInt >> 8n;
    }

    // Construct signature object (using any to bypass strict typing)
    const signature: any = {
      R8: [R8x, R8y],
      S: S,
    };

    // Construct public key
    const publicKey: any = [publicKeyX, publicKeyY];

    // Verify the signature
    const isValid = eddsa.verifyPoseidon(
      credentialHashBuffer,
      signature,
      publicKey
    );

    return isValid;
  } catch (error) {
    console.error("EdDSA signature verification error:", error);
    return false;
  }
}
