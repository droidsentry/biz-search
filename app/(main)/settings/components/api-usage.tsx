'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppConfig } from '@/app.config'
import { Progress } from '@/components/ui/progress'
import { 
  DocumentMagnifyingGlassIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { getApiUsageStats } from '../actions/api-usage'
import type { DailyApiUsage, MonthlyApiUsage } from '../actions/api-usage'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { GoogleSearchUsageChart } from './google-search-usage-chart'

interface ApiMetric {
  name: string
  icon: React.ComponentType<{ className?: string }>
  used: number
  limit: number
  unit: string
  status: 'active' | 'warning' | 'danger' | 'inactive'
  description: string
}

export function ApiUsage() {
  const [googleSearchMetric, setGoogleSearchMetric] = useState<ApiMetric>({
    name: 'Google Custom Search API',
    icon: DocumentMagnifyingGlassIcon,
    used: 0,
    limit: AppConfig.api.googleCustomSearch.dailyLimit,
    unit: 'リクエスト',
    status: 'inactive',
    description: '本日の検索リクエスト数'
  })
  const [monthlyStats, setMonthlyStats] = useState<MonthlyApiUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  
  // 今日の時間別データ（デモ用）
  const [hourlyData] = useState(() => {
    const hours = []
    const now = new Date()
    const currentHour = now.getHours()
    
    for (let i = 0; i <= currentHour; i++) {
      hours.push({
        hour: `${i}時`,
        requests: Math.floor(Math.random() * 50) + 10
      })
    }
    return hours
  })

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { daily, monthly } = await getApiUsageStats()
        
        setGoogleSearchMetric(prev => ({
          ...prev,
          used: daily.used,
          limit: daily.limit,
          status: daily.status
        }))
        
        setMonthlyStats(monthly)
      } catch (error) {
        console.error('API使用状況の取得に失敗しました:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsage()

    // Supabaseリアルタイム接続を設定
    const supabase = createClient()
    
    // search_api_logsテーブルの変更を監視
    const channel = supabase
      .channel('api-usage-monitor')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'search_api_logs',
          filter: 'status_code=eq.200'
        },
        (payload) => {
          console.log('新しいAPI呼び出しを検知:', payload)
          
          // 新しいレコードが今日のものか確認
          const createdAt = new Date(payload.new.created_at)
          const today = new Date()
          
          if (
            createdAt.getFullYear() === today.getFullYear() &&
            createdAt.getMonth() === today.getMonth() &&
            createdAt.getDate() === today.getDate()
          ) {
            // 本日の使用状況を更新
            setGoogleSearchMetric(prev => {
              const newUsed = prev.used + 1
              const percentage = (newUsed / prev.limit) * 100
              
              let newStatus: 'active' | 'warning' | 'danger' | 'inactive' = 'active'
              if (percentage >= 90) {
                newStatus = 'danger'
                // 90%超えた場合は警告
                if (prev.status !== 'danger') {
                  toast.error('API使用率が90%を超えました！')
                }
              } else if (percentage >= 70) {
                newStatus = 'warning'
                // 70%超えた場合は注意
                if (prev.status !== 'warning' && prev.status !== 'danger') {
                  toast.warning('API使用率が70%を超えました')
                }
              }
              
              return {
                ...prev,
                used: newUsed,
                status: newStatus
              }
            })

            // 月間統計も更新
            const currentMonth = today.getMonth()
            setMonthlyStats(prev => 
              prev.map((stat, index) => {
                // 現在の月のインデックスを計算（過去5ヶ月の最後が現在月）
                if (index === prev.length - 1) {
                  return {
                    ...stat,
                    requests: stat.requests + 1
                  }
                }
                return stat
              })
            )
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true)
          console.log('リアルタイム接続が確立されました')
        }
      })

    // クリーンアップ
    return () => {
      setIsRealtimeConnected(false)
      supabase.removeChannel(channel)
    }
  }, [])

  const apiMetrics: ApiMetric[] = [
    googleSearchMetric
  ]
  const getStatusBadge = (status: ApiMetric['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
            正常
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <div className="h-1.5 w-1.5 bg-amber-500 rounded-full" />
            注意
          </span>
        )
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
            <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
            警告
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            <div className="h-1.5 w-1.5 bg-gray-400 rounded-full" />
            待機中
          </span>
        )
    }
  }

  const calculatePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  return (
    <div className="space-y-6">
      {/* API使用状況カード */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {apiMetrics.map((metric) => {
          const percentage = calculatePercentage(metric.used, metric.limit)
          const Icon = metric.icon
          
          return (
            <Card key={metric.name} className="shadow-border relative overflow-hidden">
              <CardHeader className="border-b pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <CardTitle className="text-base font-normal text-gray-900 dark:text-gray-100 truncate">
                      {metric.name}
                    </CardTitle>
                  </div>
                  {metric.name === 'Google Custom Search API' && isRealtimeConnected && (
                    <div className="flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 flex-shrink-0">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        Live
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-3">
                {metric.name === 'Google Custom Search API' ? (
                  <GoogleSearchUsageChart 
                    used={metric.used}
                    limit={metric.limit}
                    status={metric.status}
                  />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {metric.description}
                      </p>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-3xl font-light text-gray-900 dark:text-gray-100">
                            {metric.used.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                            / {metric.limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-light text-gray-900 dark:text-gray-100">
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="relative">
                        <Progress 
                          value={percentage} 
                          className="h-2 bg-gray-100 dark:bg-gray-800"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {metric.unit}
                        </span>
                        {getStatusBadge(metric.status)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 月間使用履歴 */}
      <Card className="shadow-border">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle className="text-base font-normal text-gray-900 dark:text-gray-100">
                月間使用履歴
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Google Custom Search API - 過去5ヶ月
              </p>
              <ChartContainer
                config={{
                  requests: {
                    label: "リクエスト数",
                    color: "#3b82f6",
                  },
                }}
                className="h-[250px] w-full"
              >
                <AreaChart
                  accessibilityLayer
                  data={monthlyStats}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickCount={5}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="requests"
                    type="natural"
                    fill="url(#fillRequests)"
                    fillOpacity={0.4}
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {(() => {
                        const currentMonth = monthlyStats[monthlyStats.length - 1]
                        const previousMonth = monthlyStats[monthlyStats.length - 2]
                        if (currentMonth && previousMonth) {
                          const change = ((currentMonth.requests - previousMonth.requests) / previousMonth.requests) * 100
                          return (
                            <>
                              {change > 0 ? (
                                <>
                                  <span className="text-green-600 dark:text-green-400">
                                    前月比 +{change.toFixed(1)}%
                                  </span>
                                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span className="text-red-600 dark:text-red-400">
                                    前月比 {change.toFixed(1)}%
                                  </span>
                                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                  </svg>
                                </>
                              )}
                            </>
                          )
                        }
                        return null
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {monthlyStats[0]?.month} - {monthlyStats[monthlyStats.length - 1]?.month}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      月間上限
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {AppConfig.api.googleCustomSearch.monthlyLimit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API制限情報 */}
      {/* <Card>
        <CardHeader>
          <CardTitle>料金情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  種別
                </h4>
                <div className='gap-3'>
                  <div>
                    <p className="mt-1 text-2xl font-semibold">
                    Google Custom Search API
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      推定：月額 ¥9,800
                    </p>
                  </div>
                  <div>
                    <p className="mt-1 text-2xl font-semibold">
                      プロフェッショナル
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      推定：月額 ¥9,800
                    </p>
                  </div>
                  <div>
                    <p className="mt-1 text-2xl font-semibold">
                      プロフェッショナル
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      推定：月額 ¥9,800
                    </p>
                  </div>
                  <div>
                    <p className="mt-1 text-2xl font-semibold">
                      プロフェッショナル
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      推定：月額 ¥9,800
                    </p>
                  </div>
                </div>

              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  次回請求日
                </h4>
                <p className="mt-1 text-2xl font-semibold">
                  2024年6月1日
                </p>
        
              </div>
            </div>

          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}