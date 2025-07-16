'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: number; title: string; description: string; location: string; employees: string; founded: string }>>([])

  // 大量のダミーデータ生成関数
  const generateDummyResults = (query: string) => {
    const companies = [
      { prefix: '株式会社', suffix: 'テクノロジー', desc: 'ITソリューション・システム開発・クラウドサービス', location: '東京都', employees: '100-500名', founded: '2015年' },
      { prefix: 'グローバル', suffix: '株式会社', desc: '国際貿易・輸出入代行・物流サポート', location: '大阪府', employees: '50-100名', founded: '2010年' },
      { prefix: '', suffix: 'イノベーションラボ合同会社', desc: 'AI開発・機械学習・データ分析サービス', location: '福岡県', employees: '10-50名', founded: '2018年' },
      { prefix: '', suffix: 'デジタルソリューション株式会社', desc: 'DX推進・業務自動化・RPAコンサルティング', location: '名古屋市', employees: '200-500名', founded: '2012年' },
      { prefix: '', suffix: 'エンタープライズ株式会社', desc: 'エンタープライズ向けSaaS・クラウドインフラ', location: '横浜市', employees: '500-1000名', founded: '2008年' },
      { prefix: '', suffix: 'スマートファクトリー株式会社', desc: '製造業向けIoT・スマート工場ソリューション', location: '愛知県', employees: '100-200名', founded: '2016年' },
      { prefix: '', suffix: 'フィンテックパートナーズ株式会社', desc: '金融システム開発・ブロックチェーン・決済サービス', location: '東京都', employees: '50-100名', founded: '2017年' },
      { prefix: '', suffix: 'ヘルスケアイノベーション株式会社', desc: '医療IT・遠隔診療・健康管理アプリ開発', location: '京都府', employees: '30-50名', founded: '2019年' },
      { prefix: '', suffix: 'グリーンエネルギー株式会社', desc: '再生可能エネルギー・環境コンサルティング', location: '北海道', employees: '100-300名', founded: '2014年' },
      { prefix: '', suffix: 'モビリティソリューション株式会社', desc: '自動運転技術・MaaS・交通システム開発', location: '茨城県', employees: '200-400名', founded: '2013年' },
    ]

    const results = []
    for (let i = 0; i < 30; i++) {
      const company = companies[i % companies.length]
      results.push({
        id: i + 1,
        title: `${company.prefix}${query || 'サンプル'}${company.suffix}${i > 9 ? i : ''}`,
        description: company.desc,
        location: company.location,
        employees: company.employees,
        founded: company.founded,
      })
    }
    return results
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // 仮の検索結果を表示
    if (searchQuery.trim()) {
      setSearchResults(generateDummyResults(searchQuery))
    } else {
      setSearchResults([])
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">カスタム検索</h1>
        <p className="text-muted-foreground">ビジネス情報を効率的に検索します</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="企業名、業種、キーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">検索</Button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">検索結果</h2>
            <p className="text-sm text-muted-foreground">{searchResults.length}件の結果</p>
          </div>
          {searchResults.map((result) => (
            <Card key={result.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{result.title}</CardTitle>
                <CardDescription>{result.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">所在地: </span>
                    <span className="text-foreground">{result.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">従業員数: </span>
                    <span className="text-foreground">{result.employees}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">設立: </span>
                    <span className="text-foreground">{result.founded}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">詳細を見る →</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">検索結果が見つかりませんでした</p>
        </div>
      )}
    </div>
  )
}