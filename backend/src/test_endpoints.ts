import { Keypair } from "@solana/web3.js";
import axios from "axios";

const BACKEND_URL = "http://localhost:3000";

/**
 * Test script for SolidKYC backend endpoints
 */
async function testEndpoints() {
  console.log("=== Testing SolidKYC Backend Endpoints ===\n");

  // Generate a test holder keypair
  const holderKeypair = Keypair.generate();
  const holderPublicKey = holderKeypair.publicKey.toString();

  console.log("Test Configuration:");
  console.log("- Backend URL:", BACKEND_URL);
  console.log("- Holder Public Key:", holderPublicKey);
  console.log();

  // Test 1: Health Check
  console.log("1️⃣  Testing /health endpoint...");
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log("✓ Health check response:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log();
  } catch (err: any) {
    console.error("❌ Health check failed:", err.message);
    console.log("Make sure the backend server is running!");
    return;
  }

  // Test 2: Issue Credentials
  console.log("2️⃣  Testing /issue_credentials endpoint...");
  
  // Date of birth: Jan 1, 2000 (Unix timestamp)
  const dateOfBirth = Math.floor(new Date("2000-01-01").getTime() / 1000);
  
  try {
    const issueResponse = await axios.post(`${BACKEND_URL}/issue_credentials`, {
      dateOfBirth: dateOfBirth,
      holderPublicKey: holderPublicKey,
    });

    const responseData: any = issueResponse.data;

    console.log("✓ Credential issued successfully!");
    console.log("\nResponse details:");
    console.log("- Transaction Signature:", responseData.transaction_signature);
    console.log("- Credential PDA:", responseData.credential_pda);
    console.log("- Credential Hash:", responseData.credential_hash);
    console.log("- Issued At:", new Date(responseData.credential.current_time * 1000).toISOString());
    console.log("- Expires At:", new Date(responseData.credential.expires_at * 1000).toISOString());
    console.log("\nSignature:");
    console.log("- R8x:", responseData.signature.R8x);
    console.log("- R8y:", responseData.signature.R8y);
    console.log("- S:", responseData.signature.S);
    console.log("\nIssuer Public Key:");
    console.log("- X:", responseData.issuer_public_key.x);
    console.log("- Y:", responseData.issuer_public_key.y);
    console.log();

    // Save credential data for verification test
    const credentialData = {
      holderPublicKey,
      credentialPDA: responseData.credential_pda,
      credentialHash: responseData.credential_hash,
      currentTime: responseData.credential.current_time,
      expiresAt: responseData.credential.expires_at,
      signature: responseData.signature,
      issuerPublicKey: responseData.issuer_public_key,
      dateOfBirth,
    };

    console.log("📝 Credential data saved for verification test");
    console.log();

    // Test 3: Verify endpoint (without actual ZK proof)
    console.log("3️⃣  Testing /verify endpoint structure...");
    console.log("⚠️  Note: This will fail ZK proof verification (we don't have a real proof)");
    console.log("   But we can test the on-chain verification logic!\n");

    try {
      // Create mock public inputs (these match what the circuit expects)
      const publicInputs = [
        credentialData.currentTime.toString(),
        credentialData.expiresAt.toString(),
        credentialData.credentialHash,
        credentialData.issuerPublicKey.x,
        credentialData.issuerPublicKey.y,
      ];

      // Create a mock proof (this will fail ZK verification, but that's expected)
      const mockProof = {
        pi_a: ["0", "0", "1"],
        pi_b: [["0", "0"], ["0", "0"], ["1", "0"]],
        pi_c: ["0", "0", "1"],
        protocol: "groth16",
        curve: "bn128",
      };

      const verifyResponse = await axios.post(`${BACKEND_URL}/verify`, {
        proof: mockProof,
        public: publicInputs,
        holderPublicKey: holderPublicKey,
      });

      console.log("Verify response:");
      console.log(JSON.stringify(verifyResponse.data, null, 2));
    } catch (err: any) {
      if (err.response) {
        const errorData = err.response.data;
        
        // Check which verification step failed
        if (errorData.error?.includes("ZK proof verification failed")) {
          console.log("✓ On-chain verification passed!");
          console.log("✓ All security checks passed!");
          console.log("❌ ZK proof verification failed (expected - we used a mock proof)");
          console.log("\nTo complete the full verification:");
          console.log("1. Generate a real ZK proof using the credential data");
          console.log("2. Call /verify with the real proof");
        } else {
          console.log("❌ Verification failed at:", errorData.error);
          console.log("Details:", JSON.stringify(errorData, null, 2));
        }
      } else {
        console.error("❌ Request failed:", err.message);
      }
    }

    console.log();
    console.log("=== Test Summary ===");
    console.log("✓ Health check: PASSED");
    console.log("✓ Issue credentials: PASSED");
    console.log("⚠️  Verify endpoint: PARTIAL (needs real ZK proof)");
    console.log();
    console.log("💡 Next steps:");
    console.log("1. Generate a ZK proof using the issued credential data");
    console.log("2. Test the verify endpoint with the real proof");
    console.log();
    console.log("📊 Credential Data for ZK Proof Generation:");
    console.log(JSON.stringify(credentialData, null, 2));

  } catch (err: any) {
    if (err.response) {
      console.error("❌ Issue credentials failed:");
      console.error("Status:", err.response.status);
      console.error("Error:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("❌ Request failed:", err.message);
    }
  }
}

// Run the tests
testEndpoints()
  .then(() => {
    console.log("\n✅ Testing complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Test error:", err);
    process.exit(1);
  });
