'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppConfig } from '@/app.config'
import { 
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { getApiUsageStats, getAllApiUsageStats } from '../actions/api-usage'
import type { DailyApiUsage, MonthlyApiUsage, ApiStats } from '../actions/api-usage'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { GoogleSearchUsageChart } from './google-search-usage-chart'
import { PdfUsageChart } from './pdf-usage-chart'
import { GeocodingUsageChart } from './geocoding-usage-chart'

interface ApiMetric {
  name: string
  apiName?: string
  icon: React.ComponentType<{ className?: string }>
  used: number
  limit: number
  unit: string
  status: 'active' | 'warning' | 'danger' | 'inactive'
  description: string
}

export function ApiUsage() {
  const [apiStats, setApiStats] = useState<ApiStats[]>([])
  const [selectedApi, setSelectedApi] = useState<string>('google_custom_search')
  const [isLoading, setIsLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState({
    search: false,
    pdf: false,
    geocoding: false
  })
  
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
        const stats = await getAllApiUsageStats()
        setApiStats(stats)
      } catch (error) {
        console.error('API使用状況の取得に失敗しました:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsage()

    // Supabaseリアルタイム接続を設定
    const supabase = createClient()
    
    // 複数のテーブルの変更を監視
    const channels: RealtimeChannel[] = []
    
    // Google Custom Search APIの監視（search_api_logs）
    const searchChannel = supabase
      .channel('search-logs-monitor')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'search_api_logs'
        },
        (payload) => {
          console.log('Google Search APIログが追加されました:', payload)
          fetchUsage()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus(prev => ({ ...prev, search: true }))
          console.log('Google Search APIリアルタイム接続が確立されました')
        }
      })
    channels.push(searchChannel)

    // PDF解析処理の監視（pdf_processing_logs）
    const pdfChannel = supabase
      .channel('pdf-logs-monitor')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'pdf_processing_logs'
        },
        (payload) => {
          console.log('PDF処理ログが追加されました:', payload)
          fetchUsage()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus(prev => ({ ...prev, pdf: true }))
          console.log('PDF処理リアルタイム接続が確立されました')
        }
      })
    channels.push(pdfChannel)

    // Google Maps Geocoding APIの監視（geocoding_logs）
    const geocodingChannel = supabase
      .channel('geocoding-logs-monitor')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'geocoding_logs'
        },
        (payload) => {
          console.log('Geocodingログが追加されました:', payload)
          fetchUsage()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus(prev => ({ ...prev, geocoding: true }))
          console.log('Geocoding APIリアルタイム接続が確立されました')
        }
      })
    channels.push(geocodingChannel)

    // api_global_usageテーブルも監視（全体的な変更を検知）
    const globalUsageChannel = supabase
      .channel('global-usage-monitor')
      .on(
        'postgres_changes',
        { 
          event: '*', // INSERT, UPDATE, DELETE全てを監視
          schema: 'public', 
          table: 'api_global_usage'
        },
        (payload) => {
          console.log('api_global_usage が更新されました:', payload)
          fetchUsage()
        }
      )
      .subscribe((status) => {
        console.log('api_global_usage リアルタイムステータス:', status)
      })
    channels.push(globalUsageChannel)

    // クリーンアップ
    return () => {
      setRealtimeStatus({ search: false, pdf: false, geocoding: false })
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [])

  // APIアイコンのマッピング
  const apiIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'google_custom_search': DocumentMagnifyingGlassIcon,
    'pdf_parsing': DocumentTextIcon,
    'google_maps_geocoding': MapPinIcon
  }

  // APIメトリクスの生成
  const apiMetrics: ApiMetric[] = apiStats.map(stat => ({
    name: stat.displayName,
    apiName: stat.apiName,
    icon: apiIcons[stat.apiName] || DocumentMagnifyingGlassIcon,
    used: stat.daily.used,
    limit: stat.daily.limit,
    unit: stat.apiName === 'pdf_parsing' ? 'ファイル' : 'リクエスト',
    status: stat.daily.status,
    description: getApiDescription(stat.apiName)
  }))

  function getApiDescription(apiName: string): string {
    switch (apiName) {
      case 'google_custom_search':
        return '本日の検索リクエスト数'
      case 'pdf_parsing':
        return '本日のPDF処理ファイル数'
      case 'google_maps_geocoding':
        return '本日のジオコーディング数'
      default:
        return '本日の使用数'
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
            <Card key={metric.name} className="group relative transition-all duration-200 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {metric.name.startsWith('Coming Soon') ? 'Coming Soon' : metric.name}
                    </CardTitle>
                    {metric.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {metric.description}
                      </p>
                    )}
                  </div>
                  {((metric.name === 'Google Custom Search API' && realtimeStatus.search) ||
                    (metric.name === 'PDF解析処理' && realtimeStatus.pdf) ||
                    (metric.name === 'Google Maps Geocoding API' && realtimeStatus.geocoding)) && (
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span>Live</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                {metric.name === 'Google Custom Search API' ? (
                  <GoogleSearchUsageChart 
                    used={metric.used}
                    limit={metric.limit}
                    status={metric.status}
                  />
                ) : metric.name.startsWith('Coming Soon') ? (
                  <div className="flex flex-col items-center justify-center h-[280px] text-center">
                    <div className="p-4 rounded-full bg-gray-50 dark:bg-gray-900/50 mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">新機能を準備中</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">近日公開予定</p>
                  </div>
                ) : metric.name === 'PDF解析処理' ? (
                  <PdfUsageChart 
                    used={metric.used}
                    limit={metric.limit}
                    status={metric.status}
                  />
                ) : metric.name === 'Google Maps Geocoding API' ? (
                  <GeocodingUsageChart 
                    used={metric.used}
                    limit={metric.limit}
                    status={metric.status}
                  />
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 月間使用履歴 */}
      <Card className="group relative transition-all duration-200 hover:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
                月間使用履歴
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                過去5ヶ月
              </p>
            </div>
            <select
              value={selectedApi}
              onChange={(e) => setSelectedApi(e.target.value)}
              className="text-sm border rounded-md px-2 py-1 bg-white dark:bg-gray-800"
            >
              {apiStats.map(stat => (
                <option key={stat.apiName} value={stat.apiName}>
                  {stat.displayName}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const selectedStats = apiStats.find(s => s.apiName === selectedApi)
                if (!selectedStats) return null
                
                return (
                  <>
                    <ChartContainer
                      config={{
                        requests: {
                          label: selectedApi === 'pdf_parsing' ? "処理数" : "リクエスト数",
                          color: "#3b82f6",
                        },
                      }}
                      className="h-[250px] w-full"
                    >
                      <AreaChart
                        accessibilityLayer
                        data={selectedStats.monthly}
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
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-sm">
                            {(() => {
                              const currentMonth = selectedStats.monthly[selectedStats.monthly.length - 1]
                              const previousMonth = selectedStats.monthly[selectedStats.monthly.length - 2]
                              if (currentMonth && previousMonth && previousMonth.requests > 0) {
                                const change = ((currentMonth.requests - previousMonth.requests) / previousMonth.requests) * 100
                                return (
                                  <>
                                    {change > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                          {change.toFixed(1)}%
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                        <span className="text-red-600 dark:text-red-400 font-medium">
                                          {Math.abs(change).toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )
                              }
                              return <span className="text-gray-500">-</span>
                            })()}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            前月比
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            月間上限
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {(() => {
                              const limit = apiStats.find(s => s.apiName === selectedApi)?.daily.limit || 0
                              return (limit * 30).toLocaleString()
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
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