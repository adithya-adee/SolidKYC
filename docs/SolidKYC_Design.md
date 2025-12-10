# SolidKYC – Design Document (Condensed)

This design document consolidates and compresses the content of both the v2 Design Document and PRD while ensuring clarity, complete architecture coverage, and inclusion of required mermaid diagrams.

---

## 1. System Overview

SolidKYC is a decentralized ZK‑KYC framework on Solana. It enables selective disclosure (e.g., Age > 18) via zero‑knowledge proofs using user‑owned encrypted storage and Solana PDAs for trust anchoring.

Core components:

- Local Identity Vault (off‑chain, encrypted) - IndexedDB
- Issuer (VC creation, on‑chain anchoring)
- ZK Prover (browser/desktop)
- Solana Program (PDA registry, identity, revocation)
- Verifier API (challenge issuance, ZK verification)

---

## 2. Architecture

### 2.1 High‑Level Architecture

- **User vault** stores encrypted VCs; nothing leaves device except hashed credential & ZK proof.
- **Issuer** signs VC + anchors credential hash to UserIdentityPDA.
- **ZK circuit** verifies: signature validity, hash consistency, age constraint, expiry, challenge binding.
- **Verifier** checks ZK proof & on‑chain PDAs.

### 2.2 Component Architecture Diagram

```mermaid
flowchart TD
    subgraph UserDevice[User Device]
        A[Local Identity Vault] --> B[ZK Prover]
    end

    subgraph Issuer
        I1[Issuer Dashboard]
        I2[KYC Verification]
        I3[Credential Signer]
    end

    subgraph Solana
        S1[Issuer Registry PDA]
        S2[User Identity PDA]
        S3[Revocation Bitmap PDA]
    end

    subgraph Verifier
        V1[Verifier API]
        V2[ZK Proof Verifier]
        V3[PDA Query Service]
    end

    B -->|Submit Proof| V1
    I1 --> I2 --> I3
    I3 -->|Write Hash| S2
    I3 -->|Return VC| A
    V1 --> S1
    V1 --> S2
    V1 --> S3
    V1 --> V2
```

---

## 3. Detailed Workflows

### 3.1 Credential Issuance

1. User uploads documents → vault.
2. Vault sends docs → Issuer.
3. Issuer reviews, constructs VC, computes `credential_hash`, signs using EdDSA.
4. Issuer writes PDA: hash, issuer pubkey, issued\_at, expires\_at, revocation\_nonce.
5. VC returned to vault; signature validated locally.

Error handling: signature mismatch, Solana write failure, network retry queue.

### 3.2 Proof Generation

Inputs:

- **Private:** full VC, DOB timestamp, issuer signature.
- **Public:** credential hash, issuer pubkey, challenge nonce, current timestamp, expiry, threshold.

Circuit constraints:

- Hash integrity: Poseidon hash matches credential\_hash.
- Signature verification **inside circuit**.
- Age check using timestamp arithmetic.
- Expiry check.
- Challenge binding → prevents replay.

### 3.3 Verification

1. Validate challenge freshness & replay.
2. Query UserIdentityPDA → validate issuer, expiry, revocation nonce.
3. Verify ZK proof cryptographically.
4. Return result.

---

## 4. Solana Program Design

### 4.1 PDAs

**IssuerRegistryPDA:** admin, list of issuers. 
**UserIdentityPDA:** credential\_hash, issuer, revocation\_nonce, issued\_at, expires\_at, user. 
**RevocationBitmapPDA:** issuer, bitmap vector.

