'use server'

import { createClient } from '@/lib/supabase/server'

export interface DailyApiUsage {
  used: number
  limit: number
  status: 'active' | 'warning' | 'danger' | 'inactive'
}

export interface MonthlyApiUsage {
  month: string
  requests: number
}

export interface ApiStats {
  apiName: string
  displayName: string
  daily: DailyApiUsage
  monthly: MonthlyApiUsage[]
}

/**
 * 特定のAPIの本日の使用状況を取得
 */
export async function getDailyApiUsage(apiName: string): Promise<DailyApiUsage> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { used: 0, limit: 100, status: 'inactive' }
  }

  // グローバル統計を取得
  const { data: stats, error } = await supabase
    .rpc('get_global_api_usage_stats', {
      p_api_name: apiName
    })

  if (error || !stats || stats.length === 0) {
    console.error(`${apiName} API使用状況取得エラー:`, error)
    return { used: 0, limit: 100, status: 'inactive' }
  }

  const globalStats = stats[0]
  const used = globalStats.daily_used || 0
  const limit = globalStats.daily_limit || 100
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
export async function getMonthlyApiUsage(apiName: string): Promise<MonthlyApiUsage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const monthlyUsage: MonthlyApiUsage[] = []
  const now = new Date()

  // APIごとに異なるテーブルを使用
  let tableName: 'search_api_logs' | 'pdf_processing_logs' | 'geocoding_logs'
  
  switch (apiName) {
    case 'google_custom_search':
      tableName = 'search_api_logs'
      break
    case 'pdf_parsing':
      tableName = 'pdf_processing_logs'
      break
    case 'google_maps_geocoding':
      tableName = 'geocoding_logs'
      break
    default:
      return []
  }

  // 過去5ヶ月分のデータを取得
  for (let i = 4; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()
    
    // 月の開始と終了日を計算
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 1)

    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())
      .lt('created_at', endOfMonth.toISOString())

    // 各APIに応じたフィルタを適用
    if (apiName === 'google_custom_search') {
      query = query.eq('status_code', 200)
    } else if (apiName === 'google_maps_geocoding') {
      query = query.eq('success', true)
    }

    const { count, error } = await query

    if (error) {
      console.error(`${year}年${month + 1}月の${apiName}使用状況取得エラー:`, error)
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
 * 全APIの使用状況統計を取得
 */
export async function getAllApiUsageStats(): Promise<ApiStats[]> {
  const apis = [
    { name: 'google_custom_search', displayName: 'Google Custom Search API' },
    { name: 'pdf_parsing', displayName: 'PDF解析処理' },
    { name: 'google_maps_geocoding', displayName: 'Google Maps Geocoding API' }
  ]

  const stats = await Promise.all(
    apis.map(async (api) => {
      const [daily, monthly] = await Promise.all([
        getDailyApiUsage(api.name),
        getMonthlyApiUsage(api.name)
      ])

      return {
        apiName: api.name,
        displayName: api.displayName,
        daily,
        monthly
      }
    })
  )

  return stats
}

/**
 * 旧関数（後方互換性のため残す）
 */
export async function getApiUsageStats() {
  const [daily, monthly] = await Promise.all([
    getDailyApiUsage('google_custom_search'),
    getMonthlyApiUsage('google_custom_search')
  ])

  return {
    daily,
    monthly
  }
}