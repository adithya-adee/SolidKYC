import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { buildBabyjub, buildEddsa } from "circomlibjs";
import { Solidkyc } from "./types/solidkyc";

/**
 * Ensure issuer is initialized on-chain
 * This is called automatically on backend startup
 * - Checks if issuer account exists
 * - If not, creates it automatically (no manual script needed!)
 * - Prevents duplicate issuers by checking PDA first
 */
export async function ensureIssuerInitialized(
  programId: PublicKey,
  authorityKeypair: Keypair,
  connection: Connection,
  issuerName: string,
  zkPrivateKey: string
): Promise<void> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ISSUER INITIALIZATION CHECK");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Authority:", authorityKeypair.publicKey.toString());
  console.log("  Issuer Name:", issuerName);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Create provider and program
  const wallet = new Wallet(authorityKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idl = require("./types/solidkyc.json");
  const program = new Program<Solidkyc>(idl, provider);

  // Derive issuer PDA (deterministic - same for same authority + name)
  const [issuerPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("issuer"), authorityKeypair.publicKey.toBuffer(), Buffer.from(issuerName)],
    programId
  );

  console.log("Issuer PDA (deterministic):", issuerPDA.toString());
  console.log("Bump:", bump);
  console.log();

  // Check if issuer already exists (prevents duplicates!)
  try {
    const existingIssuer = await program.account.issuerAccount.fetch(issuerPDA);
    
    console.log("✅ ISSUER ALREADY EXISTS!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Issuer Details:");
    console.log("  - Name:", existingIssuer.name);
    console.log("  - Authority:", existingIssuer.authority.toString());
    console.log("  - Active:", existingIssuer.isActive);
    console.log("  - Registered:", new Date(existingIssuer.registeredAt.toNumber() * 1000).toISOString());
    console.log("  - Credentials Issued:", existingIssuer.credentialsIssued.toString());
    
    // Convert zkPublicKey bytes to BigInt for display
    const pkX = BigInt('0x' + Buffer.from(existingIssuer.zkPublicKeyX).toString('hex'));
    const pkY = BigInt('0x' + Buffer.from(existingIssuer.zkPublicKeyY).toString('hex'));
    console.log("  - ZK Public Key X:", pkX.toString());
    console.log("  - ZK Public Key Y:", pkY.toString());
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    return; // Issuer exists, nothing to do!
  } catch (err: any) {
    // Account doesn't exist - we need to create it
    if (err.message?.includes("Account does not exist")) {
      console.log("ℹ️  Issuer account not found - will create it now...\n");
    } else {
      throw err; // Some other error - rethrow
    }
  }

  // Generate ZK public key using EdDSA-compatible method
  // IMPORTANT: Must use eddsa.prv2pub to match signPoseidon
  console.log("Generating ZK public key (EdDSA compatible)...");
  const eddsa = await buildEddsa();
  const babyJub = await buildBabyjub();
  
  // Convert private key to buffer (same as in simulate_issuer.ts)
  const privateKey = BigInt(zkPrivateKey);
  const privateKeyBuffer = Buffer.alloc(32);
  let pk = privateKey;
  for (let i = 0; i < 32; i++) {
    privateKeyBuffer[i] = Number(pk & 0xFFn);
    pk = pk >> 8n;
  }
  
  // Use eddsa.prv2pub to get the public key (applies Blake hash internally)
  const publicKey = eddsa.prv2pub(privateKeyBuffer);
  const publicKeyXBigInt = babyJub.F.toObject(publicKey[0]);
  const publicKeyYBigInt = babyJub.F.toObject(publicKey[1]);

  console.log("  ZK Public Key X:", publicKeyXBigInt.toString());
  console.log("  ZK Public Key Y:", publicKeyYBigInt.toString());
  console.log();

  // Convert to byte arrays for Solana
  function bigIntToBytes32(value: bigint): number[] {
    const bytes = new Array(32).fill(0);
    let val = value;
    for (let i = 0; i < 32; i++) {
      bytes[i] = Number(val & 0xFFn);
      val = val >> 8n;
    }
    return bytes;
  }

  const zkPublicKeyXBytes = bigIntToBytes32(publicKeyXBigInt);
  const zkPublicKeyYBytes = bigIntToBytes32(publicKeyYBigInt);

  // Check if authority has balance (needed for transaction fees)
  console.log("Checking authority balance...");
  const balance = await connection.getBalance(authorityKeypair.publicKey);
  console.log("  Balance:", balance / 1e9, "SOL");
  
  if (balance === 0) {
    console.log("  ⚠️  Authority has no balance!");
    console.log("  Requesting airdrop (test validator only)...");
    try {
      const airdropSig = await connection.requestAirdrop(
        authorityKeypair.publicKey,
        2 * 1e9 // 2 SOL
      );
      await connection.confirmTransaction(airdropSig);
      console.log("  ✅ Airdrop successful!");
    } catch (airdropErr) {
      console.log("  ⚠️  Airdrop failed (not on test validator?)");
      console.log("  You may need to fund the authority account manually");
    }
  }
  console.log();

  // Initialize issuer on-chain
  console.log("Creating issuer account on Solana...");
  try {
    const tx = await program.methods
      .initializeIssuer(
        issuerName,
        zkPublicKeyXBytes,
        zkPublicKeyYBytes
      )
      .accountsPartial({
        issuerAccount: issuerPDA,
        authority: authorityKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authorityKeypair])
      .rpc();

    console.log("✅ ISSUER CREATED SUCCESSFULLY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Transaction:", tx);
    console.log("  Issuer PDA:", issuerPDA.toString());
    console.log("  Name:", issuerName);
    console.log("  Authority:", authorityKeypair.publicKey.toString());
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (err: any) {
    console.error("❌ FAILED TO CREATE ISSUER");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error:", err.message || err);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    throw err;
  }
}
