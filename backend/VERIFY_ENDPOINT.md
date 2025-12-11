# Verify Endpoint - Complete Implementation

## Overview

The `/verify` endpoint performs comprehensive verification of zero-knowledge proofs for age verification credentials. It validates the proof against both on-chain Solana data and cryptographic signatures.

## Endpoint

```
POST /verify
```

## Request Body

```json
{
  "proof": { /* Groth16 proof object from snarkjs */ },
  "public": [
    "1702400000",           // currentTime (Unix timestamp)
    "1702400600",           // expiresAt (Unix timestamp)
    "12345678...",          // credential_hash (BigInt as string)
    "67890123...",          // issuerPublicKeyX (BigInt as string)
    "45678901..."           // issuerPublicKeyY (BigInt as string)
  ],
  "holderPublicKey": "HolderSolanaPublicKeyBase58"
}
```

## Verification Steps

The endpoint performs **10 comprehensive verification checks**:

### 1. **Derive Credential PDA**
- Derives the Program Derived Address for the credential
- Uses: `[b"credential", holder_pubkey, issuer_pda]`

### 2. **Fetch On-Chain Credential**
- Retrieves credential data from Solana blockchain
- ❌ Fails if credential doesn't exist

### 3. **Verify Authority**
- Fetches issuer account from blockchain
- Compares issuer's authority with expected authority from `.env`
- ❌ Fails if authority mismatch

### 4. **Verify Issuer is Active**
- Checks `issuerAccount.isActive` flag
- ❌ Fails if issuer is deactivated

### 5. **Verify Credential Not Revoked**
- Checks `credentialAccount.isRevoked` flag
- ❌ Fails if credential has been revoked

### 6. **Verify Credential Holder**
- Ensures the credential belongs to the claimed holder
- ❌ Fails if holder public key mismatch

### 7. **Verify Credential Hash**
- Compares on-chain credential hash with proof's credential hash
- ❌ Fails if hash mismatch (prevents proof replay with different credentials)

### 8. **Verify Issuer Public Key**
- Compares on-chain ZK public key with proof's issuer public key
- ❌ Fails if public key mismatch (prevents fake issuer proofs)

### 9. **Verify Expiration Time**
- Compares on-chain expiration with proof's expiration
- Checks if credential hasn't expired (server time check)
- ❌ Fails if expired or time mismatch

### 10. **Verify ZK Proof**
- Uses snarkjs Groth16 verification
- Validates all circuit constraints:
  - Credential hash correctness
  - EdDSA signature validity
  - Age >= 18 years
  - Credential not expired
- ❌ Fails if proof is invalid

## Response Format

### Success Response (200 OK)

```json
{
  "verified": true,
  "credential": {
    "holder": "HolderPublicKey...",
    "issuer": "IssuerPDAAddress...",
    "credentialHash": "abc123...",
    "issuedAt": "1702300000",
    "expiresAt": "1702400600",
    "isRevoked": false
  },
  "issuer": {
    "authority": "AuthorityPublicKey...",
    "name": "MVP-Issuer",
    "isActive": true,
    "publicKeyX": "def456...",
    "publicKeyY": "ghi789..."
  },
  "message": "All verification checks passed: ZK proof valid, credential authentic, issuer verified"
}
```

### Error Responses

#### 400 Bad Request - Invalid Input
```json
{
  "verified": false,
  "error": "Missing proof or public inputs"
}
```

#### 403 Forbidden - Verification Failed
```json
{
  "verified": false,
  "error": "Credential has been revoked"
}
```

```json
{
  "verified": false,
  "error": "Invalid issuer authority - does not match expected authority",
  "expected": "ExpectedAuthority...",
  "actual": "ActualAuthority..."
}
```

#### 404 Not Found - Credential Not Found
```json
{
  "verified": false,
  "error": "Credential not found on-chain",
  "details": "Account does not exist"
}
```

#### 500 Internal Server Error
```json
{
  "verified": false,
  "error": "Solana not configured. Please check environment variables."
}
```

## Security Checks Matrix

| Check | Purpose | Attack Prevented |
|-------|---------|------------------|
| PDA Derivation | Ensure correct credential account | Account spoofing |
| Authority Verification | Validate issuer authority | Unauthorized issuers |
| Active Issuer Check | Ensure issuer is operational | Deactivated issuer abuse |
| Revocation Check | Prevent revoked credential use | Revoked credential replay |
| Holder Verification | Confirm credential ownership | Credential theft |
| Credential Hash Match | Link proof to specific credential | Proof replay attacks |
| Issuer Public Key Match | Verify signing authority | Fake issuer proofs |
| Expiration Verification | Enforce time constraints | Expired credential use |
| Server Time Check | Real-time expiration validation | Time manipulation |
| ZK Proof Verification | Validate cryptographic proof | Invalid proofs, age fraud |

## Circuit Public Inputs

The circuit expects exactly 5 public inputs in this order:

1. **currentTime**: Unix timestamp when proof was generated
2. **expiresAt**: Unix timestamp when credential expires
3. **credential_hash**: Poseidon hash of the credential
4. **issuerPublicKeyX**: X coordinate of issuer's BabyJubJub public key
5. **issuerPublicKeyY**: Y coordinate of issuer's BabyJubJub public key

These must match the on-chain data stored in the credential account.

## Example Usage

```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "proof": { ... },
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

## Console Output (Success)

```
=== Starting Verification Process ===
Credential PDA: 8ZkW...
Credential account fetched successfully
✓ Authority verified
✓ Issuer is active
✓ Credential not revoked
✓ Credential holder verified
✓ Credential hash verified
✓ Issuer public key verified
✓ Expiry time verified
✓ Credential not expired
Verifying ZK proof...
✓ ZK proof verified

=== ✓ ALL VERIFICATION CHECKS PASSED ===
```

## Integration Notes

1. **Frontend Integration**: The frontend should:
   - Generate the ZK proof with snarkjs
   - Extract public inputs from the proof generation
   - Send all required fields in the request

2. **Verification Key**: Must be present at `/backend/public/verification_key.json`

3. **Solana Connection**: Backend must be connected to the same Solana cluster where credentials were issued

## Error Handling

The endpoint returns appropriate HTTP status codes:
- `200`: Verification successful
- `400`: Invalid request (missing/malformed data)
- `403`: Verification failed (security checks failed)
- `404`: Credential or issuer not found
- `500`: Server error (configuration, Solana connection)

## Next Steps

To test the endpoint:
1. Ensure Solana localnet is running
2. Issue a credential using `/issue_credentials`
3. Generate a ZK proof using the ZK circuit
4. Call `/verify` with the proof, public inputs, and holder public key
