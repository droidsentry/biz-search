'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface GoogleSearchProps {
  initialQuery?: string
}

export function GoogleSearch({ initialQuery = '' }: GoogleSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    // Custom Search API実装予定
    // 現在はダミーデータを表示
    setTimeout(() => {
      setResults([
        { title: '検索結果1', link: '#', snippet: 'これはダミーの検索結果です。' },
        { title: '検索結果2', link: '#', snippet: 'Custom Search APIが実装されると実際の結果が表示されます。' },
      ])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground mb-3">Google検索</p>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索キーワードを入力"
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {isLoading && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          検索中...
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((result, index) => (
            <div key={index} className="p-3 bg-muted-foreground/5 rounded-lg">
              <h4 className="font-medium text-sm">{result.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{result.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}