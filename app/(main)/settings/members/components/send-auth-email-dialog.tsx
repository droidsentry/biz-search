'use client'

import { sendAuthEmailAction } from '../actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tables } from '@/lib/types/database'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Profile = Tables<'profiles'>

interface SendAuthEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
}

export function SendAuthEmailDialog({
  open,
  onOpenChange,
  profile,
}: SendAuthEmailDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    setIsLoading(true)
    
    const result = await sendAuthEmailAction({
      userId: profile.id,
      email: profile.email,
    })
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('認証メールを送信しました')
      onOpenChange(false)
    }
    
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>認証メールを送信</DialogTitle>
          <DialogDescription>
            {profile.display_name || profile.username}（{profile.email}）に
            パスワードレス認証用のメールを送信します。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                送信中...
              </>
            ) : (
              '送信'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}