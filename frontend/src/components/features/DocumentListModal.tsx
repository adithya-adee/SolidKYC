import { FileText, Clock, Trash2 } from 'lucide-react'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface Document {
  id: number
  type: string
  timestamp: number
  metadata?: {
    name?: string
    description?: string
  }
}

interface DocumentListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documents: Document[]
  onViewDocument?: (id: number) => void
  onDeleteDocument?: (id: number) => void
}

export function DocumentListModal({
  open,
  onOpenChange,
  documents,
  onViewDocument,
  onDeleteDocument
}: DocumentListModalProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-3xl">
      <ModalHeader>
        <ModalTitle>Stored Documents</ModalTitle>
        <ModalDescription>
          View and manage your encrypted documents
        </ModalDescription>
      </ModalHeader>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents stored yet</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-md bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {doc.metadata?.name || `Document ${doc.id}`}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {doc.metadata?.description || doc.type}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(doc.timestamp)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDocument?.(doc.id)}
                >
                  View
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDeleteDocument?.(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}
