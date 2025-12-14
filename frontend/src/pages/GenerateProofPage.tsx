import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Shield, ArrowLeft, FileText, CheckCircle2, Loader2, Download, Eye, AlertTriangle, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal'
import { toast } from 'sonner'
import { getAllCredentials, getEncryptedData } from '@/lib/encryptedDB'
import { validateCredentialData, generateProof, type CredentialData } from '@/lib/zkProof'
import { verifyProof as verifyProofAPI } from '@/lib/api'
import { WalletConnectModal } from '@/components/features/WalletConnectModal'

interface GenerateProofPageProps {
  privateKey?: string
  onBack: () => void
}

type ProofStep = 'select' | 'generating' | 'success' | 'error'

interface SelectedCredential {
  id: number
  name: string
  type: string
}

interface GeneratedProofData {
  proof: any
  publicSignals: string[]
  verificationResult?: any
  timestamp: number
  credentialId: number
  credentialName: string
}

export function GenerateProofPage({ privateKey, onBack }: GenerateProofPageProps) {
  const [currentStep, setCurrentStep] = useState<ProofStep>('select')
  const [documents, setDocuments] = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<SelectedCredential | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [generatedProof, setGeneratedProof] = useState<GeneratedProofData | null>(null)
  const [showProofModal, setShowProofModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showWalletModal, setShowWalletModal] = useState(false)
  
  // Wallet connection
  const { connected, publicKey } = useWallet()

  // Load documents when component mounts
  useEffect(() => {
    loadDocuments()
    if (!privateKey) {
      toast.info('You need to open a vault to generate a proof.')
    }
  }, [privateKey])

  const loadDocuments = async () => {
    try {
      const creds = await getAllCredentials()
      // Filter only KYC credentials
      const kycCreds = creds.filter(doc => doc.type === 'kyc_credential')
      setDocuments(kycCreds)
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
    }
  }

  const handleSelectDocument = (doc: any) => {
    // Check wallet connection first
    if (!connected || !publicKey) {
      setShowWalletModal(true)
      toast.error('Wallet not connected', {
        description: 'Please connect your Solana wallet to generate a proof',
      })
      return
    }

    setSelectedDoc({
      id: doc.id,
      name: doc.metadata?.name || `Document ${doc.id}`,
      type: doc.type
    })
    
    if (privateKey) {
      handleGenerateProof(doc.id, privateKey)
    } else {
      setShowPasswordModal(true)
    }
  }

  const handlePasswordSubmit = () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }
    if (!selectedDoc) {
      toast.error('No document selected')
      return
    }
    setShowPasswordModal(false)
    handleGenerateProof(selectedDoc.id, password)
  }

  const handleGenerateProof = async (credentialId: number, key: string) => {
    if (!connected || !publicKey) {
      toast.error('Wallet not connected')
      setShowWalletModal(true)
      return
    }

    setCurrentStep('generating')
    setErrorMessage('')

    try {
      // Step 1: Decrypt the credential from IndexedDB
      toast.info('Decrypting credential...')
      const credentialData = await getEncryptedData(credentialId, key)
      
      console.log('Decrypted credential data:', credentialData)

      // Step 2: Validate the credential has all required fields
      if (!validateCredentialData(credentialData)) {
        throw new Error('Invalid credential data. This credential is missing required fields for proof generation.')
      }

      toast.info('Credential validated. Generating witness...')

      // Step 3: Generate the ZK proof
      // This will:
      // - Prepare input.json from credential data
      // - Use age_verification.wasm to generate witness
      // - Use circuit_0000.zkey to generate proof
      const { proof, publicSignals } = await generateProof(credentialData as CredentialData)

      console.log('Proof generated:', proof)
      console.log('Public signals:', publicSignals)

      toast.info('Proof generated. Verifying on blockchain...')

      // Step 4: Submit proof to backend for verification
      const verificationResult = await verifyProofAPI(
        proof,
        publicSignals,
        publicKey.toString()
      )

      console.log('Verification result:', verificationResult)

      if (verificationResult.verified) {
        toast.success('Zero-knowledge proof verified successfully!', {
          description: verificationResult.message || 'Your proof is valid and has been verified on-chain'
        })
        
        setGeneratedProof({
          proof,
          publicSignals,
          verificationResult,
          timestamp: Date.now(),
          credentialId,
          credentialName: selectedDoc?.name || `Credential ${credentialId}`
        })
        
        setCurrentStep('success')
      } else {
        throw new Error(verificationResult.error || 'Proof verification failed')
      }

    } catch (error: any) {
      console.error('Failed to generate/verify proof:', error)
      const message = error.message || 'Failed to generate proof. Please check your credential data.'
      setErrorMessage(message)
      setCurrentStep('error')
      toast.error('Proof Generation Failed', {
        description: message
      })
    }
  }

  const handleDownloadProof = () => {
    if (!generatedProof) return

    const proofData = {
      proof: generatedProof.proof,
      publicSignals: generatedProof.publicSignals,
      verification: generatedProof.verificationResult,
      metadata: {
        timestamp: generatedProof.timestamp,
        credentialId: generatedProof.credentialId,
        credentialName: generatedProof.credentialName,
        generatedAt: new Date(generatedProof.timestamp).toISOString()
      }
    }

    const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zk-proof-${generatedProof.timestamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Proof downloaded successfully!')
  }

  const handleViewProof = () => {
    setShowProofModal(true)
  }

  const handleReset = () => {
    setCurrentStep('select')
    setSelectedDoc(null)
    setGeneratedProof(null)
    setPassword('')
    setErrorMessage('')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b glass sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">SolidKYC</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {connected && publicKey ? (
                <div className="text-sm text-muted-foreground">
                  Wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-4)}
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowWalletModal(true)}
                  className="gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">Generate Zero-Knowledge Proof</h2>
            <p className="text-muted-foreground">
              Prove you are over 18 without revealing your actual date of birth
            </p>
          </div>

          {/* Step 1: Select Document */}
          {currentStep === 'select' && (
            <div className="animate-slide-up">
              <Card>
                <CardHeader>
                  <CardTitle>Select Credential</CardTitle>
                  <CardDescription>
                    Choose which KYC credential to use for proof generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No KYC credentials found</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        You need to issue a KYC credential first before generating a proof
                      </p>
                      <Button onClick={onBack}>Go Back to Vault</Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectDocument(doc)}
                          className="p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer hover:border-primary"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {doc.metadata?.name || `Credential ${doc.id}`}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {doc.type} • {new Date(doc.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost">Select</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Generating */}
          {currentStep === 'generating' && (
            <div className="animate-fade-in">
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center text-center gap-6">
                    <div className="relative">
                      <Loader2 className="h-20 w-20 text-primary animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Generating Proof...</h3>
                      <p className="text-muted-foreground max-w-md">
                        Creating zero-knowledge proof for age verification
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        This may take a few moments...
                      </p>
                    </div>
                    <div className="w-full max-w-md">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-pulse" style={{ width: '66%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Success */}
          {currentStep === 'success' && generatedProof && (
            <div className="animate-slide-up space-y-6">
              <Card className="border-green-500/50">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-green-500/10">
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Proof Verified Successfully!</h3>
                      <p className="text-muted-foreground">
                        Your zero-knowledge proof has been generated and verified on-chain
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proof Details</CardTitle>
                  <CardDescription>
                    Generated on {new Date(generatedProof.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Credential</Label>
                    <p className="font-medium">{generatedProof.credentialName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Verification Status</Label>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      ✓ {generatedProof.verificationResult?.message || 'Verified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Public Signals ({generatedProof.publicSignals.length})</Label>
                    <p className="font-mono text-xs bg-muted p-2 rounded">
                      {generatedProof.publicSignals.slice(0, 2).join(', ')}...
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleViewProof}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Proof
                    </Button>
                    <Button
                      onClick={handleDownloadProof}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Proof
                    </Button>
                  </div>

                  <Button
                    onClick={handleReset}
                    variant="secondary"
                    className="w-full"
                  >
                    Generate Another Proof
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error State */}
          {currentStep === 'error' && (
            <div className="animate-fade-in">
              <Card className="border-red-500/50">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-red-500/10">
                      <AlertTriangle className="h-16 w-16 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Proof Generation Failed</h3>
                      <p className="text-muted-foreground max-w-md">
                        {errorMessage}
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button onClick={handleReset} variant="outline">
                        Try Again
                      </Button>
                      <Button onClick={onBack}>
                        Back to Vault
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Password Modal */}
      <Modal open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <ModalHeader>
          <ModalTitle>Enter Password</ModalTitle>
          <ModalDescription>
            Enter your private key to decrypt the credential
          </ModalDescription>
        </ModalHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Private Key / Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your private key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button onClick={handlePasswordSubmit}>
            Continue
          </Button>
        </ModalFooter>
      </Modal>

      {/* View Proof Modal */}
      <Modal open={showProofModal} onOpenChange={setShowProofModal} className="max-w-4xl">
        <ModalHeader>
          <ModalTitle>Full Proof Contents</ModalTitle>
          <ModalDescription>
            Complete zero-knowledge proof data
          </ModalDescription>
        </ModalHeader>
        <div className="max-h-96 overflow-y-auto">
          <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
            {JSON.stringify(generatedProof, null, 2)}
          </pre>
        </div>
        <ModalFooter>
          <Button onClick={() => setShowProofModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        open={showWalletModal} 
        onOpenChange={setShowWalletModal}
      />
    </div>
  )
}
