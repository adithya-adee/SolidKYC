# SimDEX Integration Guide

## Complete Workflow: Zero-Knowledge Age Verification

This document explains the complete end-to-end flow of how the SimDEX demonstrates zero-knowledge proof based age verification.

---

## 🎯 Overview

**Goal**: Verify a user is 18+ years old without revealing their date of birth or any personal information.

**Technology**: Zero-Knowledge Proofs (ZKP) using circom circuits and snarkjs

---

## 🔄 Complete Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  1. SIMDEX (localhost:3001)                             │
│     - Shows "Verify 18+" prompt                         │
│     - User clicks "Verify via SolidKYC"                 │
└──────┬──────────────────────────────────────────────────┘
       │
       │ Redirect to:
       │ http://localhost:5173?callback=http://localhost:3001/verify-callback
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  2. SOLIDKYC FRONTEND (localhost:5173)                  │
│     - User unlocks vault (enters passphrase)            │
│     - User selects KYC credential                       │
│     - Decrypts credential with private key              │
│     - Generates ZK proof (proof.json + public.json)     │
└──────┬──────────────────────────────────────────────────┘
       │
       │ POST to callback URL:
       │ {
       │   "proof": {...},
       │   "publicInputs": ["..."],
       │   "holderPublicKey": "..."
       │ }
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  3. SIMDEX CALLBACK (localhost:3001/verify-callback)    │
│     - Receives proof + publicInputs                     │
│     - Forwards to backend for verification              │
└──────┬──────────────────────────────────────────────────┘
       │
       │ POST to backend:
       │ {
       │   "proof": {...},
       │   "public": ["..."],
       │   "holderPublicKey": "..."
       │ }
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  4. BACKEND (localhost:3000/verify)                     │
│     - Verifies ZK proof cryptographically               │
│     - Checks credential on Solana blockchain            │
│     - Returns verification result                       │
└──────┬──────────────────────────────────────────────────┘
       │
       │ Response:
       │ {
       │   "verified": true/false,
       │   "message": "..."
       │ }
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  5. SIMDEX CALLBACK                                     │
│     - Returns redirect URL based on result              │
│     - redirectUrl: http://localhost:3001?verified=true  │
└──────┬──────────────────────────────────────────────────┘
       │
       │ SolidKYC redirects user to:
       │ http://localhost:3001?verified=true
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  6. SIMDEX SUCCESS PAGE                                 │
│     - Shows "Verification Successful!"                  │
│     - Explains how ZKP worked                           │
│     - "This is how zero-knowledge proofs work!"         │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Detailed Steps

### Step 1: User Lands on SimDEX

**File**: `simulation-dex/src/app/page.tsx`

```typescript
const handleVerifyAge = () => {
  const callbackParam = encodeURIComponent('http://localhost:3001/verify-callback')
  window.location.href = `http://localhost:5173?callback=${callbackParam}`
}
```

**What happens**:
- User sees age verification gate
- Clicks "Verify via SolidKYC"
- Redirected to SolidKYC with callback URL as query parameter

---

### Step 2: User Generates Proof in SolidKYC

**File**: `frontend/src/components/features/GenerateZKCard.tsx`

```typescript
// Check for callback URL
const urlParams = new URLSearchParams(window.location.search)
const callbackUrl = urlParams.get('callback')

// Generate proof
const { proof, publicSignals } = await generateProof(credentialData)

// If callback exists, POST to it
if (callbackUrl) {
  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proof,
      publicInputs: publicSignals,
      holderPublicKey: publicKey.toString(),
    }),
  })
}
```

**What happens**:
1. User unlocks vault with passphrase
2. User selects a KYC credential
3. Credential is decrypted using user's private key
4. ZK proof is generated using circom circuit
5. Proof + public signals are POSTed to callback URL

---

### Step 3: DEX Receives Proof

**File**: `simulation-dex/src/app/verify-callback/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { proof, publicInputs, holderPublicKey } = await request.json()
  
  // Verify with backend
  const verifyResponse = await fetch('http://localhost:3000/verify', {
    method: 'POST',
    body: JSON.stringify({
      proof,
      public: publicInputs,
      holderPublicKey,
    }),
  })
  
  const result = await verifyResponse.json()
  
  // Return redirect URL
  return NextResponse.json({
    success: result.verified,
    redirectUrl: `http://localhost:3001?verified=${result.verified}`,
  })
}
```

**What happens**:
1. DEX receives proof from SolidKYC
2. DEX forwards proof to backend `/verify` endpoint
3. Backend verifies the proof cryptographically
4. DEX returns redirect URL to SolidKYC

---

### Step 4: Backend Verifies Proof

**File**: `backend/src/verify.ts` (existing)

```typescript
// Pseudocode - actual implementation in backend
export async function verifyProof(proof, publicInputs, holderPublicKey) {
  // 1. Verify ZK proof cryptographically using snarkjs
  const isValid = await snarkjs.groth16.verify(vKey, publicInputs, proof)
  
  // 2. Check credential on Solana blockchain
  const credential = await program.account.credentialAccount.fetch(credentialPDA)
  
  // 3. Verify credential is not revoked
  if (credential.isRevoked) return { verified: false }
  
  // 4. Return verification result
  return { verified: true, message: "Proof verified successfully" }
}
```

**What happens**:
1. Backend uses snarkjs to verify the ZK proof
2. Checks the credential exists on Solana
3. Verifies credential is not revoked
4. Returns verification result

---

### Step 5: User Redirected Back to DEX

**File**: `frontend/src/components/features/GenerateZKCard.tsx`

```typescript
if (result.success && result.redirectUrl) {
  toast.success('Verification complete! Redirecting to DEX...')
  setTimeout(() => {
    window.location.href = result.redirectUrl
  }, 1500)
}
```

**What happens**:
1. SolidKYC receives redirect URL from callback
2. Shows success toast
3. Redirects user back to DEX with `?verified=true`

---

### Step 6: DEX Shows Result

**File**: `simulation-dex/src/app/page.tsx`

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const verified = params.get('verified')
  
  if (verified === 'true') {
    setVerificationState('success')
    setVerificationMessage('This is how zero-knowledge proofs work!')
  }
}, [])
```

