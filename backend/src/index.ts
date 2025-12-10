import express, { json, Request, Response } from "express";
import { verifyProof } from "./verifier";
import { generateBabyJubJubKeys , signCredentialHash} from "./simulate_issuer";
import { buildPoseidon, buildEddsa } from "circomlibjs";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: Math.floor(Date.now() / 1000),
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("SolidKYC Backend - ZK Proof Verification Service");
});

app.post("/issue_credentials", async (req: Request, res: Response) => {
  try {
    const { dateOfBirth } = req.body;

    // Validate dateOfBirth
    if (!dateOfBirth) {
      return res.status(400).json({
        error: "Missing required field: dateOfBirth"
      });
    }

    if (isNaN(Number(dateOfBirth)) || Number(dateOfBirth) <= 0) {
      return res.status(400).json({
        error: "Invalid dateOfBirth: must be a positive number"
      });
    }

    // Unix timestamp in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const expiresAt = currentTime + 10 * 60; // 10 minutes from now

    // build credential
    const credential = {
      dateOfBirth: dateOfBirth,
      currentTime: currentTime,
      expiresAt: expiresAt,
    };

    const poseidon = await buildPoseidon();
    const inputs = [dateOfBirth];
    const hash = poseidon(inputs);
    const credential_hash = poseidon.F.toObject(hash); // Get as BigInt

    console.log("Credential Hash:", credential_hash.toString());

    const {
      privateKey,
      publicKey: { x, y },
    } = await generateBabyJubJubKeys();

    const signature = await signCredentialHash(privateKey, credential_hash);
    const R8x = signature.R8[0].toString();
    const R8y = signature.R8[1].toString();
    const S = signature.S.toString();

    const response = {
      credential: {
        dob: dateOfBirth,
        current_time: currentTime,
        expires_at: expiresAt,
      },
      credential_hash: credential_hash.toString(),
      signature: {
        R8x,
        R8y,
        S,
      },
      issuer_public_key: {
        x: x.toString(),
        y: y.toString(),
      },
    };
    return res.json(response);
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
