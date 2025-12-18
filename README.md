# 🔐 SolidKYC

**Privacy-Preserving Age Verification on Solana using Zero-Knowledge Proofs**

SolidKYC is a decentralized identity verification system that enables users to prove they meet age requirements (18+) without revealing their actual date of birth. Built on Solana blockchain with zk-SNARKs technology.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/?cluster=devnet)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blue)](https://www.anchor-lang.com/)

---

## 🌟 Features

- ✨ **Zero-Knowledge Proofs** - Prove age without revealing date of birth
- 🔒 **Client-Side Encryption** - Credentials encrypted in browser IndexedDB
- ⛓️ **Blockchain Verified** - Credentials stored on Solana for tamper-proof verification
- 🎯 **Privacy First** - No personal data stored on servers
- 🚀 **Fast & Cheap** - Leverages Solana's speed and low transaction costs
- 🔄 **Reusable Proofs** - Generate unlimited proofs from a single credential
- 🌐 **Integration Ready** - Easy integration for DEXs, DApps, and services

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Flow                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Connect Solana Wallet                                    │
│  2. Submit Date of Birth → Backend                           │
│  3. Backend issues signed credential → Solana Program        │
│  4. Credential stored on-chain + encrypted locally           │
│  5. Generate ZK proof (proves age ≥ 18)                      │
│  6. Verifier checks proof + on-chain data                    │
│  7. Access granted! 🎉                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Frontend** (React + Vite + TypeScript)
   - Wallet connection (Solana)
   - Encrypted credential storage (IndexedDB)
   - ZK proof generation (SnarkJS)

2. **Backend** (Node.js + Express + TypeScript)
   - Credential signing (EdDSA on BabyJubJub)
   - On-chain credential issuance
   - Proof verification

3. **Solana Program** (Rust + Anchor)
   - Issuer management
   - Credential storage
   - Credential revocation

4. **Simulation DEX** (Next.js)
   - Example integration
   - Demonstrates age-gated access

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Rust 1.75+
- Solana CLI 1.18+
- Anchor CLI 0.32+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/SolidKYC.git
cd SolidKYC

# Install dependencies for all projects
cd frontend && pnpm install && cd ..
cd backend && npm install && cd ..
cd simulation-dex && pnpm install && cd ..
cd solidkyc && yarn install && cd ..
```

### Local Development

#### 1. Start Solana Test Validator

```bash
# In terminal 1
solana-test-validator --reset
```

#### 2. Build & Deploy Solana Program

```bash
# In terminal 2
cd solidkyc
anchor build
anchor deploy
```

#### 3. Start Backend

```bash
# In terminal 3
cd backend
npm run dev
```

Backend starts on `http://localhost:3000`

#### 4. Start Frontend

```bash
# In terminal 4
cd frontend
pnpm dev
```

Frontend starts on `http://localhost:5173`

#### 5. (Optional) Start Simulation DEX

```bash
# In terminal 5
cd simulation-dex
pnpm dev
```

DEX starts on `http://localhost:3001`

---

## 🌐 Deployment

### Deploy to Devnet

See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for complete deployment guide.

**Quick Steps:**

1. **Deploy Solana Program to Devnet**
   ```bash
   solana config set --url https://api.devnet.solana.com
   solana airdrop 2
   cd solidkyc
   anchor deploy
   ```

2. **Deploy Backend to Railway**
   - Connect GitHub repo
   - Set root directory: `backend`
   - Add environment variables
   - Deploy!

3. **Deploy Frontend to Vercel**
   - Import GitHub repo
   - Set root directory: `frontend`
   - Add environment variables
   - Deploy!

**Live Demo:** [Coming Soon]

---

## 📚 Documentation

- [Deployment Guide](./RAILWAY_DEPLOY.md) - How to deploy to production
- [API Documentation](./backend/README.md) - Backend API endpoints
- [Smart Contract](./solidkyc/programs/solidkyc/src/lib.rs) - Anchor program source
- [ZK Circuit](./circuits/age_verify.circom) - Circom circuit for proof generation

---

## 🔧 Configuration

### Backend Environment Variables

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=YOUR_PROGRAM_ID

# Server
PORT=3000
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Authority
AUTHORITY_PRIVATE_KEY=[...]
ISSUER_NAME=MVP-Issuer
ZK_PRIVATE_KEY=1234567890123456789012345678901234567890
```

### Frontend Environment Variables

```bash
# API Endpoints
VITE_BACKEND_URL=http://localhost:3000
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# App Config
VITE_APP_NAME=SolidKYC
VITE_DB_NAME=SolidKYC_Vault
```

---

## 🛡️ Security Features

- ✅ **EdDSA Signatures** - BabyJubJub curve for ZK-friendly signatures
- ✅ **Client-Side Encryption** - AES-GCM with PBKDF2 key derivation
- ✅ **On-Chain Verification** - Tamper-proof credential storage
- ✅ **Proof Verification** - Multi-layer verification (circuit + on-chain)
- ✅ **Credential Expiry** - Time-bound credentials (1 hour default)
- ✅ **Revocation** - Issuer can revoke compromised credentials

---

## 🧪 Testing

### Run Tests

```bash
# Anchor program tests
cd solidkyc
anchor test

# Backend tests (coming soon)
cd backend
npm test

# Frontend tests (coming soon)
cd frontend
pnpm test
```

### Manual Testing Flow

1. **Open Frontend** → http://localhost:5173
2. **Connect Wallet** → Use a Devnet wallet
3. **Create Vault** → Set password
4. **Issue Credential** → Submit DOB (e.g., 1990-01-01)
5. **Generate Proof** → Prove you're 18+
6. **Verify** → Backend verifies proof + on-chain data
7. **Success!** ✅

---

## 🤝 Integration Guide

### For DEXs/DApps

Integrate SolidKYC age verification in 3 steps:

#### Step 1: Redirect to SolidKYC

```typescript
const solidKycUrl = 'https://solidkyc.vercel.app'
const callbackUrl = 'https://yourdex.com/verify-callback'

window.location.href = `${solidKycUrl}?callback=${encodeURIComponent(callbackUrl)}`
```

#### Step 2: Receive Proof

```typescript
// /verify-callback endpoint
app.post('/verify-callback', async (req, res) => {
  const { proof, publicInputs, holderPublicKey } = req.body
  
  // Verify proof with SolidKYC backend
  const result = await fetch('https://solidkyc-backend.railway.app/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proof, public: publicInputs, holderPublicKey })
  })
  
  const verification = await result.json()
  
  if (verification.verified) {
    // User is verified 18+!
    res.json({ success: true, redirectUrl: '/trading' })
  }
})
```

#### Step 3: Grant Access

User is verified and can access age-restricted features!

---

## 📊 Project Structure

```
SolidKYC/
├── frontend/              # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── lib/          # ZK proof generation, encryption
│   │   ├── pages/        # Main pages
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
│
├── backend/              # Node.js backend (Express + TypeScript)
│   ├── src/
│   │   ├── index.ts      # Main server
│   │   ├── verifier.ts   # Proof verification
│   │   └── solana.ts     # Solana integration
│   └── circuits/         # ZK circuit artifacts
│
├── solidkyc/             # Anchor program (Rust)
│   ├── programs/
│   │   └── solidkyc/
│   │       └── src/
│   │           └── lib.rs  # Smart contract
│   └── tests/            # Program tests
│
├── simulation-dex/       # Example DEX integration (Next.js)
│   └── src/
│       └── app/          # Next.js 14 app router
│
└── circuits/             # Circom circuits
    └── age_verify.circom # Age verification circuit
