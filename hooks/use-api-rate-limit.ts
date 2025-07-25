'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ApiUsageStats {
  api_name: string
  daily_used: number
  daily_limit: number
  monthly_used: number
  monthly_limit: number
  is_blocked: boolean
  blocked_until: string | null
}

export function useApiRateLimit(apiName: string = 'google_custom_search') {
  const [stats, setStats] = useState<ApiUsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const supabase = createClient()
    let channel: any
    
    const fetchStats = async () => {
      // グローバル統計を取得
      const { data, error } = await supabase
        .rpc('get_global_api_usage_stats', {
          p_api_name: apiName
        })
        
      if (!error && data && data.length > 0) {
        const globalStats = data[0]
        setStats({
          api_name: globalStats.api_name,
          daily_used: globalStats.daily_used,
          daily_limit: globalStats.daily_limit,
          monthly_used: globalStats.monthly_used,
          monthly_limit: globalStats.monthly_limit,
          is_blocked: globalStats.is_blocked,
          blocked_until: globalStats.blocked_until
        })
      }
      setIsLoading(false)
    }
    
    const setupRealtimeSubscription = async () => {
      // api_global_usageテーブルの変更を監視
      channel = supabase
        .channel('api-usage-global')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'api_global_usage',
            filter: `api_name=eq.${apiName}`
          },
          async (payload) => {
            if (payload.new) {
              // 最新の統計を再取得
              const { data } = await supabase
                .rpc('get_global_api_usage_stats', {
                  p_api_name: apiName
                })
                
              if (data && data.length > 0) {
                const globalStats = data[0]
                const newStats: ApiUsageStats = {
                  api_name: globalStats.api_name,
                  daily_used: globalStats.daily_used,
                  daily_limit: globalStats.daily_limit,
                  monthly_used: globalStats.monthly_used,
                  monthly_limit: globalStats.monthly_limit,
                  is_blocked: globalStats.is_blocked,
                  blocked_until: globalStats.blocked_until
                }
                setStats(newStats)
                
                // 警告通知
                const percentage = (newStats.daily_used / newStats.daily_limit) * 100
                if (percentage >= 90 && !newStats.is_blocked) {
                  toast.error('API使用率が90%を超えました！')
                } else if (percentage >= 70) {
                  toast.warning('API使用率が70%を超えました')
                }
                
                if (newStats.is_blocked) {
                  toast.error('API利用制限に達しました')
                }
              }
            }
          }
        )
        .subscribe()
    }
    
    fetchStats()
    setupRealtimeSubscription()
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [apiName])
  
  return { stats, isLoading }
}