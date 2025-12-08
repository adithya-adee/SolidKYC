# SolidKYC Frontend

A secure, privacy-focused KYC vault built with React, TypeScript, and shadcn/ui. Features end-to-end encryption using AES-256-GCM and zero-knowledge proof capabilities.

## 🚀 Features

- **End-to-End Encryption**: All data encrypted with AES-256-GCM before storage
- **IndexedDB Storage**: Secure local storage with encrypted credentials
- **Zero-Knowledge Proofs**: Generate cryptographic proofs without revealing personal data
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Dark Mode**: Beautiful dark theme with glassmorphism effects
- **Toast Notifications**: Sonner integration for user feedback

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── modal.tsx         # Modal with background blur
│   └── features/              # Feature-specific components
│       ├── UploadDocumentCard.tsx
│       ├── GenerateZKCard.tsx
│       ├── PasswordModal.tsx
│       └── DocumentListModal.tsx
├── lib/
│   ├── utils.ts              # Utility functions (cn)
│   └── encryptedDB.ts        # AES-256-GCM encrypted IndexedDB
├── pages/
│   ├── HomePage.tsx          # Landing page with vault creation/access
│   └── VaultPage.tsx         # Main vault interface
├── types/
│   └── index.ts              # TypeScript type definitions
├── App.tsx                   # Main app component
├── main.tsx                  # Entry point
└── index.css                 # Global styles with Tailwind

## 🔐 Security Features

### AES-256-GCM Encryption

The app uses AES-256-GCM encryption with PBKDF2 key derivation:

- **Key Derivation**: PBKDF2 with 100,000 iterations and SHA-256
- **Encryption**: AES-GCM-256 with random IV and salt for each encryption
- **Storage**: Encrypted data stored in IndexedDB
- **Private Key**: Only the user with the correct private key can decrypt data

### Usage Example

```typescript
import { storeEncryptedData, getEncryptedData } from '@/lib/encryptedDB'

// Store encrypted data
const id = await storeEncryptedData(
  { name: 'John', age: 30 },
  'my-private-key',
  'user-data',
  { name: 'User Profile' }
)

// Retrieve and decrypt data
const data = await getEncryptedData(id, 'my-private-key')
```

## 🎨 Design System

### Colors

The app uses HSL-based color variables for dark mode support:

- `--primary`: Main brand color (blue)
- `--secondary`: Secondary actions
- `--destructive`: Error states
- `--muted`: Subtle backgrounds
- `--accent`: Highlights

### Components

All UI components follow the shadcn/ui pattern:

- **Composable**: Small, reusable pieces
- **Accessible**: ARIA attributes and keyboard navigation
- **Themeable**: CSS variables for easy customization
- **Type-safe**: Full TypeScript support

## 🛠️ Development

### Prerequisites

- Node.js 18+ or Bun
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build

## 📦 Dependencies

### Core
- **React 19.2** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool

### UI
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **lucide-react** - Icons
- **sonner** - Toast notifications
- **clsx + tailwind-merge** - Class name utilities

## 🔒 Privacy & Security

### Data Storage

- All data is stored locally in the browser's IndexedDB
- No data is sent to any external servers
- Each user's data is encrypted with their unique private key

### Private Key Management

- Private keys are never stored persistently
- Keys exist only in memory during the session
- Users must re-enter their key after closing the browser

## 🎯 Usage

### Creating a Vault

1. Click "Create Vault" on the home page
2. Enter a strong password (acts as private key)
3. Confirm the password
4. Your vault is created and ready to use

### Accessing a Vault

1. Click "Access Vault" on the home page
2. Enter your private key
3. View and manage your encrypted documents

### Uploading Documents

1. In the vault, click on "Upload Document"
2. Select a file from your computer
3. The file is encrypted and stored securely

### Managing Documents

1. Click "Access Indexed DB" to view all documents
2. Click "View" to decrypt and see document contents (requires private key)
3. Click the trash icon to delete documents

## 🚀 Deployment

The app can be deployed to any static hosting service:

```bash
pnpm build
# Upload the dist/ folder to your hosting service
```

Recommended platforms:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please follow the existing code style and component patterns.
