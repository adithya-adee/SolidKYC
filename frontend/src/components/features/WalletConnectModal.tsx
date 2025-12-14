import { Wallet } from 'lucide-react'
import { Modal, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal'
import WalletButton from '@/components/wallet-button'

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="p-6">
        <ModalHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <ModalTitle className="text-center text-2xl font-bold">
            Connect Wallet
          </ModalTitle>
          <ModalDescription className="text-center">
            Connect your Solana wallet to issue credentials on the blockchain
          </ModalDescription>
        </ModalHeader>

        <div className="mt-6 flex flex-col items-center gap-4">
          <WalletButton />
          
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Supported wallets: Phantom, Solflare
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Your wallet address will be used to issue the credential
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
