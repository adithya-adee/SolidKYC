import { useState } from 'react'
import { Upload, FileText, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { storeEncryptedData } from '@/lib/encryptedDB'

interface UploadDocumentCardProps {
  privateKey: string
  onUploadSuccess?: (id: number) => void
}

export function UploadDocumentCard({ privateKey, onUploadSuccess }: UploadDocumentCardProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setIsUploaded(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    if (!privateKey) {
      toast.error('Private key required')
      return
    }

    setIsUploading(true)

    try {
      // Read file as base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Data = e.target?.result

        const documentData = {
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: Date.now(),
          data: base64Data,
        }

        try {
          const id = await storeEncryptedData(
            documentData,
            privateKey,
            'document',
            {
              name: file.name,
              description: `Uploaded ${file.type} (${(file.size / 1024).toFixed(2)} KB)`,
            }
          )

          setIsUploaded(true)
          toast.success('Document encrypted and stored successfully!')
          onUploadSuccess?.(id)
          
          // Reset after 2 seconds
          setTimeout(() => {
            setFile(null)
            setIsUploaded(false)
          }, 2000)
        } catch (error) {
          console.error('Upload error:', error)
          toast.error('Failed to encrypt and store document')
        } finally {
          setIsUploading(false)
        }
      }

      reader.onerror = () => {
        toast.error('Failed to read file')
        setIsUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document')
      setIsUploading(false)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document (MVP)
        </CardTitle>
        <CardDescription>
          Upload and encrypt your KYC documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploaded ? (
                  <Check className="w-12 h-12 mb-3 text-green-500" />
                ) : (
                  <FileText className="w-12 h-12 mb-3 text-muted-foreground" />
                )}
                <p className="mb-2 text-sm text-muted-foreground">
                  {file ? (
                    <span className="font-semibold">{file.name}</span>
                  ) : (
                    <span>
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, PNG, JPG or other documents
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>

          {file && !isUploaded && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Encrypting...' : 'Upload & Encrypt'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
