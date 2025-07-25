'use server'

import { createClient } from '@/lib/supabase/server'
import { AppConfig } from '@/app.config'

export interface DailyApiUsage {
  used: number
  limit: number
  status: 'active' | 'warning' | 'danger' | 'inactive'
}

export interface MonthlyApiUsage {
  month: string
  requests: number
}

/**
 * 本日のGoogle Custom Search API使用状況を取得
 */
export async function getDailyApiUsage(): Promise<DailyApiUsage> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { used: 0, limit: AppConfig.api.googleCustomSearch.dailyLimit, status: 'inactive' }
  }

  // グローバル統計を取得
  const { data: stats, error } = await supabase
    .rpc('get_global_api_usage_stats', {
      p_api_name: 'google_custom_search'
    })

  if (error || !stats || stats.length === 0) {
    console.error('API使用状況取得エラー:', error)
    return { used: 0, limit: AppConfig.api.googleCustomSearch.dailyLimit, status: 'inactive' }
  }

  const globalStats = stats[0]
  const used = globalStats.daily_used || 0
  const limit = globalStats.daily_limit || AppConfig.api.googleCustomSearch.dailyLimit
  const percentage = (used / limit) * 100

  let status: 'active' | 'warning' | 'danger' | 'inactive' = 'active'
  if (globalStats.is_blocked) {
    status = 'danger'
  } else if (percentage >= 90) {
    status = 'danger'
  } else if (percentage >= 70) {
    status = 'warning'
  } else if (used === 0) {
    status = 'inactive'
  }

  return { used, limit, status }
}

/**
 * 過去5ヶ月間の月間API使用状況を取得
 */
export async function getMonthlyApiUsage(): Promise<MonthlyApiUsage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const monthlyUsage: MonthlyApiUsage[] = []
  const now = new Date()

  // 過去5ヶ月分のデータを取得
  for (let i = 4; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()
    
    // 月の開始と終了日を計算
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 1)

    const { count, error } = await supabase
      .from('search_api_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())
      .lt('created_at', endOfMonth.toISOString())
      .eq('status_code', 200)

    if (error) {
      console.error(`${year}年${month + 1}月のAPI使用状況取得エラー:`, error)
      monthlyUsage.push({
        month: `${month + 1}月`,
        requests: 0
      })
    } else {
      monthlyUsage.push({
        month: `${month + 1}月`,
        requests: count || 0
      })
    }
  }

  return monthlyUsage
}

/**
 * APIの使用状況統計を取得
 */
export async function getApiUsageStats() {
  const [daily, monthly] = await Promise.all([
    getDailyApiUsage(),
    getMonthlyApiUsage()
  ])

  return {
    daily,
    monthly
  }
}