import express, { json, Request, Response } from "express";
import { verifyProof } from "./verifier";
import { generateBabyJubJubKeys, signCredentialHash } from "./simulate_issuer";
import { buildPoseidon, buildEddsa } from "circomlibjs";
import { PublicKey } from "@solana/web3.js";
import {
  initializeSolana,
  bigIntToBytes32,
  getIssuerPDA,
  getCredentialPDA,
  SolanaConfig,
} from "./solana";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Solana configuration
let solanaConfig: SolanaConfig | null = null;

try {
  solanaConfig = initializeSolana();
} catch (error) {
  console.error("Failed to initialize Solana:", error);
  console.error("Server will start but /issue_credentials endpoint will not work");
}

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
    const expiresAt = currentTime + 10 * 60; // 10 minutes from now

    // Build credential
    const credential = {
      dateOfBirth: dateOfBirth,
      currentTime: currentTime,
      expiresAt: expiresAt,
    };

    // Generate credential hash using Poseidon
    const poseidon = await buildPoseidon();
    const inputs = [dateOfBirth];
    const hash = poseidon(inputs);
    const credential_hash = poseidon.F.toObject(hash); // Get as BigInt

    console.log("Credential Hash:", credential_hash.toString());

    // Generate ZK keys and signature
    const {
      privateKey,
      publicKey: { x, y },
    } = await generateBabyJubJubKeys();

    const signature = await signCredentialHash(privateKey, credential_hash);
    // EdDSA signature components (circomlibjs returns these as special types)
    const R8x = signature.R8[0];
    const R8y = signature.R8[1];
    const S = signature.S;

    // Convert to byte arrays for Solana (handle both BigInt and other numeric types)
    const credentialHashBytes = bigIntToBytes32(credential_hash);
    const zkSignatureR8xBytes = bigIntToBytes32(BigInt((R8x as any).toString()));
    const zkSignatureR8yBytes = bigIntToBytes32(BigInt((R8y as any).toString()));
    const zkSignatureSBytes = bigIntToBytes32(BigInt((S as any).toString()));

    // Derive PDAs
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

    console.log("Issuer PDA:", issuerPDA.toString());
    console.log("Credential PDA:", credentialPDA.toString());

    // Call Solana smart contract - issueCredential instruction
    try {
      const tx = await solanaConfig.program.methods
        .issueCredential(
          solanaConfig.issuerName,
          credentialHashBytes,
          currentTime,
          expiresAt,
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
          R8x: BigInt((R8x as any).toString()).toString(),
          R8y: BigInt((R8y as any).toString()).toString(),
          S: BigInt((S as any).toString()).toString(),
        },
        issuer_public_key: {
          x: x.toString(),
          y: y.toString(),
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
    const { proof, public: publicInputs } = req.body;

    // Validate input
    if (!proof || !publicInputs) {
      return res.status(400).json({
        verified: false,
        error: "Missing proof or public inputs",
      });
    }

    // Verify the proof
    const result = await verifyProof(proof, publicInputs);

    res.json({
      verified: result.verified,
      error: result.error || null,
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      verified: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
  console.log(`Verify endpoint available at http://0.0.0.0:${PORT}/verify`);
});
