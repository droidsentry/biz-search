import { keywordsSchema, searchParamsSchema, } from '@/lib/schemas/serpstack'
import { z } from 'zod'

/** 検索パラメータの型 */
export type SearchParams = z.infer<typeof searchParamsSchema>

/** 検索結果の各項目 */
export interface SearchResult {
  title: string           // ページタイトル
  url: string             // ページURL
  description?: string    // ページの説明文
  age?: string            // 作成日時または更新日時
  thumbnail?: {           // サムネイル画像
    src: string           // 画像URL
    height: number        // 画像の高さ
    width: number         // 画像の幅
  }
}

/** 検索アクションの結果 */
export interface SearchActionResult {
  success: boolean                // 成功フラグ
  data?: {                        // 成功時のデータ
    results: SearchResult[]       // 検索結果リスト
    query: string                 // 実行された検索クエリ
    totalResults?: number         // 総検索結果数
  }
  error?: string                  // エラーメッセージ
}


export type Keywords = z.infer<typeof keywordsSchema>;

// Serpstack APIレスポンスの型をre-export
export type { SerpstackResponse } from '@/lib/serpstack';