```

---

## 🎯 Roadmap

### ✅ Phase 1 - MVP (Current)
- [x] Basic credential issuance
- [x] ZK proof generation
- [x] On-chain verification
- [x] Simple frontend UI
- [x] Example DEX integration

### 🚧 Phase 2 - Enhancement (Next)
- [ ] Multiple credential types (ID, address, etc.)
- [ ] Mobile wallet support
- [ ] Batch verification
- [ ] Performance optimization
- [ ] Security audit

### 🔮 Phase 3 - Production (Future)
- [ ] Mainnet deployment
- [ ] Multi-issuer support
- [ ] Governance token
- [ ] DAO structure
- [ ] SDK for easy integration

---

## 🐛 Known Issues & Limitations

- ⚠️ **MVP Stage** - Currently for testing/demo purposes only
- ⚠️ **Devnet Only** - Not deployed to mainnet yet
- ⚠️ **No Security Audit** - Do not use with real/sensitive data
- ⚠️ **Credential Re-issuance** - Enabled for testing (should be limited in production)
- ⚠️ **Fixed Issuer** - Single issuer for MVP (multi-issuer planned)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Anchor Framework](https://www.anchor-lang.com/) - Solana smart contract framework
- [SnarkJS](https://github.com/iden3/snarkjs) - JavaScript ZK-SNARK implementation
- [Circom](https://docs.circom.io/) - Circuit compiler for ZK proofs
- [Iden3](https://iden3.io/) - ZK identity protocols and libraries
- [Solana](https://solana.com/) - High-performance blockchain

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/SolidKYC/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/SolidKYC/discussions)
- **Twitter**: [@SolidKYC](https://twitter.com/solidkyc) (if applicable)

---

## ⚖️ Disclaimer

This is an experimental project for educational and demonstration purposes. The code has not been audited and should not be used in production with real user data or funds without proper security review.

---

<div align="center">

**Built with ❤️ for a privacy-first web**

[Website](https://solidkyc.vercel.app) • [Docs](./RAILWAY_DEPLOY.md) • [Demo](https://demo.solidkyc.vercel.app)

</div>
