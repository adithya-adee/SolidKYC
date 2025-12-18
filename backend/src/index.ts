import express, { json, Request, Response } from "express";
import cors from "cors";
import { verifyProof } from "./verifier";
import { generateBabyJubJubKeys, signCredentialHash } from "./simulate_issuer";
import { buildPoseidon, buildEddsa, buildBabyjub } from "circomlibjs";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  initializeSolana,
  bigIntToBytes32,
  bytes32ToBigInt,
  getIssuerPDA,
  getCredentialPDA,
  SolanaConfig,
} from "./solana";
import { ensureIssuerInitialized } from "./ensureIssuer";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Solana configuration and ensure issuer exists
let solanaConfig: SolanaConfig | null = null;
let issuerInitialized = false;

async function initializeSystem() {
  try {
    console.log("\n=== Initializing SolidKYC Backend ===\n");
    
    // Step 1: Initialize Solana connection
    solanaConfig = initializeSolana();
    
    // Step 2: Ensure issuer account exists (auto-initialize if not)
    const zkPrivateKey = process.env.ZK_PRIVATE_KEY || "1234567890123456789012345678901234567890";
    
    await ensureIssuerInitialized(
      solanaConfig.programId,
      solanaConfig.authorityKeypair,
      solanaConfig.connection,
      solanaConfig.issuerName,
      zkPrivateKey
    );
    
    issuerInitialized = true;
    console.log("\n✅ System initialization complete!\n");
  } catch (error) {
    console.error("\n❌ System initialization failed:", error);
    console.error("Server will start but /issue_credentials endpoint may not work properly");
    issuerInitialized = false;
  }
}

// Initialize system before starting server
initializeSystem().then(() => {
  // Start server after initialization
  app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
    console.log(`Verify endpoint available at http://0.0.0.0:${PORT}/verify`);
  });
});

// CORS configuration - allow requests from frontend and simulation DEX
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: Math.floor(Date.now() / 1000),
    solana: solanaConfig ? "connected" : "disconnected",
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("SolidKYC Backend - ZK Proof Verification Service");
});

