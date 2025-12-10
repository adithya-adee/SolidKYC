import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface PasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (password: string) => void
  title?: string
  description?: string
  mode?: 'enter' | 'create'
}

export function PasswordModal({
  open,
  onOpenChange,
  onSuccess,
  title = 'Enter Password',
  description = 'Enter your private key to access the encrypted vault',
  mode = 'enter'
}: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!open) {
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      toast.error('Please enter a password')
      return
    }

    if (mode === 'create' && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    onSuccess(password)
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="p-6">
        <ModalHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary-foreground">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <ModalTitle className="text-center text-2xl font-bold">{title}</ModalTitle>
          <ModalDescription className="text-center">{description}</ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="password">Private Key / Password</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your private key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your private key"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-password"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="show-password" className="text-sm text-muted-foreground cursor-pointer">
              Show password
            </label>
          </div>

          <ModalFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Cancel
            </Button>
            <Button type="submit" className="w-full">
              {mode === 'create' ? 'Create Vault' : 'Access Vault'}
            </Button>
          </ModalFooter>
        </form>
      </div>
    </Modal>
  )
}
