import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Key, Sparkles, FileText, CheckCircle2, Loader2, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getAllCredentials, getEncryptedData } from '@/lib/encryptedDB'
import { validateCredentialData, generateProof, type CredentialData } from '@/lib/zkProof'
import { verifyProof as verifyProofAPI } from '@/lib/api'
import { WalletConnectModal } from './WalletConnectModal'

interface GenerateZKCardProps {
  privateKey?: string
  onGenerate?: () => void
}

interface GeneratedProofData {
  proof: any
  publicSignals: string[]
  verificationResult?: any
  timestamp: number
  credentialId: number
  credentialName: string
}

export function GenerateZKCard({ privateKey, onGenerate }: GenerateZKCardProps) {
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showProofModal, setShowProofModal] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [credentials, setCredentials] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProof, setGeneratedProof] = useState<GeneratedProofData | null>(null)
  
  const { connected, publicKey } = useWallet()

  const loadCredentials = async () => {
    try {
      const creds = await getAllCredentials()
      const kycCreds = creds.filter(doc => doc.type === 'kyc_credential')
      setCredentials(kycCreds)
    } catch (error) {
      console.error('Failed to load credentials:', error)
      toast.error('Failed to load credentials')
    }
  }

  const handleOpenModal = async () => {
    // Check wallet connection first
    if (!connected || !publicKey) {
      setShowWalletModal(true)
      toast.error('Wallet not connected', {
        description: 'Please connect your Solana wallet to generate a proof',
      })
      return
    }

    if (!privateKey) {
      toast.error('Vault not opened', {
        description: 'Please open your vault first'
      })
      return
    }

    await loadCredentials()
    setShowSelectModal(true)
  }

  const handleSelectCredential = async (credentialId: number, credentialName: string) => {
    if (!connected || !publicKey || !privateKey) {
      toast.error('Wallet not connected or vault not opened')
      return
    }

    setShowSelectModal(false)
    setIsGenerating(true)

    try {
      // Step 1: Decrypt credential
      toast.info('Decrypting credential...')
      const credentialData = await getEncryptedData(credentialId, privateKey)
      
      // Step 2: Validate credential
      if (!validateCredentialData(credentialData)) {
        throw new Error('Invalid credential data. Missing required fields for proof generation.')
      }

      toast.info('Credential validated. Generating witness...')

      // Step 3: Generate ZK proof
      const { proof, publicSignals } = await generateProof(credentialData as CredentialData)

      toast.info('Proof generated. Verifying on blockchain...')

      // Step 4: Verify proof on backend
      const verificationResult = await verifyProofAPI(
        proof,
        publicSignals,
        publicKey.toString()
      )

      if (verificationResult.verified) {
        toast.success('Zero-knowledge proof verified successfully!', {
          description: 'Your proof is valid and has been verified on-chain'
        })
        
        setGeneratedProof({
          proof,
          publicSignals,
          verificationResult,
          timestamp: Date.now(),
          credentialId,
          credentialName
        })
        
        setIsGenerating(false)
        setShowProofModal(true)
        onGenerate?.()
      } else {
        throw new Error(verificationResult.error || 'Proof verification failed')
      }

    } catch (error: any) {
      console.error('Failed to generate/verify proof:', error)
      const message = error.message || 'Failed to generate proof'
      setIsGenerating(false)
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

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2"
        onClick={handleOpenModal}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Generate ZK Proof
          </CardTitle>
          <CardDescription>
            Create zero-knowledge proofs for your credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Key className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-center text-muted-foreground max-w-xs">
              Prove you're over 18 without revealing your date of birth
            </p>
            <Button
              className="w-full"
              size="lg"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Proof...
                </>
              ) : (
                'Generate Proof'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credential Selection Modal */}
      <Modal open={showSelectModal} onOpenChange={setShowSelectModal}>
        <ModalHeader>
          <ModalTitle>Select Credential</ModalTitle>
          <ModalDescription>
            Choose which KYC credential to use for proof generation
          </ModalDescription>
        </ModalHeader>
        <div className="space-y-4">
          {credentials.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No KYC credentials found</p>
              <p className="text-sm text-muted-foreground">
                Issue a KYC credential first before generating a proof
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  onClick={() => handleSelectCredential(cred.id, cred.metadata?.name || `Credential ${cred.id}`)}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer hover:border-primary"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {cred.metadata?.name || `Credential ${cred.id}`}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {cred.type} • {new Date(cred.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Select</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowSelectModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Proof Success Modal */}
      <Modal open={showProofModal} onOpenChange={setShowProofModal}>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Proof Verified Successfully!
          </ModalTitle>
          <ModalDescription>
            Your zero-knowledge proof has been generated and verified on-chain
          </ModalDescription>
        </ModalHeader>
        <div className="space-y-4">
          {generatedProof && (
            <div className="space-y-4">
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
                <Label className="text-xs text-muted-foreground">Generated At</Label>
                <p className="font-medium">{new Date(generatedProof.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Public Signals ({generatedProof.publicSignals.length})</Label>
                <p className="font-mono text-xs bg-muted p-2 rounded">
                  {generatedProof.publicSignals.slice(0, 2).join(', ')}...
                </p>
              </div>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={handleDownloadProof}>
            <Download className="h-4 w-4 mr-2" />
            Download Proof
          </Button>
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
    </>
  )
}
