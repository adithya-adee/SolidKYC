import { buildBabyjub, buildEddsa } from "circomlibjs";
import * as dotenv from "dotenv";

dotenv.config();

// Shared private key buffer - generated once and reused
let privateKeyBuffer: Buffer | null = null;

function getPrivateKeyBuffer(): Buffer {
    if (privateKeyBuffer) return privateKeyBuffer;
    
    const zkPrivateKey = process.env.ZK_PRIVATE_KEY || "1234567890123456789012345678901234567890";
    const privateKey = BigInt(zkPrivateKey);
    
    // Convert BigInt to Buffer (32 bytes, little-endian)
    privateKeyBuffer = Buffer.alloc(32);
    let pk = privateKey;
    for (let i = 0; i < 32; i++) {
        privateKeyBuffer[i] = Number(pk & 0xFFn);
        pk = pk >> 8n;
    }
    
    return privateKeyBuffer;
}

/**
 * Generates BabyJubJub key pair for credential signing.
 * IMPORTANT: Uses eddsa.prv2pub which applies Blake hash to derive public key.
 * This MUST match how signPoseidon derives the signing key.
 * 
 * @return {Promise<{privateKey: Buffer, publicKey: {x: bigint, y: bigint}}>} 
 *         Object containing the private key buffer and public key coordinates
 */
export async function generateBabyJubJubKeys() {
    const eddsa = await buildEddsa();
    const babyJub = await buildBabyjub();
    
    const pkBuffer = getPrivateKeyBuffer();
    
    // Use eddsa.prv2pub to get the public key
    // This applies Blake hash internally - same as signPoseidon uses
    const publicKey = eddsa.prv2pub(pkBuffer);
    
    // Public key components - convert F1Field objects to BigInt
    const publicKeyX = babyJub.F.toObject(publicKey[0]);
    const publicKeyY = babyJub.F.toObject(publicKey[1]);

    console.log("Private Key Buffer (first 8 bytes):", Array.from(pkBuffer.slice(0, 8)));
    console.log("Public Key (X):", publicKeyX.toString());
    console.log("Public Key (Y):", publicKeyY.toString());

    return { 
        privateKey: pkBuffer, 
        publicKey: { x: publicKeyX, y: publicKeyY } 
    };
}

/**
 * Signs a credential hash using EdDSA Poseidon signature scheme.
 * Uses signPoseidon which is compatible with EdDSAPoseidonVerifier circuit.
 * 
 * @param {Buffer} privateKeyBuffer - The private key buffer for signing
 * @param {any} credential_hash_F - The credential hash in F (field) format from Poseidon
 * @return {Promise<{R8: [any, any], S: bigint}>} EdDSA signature
 */
export async function signCredentialHash(privateKeyBuffer: Buffer, credential_hash_F: any) {
    const eddsa = await buildEddsa();
    
    // signPoseidon expects the message as F element (field format from poseidon)
    const signature = eddsa.signPoseidon(privateKeyBuffer, credential_hash_F);

    return signature;
}