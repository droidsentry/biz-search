import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, Building2, Search, TrendingUp, Users } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    {
      title: '登録企業数',
      value: '1,234',
      change: '+12.5%',
      icon: Building2,
    },
    {
      title: '検索回数',
      value: '5,678',
      change: '+23.1%',
      icon: Search,
    },
    {
      title: 'アクティブユーザー',
      value: '892',
      change: '+18.2%',
      icon: Users,
    },
    {
      title: 'API利用率',
      value: '94.2%',
      change: '+5.4%',
      icon: TrendingUp,
    },
  ]

  const recentActivities = [
    { id: 1, company: '株式会社テクノロジー', action: '新規登録', time: '5分前' },
    { id: 2, company: 'グローバルトレード株式会社', action: '情報更新', time: '15分前' },
    { id: 3, company: 'イノベーションラボ合同会社', action: '検索実行', time: '1時間前' },
    { id: 4, company: 'スマートソリューション株式会社', action: '新規登録', time: '2時間前' },
    { id: 5, company: 'エコテック株式会社', action: 'API呼び出し', time: '3時間前' },
    { id: 6, company: 'デジタルマーケティング株式会社', action: '情報更新', time: '4時間前' },
    { id: 7, company: 'クラウドサービス合同会社', action: '新規登録', time: '5時間前' },
    { id: 8, company: 'AIソリューション株式会社', action: '検索実行', time: '6時間前' },
    { id: 9, company: 'モバイルアプリ開発株式会社', action: 'API呼び出し', time: '7時間前' },
    { id: 10, company: 'ビッグデータ分析株式会社', action: '情報更新', time: '8時間前' },
    { id: 11, company: 'サイバーセキュリティ株式会社', action: '新規登録', time: '9時間前' },
    { id: 12, company: 'IoTプラットフォーム株式会社', action: '検索実行', time: '10時間前' },
    { id: 13, company: 'ブロックチェーン開発株式会社', action: 'API呼び出し', time: '11時間前' },
    { id: 14, company: 'VR/ARコンテンツ株式会社', action: '情報更新', time: '12時間前' },
    { id: 15, company: '量子コンピューティング研究所', action: '新規登録', time: '13時間前' },
  ]

  const topCompanies = [
    { rank: 1, name: 'テックジャイアント株式会社', industry: 'IT・ソフトウェア', views: 15234 },
    { rank: 2, name: 'グローバルイノベーション株式会社', industry: '製造業', views: 12890 },
    { rank: 3, name: 'デジタルトランスフォーム株式会社', industry: 'コンサルティング', views: 11567 },
    { rank: 4, name: 'エンタープライズソリューション株式会社', industry: 'SaaS', views: 10234 },
    { rank: 5, name: 'フィンテックパイオニア株式会社', industry: '金融・保険', views: 9876 },
    { rank: 6, name: 'ヘルステック革新株式会社', industry: 'ヘルスケア', views: 8765 },
    { rank: 7, name: 'エコロジーテクノロジー株式会社', industry: '環境・エネルギー', views: 7654 },
    { rank: 8, name: 'ロジスティクスDX株式会社', industry: '物流・運輸', views: 6543 },
    { rank: 9, name: 'リテールイノベーション株式会社', industry: '小売・流通', views: 5432 },
    { rank: 10, name: 'エデュテックソリューション株式会社', industry: '教育', views: 4321 },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-2 md:px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">ダッシュボード</h1>
        <p className="text-muted-foreground">ビジネス検索プラットフォームの概要</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{stat.change}</span>
                  <span>前月比</span>
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
            <CardDescription>
              プラットフォーム上の最新の活動
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {activity.company}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>人気の検索キーワード</CardTitle>
            <CardDescription>
              よく検索されているキーワード
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['IT・ソフトウェア', '製造業', '小売・流通', '金融・保険', 'ヘルスケア', 'コンサルティング', 'SaaS', '環境・エネルギー', '物流・運輸', '教育'].map((keyword, index) => (
                <div key={keyword} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {keyword}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${100 - index * 8}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {100 - index * 8}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>注目企業ランキング</CardTitle>
          <CardDescription>
            最も閲覧されている企業トップ10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">順位</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">企業名</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">業種</th>
                  <th className="text-right p-2 text-sm font-medium text-muted-foreground">閲覧数</th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.map((company) => (
                  <tr key={company.rank} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-sm">{company.rank}</td>
                    <td className="p-2 text-sm font-medium">{company.name}</td>
                    <td className="p-2 text-sm text-muted-foreground">{company.industry}</td>
                    <td className="p-2 text-sm text-right">{company.views.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}