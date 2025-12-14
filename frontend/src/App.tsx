import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { HomePage } from '@/pages/HomePage'
import { VaultPage } from '@/pages/VaultPage'
import { GenerateProofPage } from '@/pages/GenerateProofPage'
import { initDB } from '@/lib/encryptedDB'
import { hasMasterPassword, createMasterPassword } from '@/lib/masterPassword'
import { createSession, clearSession, hasValidSession, restorePasswordFromSession } from '@/lib/sessionManager'
import './index.css'

type AppView = 'home' | 'vault' | 'generateProof'

function App() {
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [isRestoringSession, setIsRestoringSession] = useState(true)

  useEffect(() => {
    // Initialize IndexedDB and check for existing session
    const initialize = async () => {
      try {
        await initDB()
        console.log('IndexedDB initialized')
        
        // Check for existing valid session
        if (hasValidSession() && hasMasterPassword()) {
          toast.info('Restoring session...')
          
          // Try to restore password from encrypted session
          const restoredPassword = await restorePasswordFromSession()
          
          if (restoredPassword) {
            setPrivateKey(restoredPassword)
            setCurrentView('vault')
            toast.success('Session restored! Welcome back.')
          } else {
            toast.error('Failed to restore session. Please login again.')
            clearSession()
          }
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize:', error)
        toast.error('Initialization failed')
      } finally {
        setIsRestoringSession(false)
      }
    }
    
    initialize()
  }, [])

  const handleCreateVault = async (password: string) => {
    try {
      // If no master password exists, create one
      if (!hasMasterPassword()) {
        await createMasterPassword(password)
        toast.success('Master password created successfully!')
      }
      
      // Create session with encrypted password
      await createSession(password)
      
      setPrivateKey(password)
      setCurrentView('vault')
    } catch (error: any) {
      console.error('Failed to create vault:', error)
      toast.error('Failed to create vault', {
        description: error.message,
      })
    }
  }

  const handleAccessVault = async (password: string) => {
    // Password validation is already done in PasswordModal
    // Create session on successful login
    await createSession(password)
    
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
    // Clear session on logout
    clearSession()
    setPrivateKey(null)
    setCurrentView('home')
    toast.info('Logged out successfully')
  }

  if (!isInitialized || isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">
            {isRestoringSession ? 'Checking session...' : 'Initializing secure storage...'}
          </p>
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
