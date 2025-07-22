import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { AlertCircle, CheckCircle, Clock, Search, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // 最近のAPIログを取得
  const { data: apiLogs } = await supabase
    .from('search_api_logs')
    .select(`
      id,
      created_at,
      status_code,
      result_count,
      error_message,
      api_response_time,
      google_custom_search_params,
      pattern:search_patterns (
        id,
        name
      ),
      project:projects (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // ステータス別の統計を計算
  const stats = apiLogs?.reduce((acc, log) => {
    if (log.status_code === 200) {
      acc.success++
    } else {
      acc.error++
    }
    acc.total++
    acc.avgResponseTime = (acc.avgResponseTime * (acc.total - 1) + (log.api_response_time || 0)) / acc.total
    return acc
  }, { total: 0, success: 0, error: 0, avgResponseTime: 0 }) || { total: 0, success: 0, error: 0, avgResponseTime: 0 }

  // デモデータを追加（実際のデータがない場合）
  const demoLogs = apiLogs?.length === 0 ? [
    {
      id: '1',
      created_at: new Date().toISOString(),
      status_code: 200,
      result_count: 10,
      error_message: null,
      api_response_time: 523,
      google_custom_search_params: {
        customerName: '山田太郎',
        address: '東京都港区',
        dateRestrict: 'y1'
      },
      pattern: { id: '1', name: '基本検索パターン' },
      project: { id: '1', name: 'テストプロジェクト' }
    },
    {
      id: '2',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      status_code: 200,
      result_count: 5,
      error_message: null,
      api_response_time: 412,
      google_custom_search_params: {
        customerName: '鈴木花子',
        address: '大阪府大阪市',
        dateRestrict: 'all'
      },
      pattern: null,
      project: { id: '2', name: '関西プロジェクト' }
    },
    {
      id: '3',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      status_code: 429,
      result_count: null,
      error_message: 'API rate limit exceeded',
      api_response_time: 105,
      google_custom_search_params: {
        customerName: '佐藤次郎',
        address: '',
        dateRestrict: 'y3'
      },
      pattern: { id: '2', name: '詳細検索パターン' },
      project: { id: '1', name: 'テストプロジェクト' }
    }
  ] : apiLogs || []

  const logsToDisplay = apiLogs?.length ? apiLogs : demoLogs

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">API使用ログ</h1>
        <p className="text-muted-foreground">Google Custom Search APIの使用履歴</p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総API呼び出し</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">過去100件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{stats.success}件成功</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">エラー数</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.error}</div>
            <p className="text-xs text-muted-foreground">失敗した呼び出し</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均応答時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">レスポンス時間</p>
          </CardContent>
        </Card>
      </div>

      {/* ログテーブル */}
      <Card>
        <CardHeader>
          <CardTitle>検索履歴</CardTitle>
          <CardDescription>
            最新100件の検索API呼び出し履歴
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsToDisplay.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">日時</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">検索対象</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">プロジェクト</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">パターン</th>
                    <th className="text-center p-2 text-sm font-medium text-muted-foreground">ステータス</th>
                    <th className="text-right p-2 text-sm font-medium text-muted-foreground">結果数</th>
                    <th className="text-right p-2 text-sm font-medium text-muted-foreground">応答時間</th>
                  </tr>
                </thead>
                <tbody>
                  {logsToDisplay.map((log) => {
                    const searchParams = log.google_custom_search_params as any
                    return (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-sm">
                          {format(new Date(log.created_at), 'M/d HH:mm:ss', { locale: ja })}
                        </td>
                        <td className="p-2 text-sm">
                          <div>
                            <p className="font-medium">{searchParams?.customerName || '-'}</p>
                            {searchParams?.address && (
                              <p className="text-xs text-muted-foreground">{searchParams.address}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          {log.project ? (
                            <Link 
                              href={`/projects/${log.project.id}`}
                              className="hover:underline text-primary"
                            >
                              {log.project.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2 text-sm">
                          {log.pattern ? (
                            <Badge variant="secondary" className="text-xs">
                              {log.pattern.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {log.status_code === 200 ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              成功
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              エラー ({log.status_code})
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-sm text-right">
                          {log.result_count !== null ? `${log.result_count}件` : '-'}
                        </td>
                        <td className="p-2 text-sm text-right">
                          {log.api_response_time ? `${log.api_response_time}ms` : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">検索履歴がありません</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
