import { useState, useEffect } from 'react'
import { Shield, LogOut, Database, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IssueDOBCredentialCard } from '@/components/features/SimulateDateOfBirth'
import { GenerateZKCard } from '@/components/features/GenerateZKCard'
import { DocumentListModal } from '@/components/features/DocumentListModal'
import { toast } from 'sonner'
import { getAllCredentials, getEncryptedData, deleteCredential } from '@/lib/encryptedDB'

interface VaultPageProps {
  privateKey: string
  onLogout: () => void
}

export function VaultPage({ privateKey, onLogout }: VaultPageProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [showDocuments, setShowDocuments] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const creds = await getAllCredentials()
      setDocuments(creds)
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDocument = async (id: number) => {
    try {
      const data = await getEncryptedData(id, privateKey)
      toast.success('Document decrypted successfully!')
      console.log('Decrypted data:', data)
      
      // You could show the decrypted data in a modal here
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Failed to decrypt document:', error)
      toast.error('Failed to decrypt document. Invalid private key?')
    }
  }

  const handleDeleteDocument = async (id: number) => {
    try {
      await deleteCredential(id)
      toast.success('Document deleted successfully')
      await loadDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleUploadSuccess = async () => {
    await loadDocuments()
  }

  const filteredDocuments = selectedFilter === 'all' 
    ? documents 
    : documents.filter(doc => doc.type === selectedFilter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b glass sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">SolidKYC</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDocuments(true)}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                View All ({documents.length})
              </Button>
              <Button variant="destructive" onClick={onLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">Your Secure Vault</h2>
            <p className="text-muted-foreground">
              Manage your encrypted KYC documents and generate zero-knowledge proofs
            </p>
          </div>

          {/* Filter Section */}
          <div className="mb-6 flex items-center gap-3 animate-fade-in">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('all')}
              >
                All
              </Button>
              <Button
                variant={selectedFilter === 'VC' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('VC')}
              >
                VC
              </Button>
              <Button
                variant={selectedFilter === 'User' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('User')}
              >
                User
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-slide-up">
            <IssueDOBCredentialCard 
              privateKey={privateKey}
              onCredentialIssued={handleUploadSuccess}
            />
            <GenerateZKCard />
            
            {/* Access IndexedDB Card */}
            <Card 
              onClick={() => setShowDocuments(true)}
              className="hover:shadow-lg transition-all cursor-pointer border-2"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Access Indexed DB
                </CardTitle>
                <CardDescription>
                  View and manage your encrypted documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Database className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    {documents.length} document{documents.length !== 1 ? 's' : ''} stored
                  </p>
                  <Button className="w-full">
                    View Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Preview Grid */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">Recent Documents</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredDocuments.slice(0, 4).map((doc, index) => (
                <Card 
                  key={doc.id || index}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleViewDocument(doc.id!)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-lg bg-muted">
                        <Database className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="font-medium truncate w-full">
                          {doc.metadata?.name || `Document ${doc.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredDocuments.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No documents found. Upload your first document to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Document List Modal */}
      <DocumentListModal
        open={showDocuments}
        onOpenChange={setShowDocuments}
        documents={documents}
        onViewDocument={handleViewDocument}
        onDeleteDocument={handleDeleteDocument}
      />
    </div>
  )
}
