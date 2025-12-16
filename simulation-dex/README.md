# SimDEX - Simulation Decentralized Exchange

A demonstration application showcasing **zero-knowledge proof (ZKP) based age verification** powered by SolidKYC.

## Overview

SimDEX is a privacy-first decentralized exchange simulation that requires users to verify they are 18+ years old **without revealing their actual date of birth or any personal information**. This is achieved using zero-knowledge proofs.

## How It Works

1. **User visits SimDEX** → Sees age verification gate
2. **Clicks "Verify via SolidKYC"** → Redirected to SolidKYC with callback URL
3. **User unlocks vault** → Selects credential and generates ZK proof
4. **Proof sent to DEX** → `proof.json` and `public.json` POSTed to callback URL
5. **DEX verifies proof** → Calls backend `/verify` endpoint
6. **Access granted/denied** → User sees result without sharing personal data

## 🎯 Key Features

- ✅ **Privacy-preserving**: No personal information shared
- ✅ **Zero-knowledge proofs**: Cryptographically secure age verification
- ✅ **Beautiful UI**: Modern gradient design with animations
- ✅ **Real-time feedback**: Toast notifications for user actions
- ✅ **Demonstrates ZK concept**: Educational showcase of ZKP technology

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- SolidKYC backend running on `http://localhost:3000`
- SolidKYC frontend running on `http://localhost:5173`

### Installation

```bash
# Install dependencies
npm install

# Run development server on port 3001
npm run dev
```

The DEX will be available at `http://localhost:3001`

## 🔗 Integration Flow

### DEX → SolidKYC
```
GET http://localhost:5173?callback=http://localhost:3001/verify-callback
```

### SolidKYC → DEX Callback
```
POST http://localhost:3001/verify-callback
Content-Type: application/json

{
  "proof": { ... },
  "publicInputs": ["...", "..."],
  "holderPublicKey": "..."
}
```

### DEX → Backend Verification
```
POST http://localhost:3000/verify
Content-Type: application/json

{
  "proof": { ... },
  "public": ["...", "..."],
  "holderPublicKey": "..."
}
```

## 📁 Project Structure

```
simulation-dex/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main DEX page with age verification gate
│   │   ├── verify-callback/      
│   │   │   └── route.ts          # API route to receive proof from SolidKYC
│   │   ├── layout.tsx            # Root layout with Toaster
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   └── ui/                   # shadcn/ui components
│   └── lib/
│       └── utils.ts              # Utility functions
└── package.json
```

## 🎨 Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## 🔐 Security & Privacy

This is a **simulation/demonstration** application. In a production environment:

- Use HTTPS for all communications
- Implement proper CORS policies
- Add rate limiting on endpoints
- Validate all inputs server-side
- Use secure session management

## 📝 Environment Variables

Currently hardcoded for local development. For production:

```env
NEXT_PUBLIC_SOLIDKYC_URL=http://localhost:5173
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_CALLBACK_URL=http://localhost:3001/verify-callback
```

## 🤝 Integration with SolidKYC

The SolidKYC frontend has been modified to detect callback URLs:
- When `?callback=<url>` is present in URL params
- After proof generation, it POSTs to the callback URL
- Then redirects the user back to the DEX

## 📄 License

MIT

## 🙏 Acknowledgments

Built as part of the SolidKYC zero-knowledge proof demonstration ecosystem.
