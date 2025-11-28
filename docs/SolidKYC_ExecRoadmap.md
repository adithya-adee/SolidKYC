# SolidKYC — Execution Roadmap & Directory Structure

## Overview
This document defines the 2‑week execution roadmap for two engineers building the **SolidKYC MVP**, along with the recommended directory structure. The plan is optimized for:
- Clear division of responsibilities
- Parallel development
- Rapid end‑to‑end integration
- Hackathon‑friendly delivery
- ZK + Solana + Web stack with minimal blockers

---

## Team Setup
- **Engineer A** → Solana Program, ZK Circuits, Prover Integration, Backend (Axum)
- **Engineer B** → Frontend, Vault, Issuer Dashboard, Demo dApp

---

## 📆 2‑Week Execution Roadmap (12 Days Total)

# WEEK 1 — Core Architecture, ZK, Solana

## Day 1 — Setup & Project Infrastructure
**Engineer A**
- Initialize Anchor project
- Set up PDAs: ProgramConfig, IssuerRegistry, UserIdentity
- Create local validator + deployment scripts

**Engineer B**
- Initialize Next.js project
- Set up wallet adapter (Phantom/Solflare)
- Prepare folder structure: `/vault`, `/issuer`, `/verifier`, `/demo`

---

## Day 2 — Solana Program: Issuer + Identity Anchoring
**Engineer A**
- Implement:
  - `register_issuer`
  - `issue_credential`
- Add PDA initialization tests

**Engineer B**
- Start Vault Encryption Module
- AES‑256‑GCM
- Key derivation via wallet signature

---

## Day 3 — ZK Circuit Implementation
**Engineer A**
- Implement Circom/Noir circuit with:
  - Poseidon hash correctness
  - Age > threshold (timestamp arithmetic)
  - Expiry check
  - Challenge binding
  - *(Signature verification off‑circuit for MVP)*

**Engineer B**
- Build Issuer Dashboard UI
- Mock manual KYC approval → generate VC → return VC to vault

---

## Day 4 — Prover Integration (rapidsnark)
**Engineer A**
- Compile Circom → R1CS, WASM, `.zkey`
- Integrate rapidsnark
- Build reusable `generateProof()` wrapper for browser (via WASM)

**Engineer B**
- Integrate VC storage → Vault
- Validate issuer signature during VC import

---

## Day 5 — Verifier Backend (Axum)
**Engineer A**
- Implement:
  - `/request-challenge`
  - `/submit-proof`
- Solana RPC PDA queries
- Integrate ZK proof verification

**Engineer B**
- Build demo dApp flow: Challenge → Proof → Submit
- UI for “Verify Age with ZK Proof”

---

# WEEK 2 — Integration, UX, Finalization

## Day 6 — End-to-End Flow Integration
**Engineer A**
- End-to-end PDA test suite
- Issuer CLI for adding issuers / issuing test credentials

**Engineer B**
- Complete UI flow:
  - Upload docs → Approve → VC saved → Unlock vault → Generate proof

---

## Day 7 — Verification Path Polishing
**Engineer A**
- Add 30‑sec freshness check
- Challenge non‑reuse
- Implement `revocation_nonce`

**Engineer B**
- Add proving progress indicators
- Improve error feedback

---

## Day 8 — Issuer Dashboard Completion
**Engineer A**
- Add `revoke_credential`
- Add `update_expiry`

**Engineer B**
- Add issuer UI: View All Credentials
- Add revoke + update expiry actions

---

## Day 9 — Mobile Optimization
**Engineer A**
- Benchmark mobile proving
- Add fallback QR → desktop proving option

**Engineer B**
- IndexedDB reliability fixes for mobile
- Improve UI responsiveness

---

## Day 10 — Hardening & Logging
**Engineer A**
- Add RPC retry logic
- Add rate limiting for Axum API
- Add request logging middleware

**Engineer B**
- Clean redirect flows
- Add loading skeletons and polish

---

# FINAL 2 DAYS — QA + Freeze

## Day 11 — QA
Both engineers test:
- Credential issuance
- Vault encryption
- ZK proof generation
- PDA anchoring
- Challenge replay protection
- Axum verification pipeline
- Browser & mobile compatibility

---

## Day 12 — Bug Fix + Demo Prep
- Fix blocking bugs
- Prepare final demo flows
- Freeze build for hackathon submission

---

# 📁 Recommended Directory Structure
```
solidkyc/
│
├── solana-program/
│   ├── Cargo.toml
│   ├── Anchor.toml
│   ├── programs/
│   │   └── solidkyc/
│   │       ├── src/
│   │       │   ├── lib.rs
│   │       │   ├── instructions/
│   │       │   ├── state/
│   │       │   └── errors.rs
│   └── tests/
│
├── zk/
│   ├── circuits/
│   │   ├── age.circom
│   │   └── poseidon.circom
│   ├── build/
│   │   ├── age.r1cs
│   │   ├── age.wasm
│   │   └── age.zkey
│   └── prover/
│       └── generateProof.js
│
├── backend-verifier/
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs
│   │   ├── routes/
│   │   │   ├── challenge.rs
│   │   │   └── submit_proof.rs
│   │   ├── services/
│   │   └── solana_client.rs
│
├── frontend/
│   ├── package.json
│   ├── pages/
│   ├── components/
│   ├── vault/
│   │   ├── encrypt.ts
│   │   ├── decrypt.ts
│   │   └── storage.ts
│   ├── issuer-dashboard/
│   ├── demo-dapp/
│   └── prover/
│
└── docs/
    ├── SolidKYC_PRD.md
    ├── SolidKYC_Design.md
    └── SolidKYC_Execution_Roadmap_And_Directory_Structure.md
```

---

**End of Document**

