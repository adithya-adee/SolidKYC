import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Calendar as CalendarIcon, Send, Loader2, CheckCircle, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { storeEncryptedData } from '@/lib/encryptedDB'
import { issueCredential } from '@/lib/api'
import { WalletConnectModal } from './WalletConnectModal'

interface IssueDOBCredentialCardProps {
  privateKey: string
  onCredentialIssued?: (id: number) => void
}

export function IssueDOBCredentialCard({ privateKey, onCredentialIssued }: IssueDOBCredentialCardProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  
  // Get wallet connection status and public key
  const { connected, publicKey } = useWallet()

  const handleSubmit = async () => {
    // Check if wallet is connected
    if (!connected || !publicKey) {
      // Show wallet connect modal
      setShowWalletModal(true)
      toast.error('Wallet not connected', {
        description: 'Please connect your Solana wallet to continue',
      })
      return
    }

    if (!selectedDate) {
      toast.error('Please select your date of birth')
      return
    }

    if (!privateKey) {
      toast.error('Private key required')
      return
    }

    setIsProcessing(true)

    try {
      // Convert date string (YYYY-MM-DD) to Unix timestamp (seconds)
      const dateObj = new Date(selectedDate + 'T00:00:00Z') // Use UTC to avoid timezone issues
      const timestamp = Math.floor(dateObj.getTime() / 1000)
      
      const walletAddress = publicKey.toString()
      toast.info(`Issuing credential for DOB: ${selectedDate}`, {
        description: `Wallet: ${walletAddress.slice(0, 8)}...`,
      })

      // Issue credential to backend with REAL wallet public key
      const credentialResponse = await issueCredential(timestamp, walletAddress)

      toast.success('Credential issued successfully!', {
        description: `Transaction: ${credentialResponse.transaction_signature.substring(0, 16)}...`,
      })

      // Store only the credential response (as-is from backend)
      const id = await storeEncryptedData(
        credentialResponse,
        privateKey,
        'kyc_credential',
        {
          name: `KYC Credential - ${selectedDate}`,
          description: `Wallet: ${walletAddress} | Issued at ${new Date().toLocaleString()}`,
        }
      )

      setIsSuccess(true)
      toast.success('Credential stored securely!', {
        description: 'Your credential has been encrypted and saved.',
      })
      
      onCredentialIssued?.(id)

      // Reset after 3 seconds
      setTimeout(() => {
        setSelectedDate('')
        setIsSuccess(false)
      }, 3000)


    } catch (error: any) {
      console.error('Credential issuance error:', error)
      
      // Check if it's a duplicate credential error (409 Conflict)
      if (error.message?.includes('already exists') || error.message?.includes('Credential already exists')) {
        toast.error('Credential Already Exists', {
          description: 'A credential has already been issued to this wallet. Use a different wallet or wait for the existing credential to expire.',
          duration: 6000,
        })
      } else if (error.message?.includes('credential')) {
        toast.error('Backend Error', {
          description: 'Failed to issue credential. Make sure backend is running.',
        })
      } else {
        toast.error('Issuance Failed', {
          description: error.message || 'An error occurred during credential issuance',
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const maxDate = new Date().toISOString().split('T')[0] // Today
  const minDate = '1900-01-01'

  return (
    <>
      <Card className="hover:shadow-lg transition-all border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Issue KYC Credential
          </CardTitle>
          <CardDescription>
            {connected 
              ? `Connected: ${publicKey?.toString().slice(0, 8)}...${publicKey?.toString().slice(-4)}`
              : 'Enter your date of birth to issue a blockchain credential'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isSuccess ? (
              <>
                {/* Date Input - Simple HTML5 */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dob-input">Date of Birth</Label>
                  <Input
                    id="dob-input"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={maxDate}
                    min={minDate}
                    disabled={isProcessing}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Select your date of birth (YYYY-MM-DD)
                  </p>
                </div>

                {/* Wallet Status */}
                {connected && publicKey ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Credential will be issued to:</p>
                    <p className="text-sm font-mono text-foreground mt-1 break-all">
                      {publicKey.toString()}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Wallet connection required to issue credential
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                {selectedDate && (
                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Issuing Credential...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {connected ? 'Issue Credential to Blockchain' : 'Connect Wallet & Issue'}
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              /* Success State */
              <div className="flex flex-col items-center gap-3 py-6 animate-fade-in">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="text-center">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    Credential Issued!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    DOB: {selectedDate}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    Wallet: {publicKey?.toString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        open={showWalletModal} 
        onOpenChange={setShowWalletModal}
      />
    </>
  )
}
