import { buildBabyjub, buildEddsa } from "circomlibjs";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Generates BabyJubJub key pair for credential signing (simulation purposes).
 * Uses a fixed private key for testing/simulation. DO NOT use in production.
 * 
 * @return {Promise<{privateKey: bigint, publicKey: {x: bigint, y: bigint}}>} 
 *         Object containing the private key and public key coordinates on the BabyJubJub curve
 */
export async function generateBabyJubJubKeys() {
    const babyJub = await buildBabyjub();

    // Use a fixed private key from environment (a BigInt)
    const zkPrivateKey = process.env.ZK_PRIVATE_KEY || "1234567890123456789012345678901234567890";
    const privateKey = BigInt(zkPrivateKey);

    // Generate the public key from the private key
    // The public key is a point on the Baby Jubjub curve (x, y coordinates)
    const publicKey = babyJub.mulPointEscalar(babyJub.Base8, privateKey);

    // Public key components - convert F1Field objects to BigInt
    const publicKeyX = babyJub.F.toObject(publicKey[0]);
    const publicKeyY = babyJub.F.toObject(publicKey[1]);

    console.log("Private Key:", privateKey.toString());
    console.log("Public Key (X):", publicKeyX.toString());
    console.log("Public Key (Y):", publicKeyY.toString());

    return { privateKey, publicKey: { x: publicKeyX, y: publicKeyY } };
}

/**
 * Signs a credential hash using EdDSA signature scheme with BabyJubJub curve.
 * Converts BigInt values to little-endian buffers for signing.
 * 
 * @param {bigint} privateKey - The private key used for signing the credential hash
 * @param {bigint} credential_hash - The Poseidon hash of the credential to be signed
 * @return {Promise<{R8: [bigint, bigint], S: bigint}>} 
 *         EdDSA signature containing R8 point coordinates and scalar S
 */
export async function signCredentialHash(privateKey: bigint, credential_hash: bigint) {
    const eddsa = await buildEddsa();

    // Convert BigInt to Buffer (32 bytes, little-endian)
    const privateKeyBuffer = Buffer.alloc(32);
    let pkBigInt = privateKey;
    for (let i = 0; i < 32; i++) {
        privateKeyBuffer[i] = Number(pkBigInt & 0xFFn);
        pkBigInt = pkBigInt >> 8n;
    }

    // Convert credential hash BigInt to Buffer (32 bytes, little-endian)
    const credentialHashBuffer = Buffer.alloc(32);
    let hashBigInt = credential_hash;
    for (let i = 0; i < 32; i++) {
        credentialHashBuffer[i] = Number(hashBigInt & 0xFFn);
        hashBigInt = hashBigInt >> 8n;
    }

    const signature = eddsa.signPedersen(privateKeyBuffer, credentialHashBuffer);

    return signature;
}