# 🔐 SolidKYC

**Privacy-Preserving Identity Verification Infrastructure on Solana**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/?cluster=devnet)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blue)](https://www.anchor-lang.com/)

> Reference implementation of a stateless verification layer where applications can verify user claims (age, residency, accreditation) without storing or accessing raw identity data.

---

## 🎯 Motivation

**Today's KYC systems centralize PII, creating honeypots and compliance risk.**

Every time an application collects and stores identity documents:

- They become a **liability target** (data breach lawsuits, regulatory fines)
- They assume **custodial risk** (GDPR, CCPA, SOC2 compliance)
- Users **lose control** of their data (repeated uploads, no revocation)
- Privacy is **structurally impossible** (raw PII must exist somewhere)

SolidKYC explores an alternative:

**What if verifiers could validate claims without ever holding raw identity data?**

This is infrastructure for **privacy-first verification** — not a replacement for all KYC, but a demonstration that stateless, zero-knowledge flows are technically feasible today.

---

## 🛠️ What It Does

SolidKYC is a working prototype that enables privacy-preserving age verification (18+) using zero-knowledge proofs on Solana.

### Core Flow

```
User submits date of birth
    ↓
Backend issues signed credential → stored on Solana
    ↓
User generates ZK proof locally (proves age ≥ 18, reveals nothing else)
    ↓
Verifier validates proof + on-chain credential signature
    ↓
Access granted — no PII stored by verifier
```

### Key Properties

- **Stateless verification** — Verifiers check proofs against on-chain data; no user database required
- **Client-side proof generation** — Credentials encrypted locally (IndexedDB); proofs never leave user's browser
- **Tamper-proof credentials** — EdDSA signatures on BabyJubJub curve, validated on-chain
- **Revocable** — Issuer can invalidate credentials; proofs fail verification immediately
- **Composable** — Reference integration shows how DEXs/DApps can consume verification

---

## 🏗️ Architecture

### High-Level Design

For detailed architecture and flow diagrams, see:
📊 **[Architecture Diagram (Excalidraw)](https://excalidraw.com/#json=your-diagram-id-here)** *(coming soon)*

### Components

| Component | Tech Stack | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + Vite + TypeScript | Credential issuance UI, ZK proof generation (SnarkJS), encrypted storage (IndexedDB) |
| **Backend** | Node.js + Express + TypeScript | Credential signing (EdDSA), on-chain issuance via Solana program |
| **Solana Program** | Rust + Anchor | Credential storage, issuer management, revocation state |
| **ZK Circuit** | Circom | Age verification circuit (proves `currentYear - birthYear ≥ 18`) |
| **Simulation DEX** | Next.js | Reference integration demonstrating age-gated access flow |

### Cryptographic Stack

- **EdDSA on BabyJubJub** — ZK-friendly signature scheme
- **Poseidon hash** — SNARK-efficient hash function
- **Groth16** — Proof system (circuit compiled via circom, proofs via SnarkJS)

---

## 🚀 Roadmap

Clear milestone-based development focused on making this infrastructure production-ready.

### ✅ Milestone 1: Stateless Verification Flow (Completed)

**Goal:** Prove that end-to-end verification without PII storage is feasible.

**Delivered:**
- ✅ Credential issuance (EdDSA-signed claims stored on Solana)
- ✅ ZK proof generation (client-side, browser-based)
- ✅ On-chain + cryptographic verification
- ✅ Reference integration (simulation-dex demonstrates consumption flow)

**Demo:** Working deployment on Devnet with video walkthrough

---

### 🟡 Milestone 2: Revocation & Expiry (Implemented, needs refinement)

**Goal:** Handle edge cases and adversarial scenarios.

**Status:** Implemented in prototype form; needs formal threat modeling, edge-case handling, and documentation.

**Planned Work:**
- [ ] Formalize revocation semantics (immediate vs. grace period)
- [ ] Optimize on-chain storage for credential expiry checks
- [ ] Document threat model and attack vectors
- [ ] Add monitoring/indexing for revoked credentials
- [ ] Write security guarantees and limitations guide

**Success Criteria:**
- Documented revocation flow that developers can reason about
- Tests covering edge cases (expired credentials, revoked signatures, replay attacks)
- Clear guidance on when revocation is checked (proof time vs. verification time)

**Estimated Duration:** 2-3 weeks

---

### 🔲 Milestone 3: Developer SDK (Planned)

**Goal:** Make integration frictionless for developers.

**Motivation:** Current integration requires manual proof verification, callback handling, and on-chain queries. This is a barrier to adoption.

**Planned Work:**
- [ ] JavaScript/TypeScript SDK with clean API
- [ ] One-line verification: `await solidkyc.verify(proof, publicInputs)`
- [ ] Automatic fallback handling (RPC errors, proof validation)
- [ ] React hooks for wallet integration
- [ ] Example projects (Next.js, Remix, vanilla TypeScript)
- [ ] Comprehensive API documentation

**Success Criteria:**
- Developer can integrate age verification in <30 lines of code
- SDK handles all cryptographic complexity
- Clear error messages and debugging surface

**Estimated Duration:** 3-4 weeks

---

### 🔲 Milestone 4: Production Hardening (Future)

**Goal:** Make SolidKYC audit-ready and operationally sound.

**Planned Work:**
- [ ] Security audit (smart contract + cryptographic implementation)
- [ ] Formal verification of circuit constraints
- [ ] Performance benchmarking (proof generation time, verification cost)
- [ ] Multi-issuer support (federated trust model)
- [ ] Mainnet deployment strategy
- [ ] Governance framework for protocol upgrades

**Success Criteria:**
- Third-party security audit with public report
- <2s client-side proof generation on median hardware
- <0.01 SOL verification cost per proof
- Documentation of trust assumptions and threat model

**Estimated Duration:** 6-8 weeks (dependent on audit timeline)

---

## 🎬 Demo & Reference Integration

### Warning: May contain visual awesomeness

https://github.com/user-attachments/assets/c73bd17e-48b6-41db-8ad7-068d098e6f72

### What This Demonstrates

- **End-to-end flow** from credential issuance → proof generation → verification
- **Real Solana integration** (transactions on Devnet)
- **Reference DEX integration** showing how third-party apps consume SolidKYC
- **Client-side encryption** with password-protected credential vault

---

## ⚙️ Getting Started

See **[SETUP.md](./SETUP.md)** for complete installation and local development instructions.

**Quick start:**
```bash
# Clone and install
git clone https://github.com/yourusername/SolidKYC.git
cd SolidKYC

# See SETUP.md for detailed steps
# You'll need: Node.js 18+, Rust, Solana CLI, Anchor CLI
```

**Live Demo:** [Coming Soon — Devnet deployment]

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** — Installation, local development, environment setup
- **[Backend API Docs](./backend/README.md)** — Endpoint documentation
- **[Raw Architecture Diagram](./docs//MVP%20Design.excalidraw)** Architecture Diagram Using Excalidraw
- **[Smart Contract Source](./solidkyc/programs/solidkyc/src/lib.rs)** — Anchor program
- **[ZK Circuit](./circuits/age_verify.circom)** — Circom age verification circuit

---

## � Security & Limitations

### Current Status

⚠️ **Experimental prototype** — not audited, not intended for production use with real user data.

### What's Implemented

- ✅ EdDSA signatures (BabyJubJub curve)
- ✅ Client-side encryption (AES-GCM with PBKDF2 key derivation)
- ✅ On-chain credential verification
- ✅ Proof verification (circuit + signature validation)
- ✅ Credential expiry (1 hour default, configurable)
- ✅ Revocation (issuer-initiated)

### Known Limitations

- **Single issuer** — Prototype uses one trusted issuer; multi-issuer support planned
- **Age verification only** — Other attributes (residency, accreditation) not yet supported
- **No formal audit** — Cryptographic implementation not independently reviewed
- **Devnet only** — Not deployed to mainnet
- **Re-issuance enabled** — For testing; should be rate-limited in production

### Threat Model (In Progress)

Formal threat model documentation is in development. Current assumptions:

- Issuer is trusted to validate identity claims before signing
- User's browser environment is not compromised
- Solana RPC endpoints are honest (no proof forgery via RPC manipulation)
- Verifiers correctly implement proof validation (SDK mitigates this)

---

## 🧑‍💻 Credibility & Execution

### What's Been Built

SolidKYC is a **reference implementation** of stateless verification infrastructure, developed fully in the open.

All components — protocol design, cryptographic flow, backend, ZK circuits, smart contracts, and reference integration — were implemented and deployed by a single contributor.

**Engineering artifacts delivered:**

- **Stateless verification flow** — Verifiers validate user claims without storing PII or long-term state
- **ZK proof-based credential verification** — Proof verifies attributes, not identity data itself
- **End-to-end working system** — Issuance → proof generation → verification, deployed on Devnet
- **Reference integration (simulation-dex)** — Demonstrates how real applications consume SolidKYC

### Feedback Received

Received feedback from early developers reviewing the architecture and integration flow. Key themes:

- **Verification flow clarity** — Requests for clearer documentation of when/where verification happens
- **Revocation handling** — Questions about revocation semantics and edge cases (addressed in Milestone 2)
- **SDK ergonomics** — Requests for easier integration APIs (addressed in Milestone 3)
- **Threat model transparency** — Developers want explicit documentation of trust assumptions

Feedback has directly shaped the roadmap prioritization.

### Open Source Commitment

SolidKYC is developed fully in the open, with all design decisions, tradeoffs, and limitations documented publicly.

- **License:** MIT (permissive, grant-compatible)
- **Repo:** Public from day one
- **Transparency:** All architectural choices and limitations documented
- **Community-first:** Built to be composable infrastructure, not a closed platform

### Solo Execution Proof

Evidence of execution capability:

- ✅ Working deployment (Devnet, accessible for testing)
- ✅ Video demo (full flow demonstration)
- ✅ Multi-component system (frontend, backend, smart contracts, ZK circuits)
- ✅ Reference integration proving composability

This is not a whitepaper project — it's running code.

---

## 🤝 Contributing

Contributions are welcome, especially:

- Circuit optimization (proof generation performance)
- Threat modeling and security review
- Integration examples (other frameworks, languages)
- Documentation improvements

**How to contribute:**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/improvement`)
3. Make changes with clear commit messages
4. Open a Pull Request with context

For major changes, please open an issue first to discuss the approach.

---

## 🙏 Acknowledgments

SolidKYC builds on excellent open-source primitives:

- **[Circom](https://docs.circom.io/)** & **[SnarkJS](https://github.com/iden3/snarkjs)** — ZK circuit tooling by Iden3
- **[Anchor](https://www.anchor-lang.com/)** — Solana smart contract framework
- **[Iden3 Cryptographic Libraries](https://iden3.io/)** — EdDSA, Poseidon, ZK identity protocols
- **[Solana](https://solana.com/)** — High-performance blockchain infrastructure

---

## � License

MIT License - see [LICENSE](./LICENSE) for details.

This is permissive, grant-compatible licensing. Use, fork, and build freely.

---

## ⚖️ Disclaimer

**Experimental prototype for research and demonstration purposes.**

This code has not been formally audited. Do not use in production with real user data or funds without independent security review.

SolidKYC demonstrates technical feasibility, not production readiness.

---

<div align="center">

**Built for a privacy-first web**

[Setup Guide](./SETUP.md) • [Raw Architecture Diagram](./docs/MVP%20Design.excalidraw) • [Issues](https://github.com/adithya-adee/SolidKYC/issues)

</div>