**What happens**:
1. DEX reads `verified` query parameter
2. Shows success message
3. Explains how ZKP worked without revealing personal data

---

## 🔐 What Makes This Zero-Knowledge?

### Information NOT Shared:
- ❌ Date of birth
- ❌ Full name
- ❌ Address
- ❌ Any other PII (Personally Identifiable Information)

### Information Shared:
- ✅ A cryptographic proof that age > 18
- ✅ Public signals (hashed values)
- ✅ Wallet public key (already public)

### How It Works:
1. **Circuit Constraint**: The circom circuit enforces `currentTime - dateOfBirth >= 18 years`
2. **Proof Generation**: User's device generates proof locally
3. **Verification**: Anyone can verify the proof without seeing the input data
4. **Privacy**: The actual date of birth never leaves the user's device

---

## 🧪 Testing the Complete Flow

### Prerequisites:
```bash
# Terminal 1: Backend
cd backend
npm run dev
# Running on http://localhost:3000

# Terminal 2: SolidKYC Frontend
cd frontend
npm run dev
# Running on http://localhost:5173

# Terminal 3: SimDEX
cd simulation-dex
npm run dev
# Running on http://localhost:3001
```

### Test Steps:
1. **Open SimDEX**: Visit `http://localhost:3001`
2. **Click Verify**: Click "Verify via SolidKYC"
3. **Unlock Vault**: Enter your passphrase in SolidKYC
4. **Select Credential**: Choose a KYC credential
5. **Generate Proof**: Click to generate ZK proof
6. **Wait for Redirect**: You'll be redirected back to SimDEX
7. **See Result**: Success message explaining ZKP!

---

## 🐛 Troubleshooting

### Issue: "Callback failed"
- **Cause**: DEX not running on port 3001
- **Fix**: Make sure SimDEX is running: `npm run dev` in simulation-dex

### Issue: "Verification failed"
- **Cause**: Backend not running or not accessible
- **Fix**: Start backend: `npm run dev` in backend directory

### Issue: "Network error"
- **Cause**: CORS or network issue
- **Fix**: Check all three servers are running on correct ports

### Issue: "Invalid proof"
- **Cause**: Proof generation failed or credential expired
- **Fix**: Re-issue credential and try again

---

## 📊 Data Flow

```
User's Device (SolidKYC):
  ┌─────────────────────┐
  │  Encrypted Vault    │
  │  - Date of Birth    │
  │  - Signature        │
  │  - Issuer PubKey    │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  ZK Circuit         │
  │  proves: age >= 18  │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  proof.json         │
  │  public.json        │
  └──────────┬──────────┘
             │
             ▼ (POST to callback)
             
SimDEX Callback:
  ┌─────────────────────┐
  │  Receives proof     │
  └──────────┬──────────┘
             │
             ▼ (Forward to backend)
             
Backend:
  ┌─────────────────────┐
  │  Verifies proof     │
  │  Checks Solana      │
  └──────────┬──────────┘
             │
             ▼ (Return result)
             
SimDEX:
  ┌─────────────────────┐
  │  Shows success!     │
  │  (No PII revealed)  │
  └─────────────────────┘
```

---

## 🎓 Educational Value

This simulation demonstrates:

1. **Zero-Knowledge Proofs**: Proving something without revealing the underlying data
2. **Callback Architecture**: OAuth-like flow for proof generation
3. **Cryptographic Verification**: Using snarkjs and circom
4. **Blockchain Integration**: Credential verification on Solana
5. **Privacy-Preserving**: Real-world application of ZKP technology

---

## 🚀 Next Steps

To extend this simulation:

1. **Add more claim types**: Income verification, location proof, etc.
2. **Implement session management**: Keep users logged in
3. **Add actual DEX features**: Trading interface, liquidity pools
4. **Multi-credential support**: Combine multiple proofs
5. **Mobile support**: React Native or PWA

---

## 📚 References

- [SolidKYC Documentation](../README.md)
- [circom Documentation](https://docs.circom.io/)
- [snarkjs Documentation](https://github.com/iden3/snarkjs)
- [Zero-Knowledge Proofs Explained](https://z.cash/technology/zksnarks/)
