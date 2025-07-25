'use client'

import { Button } from '@/components/ui/button'
import { Check, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { toggleInvestigationStatusAction } from '../actions'

interface InvestigationStatusButtonProps {
  ownerId: string
  initialStatus: boolean
}

export function InvestigationStatusButton({ 
  ownerId, 
  initialStatus 
}: InvestigationStatusButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(initialStatus)

  const handleToggle = async () => {
    setIsLoading(true)
    
    try {
      const result = await toggleInvestigationStatusAction(ownerId)
      
      if (result.success && result.newStatus !== undefined) {
        setIsCompleted(result.newStatus)
        toast.success(result.message)
      } else if (!result.success && result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('エラーが発生しました')
      console.error('Investigation status toggle error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isCompleted ? 'default' : 'outline'}
      className={isCompleted 
        ? 'bg-green-600 hover:bg-green-700 text-white' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          処理中...
        </span>
      ) : isCompleted ? (
        <span className="flex items-center gap-2">
          <Check className="size-4" />
          調査完了
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <AlertCircle className="size-4" />
          未完了
        </span>
      )}
    </Button>
  )
}