### 4.2 PDA Details & Space
1. **Program Config**:
```
pub struct ProgramConfig {
    pub admin: Pubkey,    // 32 bytes
    pub version: u8,      // 1 byte
    pub bump: u8,         // 1 byte
}

impl ProgramConfig {
    pub const SIZE: usize = 32 + 1 + 1;
}
```
2. **Issue Registry**:
```
#[account]
pub struct IssuerRegistry {
    pub admin: Pubkey,               // 32
    pub issuers: [Pubkey; 32],       // 32 * 32 = 1024
    pub count: u8,                   // how many populated entries
    pub bump: u8,                    // 1
}

impl IssuerRegistry {
    pub const SIZE: usize = 32 + (32 * 32) + 1 + 1; // ≈ 1090 bytes
}
```
3. **User Identity**:
```
#[account]
pub struct UserIdentity {
    pub owner: Pubkey,              // 32
    pub issuer: Pubkey,             // 32
    pub credential_hash: [u8; 32],  // 32
    pub revocation_nonce: u64,      // 8
    pub issued_at: i64,             // 8
    pub expires_at: i64,            // 8
    pub bump: u8,                   // 1
}

impl UserIdentity {
    pub const SIZE: usize = 32 + 32 + 32 + 8 + 8 + 8 + 1; // = 121 bytes
}

```

### 4.2 Instructions

- register\_issuer
- issue\_credential
- revoke\_credential
- update\_expiry

Validation includes issuer authority checks, expiry constraints, rent, and conflicts.

---

## 5. ZK Circuit Design

### 5.1 Inputs

Private: full VC data, DOB timestamp, EdDSA signature. Public: credential\_hash, issuer\_pubkey, challenge\_nonce, current\_timestamp, expiry, age threshold.

### 5.2 Constraints

- `verify_eddsa(issuer_pubkey, credential_hash, signature)`
- Hash check: `poseidon_hash(full_vc_data) == credential_hash`
- Age: `(current_timestamp - dob) >= threshold * 31557600`
- `current_timestamp < expiry`
- Challenge binding via Poseidon

### 5.3 Extended Circuit Notes

- Poseidon‑friendly data encoding.
- Constraint budget planned for < 120k constraints.
- Future: Merkle inclusion.

---

## 6. Off‑Chain Components

### 6.1 Local Identity Vault (IndexedDB)

- AES‑256‑GCM encrypted
- Key: derived from wallet signature
- Auto‑locking
- Stores: VCs, signatures, raw docs
- API supports store/get/list/delete + generateProof

### 6.2 Verifier Backend

- Issues challenge nonces
- Verifies ZK proofs
- Queries PDAs
- Enforces rate limits, retries RPC calls

---

## 7. Error Handling

Categories:

- Issuance errors (invalid document, RPC failure)
- Proof generation errors (credential expired, proving failure, memory exhaustion)
- Verification errors (issuer untrusted, PDA missing, timestamp stale, invalid proof)

---

## 8. Performance Targets

- Proof generation <5s mobile, <2s desktop
- Verification <500ms
- End‑to‑end <2s
- PDA query <200ms

Optimizations: Groth16, snarkjs, caching issuer registry.

---

## 9. Security Model

- No PII on‑chain
- Signature verification inside ZK circuit
- Challenge‑nonce replay protection
- Expiry + revocation enforced on‑chain + in‑circuit
- Vault key unrecoverable (documented)

Threat mitigations for forged credentials, replay attacks, compromised issuers.

---

## 10. Diagrams

### 10.1 Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Vault
    participant Prover
    participant Verifier
    participant Solana
    participant Issuer

    User->>Vault: Upload Docs
    Vault->>Issuer: Submit KYC
    Issuer->>Solana: Write Credential Hash
    Issuer->>Vault: Return VC

    User->>Verifier: Request Verification
    Verifier->>User: Send Challenge
    User->>Prover: Generate Proof
    Prover->>Verifier: Submit Proof

    Verifier->>Solana: Query PDAs
    Verifier->>Verifier: Verify ZK Proof
    Verifier->>User: Return Result
