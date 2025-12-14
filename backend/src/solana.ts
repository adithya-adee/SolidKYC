import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import * as dotenv from "dotenv";
import { Solidkyc } from "./types/solidkyc";
import IDL from "./types/solidkyc.json";

dotenv.config();

/**
 * Configuration for Solana connection and program interaction
 */
export interface SolanaConfig {
  connection: Connection;
  provider: AnchorProvider;
  program: any; // Using any to avoid IDL type complexity
  authorityKeypair: Keypair;
  programId: PublicKey;
  issuerName: string;
}

/**
 * Initialize Solana connection and Anchor program
 * Reads configuration from environment variables
 * 
 * @returns {SolanaConfig} Configured Solana connection, program, and authority keypair
 */
export function initializeSolana(): SolanaConfig {
  // Load environment variables
  const rpcUrl = process.env.SOLANA_RPC_URL || "http://localhost:8899";
  const programIdStr = process.env.PROGRAM_ID;
  const authorityPrivateKey = process.env.AUTHORITY_PRIVATE_KEY;
  const issuerName = process.env.ISSUER_NAME || "MVP-Issuer";

  if (!programIdStr) {
    throw new Error("PROGRAM_ID not found in environment variables");
  }

  if (!authorityPrivateKey) {
    throw new Error("AUTHORITY_PRIVATE_KEY not found in environment variables");
  }

  // Parse authority keypair from JSON array
  const authoritySecretKey = JSON.parse(authorityPrivateKey);
  const authorityKeypair = Keypair.fromSecretKey(Uint8Array.from(authoritySecretKey));

  // Create connection
  const connection = new Connection(rpcUrl, "confirmed");

  // Create wallet
  const wallet = new Wallet(authorityKeypair);

  // Create provider
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Create program ID
  const programId = new PublicKey(programIdStr);

  // Create program instance with proper typing
  const program = new Program<Solidkyc>(IDL as Solidkyc, provider);

  console.log("Solana initialized:");
  console.log("- RPC URL:", rpcUrl);
  console.log("- Program ID:", programId.toString());
  console.log("- Authority:", authorityKeypair.publicKey.toString());
  console.log("- Issuer Name:", issuerName);

  return {
    connection,
    provider,
    program,
    authorityKeypair,
    programId,
    issuerName,
  };
}

/**
 * Convert BigInt to 32-byte array (little-endian)
 *
 * @param {bigint} value - BigInt value to convert
 * @returns {number[]} 32-byte array representation
 */
export function bigIntToBytes32(value: bigint): number[] {
  const bytes = new Array(32).fill(0);
  let val = value;
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(val & 0xFFn);
    val = val >> 8n;
  }
  return bytes;
}

/**
 * Convert 32-byte array (little-endian) back to BigInt
 *
 * @param {number[] | Uint8Array} bytes - 32-byte array in little-endian format
 * @returns {bigint} The BigInt representation
 */
export function bytes32ToBigInt(bytes: number[] | Uint8Array): bigint {
  let result = 0n;
  for (let i = 31; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Derive the PDA for an issuer account
 * 
 * @param {PublicKey} programId - The Solana program ID
 * @param {PublicKey} authority - The authority public key
 * @param {string} issuerName - The issuer name
 * @returns {Promise<[PublicKey, number]>} The PDA and bump seed
 */
export async function getIssuerPDA(
  programId: PublicKey,
  authority: PublicKey,
  issuerName: string
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("issuer"), authority.toBuffer(), Buffer.from(issuerName)],
    programId
  );
}

/**
 * Derive the PDA for a credential account
 * 
 * @param {PublicKey} programId - The Solana program ID
 * @param {PublicKey} holder - The holder's public key
 * @param {PublicKey} issuer - The issuer account PDA
 * @returns {Promise<[PublicKey, number]>} The PDA and bump seed
 */
export async function getCredentialPDA(
  programId: PublicKey,
  holder: PublicKey,
  issuer: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("credential"), holder.toBuffer(), issuer.toBuffer()],
    programId
  );
}
