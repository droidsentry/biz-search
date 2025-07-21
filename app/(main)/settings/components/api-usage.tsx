'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ChartBarIcon, 
  DocumentMagnifyingGlassIcon,
  ServerIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface ApiMetric {
  name: string
  icon: React.ComponentType<{ className?: string }>
  used: number
  limit: number
  unit: string
  status: 'active' | 'warning' | 'danger' | 'inactive'
  description: string
}

const apiMetrics: ApiMetric[] = [
  {
    name: 'Google Custom Search API',
    icon: DocumentMagnifyingGlassIcon,
    used: 8432,
    limit: 10000,
    unit: 'リクエスト',
    status: 'warning',
    description: '月間検索リクエスト数'
  },
  {
    name: 'PDF解析API',
    icon: ChartBarIcon,
    used: 245,
    limit: 1000,
    unit: 'ファイル',
    status: 'active',
    description: 'PDF処理件数'
  },
  {
    name: 'ストレージ使用量',
    icon: ServerIcon,
    used: 3.2,
    limit: 10,
    unit: 'GB',
    status: 'active',
    description: 'ファイルストレージ'
  }
]

const monthlyStats = [
  { month: '1月', requests: 6500 },
  { month: '2月', requests: 7200 },
  { month: '3月', requests: 8100 },
  { month: '4月', requests: 7800 },
  { month: '5月', requests: 8432 },
]

export function ApiUsage() {
  // const getStatusColor = (status: ApiMetric['status']) => {
  //   switch (status) {
  //     case 'active':
  //       return 'bg-green-500'
  //     case 'warning':
  //       return 'bg-yellow-500'
  //     case 'danger':
  //       return 'bg-red-500'
  //     case 'inactive':
  //       return 'bg-gray-400'
  //   }
  // }

  const getStatusBadge = (status: ApiMetric['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">アクティブ</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">警告</Badge>
      case 'danger':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">制限間近</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">非アクティブ</Badge>
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
            <Card key={metric.name} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <CardTitle className="text-base font-medium">
                      {metric.name}
                    </CardTitle>
                  </div>
                  {getStatusBadge(metric.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {metric.used.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                  
                  {metric.status === 'warning' && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      残り{metric.limit - metric.used}リクエスト
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 月間使用履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle>月間使用履歴</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Google Custom Search API - 過去5ヶ月
            </div>
            <div className="space-y-3">
              {monthlyStats.map((stat) => (
                <div key={stat.month} className="flex items-center space-x-4">
                  <div className="w-12 text-sm text-gray-600 dark:text-gray-400">
                    {stat.month}
                  </div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                      <div 
                        className="h-full bg-gray-900 dark:bg-gray-100 transition-all duration-500"
                        style={{ width: `${(stat.requests / 10000) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm font-medium">
                    {stat.requests.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
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