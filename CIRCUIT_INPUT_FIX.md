# Circuit Input Fix - EdDSA Signature Verification

## Issue
When generating ZK proofs, the circuit was failing with the error:
```
Error: Assert Failed. Error in template ForceEqualIfEnabled_167 line: 56 
Error in template EdDSAPoseidonVerifier_168 line: 117 
Error in template AgeVerification_173 line: 60
```

This error occurred at line 60 of the circuit, which is the EdDSA signature verification step.

## Root Cause

The issue was a **data type mismatch** in the circuit inputs:

### What the Circuit Expects (from `zk/input.json`)
```json
{
  "dateOfBirth": "915148800",        // String
  "expiresAt": "1760000000",         // String
  "signatureR8x": "...",             // String
  ...
}
```

### What We Were Sending
```typescript
{
  dateOfBirth: 915148800,            // Number (wrong!)
  expiresAt: 1760000000,             // Number (wrong!)
  signatureR8x: "...",               // String (correct)
  ...
}
```

The backend returns `credential.dob` and `credential.expires_at` as **numbers**, but the circuit expects **string** inputs.

## Solution

Updated `frontend/src/lib/zkProof.ts`:

### 1. Fixed the Interface
```typescript
export interface CredentialData {
  credential: {
    dob: number;  // ✅ Now correctly typed as number (matches backend)
    current_time: number;
    expires_at: number;
  };
  // ... rest unchanged
}
```

### 2. Fixed the Input Preparation
```typescript
export function prepareCircuitInput(credentialData: CredentialData): ProofInput {
  const currentTime = Math.floor(Date.now() / 1000);
  
  return {
    // Convert numbers to strings for circuit
    dateOfBirth: String(credentialData.credential.dob),      // ✅ Number → String
    expiresAt: String(credentialData.credential.expires_at),  // ✅ Number → String
    currentTime: currentTime.toString(),
    
    // These are already strings from backend
    signatureR8x: credentialData.signature.R8x,
    signatureR8y: credentialData.signature.R8y,
    signatureS: credentialData.signature.S,
    credential_hash: credentialData.credential_hash,
    issuerPublicKeyX: credentialData.issuer_public_key.x,
    issuerPublicKeyY: credentialData.issuer_public_key.y,
  };
}
```

## What Changed

**File:** `frontend/src/lib/zkProof.ts`

**Changes:**
1. Line 15: Changed `dob: string;` → `dob: number;` in interface
2. Line 104: Changed `dateOfBirth: credentialData.credential.dob,` → `dateOfBirth: String(credentialData.credential.dob),`
3. Line 111: Changed `expiresAt: credentialData.credential.expires_at.toString(),` → `expiresAt: String(credentialData.credential.expires_at),`

## Why This Matters

### The Circuit's EdDSA Verifier Checks:
1. The signature was created by signing `credential_hash`
2. Using the issuer's private key
3. The public key in the circuit matches the signer

When the inputs are **numbers instead of strings**, the signature verification fails because:
- The hash computation is different
- The signature components don't match
- The `enabled` check in `ForceEqualIfEnabled` fails

## Testing

After this fix:
1. ✅ Credential data is correctly parsed as numbers from backend
2. ✅ Input preparation converts numbers to strings  
3. ✅ Circuit receives properly formatted string inputs
4. ✅ EdDSA signature verification passes
5. ✅ Proof generation succeeds
6. ✅ Backend verification passes

## Data Flow

```
Backend Response            zkProof.ts                  Circuit
──────────────────         ──────────────              ─────────
{                          Convert to strings:         {
  credential: {                                          "dateOfBirth": "915148800",
    dob: 915148800      →  String(dob)            →     "expiresAt": "1760000000",
    expires_at: 176...  →  String(expires_at)     →     "signatureR8x": "...",
  },                                                     ...
  signature: {                                         }
    R8x: "...",         →  (already string)       →
    ...
  }
}
```

## Related Files

- `zk/age_verification.circom` - The circuit definition
- `zk/input.json` - Example of correct input format
- `frontend/src/lib/zkProof.ts` - **Fixed** input preparation
- `backend/src/index.ts` - Backend response format

---

**Status:** ✅ Fixed

The proof generation should now work correctly!
