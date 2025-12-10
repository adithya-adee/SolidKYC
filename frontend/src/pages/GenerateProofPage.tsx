import { useState, useEffect } from 'react'
import { Shield, ArrowLeft, FileText, CheckCircle2, Loader2, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal'
import { toast } from 'sonner'
import { getAllCredentials, getEncryptedData } from '@/lib/encryptedDB'

interface GenerateProofPageProps {
  privateKey?: string
  onBack: () => void
}

type ProofStep = 'select' | 'input' | 'generating' | 'success'

interface SelectedCredential {
  id: number
  name: string
  type: string
}

export function GenerateProofPage({ privateKey, onBack }: GenerateProofPageProps) {
  const [currentStep, setCurrentStep] = useState<ProofStep>('select')
  const [documents, setDocuments] = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<SelectedCredential | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [proofValue, setProofValue] = useState('')
  const [generatedProof, setGeneratedProof] = useState<any>(null)
  const [showProofModal, setShowProofModal] = useState(false)

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
      setDocuments(creds)
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
    }
  }

  const handleSelectDocument = (doc: any) => {
    setSelectedDoc({
      id: doc.id,
      name: doc.metadata?.name || `Document ${doc.id}`,
      type: doc.type
    })
    
    if (privateKey) {
      setCurrentStep('input')
    } else {
      setShowPasswordModal(true)
    }
  }

  const handlePasswordSubmit = () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }
    setShowPasswordModal(false)
    setCurrentStep('input')
  }

  const handleGenerateProof = async () => {
    if (!proofValue) {
      toast.error('Please enter a value to prove')
      return
    }

    if (!selectedDoc) {
      toast.error('No document selected')
      return
    }

    setCurrentStep('generating')

    try {
      // Simulate proof generation with realistic delay
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Decrypt the document to use in proof
      const key = privateKey || password
      if (key) {
        // Verify we can decrypt the document
        await getEncryptedData(selectedDoc.id, key)
        
        // Generate mock ZK proof
        const proof = {
          proof: generateMockProof(),
          publicSignals: [proofValue, Date.now().toString()],
          verificationKey: generateMockVerificationKey(),
          timestamp: Date.now(),
          documentId: selectedDoc.id,
          documentName: selectedDoc.name
        }

        setGeneratedProof(proof)
        setCurrentStep('success')
        toast.success('Zero-knowledge proof generated successfully!')
      }
    } catch (error) {
      console.error('Failed to generate proof:', error)
      toast.error('Failed to generate proof. Invalid password or corrupted data.')
      setCurrentStep('input')
    }
  }

  const generateMockProof = () => {
    // Generate a realistic-looking proof hash
    const chars = '0123456789abcdef'
    let proof = '0x'
    for (let i = 0; i < 512; i++) {
      proof += chars[Math.floor(Math.random() * chars.length)]
    }
    return proof
  }

  const generateMockVerificationKey = () => {
    const chars = '0123456789abcdef'
    let key = '0x'
    for (let i = 0; i < 64; i++) {
      key += chars[Math.floor(Math.random() * chars.length)]
    }
    return key
  }

  const handleDownloadProof = () => {
    if (!generatedProof) return

    const proofData = JSON.stringify(generatedProof, null, 2)
    const blob = new Blob([proofData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zk-proof-${Date.now()}.json`
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
    setProofValue('')
    setGeneratedProof(null)
    setPassword('')
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
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Step {currentStep === 'select' ? '1' : currentStep === 'input' ? '2' : currentStep === 'generating' ? '3' : '4'} of 4
              </div>
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
              Prove claims about your credentials without revealing the actual data
            </p>
          </div>

          {/* Step 1: Select Document */}
          {currentStep === 'select' && (
            <div className="animate-slide-up">
              <Card>
                <CardHeader>
                  <CardTitle>Select Document</CardTitle>
                  <CardDescription>
                    Choose which encrypted document to generate a proof for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No documents found</p>
                      <Button onClick={onBack}>Go Back</Button>
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
                                  {doc.metadata?.name || `Document ${doc.id}`}
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

          {/* Step 2: Input Proof Value */}
          {currentStep === 'input' && (
            <div className="animate-slide-up space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Document</CardTitle>
                  <CardDescription>
                    {selectedDoc?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{selectedDoc?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedDoc?.type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enter Proof Value</CardTitle>
                  <CardDescription>
                    Specify what you want to prove (e.g., "age &gt; 18", "country = US")
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proof-value">Claim to Prove</Label>
                    <Input
                      id="proof-value"
                      placeholder="e.g., age >= 21"
                      value={proofValue}
                      onChange={(e) => setProofValue(e.target.value)}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: "age &gt;= 21" or "country = USA"
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep('select')
                        setSelectedDoc(null)
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleGenerateProof}
                      className="flex-1"
                      disabled={!proofValue}
                    >
                      Generate Proof
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Generating */}
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
                        Creating zero-knowledge proof for: <span className="font-medium text-foreground">{proofValue}</span>
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

          {/* Step 4: Success */}
          {currentStep === 'success' && generatedProof && (
            <div className="animate-slide-up space-y-6">
              <Card className="border-green-500/50">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-green-500/10">
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Proof Generated Successfully!</h3>
                      <p className="text-muted-foreground">
                        Your zero-knowledge proof has been created
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
                    <Label className="text-xs text-muted-foreground">Document</Label>
                    <p className="font-medium">{generatedProof.documentName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Claim</Label>
                    <p className="font-medium">{proofValue}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Proof Hash (Preview)</Label>
                    <p className="font-mono text-xs bg-muted p-2 rounded truncate">
                      {generatedProof.proof.substring(0, 64)}...
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Verification Key</Label>
                    <p className="font-mono text-xs bg-muted p-2 rounded truncate">
                      {generatedProof.verificationKey}
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
        </div>
      </main>

      {/* Password Modal */}
      <Modal open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <ModalHeader>
          <ModalTitle>Enter Password</ModalTitle>
          <ModalDescription>
            Enter your private key to decrypt the document
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
    </div>
  )
}