app.post("/issue_credentials", async (req: Request, res: Response) => {
  try {
    const { dateOfBirth, holderPublicKey } = req.body;

    // Validate dateOfBirth
    if (!dateOfBirth) {
      return res.status(400).json({
        error: "Missing required field: dateOfBirth",
      });
    }

    if (isNaN(Number(dateOfBirth)) || Number(dateOfBirth) <= 0) {
      return res.status(400).json({
        error: "Invalid dateOfBirth: must be a positive number",
      });
    }

    // Validate holderPublicKey
    if (!holderPublicKey) {
      return res.status(400).json({
        error: "Missing required field: holderPublicKey",
      });
    }

    // Validate Solana configuration
    if (!solanaConfig) {
      return res.status(500).json({
        error: "Solana not configured. Please check environment variables.",
      });
    }

    // Check if issuer is initialized
    if (!issuerInitialized) {
      return res.status(503).json({
        error: "Issuer not initialized",
        message: "The issuer account is still being initialized. Please wait a moment and try again.",
      });
    }

    // Parse holder public key
    let holderPubkey: PublicKey;
    try {
      holderPubkey = new PublicKey(holderPublicKey);
    } catch (err) {
      return res.status(400).json({
        error: "Invalid holderPublicKey: must be a valid Solana public key",
      });
    }

    // Unix timestamp in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const expiresAt = currentTime + 3600; // 1 hour from now (increased from 10 minutes for testing)

    // Build credential
    const credential = {
      dateOfBirth: dateOfBirth,
      currentTime: currentTime,
      expiresAt: expiresAt,
    };

    // Generate credential hash using Poseidon
    const poseidon = await buildPoseidon();
    const inputs = [dateOfBirth];
    const hash_F = poseidon(inputs);  // Keep as F (field) format for signing
    const credential_hash = poseidon.F.toObject(hash_F); // Get as BigInt for storage

    console.log("Credential Hash:", credential_hash.toString());

    // Derive issuer PDA first to fetch the issuer account
    const [issuerPDA] = await getIssuerPDA(
      solanaConfig.programId,
      solanaConfig.authorityKeypair.publicKey,
      solanaConfig.issuerName
    );

    // Fetch the issuer account to get the STORED public keys
    let issuerAccount: any;
    try {
      issuerAccount = await solanaConfig.program.account.issuerAccount.fetch(
        issuerPDA
      );
    } catch (err) {
      return res.status(404).json({
        error: "Issuer account not found",
        message: "Please initialize the issuer first by running: npx ts-node src/initialize_issuer.ts",
      });
    }

    // Convert the stored public key bytes to BigInt
    // IMPORTANT: The bytes are stored little-endian, so we need to reverse them!
    const pkXBytes = Buffer.from(issuerAccount.zkPublicKeyX);
    const pkYBytes = Buffer.from(issuerAccount.zkPublicKeyY);
    
    // Reverse for correct endianness and convert to hex
    const issuerPubKeyX = BigInt('0x' + Buffer.from(pkXBytes).reverse().toString('hex'));
    const issuerPubKeyY = BigInt('0x' + Buffer.from(pkYBytes).reverse().toString('hex'));

    console.log("Using issuer public key from Solana:");
    console.log("  X:", issuerPubKeyX.toString());
    console.log("  Y:", issuerPubKeyY.toString());

    // Generate signature using the PRIVATE key buffer
    // signPoseidon expects the hash in F (field) format, not BigInt
    const { privateKey } = await generateBabyJubJubKeys();
    const signature = await signCredentialHash(privateKey, hash_F);
    
    // Get babyJub to access the field converter
    const babyJub = await buildBabyjub();
    
    // EdDSA signature components - R8 coordinates are F1Field, S might be BigInt or Buffer
    const R8x = babyJub.F.toObject(signature.R8[0]);
    const R8y = babyJub.F.toObject(signature.R8[1]);
    // S is returned as a scalar BigInt
    const S = typeof signature.S === 'bigint' ? signature.S : BigInt('0x' + Buffer.from(signature.S).reverse().toString('hex'));

    // Convert to byte arrays for Solana
    const credentialHashBytes = bigIntToBytes32(credential_hash);
    const zkSignatureR8xBytes = bigIntToBytes32(R8x);
    const zkSignatureR8yBytes = bigIntToBytes32(R8y);
    const zkSignatureSBytes = bigIntToBytes32(S);

    // Derive credential PDA

    const [credentialPDA] = await getCredentialPDA(
      solanaConfig.programId,
      holderPubkey,
      issuerPDA
    );

    console.log("Issuer PDA:", issuerPDA.toString());
    console.log("Credential PDA:", credentialPDA.toString());

    // Check if credential already exists for this holder
    try {
      const existingCredential = await solanaConfig.program.account.userCredential.fetch(
        credentialPDA
      );
      
      if (existingCredential) {
        console.log("Credential already exists for this holder");
        return res.status(409).json({
          error: "Credential already exists for this wallet",
          message: "A credential has already been issued to this wallet address. Please use a different wallet or revoke the existing credential first.",
          credential_pda: credentialPDA.toString(),
          existing_credential: {
            issued_at: existingCredential.issuedAt.toString(),
            expires_at: existingCredential.expiresAt.toString(),
            is_revoked: existingCredential.isRevoked,
          }
        });
      }
    } catch (fetchError: any) {
      // If fetch fails with "Account does not exist", that's good - we can proceed
      if (!fetchError.message?.includes("Account does not exist")) {
        console.error("Error checking existing credential:", fetchError);
        // Continue anyway - let the transaction fail if there's a real issue
      }
      console.log("No existing credential found - proceeding with issuance");
    }

    // Call Solana smart contract - issueCredential instruction
    try {
      const tx = await solanaConfig.program.methods
        .issueCredential(
          solanaConfig.issuerName,
          credentialHashBytes,
          new BN(currentTime),
          new BN(expiresAt),
          zkSignatureR8xBytes,
          zkSignatureR8yBytes,
          zkSignatureSBytes
        )
        .accounts({
          credentialAccount: credentialPDA,
          issuerAccount: issuerPDA,
          issuerAuthority: solanaConfig.authorityKeypair.publicKey,
          holder: holderPubkey,
          systemProgram: new PublicKey("11111111111111111111111111111111"),
        })
        .signers([solanaConfig.authorityKeypair])
        .rpc();

      console.log("Transaction signature:", tx);

      const response = {
        success: true,
        transaction_signature: tx,
        credential: {
          dob: dateOfBirth,
          current_time: currentTime,
          expires_at: expiresAt,
        },
        credential_hash: credential_hash.toString(),
        signature: {
          R8x: R8x.toString(),
          R8y: R8y.toString(),
          S: S.toString(),
        },
        issuer_public_key: {
          x: issuerPubKeyX.toString(),
          y: issuerPubKeyY.toString(),
        },
        holder: holderPubkey.toString(),
        credential_pda: credentialPDA.toString(),
      };

      return res.json(response);
    } catch (err: any) {
      console.error("Solana transaction error:", err);
      return res.status(500).json({
        error: "Failed to issue credential on Solana",
        details: err.message || String(err),
      });
    }
  } catch (err) {
    console.error("Issuing Credential error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Verification endpoint
app.post("/verify", async (req: Request, res: Response) => {
  try {
    const { proof, public: publicInputs, holderPublicKey } = req.body;

    // Validate input
    if (!proof || !publicInputs) {
      return res.status(400).json({
        verified: false,
        error: "Missing proof or public inputs",
      });
    }

    if (!holderPublicKey) {
      return res.status(400).json({
        verified: false,
        error: "Missing holderPublicKey",
      });
    }

    // Validate Solana configuration
    if (!solanaConfig) {
      return res.status(500).json({
        verified: false,
        error: "Solana not configured. Please check environment variables.",
      });
    }

    // Parse holder public key
    let holderPubkey: PublicKey;
    try {
      holderPubkey = new PublicKey(holderPublicKey);
    } catch (err) {
      return res.status(400).json({
        verified: false,
        error: "Invalid holderPublicKey: must be a valid Solana public key",
      });
    }

    console.log("\n=== Starting Verification Process ===");

    // STEP 1: Derive and fetch credential PDA
    const [issuerPDA] = await getIssuerPDA(
      solanaConfig.programId,
      solanaConfig.authorityKeypair.publicKey,
      solanaConfig.issuerName
    );

    const [credentialPDA] = await getCredentialPDA(
      solanaConfig.programId,
      holderPubkey,
      issuerPDA
    );

    console.log("Credential PDA:", credentialPDA.toString());

    // Fetch credential account from Solana
    let credentialAccount: any;
    try {
      credentialAccount = await solanaConfig.program.account.userCredential.fetch(
        credentialPDA
      );
    } catch (err: any) {
      return res.status(404).json({
        verified: false,
        error: "Credential not found on-chain",
        details: err.message,
      });
    }

    console.log("Credential account fetched successfully");

    // STEP 2: Verify authority and issuer
    const expectedAuthority = solanaConfig.authorityKeypair.publicKey;
    const actualIssuerAuthority = credentialAccount.issuer;

    // Fetch issuer account to verify authority
    let issuerAccount: any;
    try {
      issuerAccount = await solanaConfig.program.account.issuerAccount.fetch(
        issuerPDA
      );
    } catch (err) {
      return res.status(404).json({
        verified: false,
        error: "Issuer account not found on-chain",
      });
    }

    // Check if issuer authority matches expected authority from env
    if (!issuerAccount.authority.equals(expectedAuthority)) {
      return res.status(403).json({
        verified: false,
        error: "Invalid issuer authority - does not match expected authority",
        expected: expectedAuthority.toString(),
        actual: issuerAccount.authority.toString(),
      });
    }

    console.log("✓ Authority verified");

    // Check if issuer is active
    if (!issuerAccount.isActive) {
      return res.status(403).json({
        verified: false,
        error: "Issuer is not active",
      });
    }

    console.log("✓ Issuer is active");

    // STEP 3: Verify credential is not revoked
    if (credentialAccount.isRevoked) {
      return res.status(403).json({
        verified: false,
        error: "Credential has been revoked",
      });
    }

    console.log("✓ Credential not revoked");

    // STEP 4: Verify credential holder matches
    if (!credentialAccount.holder.equals(holderPubkey)) {
      return res.status(403).json({
        verified: false,
        error: "Credential holder mismatch",
        expected: holderPubkey.toString(),
        actual: credentialAccount.holder.toString(),
      });
    }

    console.log("✓ Credential holder verified");

    // STEP 5: Extract public inputs from request
    // Public signals from circuit: [isValid (output), currentTime, expiresAt, credential_hash, issuerPublicKeyX, issuerPublicKeyY]
    if (!Array.isArray(publicInputs) || publicInputs.length !== 6) {
      return res.status(400).json({
        verified: false,
        error: "Invalid public inputs: expected array of 6 elements [isValid, currentTime, expiresAt, credential_hash, issuerPublicKeyX, issuerPublicKeyY]",
      });
    }

    const [
      isValid,
      currentTime,
      expiresAt,
      credentialHashStr,
      issuerPublicKeyXStr,
      issuerPublicKeyYStr,
    ] = publicInputs;

    // STEP 5b: Verify isValid output from circuit equals 1 (age >= 18 and not expired)
    if (isValid !== "1") {
      return res.status(403).json({
        verified: false,
        error: "Age verification failed: proof indicates user is under 18 or credential is expired",
        isValid,
      });
    }

    console.log("✓ Circuit isValid output verified (age >= 18)");

    // STEP 6: Verify credential hash matches on-chain data
    // On-chain data is stored in little-endian format, convert back to BigInt for comparison
    const credentialHashFromChain = bytes32ToBigInt(credentialAccount.credentialHash);
    const credentialHashFromProof = BigInt(credentialHashStr);

    if (credentialHashFromChain !== credentialHashFromProof) {
      return res.status(403).json({
        verified: false,
        error: "Credential hash mismatch between on-chain and proof",
        onChain: credentialHashFromChain.toString(),
        proof: credentialHashFromProof.toString(),
      });
    }

    console.log("✓ Credential hash verified");

    // STEP 7: Verify issuer public key matches on-chain data
    // On-chain data is stored in little-endian format, convert back to BigInt for comparison
    const issuerPubKeyXFromChain = bytes32ToBigInt(issuerAccount.zkPublicKeyX);
    const issuerPubKeyYFromChain = bytes32ToBigInt(issuerAccount.zkPublicKeyY);

    const issuerPubKeyXFromProof = BigInt(issuerPublicKeyXStr);
    const issuerPubKeyYFromProof = BigInt(issuerPublicKeyYStr);

    if (issuerPubKeyXFromChain !== issuerPubKeyXFromProof || issuerPubKeyYFromChain !== issuerPubKeyYFromProof) {
      return res.status(403).json({
        verified: false,
        error: "Issuer public key mismatch between on-chain and proof",
        onChainX: issuerPubKeyXFromChain.toString(),
        onChainY: issuerPubKeyYFromChain.toString(),
        proofX: issuerPubKeyXFromProof.toString(),
        proofY: issuerPubKeyYFromProof.toString(),
      });
    }

    console.log("✓ Issuer public key verified");

    // STEP 8: Verify expiration time matches on-chain data
    const expiresAtFromChain = credentialAccount.expiresAt.toString();
    if (expiresAtFromChain !== expiresAt) {
      return res.status(403).json({
        verified: false,
        error: "Expiry time mismatch between on-chain and proof",
        onChain: expiresAtFromChain,
        proof: expiresAt,
      });
    }

    console.log("✓ Expiry time verified");

    // STEP 9: Verify credential has not expired (based on current server time)
    const serverCurrentTime = Math.floor(Date.now() / 1000);
    if (serverCurrentTime >= credentialAccount.expiresAt) {
      return res.status(403).json({
        verified: false,
        error: "Credential has expired",
        expiresAt: credentialAccount.expiresAt.toString(),
        currentTime: serverCurrentTime.toString(),
      });
    }

    console.log("✓ Credential not expired");

    // STEP 10: Verify the ZK proof using snarkjs
    console.log("Verifying ZK proof...");
    const result = await verifyProof(proof, publicInputs);

    if (!result.verified) {
      return res.json({
        verified: false,
        error: "ZK proof verification failed",
        details: result.error,
      });
    }

    console.log("✓ ZK proof verified");

    // All checks passed!
    console.log("\n=== ✓ ALL VERIFICATION CHECKS PASSED ===\n");

    res.json({
      verified: true,
      credential: {
        holder: credentialAccount.holder.toString(),
        issuer: credentialAccount.issuer.toString(),
        credentialHash: credentialHashFromChain.toString(),
        issuedAt: credentialAccount.issuedAt.toString(),
        expiresAt: credentialAccount.expiresAt.toString(),
        isRevoked: credentialAccount.isRevoked,
      },
      issuer: {
        authority: issuerAccount.authority.toString(),
        name: issuerAccount.name,
        isActive: issuerAccount.isActive,
        publicKeyX: issuerPubKeyXFromChain.toString(),
        publicKeyY: issuerPubKeyYFromChain.toString(),
      },
      message: "All verification checks passed: ZK proof valid, credential authentic, issuer verified",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      verified: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
