# 🧪 Testing Guide - SolidKYC Backend

## Overview

This guide walks you through testing both backend endpoints: `/issue_credentials` and `/verify`.

## ⚠️ Important Prerequisites

Before testing, you **MUST** complete these steps in order:

---

## 📋 Step-by-Step Testing Instructions

### **Step 1: Start Solana Local Validator**

Open a **new terminal** and run:

```bash
cd ~/glitchy_moon/github_repo/SolidKYC
solana-test-validator
```

**Keep this terminal running** throughout testing. You should see output like:
```
Ledger location: test-ledger
Log: test-ledger/validator.log
Identity: xxxxx...
```

---

### **Step 2: Deploy the Solana Program** (If not already deployed)

In another terminal:

```bash
cd ~/glitchy_moon/github_repo/SolidKYC/solidkyc
anchor build
anchor deploy
```

Verify the program ID matches your `.env`:
```bash
# Should show: 5AFgFmdQthc3DZKmygrsGZkNnCN9JYMefADiAvNXpYCg
anchor keys list
```

---

### **Step 3: Initialize the Issuer Account** (One-time setup)

From the backend directory:

```bash
cd ~/glitchy_moon/github_repo/SolidKYC/backend
npx ts-node src/initialize_issuer.ts
```

**Expected Output:**
```
=== Initializing Issuer Account ===

Configuration:
- RPC URL: http://localhost:8899
- Program ID: 5AFgFmdQthc3DZKmygrsGZkNnCN9JYMefADiAvNXpYCg
- Authority: xxxxx...
- Issuer Name: MVP-Issuer

ZK Keys:
- Public Key X: xxxxx...
- Public Key Y: xxxxx...

Issuer PDA: xxxxx...
Bump: x

Requesting airdrop for transaction fees...
✓ Airdrop successful

Sending transaction to initialize issuer...
✓ Transaction successful!
Transaction signature: xxxxx...

=== Issuer Account Created ===
- Authority: xxxxx...
- Name: MVP-Issuer
- Is Active: true
- Registered At: 2025-12-11T...
- Credentials Issued: 0

✅ Issuer initialization complete!
✅ All done!
```

**If you see "⚠️ Issuer already exists!"** - that's fine, skip to the next step.

---

### **Step 4: Start the Backend Server**

In a new terminal:

```bash
cd ~/glitchy_moon/github_repo/SolidKYC/backend
npm run dev
```

**Expected Output:**
```
Solana initialized:
- RPC URL: http://localhost:8899
- Program ID: 5AFgFmdQthc3DZKmygrsGZkNnCN9JYMefADiAvNXpYCg
- Authority: xxxxx...
- Issuer Name: MVP-Issuer

Server running on http://0.0.0.0:3000
Health check available at http://0.0.0.0:3000/health
Verify endpoint available at http://0.0.0.0:3000/verify
```

**Keep this terminal running** - this is your backend server.

---

### **Step 5: Run the Endpoint Tests**

In another terminal:

```bash
cd ~/glitchy_moon/github_repo/SolidKYC/backend
npx ts-node src/test_endpoints.ts
```

**Expected Output:**

```
=== Testing SolidKYC Backend Endpoints ===

Test Configuration:
- Backend URL: http://localhost:3000
- Holder Public Key: xxxxx...

1️⃣  Testing /health endpoint...
✓ Health check response:
{
  "status": "healthy",
  "timestamp": 1702400000,
  "solana": "connected"
}

2️⃣  Testing /issue_credentials endpoint...
✓ Credential issued successfully!

Response details:
- Transaction Signature: xxxxx...
- Credential PDA: xxxxx...
- Credential Hash: xxxxx...
- Issued At: 2025-12-11T...
- Expires At: 2025-12-11T...

Signature:
- R8x: xxxxx...
- R8y: xxxxx...
- S: xxxxx...

Issuer Public Key:
- X: xxxxx...
- Y: xxxxx...

📝 Credential data saved for verification test

3️⃣  Testing /verify endpoint structure...
⚠️  Note: This will fail ZK proof verification (we don't have a real proof)
   But we can test the on-chain verification logic!

✓ On-chain verification passed!
✓ All security checks passed!
❌ ZK proof verification failed (expected - we used a mock proof)

To complete the full verification:
1. Generate a real ZK proof using the credential data
2. Call /verify with the real proof

=== Test Summary ===
✓ Health check: PASSED
✓ Issue credentials: PASSED
⚠️  Verify endpoint: PARTIAL (needs real ZK proof)

💡 Next steps:
1. Generate a ZK proof using the issued credential data
2. Test the verify endpoint with the real proof
```

