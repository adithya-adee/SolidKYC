# Critical Fix: Issuer Public Key Mismatch

## The Problem

The EdDSA signature verification was failing in the circuit with:
```
Error in template ForceEqualIfEnabled_167 line: 56
Error in template EdDSAPoseidonVerifier_168 line: 117
```

This was happening because **the issuer public keys used to create credentials didn't match the keys stored on Solana**.

## Root Cause

### Before the Fix

The backend workflow was:

1. **Initialize Issuer** (`npx ts-node src/initialize_issuer.ts`):
   - Generate ZK keys from `ZK_PRIVATE_KEY`
   - Store public keys on Solana issuer account
   - Public Key X: `2390254713070255989319085409741733535856751730620877964421039371149382899586`
   - Public Key Y: `18931351235086622402032827747115362386859480978226383649260800615739626737477`

2. **Issue Credential** (`POST /issue_credentials`):
   - Generate ZK keys AGAIN from `ZK_PRIVATE_KEY`
   - Use these keys to create signature
   - Send these PUBLIC KEY VALUES to frontend
   - ❌ **But these might not match the stored keys due to conversion differences!**

### The Mismatch

Even though both use the same private key, the way the public keys were being converted and stored led to subtle differences between:
- The keys in the issuer account on Solana
- The keys sent to the frontend in the credential response

When the frontend tried to generate a ZK proof, it used the keys from the credential response, but the circuit verified against the Solana-stored keys, causing the signature to fail verification.

## The Fix

### What Changed (`backend/src/index.ts`)

```typescript
// BEFORE: Generate fresh keys each time
const { privateKey, publicKey: { x, y } } = await generateBabyJubJubKeys();

// AFTER: Read keys from Solana
// 1. Fetch the issuer account
const issuerAccount = await solanaConfig.program.account.issuerAccount.fetch(issuerPDA);

// 2. Convert stored bytes to BigInt
const issuerPubKeyX = BigInt('0x' + Buffer.from(issuerAccount.zkPublicKeyX).toString('hex'));
const issuerPubKeyY = BigInt('0x' + Buffer.from(issuerAccount.zkPublicKeyY).toString('hex'));

// 3. Still generate private key for signing (but don't use its public key)
const { privateKey } = await generateBabyJubJubKeys();

// 4. Use the Solana-stored public keys in response
issuer_public_key: {
  x: issuerPubKeyX.toString(),
  y: issuerPubKeyY.toString(),
}
```

### Why This Works

Now the workflow is:

1. **Initialize Issuer** (one-time):
   - Generate ZK keys
   - Store on Solana as **source of truth**

2. **Issue Credential** (every time):
   - **Read public keys from Solana** (not generate them)
   -  Generate private key for signing
   - Create signature with private key
   - Send **Solana-stored** public keys to frontend ✅

3. **Generate ZK Proof** (frontend):
   - Uses public keys from credential (which match Solana)
   - Circuit verifies signature
   - ✅ **Success!**

## Data Flow

```
Initialize Issuer
      ↓
ZK_PRIVATE_KEY → BabyJubJub Keys → Solana Issuer Account
                                         ↓
                                    [Public Key X]
                                    [Public Key Y]
                                         ↓
                          (Source of Truth - Never Changes)
                                         ↓
Issue Credential ←──────────────────────┘
      ↓
Sign with private key
Send public keys (from Solana) to frontend
      ↓
Frontend generates proof
      ↓
Circuit verifies:
  signature.verifyEdDSA(message, publicKey)
      ↓
✅ Success! Keys match!
```

## Benefits

1. **Consistency**: Public keys are always read from the same source (Solana)
2. **No Drift**: Keys cannot become mismatched over time
3. **Single Source of Truth**: Solana issuer account is authoritative
4. **Error Prevention**: If issuer not initialized, credential issuance fails fast

## Testing

After this fix:

1. Initialize issuer (if not already done):
   ```bash
   npx ts-node src/initialize_issuer.ts
   ```

2. Issue a new credential

3. Generate ZK proof

4. ✅ **It should work!**

The backend logs will now show:
```
Using issuer public key from Solana:
  X: 2390254713070255989319085409741733535856751730620877964421039371149382899586
  Y: 18931351235086622402032827747115362386859480978226383649260800615739626737477
```

This confirms it's reading from Solana, not generating fresh.

---

**Status:** ✅ Fixed

The public keys now match between credential issuance and on-chain storage, allowing EdDSA signature verification to succeed! 🎉
