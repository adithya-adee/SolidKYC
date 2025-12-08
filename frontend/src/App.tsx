import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { HomePage } from '@/pages/HomePage'
import { VaultPage } from '@/pages/VaultPage'
import { GenerateProofPage } from '@/pages/GenerateProofPage'
import { initDB } from '@/lib/encryptedDB'
import './index.css'

type AppView = 'home' | 'vault' | 'generateProof'

function App() {
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>('home')

  useEffect(() => {
    // Initialize IndexedDB
    initDB()
      .then(() => {
        console.log('IndexedDB initialized')
        setIsInitialized(true)
      })
      .catch((error) => {
        console.error('Failed to initialize IndexedDB:', error)
      })
  }, [])

  const handleCreateVault = (password: string) => {
    setPrivateKey(password)
    setCurrentView('vault')
  }

  const handleAccessVault = (password: string) => {
    setPrivateKey(password)
    setCurrentView('vault')
  }

  const handleNavigateToGenerateProof = () => {
    setCurrentView('generateProof')
  }

  const handleBackToHome = () => {
    setCurrentView('home')
    setPrivateKey(null)
  }

  const handleBackToVault = () => {
    setCurrentView('vault')
  }

  const handleLogout = () => {
    setPrivateKey(null)
    setCurrentView('home')
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Initializing secure storage...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="">
        {currentView === 'home' && (
          <HomePage 
            onCreateVault={handleCreateVault}
            onAccessVault={handleAccessVault}
            onNavigateToGenerateProof={handleNavigateToGenerateProof}
          />
        )}
        
        {currentView === 'vault' && privateKey && (
          <VaultPage 
            privateKey={privateKey} 
            onLogout={handleLogout}
          />
        )}
        
        {currentView === 'generateProof' && (
          <GenerateProofPage 
            privateKey={privateKey || undefined}
            onBack={privateKey ? handleBackToVault : handleBackToHome}
          />
        )}
      </div>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </>
  )
}

export default App
