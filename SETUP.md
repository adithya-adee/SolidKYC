# 🛠️ Setup & Installation Guide

Complete instructions for running SolidKYC locally.

---

## Prerequisites

Make sure you have the following installed before starting:

### Required

- **Node.js 18+** ([Download](https://nodejs.org/))
  ```bash
  node --version  # Should be 18.x or higher
  ```

- **pnpm** (or npm/yarn)
  ```bash
  npm install -g pnpm
  ```

- **Rust 1.75+** ([Install via rustup](https://rustup.rs/))
  ```bash
  rustc --version  # Should be 1.75.x or higher
  ```

- **Solana CLI 1.18+** ([Installation Guide](https://docs.solana.com/cli/install-solana-cli-tools))
  ```bash
  solana --version  # Should be 1.18.x or higher
  ```

- **Anchor CLI 0.32+** ([Installation Guide](https://www.anchor-lang.com/docs/installation))
  ```bash
  anchor --version  # Should be 0.32.x or higher
  ```

### Optional (for circuit development)

- **Circom 2.x** ([Installation](https://docs.circom.io/getting-started/installation/))
- **SnarkJS** (installed via npm in backend)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/SolidKYC.git
cd SolidKYC
```

### 2. Install Dependencies

Install dependencies for all components:

```bash
# Frontend
cd frontend
pnpm install
cd ..

# Backend
cd backend
npm install
cd ..

# Simulation DEX (optional)
cd simulation-dex
pnpm install
cd ..

# Anchor program
cd solidkyc
yarn install
cd ..
```

---

## Local Development

### Step 1: Start Solana Test Validator

Open a terminal and start the local validator:

```bash
solana-test-validator --reset
```

**Keep this running** in the background.

**Expected output:**
```
Ledger location: test-ledger
Log: test-ledger/validator.log
Identity: [pubkey]
Genesis Hash: [hash]
```

---

### Step 2: Build & Deploy Solana Program

In a new terminal:

```bash
cd solidkyc

# Build the program
anchor build

# Deploy to local validator
anchor deploy
```

**Expected output:**
```
Deploying cluster: http://localhost:8899
Program Id: [YOUR_PROGRAM_ID]
```

**Important:** Copy the `Program Id` — you'll need it for environment variables.

---

### Step 3: Configure Environment Variables

#### Backend Environment

Create `backend/.env`:

```bash
# Solana Configuration
SOLANA_RPC_URL=http://localhost:8899
PROGRAM_ID=<YOUR_PROGRAM_ID_FROM_STEP_2>

# Server Configuration
PORT=3000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

# Authority (use a test keypair for local development)
# Generate with: solana-keygen new -o authority.json
AUTHORITY_PRIVATE_KEY=[1,2,3,...]  # JSON array from authority.json

# Issuer Configuration
ISSUER_NAME=Local-Test-Issuer

# ZK Configuration (test key - DO NOT use in production)
ZK_PRIVATE_KEY=1234567890123456789012345678901234567890
```

**To generate `AUTHORITY_PRIVATE_KEY`:**

```bash
cd backend
solana-keygen new -o authority.json --no-bip39-passphrase
cat authority.json  # Copy the JSON array
```

Then paste the array into `.env`.

#### Frontend Environment

Create `frontend/.env`:

```bash
# API Endpoints
VITE_BACKEND_URL=http://localhost:3000
VITE_SOLANA_RPC_URL=http://localhost:8899

# App Configuration
VITE_APP_NAME=SolidKYC
VITE_DB_NAME=SolidKYC_Vault
```

#### Simulation DEX Environment (Optional)

Create `simulation-dex/.env`:

```bash
# Backend
BACKEND_URL=http://localhost:3000

# Frontend
FRONTEND_URL=http://localhost:5173

# Solana
SOLANA_RPC_URL=http://localhost:8899
```

---

### Step 4: Start Backend

In a new terminal:

```bash
cd backend
npm run dev
```

**Expected output:**
```
Server running on http://localhost:3000
Issuer initialized: [public key]
```

**Verify it's running:**
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok"}`

---

### Step 5: Start Frontend

In a new terminal:

```bash
cd frontend
pnpm dev
```

**Expected output:**
```
VITE ready in [time]ms
➜  Local:   http://localhost:5173/
```

**Open in browser:** http://localhost:5173

---

### Step 6: Start Simulation DEX (Optional)

For testing the reference integration:

```bash
cd simulation-dex
pnpm dev
```

**Expected output:**
```
Ready on http://localhost:3001
```

---

## Testing the Flow

### End-to-End Manual Test

1. **Open Frontend** → http://localhost:5173

2. **Connect Wallet**
   - Install [Phantom Wallet](https://phantom.app/) or [Solflare](https://solflare.com/)
   - Switch to **Localhost** network in wallet settings
   - Airdrop yourself some SOL:
     ```bash
     solana airdrop 2 <YOUR_WALLET_ADDRESS>
     ```

3. **Create Vault**
   - Click "Create Vault"
   - Set a password (use a test password like `test123`)
   - Vault created in browser's IndexedDB

4. **Issue Credential**
   - Click "Get Credential"
   - Enter date of birth (e.g., `1990-01-01` for someone 18+)
   - Backend signs credential → stores on Solana
   - Transaction confirms on local validator

5. **Generate Proof**
   - Click "Generate Proof"
   - Browser generates ZK proof (takes 2-5 seconds)
   - Proof displays on screen

6. **Verify Proof**
   - Click "Verify"
   - Backend checks proof + on-chain credential
   - Should show: ✅ **Verified**

---

## Running Tests

### Anchor Program Tests

```bash
cd solidkyc
anchor test
```

**What this does:**
- Starts test validator
- Deploys program
- Runs test suite (`tests/solidkyc.ts`)
- Shuts down validator

**Expected output:**
```
Running tests...
✓ Initialize issuer
✓ Issue credential
✓ Revoke credential
All tests passed
```

### Backend Tests (Coming Soon)

```bash
cd backend
npm test
```

### Frontend Tests (Coming Soon)

```bash
cd frontend
pnpm test
```

---

## Troubleshooting

### Common Issues

#### Issue: `anchor deploy` fails with "Insufficient funds"

**Solution:** Airdrop SOL to your deployer wallet:
```bash
solana airdrop 2
```

#### Issue: Backend can't connect to Solana validator

**Symptoms:** `Connection refused` or `fetch failed`

**Solution:**
- Check that `solana-test-validator` is running
- Verify `SOLANA_RPC_URL=http://localhost:8899` in `backend/.env`

#### Issue: Frontend shows "Wallet not connected"

**Solution:**
- Ensure wallet is set to **Localhost** network
- Refresh the browser
- Check browser console for errors

#### Issue: Proof generation takes forever or fails

**Solution:**
- Check browser console for errors
- Ensure you have `circuits/` artifacts in `backend/`
- Circuit compilation can take time on first run (30-60 seconds)

#### Issue: Transaction fails with "Custom program error: 0x0"

**Solution:**
- This usually means the program ID doesn't match
- Check `PROGRAM_ID` in `backend/.env` matches `anchor deploy` output
- Re-deploy with `anchor deploy`

---

## Project Structure

Understanding where everything lives:

```
SolidKYC/
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── lib/            # ZK proof generation, encryption
│   │   ├── pages/          # Main pages
│   │   └── types/          # TypeScript types
│   ├── .env                # Environment variables (create this)
│   └── package.json
│
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── index.ts        # Main server
│   │   ├── verifier.ts     # Proof verification logic
│   │   └── solana.ts       # Solana integration
│   ├── circuits/           # ZK circuit artifacts (wasm, zkey)
│   ├── .env                # Environment variables (create this)
│   └── package.json
│
├── solidkyc/               # Anchor program
│   ├── programs/
│   │   └── solidkyc/
│   │       └── src/
│   │           └── lib.rs  # Smart contract
│   ├── tests/              # Program tests
│   └── Anchor.toml         # Anchor config
│
├── simulation-dex/         # Example integration
│   ├── src/
│   │   └── app/           # Next.js app
│   └── .env               # Environment variables (create this)
│
└── circuits/               # Circom circuits
    └── age_verify.circom  # Age verification circuit
```

---

## Environment Variable Reference

### Backend `.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | RPC endpoint | `http://localhost:8899` |
| `PROGRAM_ID` | Deployed program address | From `anchor deploy` |
| `PORT` | Backend server port | `3000` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `AUTHORITY_PRIVATE_KEY` | Deployer keypair | JSON array from keypair file |
| `ISSUER_NAME` | Issuer identifier | `Local-Test-Issuer` |
| `ZK_PRIVATE_KEY` | EdDSA signing key | 40-digit number (test only) |

### Frontend `.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_SOLANA_RPC_URL` | Solana RPC URL | `http://localhost:8899` |
| `VITE_APP_NAME` | Application name | `SolidKYC` |
| `VITE_DB_NAME` | IndexedDB database name | `SolidKYC_Vault` |

---

## Next Steps

Once you have everything running locally:

1. **Explore the UI** — Try issuing credentials, generating proofs
2. **Check the DEX integration** — See how third-party apps consume SolidKYC
3. **Review the code** — Understand the cryptographic flow
4. **Deploy to Devnet** — See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

---

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/yourusername/SolidKYC/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/SolidKYC/discussions)
- **Documentation:** Full docs in [README.md](./README.md)

---

**Need deployment instructions?** See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for Devnet/production deployment.
