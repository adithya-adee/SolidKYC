import { useState, useEffect } from 'react'
import { Shield, Key, Plus, FolderOpen, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { PasswordModal } from '@/components/features/PasswordModal'
import { ModeToggle } from '@/components/ThemeToggle'
import { hasMasterPassword } from '@/lib/masterPassword'

interface HomePageProps {
  onCreateVault: (password: string) => void
  onAccessVault: (password: string) => void
  onNavigateToGenerateProof: () => void
}

export function HomePage({ onCreateVault, onAccessVault, onNavigateToGenerateProof }: HomePageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [vaultExists, setVaultExists] = useState(false)

  useEffect(() => {
    // Check if master password exists
    setVaultExists(hasMasterPassword())
  }, [])

  const handleCreateVault = (password: string) => {
    if (vaultExists) {
      toast.error('Vault already exists!', {
        description: 'Please use "Access Vault" to open your existing vault.',
      })
      setShowCreateModal(false)
      return
    }
    toast.success('Vault created successfully!')
    onCreateVault(password)
  }

  const handleAccessVault = (password:string) => {
    if (!vaultExists) {
      toast.error('No vault found!', {
        description: 'Please create a vault first using "Create Vault".',
      })
      setShowAccessModal(false)
      return
    }
    onAccessVault(password)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b glass">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold ">SolidKYC</h1>
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-6">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-5xl font-bold mb-4 bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Secure KYC Vault
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Store your KYC documents securely with AES-256-GCM encryption.
              Only you can access your data with your private key.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-3 gap-6 animate-slide-up">
            {/* Create Vault Card */}
            <div
              onClick={() => setShowCreateModal(true)}
              className="group cursor-pointer"
            >
              <div className="h-full p-8 rounded-xl border-2 bg-card/60 hover:shadow-2xl transition-all hover:scale-105 hover:border-primary">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-6 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Plus className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Create Vault</h3>
                    <p className="text-muted-foreground">
                      Set up a new encrypted vault to store your KYC documents
                    </p>
                  </div>
                  <Button size="lg" className="mt-4 w-full">
                    Get Started
                  </Button>
                </div>
              </div>
            </div>

            {/* Access Vault Card */}
            <div
              onClick={() => setShowAccessModal(true)}
              className="group cursor-pointer"
            >
              <div className="h-full p-8 rounded-xl border-2 bg-card/60 hover:shadow-2xl transition-all hover:scale-105 hover:border-primary">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-6 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <FolderOpen className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Access Vault</h3>
                    <p className="text-muted-foreground">
                      Open your existing vault with your private key
                    </p>
                  </div>
                  <Button size="lg" variant="secondary" className="mt-4 w-full">
                    Open Vault
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Generate Proof Card */}
            <div
              onClick={onNavigateToGenerateProof}
              className="group cursor-pointer"
            >
              <div className="h-full p-8 rounded-xl border-2 bg-card/60 hover:shadow-2xl transition-all hover:scale-105 hover:border-primary">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-6 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Fingerprint className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Generate Proof</h3>
                    <p className="text-muted-foreground">
                      Generate a ZK proof for your documents without revealing them
                    </p>
                  </div>
                  <Button size="lg" variant="secondary" className="mt-4 w-full">
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="inline-block p-3 rounded-lg bg-primary/10 mb-4">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">End-to-End Encryption</h4>
              <p className="text-sm text-muted-foreground">
                Your data is encrypted with AES-256-GCM before storage
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-block p-3 rounded-lg bg-primary/10 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Zero-Knowledge Proofs</h4>
              <p className="text-sm text-muted-foreground">
                Prove your identity without revealing personal data
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-block p-3 rounded-lg bg-primary/10 mb-4">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Local Storage</h4>
              <p className="text-sm text-muted-foreground">
                All data stored locally in your browser's IndexedDB
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <PasswordModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateVault}
        title="Create New Vault"
        description="Choose a strong password to secure your vault. This will be your private key."
        mode="create"
      />

      <PasswordModal
        open={showAccessModal}
        onOpenChange={setShowAccessModal}
        onSuccess={handleAccessVault}
        title="Access Vault"
        description="Enter your private key to decrypt and access your vault"
        mode="enter"
      />
    </div>
  )
}