```

### 10.2 Error Flow Diagram

```mermaid
flowchart TD
    Start[Submit Proof] --> C{Challenge Valid?}
    C -- No --> E1[Challenge Expired]
    C -- Yes --> P[Query UserIdentityPDA]

    P --> F{PDA Exists?}
    F -- No --> E2[Credential Missing]
    F -- Yes --> I{Issuer Trusted?}

    I -- No --> E3[Untrusted Issuer]
    I -- Yes --> X{Expired?}

    X -- Yes --> E4[Credential Expired]
    X -- No --> R{Revoked?}

    R -- Yes --> E5[Revoked]
    R -- No --> ZK{Valid Proof?}

    ZK -- No --> E6[Invalid Proof]
    ZK -- Yes --> S[Verified]
```

---

## 11. Tech Stack

**Frontend:** Next.js, Wallet Adapter, IndexedDB **ZK:** Circom (version 2.2.3), Groth16, snarkjs **Backend**: Rust (Axum — Verifier API) **Solana:** Anchor, PDAs, Web3.js **Security:** AES‑256‑GCM vault, EdDSA signatures

---

## 12. Public Inputs (ZK → Verifier → PDA Binding)

The zero‑knowledge circuit exposes the following **public inputs**, which the
verifier uses to validate the proof against on‑chain PDAs:

```js
public_inputs = {
  credential_hash,     // SHA256/Poseidon commitment anchored in UserIdentityPDA
  issuer_pubkey,       // Matches trusted issuer in IssuerRegistryPDA
  subject_pubkey,      // User wallet binding (prevents proof reuse by others)
  revocation_nonce,    // Ensures proof matches latest on-chain revocation state
  challenge,           // Anti-replay freshness challenge from verifier
  current_timestamp,   // Bound to verifier-issued timestamp
  expires_at,          // Credential expiration (verified in-circuit)
  threshold            // Age threshold (e.g., 18 years)
}
```
---

## 13. Signature Verification Strategy

SolidKYC supports two verification modes:

### Option A — In-Circuit Signature Verification (High Privacy Mode)
- EdDSA signature on the credential is verified inside the ZK circuit.
- Strongest security and privacy guarantees.
- Adds more constraints → slower proving time.

### Option B — Off-Chain Signature Verification at Issuance (MVP Mode)
- Issuer signature is verified by the Vault when storing the VC.
- ZK circuit verifies only the credential_hash.
- Much faster proof generation (<2s desktop, <5s mobile).

### MVP Choice
For the MVP, **Option B** is used for improved performance.
Signature verification inside the ZK circuit is planned for future versions.

---

## 14. PDA Size Table (Rent & Storage Overview)

| PDA Name             | Fields Included | Approx Size | Notes |
|----------------------|-----------------|-------------|----------------------------|
| ProgramConfigPDA     | admin, version  | ~34 bytes   | Very small, global config |
| IssuerRegistryPDA    | admin + 32 issuers | ~1090 bytes | Fixed-size issuer list for MVP |
| UserIdentityPDA      | owner, issuer, hash, nonce, times | ~121 bytes | Core identity anchor |
| (Optional) RevocationBitmapPDA | issuer, bitmap | 16 KB+ | Not required for MVP |

**Goal:** Keep all MVP PDAs under **1 KB** for low rent and easy maintenance.
UserIdentityPDA and ProgramConfigPDA already meet this requirement.


---

## 15. Threat Model Summary

SolidKYC enforces a strong security posture based on:
- **Zero-Knowledge Proofs:** No PII leaves the user device.
- **Issuer Trust Model:** Only issuers listed in IssuerRegistryPDA can sign credentials.
- **Replay Protection:** Challenge + timestamp + revocation_nonce prevent proof reuse.
- **Wallet Binding:** Proofs are bound to the user's public key; cannot be forwarded.
- **On-chain Anchoring:** Credential hashes + revocation state immutably stored in PDAs.

### Key Threats Mitigated

- **Forged Credential:**
  Mitigated via issuer signature verification (in-circuit or off-chain at issuance).
- **Stolen Proof Reuse:**
  Prevented using subject_pubkey binding + challenge nonce.
- **Revoked Credential Still Used:**
  Mitigated via revocation_nonce mismatch and expiry checks both in-circuit and on-chain.
- **Issuer Misbehavior:**
  Controlled via admin-managed issuer registry on-chain.
- **PII Leakage:**
  Vault encryption + no PII on-chain + ZK selective disclosure ensures safety.
- **RPC Tampering:**
  Back-end independently verifies ZK proof + PDA state, preventing false acceptance.

---

## 16. Future Enhancements

- Multi‑credential Merkle tree
- Nullifiers for unlinkability
- Mobile proving service
- Multi‑issuer federation
- Biometric ZK circuits
- Social recovery for vault
- EUDI compatibility

---

**Version:** v1 (MVP Design Document)

# STEP VERFICATION:
```mermaid
graph TB
    Start([User Wants to Prove Age ≥ 18]) --> FetchCred[User: Fetch CredentialAccount from Solana]
    
    FetchCred --> FetchIssuer[User: Fetch IssuerAccount from Solana]
    
    FetchIssuer --> PrepareInput[User: Prepare Circuit Inputs<br/>dateOfBirth, credential_hash,<br/>signatures, issuer pubkeys, timestamps]
    
    PrepareInput --> GenProof[User: Generate ZK Proof<br/>Circuit verifies: hash, signature, age ≥ 18]
    
    GenProof --> GetChallenge[User: Request Challenge/Nonce<br/>from Verifier Server]
    
    GetChallenge --> SignChallenge[User: Sign Challenge with<br/>Solana Wallet Private Key]
    
    SignChallenge --> SendData[User Sends to Verifier:<br/>1. ZK Proof<br/>2. Public Signals currentTime, expiresAt, issuerPubKeyX/Y<br/>3. User Solana Public Key<br/>4. User Signature on Challenge<br/>5. Challenge Nonce]
    
    SendData --> Verifier[Verifier Backend Receives Data]
    
    Verifier --> Step1{Step 1: Verify ZK Proof<br/>Cryptographically Valid?}
    Step1 -->|Invalid| Reject1([REJECT: Invalid ZK Proof])
    
    Step1 -->|Valid| Step2{Step 2: Verify Challenge<br/>Not Used & Not Expired?}
    Step2 -->|Invalid| Reject2([REJECT: Invalid/Used Challenge])
    
    Step2 -->|Valid| Step3{Step 3: Verify User Signature<br/>on Challenge?}
    Step3 -->|Invalid| Reject3([REJECT: Invalid Signature<br/>Not Credential Holder])
    
    Step3 -->|Valid| Step4[Step 4: Extract Public Signals<br/>currentTime, expiresAt, issuerPubKeyX/Y]
    
    Step4 --> Step5{Step 5: Check Proof Freshness<br/>currentTime within 5 min?}
    Step5 -->|No| Reject4([REJECT: Proof Too Old])
    
    Step5 -->|Yes| Step6{Step 6: Check Expiry<br/>currentTime < expiresAt?}
    Step6 -->|No| Reject5([REJECT: Credential Expired])
    
    Step6 -->|Yes| Step7[Step 7: Query Solana<br/>Find IssuerAccount by pubkeys]
    
    Step7 --> Step8{Step 8: Issuer Exists<br/>on Solana?}
    Step8 -->|No| Reject6([REJECT: Issuer Not Registered])
    
    Step8 -->|Yes| Step9{Step 9: Issuer Active?}
    Step9 -->|No| Reject7([REJECT: Issuer Revoked])
    
    Step9 -->|Yes| Step10{Step 10: Issuer PubKeys<br/>Match Solana?}
    Step10 -->|No| Reject8([REJECT: Key Mismatch])
    
    Step10 -->|Yes| Step11[Step 11: Find CredentialAccount PDA<br/>using user pubkey + issuer]
    
    Step11 --> Step12{Step 12: Credential<br/>Exists?}
    Step12 -->|No| Reject9([REJECT: No Credential Found])
    
    Step12 -->|Yes| Step13{Step 13: credential.holder ==<br/>user public key?}
    Step13 -->|No| Reject10([REJECT: Not Holder<br/>Proof Transfer Attack])
    
    Step13 -->|Yes| Step14{Step 14: Credential<br/>Revoked?}
    Step14 -->|Yes| Reject11([REJECT: Credential Revoked])
    
    Step14 -->|No| Step15[Step 15: Mark Challenge as Used]
    
    Step15 --> AllValid[All Checks Passed ✓]
    
    AllValid --> Accept([ACCEPT: User Verified as 18+])
    
    style Start fill:#e1f5ff
    style Accept fill:#c8e6c9
    style Reject1 fill:#ffcdd2
    style Reject2 fill:#ffcdd2
    style Reject3 fill:#ffcdd2
    style Reject4 fill:#ffcdd2
    style Reject5 fill:#ffcdd2
    style Reject6 fill:#ffcdd2
    style Reject7 fill:#ffcdd2
    style Reject8 fill:#ffcdd2
    style Reject9 fill:#ffcdd2
    style Reject10 fill:#ffcdd2
    style Reject11 fill:#ffcdd2
    style Verifier fill:#fff9c4
    style GenProof fill:#e1bee7
    style Step7 fill:#c5cae9
