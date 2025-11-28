# SolidKYC – Product Requirements Document (PRD)

---

## 1. Product Overview

SolidKYC is a decentralized, privacy‑preserving KYC framework on Solana. It allows users to prove identity attributes (e.g., age > 18) using zero‑knowledge proofs (ZKPs) without exposing raw documents. Credentials are issued off‑chain by trusted issuers, anchored on‑chain via PDAs, and later verified by apps using ZK proofs.

---

## 2. Problem Statement

Users repeatedly complete KYC for each service. Businesses store sensitive documents, creating large security risks. Existing identity solutions lack ZK‑based selective disclosure and user‑owned storage.

Key pain points:

- Re‑uploading identity for every service
- Centralized PII storage and risk of breaches
- No control over who stores personal documents
- High compliance cost for platforms
- Web3 lacks a Solana‑native zkKYC primitive

---

## 3. Why SolidKYC

SolidKYC provides: user‑owned encrypted vault, ZK attribute proofs, Solana‑anchored trust model, zero PII on‑chain, selective disclosure, replay protection, in‑circuit signature verification, and a minimal, fast verification process.

---

## 4. Why Solana

- High throughput and low fees enabling real‑time KYC checks
- 400–500ms finality
- PDA system ideal for identity anchoring
- Ecosystem support for verifiable credentials and ZK workloads

---

## 5. Target Users

**Primary:** Crypto users (18–45), dApp developers, DeFi protocols.
**Secondary:** Hackathon builders, compliance teams.

---

## 6. Core Use Cases (MVP)

**1. Age Verification (>18)** – Prove user is legally eligible without exposing DOB.
**2. KYC Status Proof** – dApps verify if user holds a valid credential.

Future: citizenship, residency, income range, credit score bounds.

---

## 7. Unique Value Proposition

- User‑owned encrypted vault
- ZKP with signature verification inside circuit
- On‑chain issuer registry & revocation
- Credential hash anchoring (no PII)
- Replay‑safe challenges
- Timestamp freshness
- Open‑source, Solana‑native implementation

---

## 8. Functional Requirements

### 8.1 User Vault (local)

- AES‑256‑GCM encrypted identity vault
- Unlock via wallet signature
- Store Verifiable Credentials (VCs)
- Generate ZK proofs on demand
- Auto‑lock after inactivity
- No server involvement in document storage

### 8.2 Issuer Dashboard

- Manual KYC review (MVP)
- Issue VC and sign credential hash
- Push credential hash to UserIdentityPDA
- Manage revocation & expiry

### 8.3 Verifier API

- Issue challenge nonces
- Validate ZK proofs
- Query PDAs (issuer registry, identity PDA, revocation bitmap)
- Enforce 30‑second timestamp freshness
- Return structured verification result

### 8.4 Solana Program (Anchor)

Instructions:

- register\_issuer
- issue\_credential
- revoke\_credential
- update\_expiry

PDAs:

- IssuerRegistryPDA
- UserIdentityPDA
- RevocationBitmapPDA

---

## 9. Non‑Functional Requirements

**Performance:**

- Proof generation (mobile) < 5s
- Verification < 500ms
- End‑to‑end < 2s

**Security:**

- Zero PII on‑chain
- Signature verification IN‑CIRCUIT
- Challenge‑response (5min expiry)
- Vault encryption
- Expiry & revocation enforced

**Privacy:**

- Selective disclosure (e.g., only prove age)
- Unlinkability (future: nullifiers)

**Scalability:**

- 10,000 DAU (MVP)
- 100 verifications/sec per verifier instance

**Usability:**

- Mobile‑friendly
- Clear error messages
- Wallet‑based access

---

## 10. MVP Scope

### Included

- Age > 18 circuit
- User vault (web)
- Simulated issuer (manual)
- Solana PDAs + basic revocation
- Verifier API
- Demo dApp with real flow

### Excluded

- Biometrics
- Multi‑issuer aggregation
- Recursion
- Social recovery
- Multi‑chain support

---

## 11. User Flows

### Issuance Flow

1. User uploads docs → Issuer
2. Issuer validates manually
3. VC generated, signed
4. Credential hash anchored on‑chain
5. VC returned to user vault

### Proof Generation

1. dApp requests verification
2. User unlocks vault
3. User selects claim (Age > 18)
4. Vault generates proof
5. Proof returned to dApp

### Verification Flow

1. dApp submits proof + public inputs
2. Verifier validates challenge
3. Verifier checks PDAs
4. ZK verification
5. Status returned

---

## 12. ZK Circuit Requirements

Circuit verifies:

- Issuer signature (in‑circuit)
- Credential hash integrity via Poseidon hash
- Age constraint
- Expiry check
- Challenge binding

Failure cases:

- Credential expired/revoked
- Age insufficient
- Invalid signature
- Timestamp stale

---

## 13. Technical Dependencies

- Circom/Noir
- Anchor
- Solana Web3.js
- Next.js frontend
- IndexedDB storage

---

## 14. Risks & Mitigations

- Mobile proving too slow → fallback proving service
- ZK circuit bugs → formal verification & audits
- Vault key loss → warnings, future: recovery
- RPC instability → retries, backup RPCs

---

## 15. Success Metrics

MVP:

- <3s average verification
- 90%+ proof generation success
- Complete demo flow working

6‑month:

- 1000+ users
- 5+ dApp integrations

---

**Version:** PRD Draft (MVP)