---

## ✅ What Gets Tested

### `/health` Endpoint
- ✓ Server is running
- ✓ Solana connection established

### `/issue_credentials` Endpoint
- ✓ Accepts dateOfBirth and holderPublicKey
- ✓ Generates credential hash
- ✓ Signs credential with EdDSA
- ✓ Calls Solana smart contract
- ✓ Creates credential account on-chain
- ✓ Returns transaction signature and credential data

### `/verify` Endpoint (Partial)
- ✓ Fetches credential from Solana PDA
- ✓ Verifies authority matches env config
- ✓ Checks issuer is active
- ✓ Checks credential not revoked
- ✓ Verifies credential holder
- ✓ Matches credential hash on-chain ↔ proof
- ✓ Matches issuer public key on-chain ↔ proof
- ✓ Matches expiration time
- ✓ Checks not expired
- ⚠️  ZK proof verification (needs real proof)

---

## 🔍 Manual Testing with curl

### Test Health Check
```bash
curl http://localhost:3000/health
```

### Test Issue Credentials
```bash
curl -X POST http://localhost:3000/issue_credentials \
  -H "Content-Type: application/json" \
  -d '{
    "dateOfBirth": "946684800",
    "holderPublicKey": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
  }'
```

### Test Verify (with mock proof)
```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {
      "pi_a": ["0", "0", "1"],
      "pi_b": [["0", "0"], ["0", "0"], ["1", "0"]],
      "pi_c": ["0", "0", "1"],
      "protocol": "groth16",
      "curve": "bn128"
    },
    "public": [
      "1702400000",
      "1702400600",
      "12345678901234567890",
      "67890123456789012345",
      "45678901234567890123"
    ],
    "holderPublicKey": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
  }'
```

---

## 🚨 Troubleshooting

### "Solana not configured" error
- Check `.env` file exists in `/backend`
- Verify `AUTHORITY_PRIVATE_KEY`, `PROGRAM_ID`, `ISSUER_NAME` are set

### "Credential not found on-chain" error
- Make sure you initialized the issuer (Step 3)
- Ensure the holder public key matches the issued credential

### "Connection refused" error
- Check Solana test validator is running
- Verify backend server is running on port 3000

### "Issuer account not found"
- Run the initialize_issuer.ts script again
- Check the issuer name matches env config

---

## 📊 Checking On-Chain Data

You can inspect the created accounts using:

```bash
# Check issuer account
solana account <ISSUER_PDA_ADDRESS>

# Check credential account  
solana account <CREDENTIAL_PDA_ADDRESS>
```

Or use Anchor:
```bash
cd ~/glitchy_moon/github_repo/SolidKYC/solidkyc
anchor account issuerAccount <ISSUER_PDA_ADDRESS>
anchor account userCredential <CREDENTIAL_PDA_ADDRESS>
```

---

## 🎯 Success Criteria

✅ **All tests pass** if you see:
1. Health check returns `"solana": "connected"`
2. Issue credentials returns a transaction signature
3. Verify endpoint passes all on-chain checks (fails only at ZK proof)

⚠️ **Full verification** requires:
- Generating a real ZK proof using circom/snarkjs
- Using the credential data from the issue response
- Calling verify with the real proof

---

## 📝 Notes

- The test script uses a randomly generated holder keypair
- Each run creates a new credential on-chain
- The mock proof is intentionally invalid (for structural testing)
- Real ZK proof generation requires the circom circuit

---

## 🔄 Resetting for Fresh Tests

If you want to start fresh:

```bash
# Stop the validator (Ctrl+C in validator terminal)

# Clean the ledger
rm -rf test-ledger

# Restart from Step 1
```

This will reset the entire local blockchain.