```

## PDA :
```rust
use anchor_lang::prelude::*;

#[account]
pub struct IssuerAccount {
    /// Authority that controls this issuer account (Solana Ed25519 pubkey)
    pub authority: Pubkey,                    // 32 bytes
    
    /// Baby JubJub public key X coordinate (for ZK signature verification)
    pub zk_public_key_x: [u8; 32],           // 32 bytes
    
    /// Baby JubJub public key Y coordinate (for ZK signature verification)
    pub zk_public_key_y: [u8; 32],           // 32 bytes
    
    /// Issuer name/identifier
    pub name: String,                         // 4 + len bytes
    
    /// Whether this issuer is currently active
    pub is_active: bool,                      // 1 byte
    
    /// When this issuer was registered
    pub registered_at: i64,                   // 8 bytes (Unix timestamp)
    
    /// Total credentials issued
    pub credentials_issued: u64,              // 8 bytes
    
    /// Bump seed for PDA derivation
    pub bump: u8,                            // 1 byte
}

#[account]
pub struct CredentialAccount {
    /// Owner/holder of this credential (user's Solana pubkey)
    pub holder: Pubkey,                       // 32 bytes
    
    /// Issuer who signed this credential (references IssuerAccount)
    pub issuer: Pubkey,                       // 32 bytes
    
    /// Poseidon hash of the credential data
    pub credential_hash: [u8; 32],           // 32 bytes
    
    /// Date of birth (Unix timestamp)
    pub date_of_birth: i64,                  // 8 bytes
    
    /// When credential was issued (Unix timestamp)
    pub issued_at: i64,                      // 8 bytes
    
    /// When credential expires (Unix timestamp)
    pub expires_at: i64,                     // 8 bytes
    
    /// Baby JubJub signature R8 point X coordinate
    pub zk_signature_r8x: [u8; 32],          // 32 bytes
    
    /// Baby JubJub signature R8 point Y coordinate
    pub zk_signature_r8y: [u8; 32],          // 32 bytes
    
    /// Baby JubJub signature S value
    pub zk_signature_s: [u8; 32],            // 32 bytes
    
    /// Whether this credential has been revoked
    pub is_revoked: bool,                    // 1 byte
    
    /// Bump seed for PDA derivation
    pub bump: u8,                            // 1 byte
}

// PDA Seeds for derivation
// IssuerAccount PDA: ["issuer", authority.key(), issuer.key(), bump]
// CredentialAccount PDA: ["credential", holder.key(), issuer.key(), bump]
```