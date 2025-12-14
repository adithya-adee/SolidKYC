# Duplicate Credential Prevention Fix

## Issue
When trying to issue a credential to a wallet that already has one, the backend would fail with:
```
Allocate: account Address { address: 8iw8tV3... } already in use
Program failed: custom program error: 0x0
```

This was cryptic and didn't help users understand what was wrong.

## Root Cause

The credential PDA (Program Derived Address) is derived from:
- Holder's wallet public key
- Issuer PDA  
- Seeds: `["user_credential", holder_pubkey, issuer_pda]`

Since the derivation uses the **holder's wallet address**, each wallet can only have **ONE credential per issuer**. If you try to issue a new credential to the same wallet, it tries to create an account at the same PDA, which fails because the account already exists.

## The Fix

### Backend (`backend/src/index.ts`)

Added a check **before** attempting to create the credential:

```typescript
// Check if credential already exists for this holder
try {
  const existingCredential = await solanaConfig.program.account.userCredential.fetch(
    credentialPDA
  );
  
  if (existingCredential) {
    return res.status(409).json({
      error: "Credential already exists for this wallet",
      message: "A credential has already been issued to this wallet address...",
      credential_pda: credentialPDA.toString(),
      existing_credential: {
        issued_at: existingCredential.issuedAt.toString(),
        expires_at: existingCredential.expiresAt.toString(),
        is_revoked: existingCredential.isRevoked,
      }
    });
  }
} catch (fetchError: any) {
  // If "Account does not exist" - proceed with issuance
  if (!fetchError.message?.includes("Account does not exist")) {
    console.error("Error checking existing credential:", fetchError);
  }
  console.log("No existing credential found - proceeding");
}
```

**What this does:**
1. Tries to fetch the credential at the derived PDA
2. If found → Returns HTTP 409 (Conflict) with helpful error message
3. If not found (Account does not exist) → Proceeds with issuance
4. Includes details about the existing credential (when issued, when expires, if revoked)

### Frontend (`frontend/src/components/features/SimulateDateOfBirth.tsx`)

Improved error handling to detect and show user-friendly messages:

```typescript
if (error.message?.includes('already exists') || 
    error.message?.includes('Credential already exists')) {
  toast.error('Credential Already Exists', {
    description: 'A credential has already been issued to this wallet. Use a different wallet or wait for the existing credential to expire.',
    duration: 6000,
  })
}
```

## User Experience

### Before:
```
❌ Solana transaction failed
   Error: custom program error: 0x0
```
Users had no idea what went wrong.

### After:
```
❌ Credential Already Exists
   A credential has already been issued to this wallet. 
   Use a different wallet or wait for the existing 
   credential to expire.
```
Clear, actionable message!

## Solutions for Users

When you see "Credential Already Exists", you can:

1. **Wait for Expiration**
   - The credential will expire after 1 hour (configurable)
   - After expiry, you can issue a new one to the same wallet

2. **Use a Different Wallet**
   - Connect a different Solana wallet
   - Issue the credential to that wallet instead

3. **Revoke the Existing Credential** (if supported)
   - Call the revoke endpoint/instruction
   - Then issue a new credential

4. **Reset Test Validator** (for development only)
   - Stop the validator: `pkill -f solana-test-validator`
   - Start fresh: `solana-test-validator --reset`
   - All accounts will be cleared

## Why One Credential per Wallet?

This is by design in the Solana program:
- PDA derivation ensures deterministic addresses
- Each wallet → unique PDA
- Prevents credential duplication
- Makes credential lookup simple (just derive the PDA)

## Alternative Approaches

If you need multiple credentials per wallet, you would need to:

1. **Add a nonce/index to PDA seeds**:
   ```rust
   seeds = [b"user_credential", holder.key(), issuer.key(), &index.to_le_bytes()]
   ```
   This allows multiple credentials per wallet

2. **Use credential type in seeds**:
   ```rust
   seeds = [b"user_credential", holder.key(), issuer.key(), credential_type]
   ```
   Different types of credentials (DOB, address, etc.)

3. **Implement credential updates**:
   Instead of creating new ones, update existing credential data

For MVP, the current approach (one credential per wallet) is simpler and sufficient.

---

**Status:** ✅ Fixed

The backend now gracefully handles duplicate credential attempts and provides clear error messages to users!
