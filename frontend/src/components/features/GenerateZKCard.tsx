import { useState } from 'react'
import { Key, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface GenerateZKCardProps {
  onGenerate?: () => void
}

export function GenerateZKCard({ onGenerate }: GenerateZKCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    toast.info('Generating zero-knowledge proof...')

    try {
      // Simulate ZK generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Zero-knowledge proof generated successfully!')
      onGenerate?.()
    } catch (error) {
      toast.error('Failed to generate ZK proof')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Generate ZK
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
            Generate a cryptographic proof without revealing your actual data
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate Proof'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
