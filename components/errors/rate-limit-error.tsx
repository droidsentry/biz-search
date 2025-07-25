'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface RateLimitErrorProps {
  error: {
    message: string
    rateLimitInfo?: {
      daily_used: number
      daily_limit: number
      monthly_used: number
      monthly_limit: number
      blocked_until?: string
    }
  }
}

export function RateLimitError({ error }: RateLimitErrorProps) {
  const info = error.rateLimitInfo
  
  if (!info) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>API利用制限に達しました</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            <span className="font-semibold">本日の使用状況:</span> {info.daily_used} / {info.daily_limit} 回
          </p>
          <p>
            <span className="font-semibold">今月の使用状況:</span> {info.monthly_used} / {info.monthly_limit} 回
          </p>
          {info.blocked_until && (
            <p>
              <span className="font-semibold">制限解除予定:</span> {formatDate(info.blocked_until)}
            </p>
          )}
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>APIの利用制限を増やしたい場合は、管理者にお問い合わせください。</p>
        </div>
      </AlertDescription>
    </Alert>
  )
}