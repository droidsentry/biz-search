'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ApiUsageStatsProps {
  usage: {
    api_name: string
    daily_count: number
    monthly_count: number
    is_blocked: boolean
    blocked_until: string | null
  } | null
  limits: {
    daily_limit: number
    monthly_limit: number
  } | null
}

export function ApiUsageStats({ usage, limits }: ApiUsageStatsProps) {
  const router = useRouter()
  const [stats, setStats] = useState(usage)
  
  useEffect(() => {
    // Realtime購読
    const supabase = createClient()
    const channel = supabase
      .channel('api-usage-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_global_usage',
          filter: `api_name=eq.google_custom_search`
        },
        (payload) => {
          setStats(payload.new as any)
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  const handleReset = async (type: 'daily' | 'monthly' | 'unblock') => {
    const confirmMessage = type === 'unblock' 
      ? 'ブロックを解除しますか？'
      : `${type === 'daily' ? '日次' : '月次'}カウンターをリセットしますか？`
    
    const confirm = window.confirm(confirmMessage)
    if (!confirm) return
    
    try {
      const supabase = createClient()
      let updates: any = {}
      
      if (type === 'daily') {
        updates = { daily_count: 0 }
      } else if (type === 'monthly') {
        updates = { monthly_count: 0 }
      } else if (type === 'unblock') {
        updates = { is_blocked: false, blocked_until: null }
      }
        
      const { error } = await supabase
        .from('api_global_usage')
        .update(updates)
        .eq('api_name', 'google_custom_search')
        
      if (error) {
        toast.error('リセットに失敗しました')
        return
      }
      
      const successMessage = type === 'unblock'
        ? 'ブロックを解除しました'
        : `${type === 'daily' ? '日次' : '月次'}カウンターをリセットしました`
      
      toast.success(successMessage)
      
      // ブロック解除の場合は、ローカルの状態も更新
      if (type === 'unblock' && stats) {
        setStats({
          ...stats,
          is_blocked: false,
          blocked_until: null
        })
      }
      
      router.refresh()
    } catch (error) {
      toast.error('エラーが発生しました')
    }
  }
  
  const dailyPercentage = limits ? (stats?.daily_count || 0) / limits.daily_limit * 100 : 0
  const monthlyPercentage = limits ? (stats?.monthly_count || 0) / limits.monthly_limit * 100 : 0
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>使用状況</CardTitle>
        <CardDescription>
          現在のAPI使用状況
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats?.is_blocked && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">API利用制限中</span>
            </div>
            {stats.blocked_until && (
              <p className="text-sm text-muted-foreground mt-1">
                解除予定: {new Date(stats.blocked_until).toLocaleString('ja-JP')}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">本日の使用状況</span>
              <span className="text-sm text-muted-foreground">
                {stats?.daily_count || 0} / {limits?.daily_limit || 100}
              </span>
            </div>
            <Progress value={dailyPercentage} className="h-2" />
            {dailyPercentage >= 90 && (
              <p className="text-xs text-destructive mt-1">
                日次制限に近づいています
              </p>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">今月の使用状況</span>
              <span className="text-sm text-muted-foreground">
                {stats?.monthly_count || 0} / {limits?.monthly_limit || 10000}
              </span>
            </div>
            <Progress value={monthlyPercentage} className="h-2" />
            {monthlyPercentage >= 90 && (
              <p className="text-xs text-destructive mt-1">
                月次制限に近づいています
              </p>
            )}
          </div>
        </div>
        
        <div className="pt-4 border-t space-y-2">
          <p className="text-sm text-muted-foreground">管理者アクション</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReset('daily')}
            >
              日次リセット
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReset('monthly')}
            >
              月次リセット
            </Button>
            {stats?.is_blocked && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReset('unblock')}
              >
                ブロック解除
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}