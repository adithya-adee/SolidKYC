import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import * as dotenv from "dotenv";
import { buildBabyjub } from "circomlibjs";
import { Solidkyc } from "./types/solidkyc";

dotenv.config();

/**
 * Script to initialize the issuer account on Solana
 * This should be run once before testing the backend
 */
async function initializeIssuer() {
  console.log("=== Initializing Issuer Account ===\n");

  // Load configuration
  const rpcUrl = process.env.SOLANA_RPC_URL || "http://localhost:8899";
  const programIdStr = process.env.PROGRAM_ID;
  const authorityPrivateKey = process.env.AUTHORITY_PRIVATE_KEY;
  const issuerName = process.env.ISSUER_NAME || "MVP-Issuer";
  const zkPrivateKey = process.env.ZK_PRIVATE_KEY || "1234567890123456789012345678901234567890";

  if (!programIdStr || !authorityPrivateKey) {
    throw new Error("Missing required environment variables");
  }

  // Parse authority keypair
  const authoritySecretKey = JSON.parse(authorityPrivateKey);
  const authorityKeypair = Keypair.fromSecretKey(Uint8Array.from(authoritySecretKey));

  console.log("Configuration:");
  console.log("- RPC URL:", rpcUrl);
  console.log("- Program ID:", programIdStr);
  console.log("- Authority:", authorityKeypair.publicKey.toString());
  console.log("- Issuer Name:", issuerName);
  console.log();

  // Generate ZK public key from private key
  const babyJub = await buildBabyjub();
  const privateKey = BigInt(zkPrivateKey);
  const publicKey = babyJub.mulPointEscalar(babyJub.Base8, privateKey);
  const publicKeyX = publicKey[0];
  const publicKeyY = publicKey[1];

  console.log("ZK Keys:");
  console.log("- Public Key X:", publicKeyX.toString());
  console.log("- Public Key Y:", publicKeyY.toString());
  console.log();

  // Convert to byte arrays (little-endian, 32 bytes)
  function bigIntToBytes32(value: bigint): number[] {
    const bytes = new Array(32).fill(0);
    let val = value;
    for (let i = 0; i < 32; i++) {
      bytes[i] = Number(val & 0xFFn);
      val = val >> 8n;
    }
    return bytes;
  }

  // Convert public key coordinates to BigInt
  // circomlibjs returns F1Field objects, use F.toObject() to get BigInt
  const publicKeyXBigInt = babyJub.F.toObject(publicKeyX);
  const publicKeyYBigInt = babyJub.F.toObject(publicKeyY);

  const zkPublicKeyXBytes = bigIntToBytes32(publicKeyXBigInt);
  const zkPublicKeyYBytes = bigIntToBytes32(publicKeyYBigInt);

  // Create connection and provider
  const connection = new Connection(rpcUrl, "confirmed");
  const wallet = new Wallet(authorityKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

  // Load program
  const programId = new PublicKey(programIdStr);
  const idl = require("./types/solidkyc.json");
  const program = new Program<Solidkyc>(idl, provider);

  // Derive issuer PDA
  const [issuerPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("issuer"), authorityKeypair.publicKey.toBuffer(), Buffer.from(issuerName)],
    programId
  );

  console.log("Issuer PDA:", issuerPDA.toString());
  console.log("Bump:", bump);
  console.log();

  // Check if issuer already exists
  try {
    const existingIssuer: any = await program.account.issuerAccount.fetch(issuerPDA);
    console.log("⚠️  Issuer already exists!");
    console.log("Existing issuer details:");
    console.log("- Authority:", existingIssuer.authority.toString());
    console.log("- Name:", existingIssuer.name);
    console.log("- Is Active:", existingIssuer.isActive);
    console.log("- Credentials Issued:", existingIssuer.credentialsIssued.toString());
    console.log("\nSkipping initialization...");
    return;
  } catch (err) {
    // Issuer doesn't exist, proceed with initialization
    console.log("Issuer doesn't exist. Proceeding with initialization...\n");
  }

  // Request airdrop for transaction fees
  console.log("Requesting airdrop for transaction fees...");
  try {
    const airdropSignature = await connection.requestAirdrop(
      authorityKeypair.publicKey,
      2 * 1e9 // 2 SOL
    );

    const latestBlockhash = await provider.connection.getLatestBlockhash();

    await connection.confirmTransaction(airdropSignature);
    console.log("✓ Airdrop successful\n");
  } catch (err) {
    console.log("⚠️  Airdrop failed (may already have funds):", (err as Error).message);
  }

  // Initialize issuer
  console.log("Sending transaction to initialize issuer...");
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

    console.log("✓ Transaction successful!");
    console.log("Transaction signature:", tx);
    console.log();

    // Fetch and display the created account
    const issuerAccount: any = await program.account.issuerAccount.fetch(issuerPDA);
    console.log("=== Issuer Account Created ===");
    console.log("- Authority:", issuerAccount.authority.toString());
    console.log("- Name:", issuerAccount.name);
    console.log("- Is Active:", issuerAccount.isActive);
    console.log("- Registered At:", new Date(issuerAccount.registeredAt.toNumber() * 1000).toISOString());
    console.log("- Credentials Issued:", issuerAccount.credentialsIssued.toString());
    console.log("\n✅ Issuer initialization complete!");
  } catch (err) {
    console.error("❌ Failed to initialize issuer:", err);
    throw err;
  }
}

// Run the script
initializeIssuer()
  .then(() => {
    console.log("\n✅ All done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error:", err);
    process.exit(1);
  });
