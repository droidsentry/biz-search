import 'server-only'

import { formatSerpstackError, isSerpstackErrorResponse, type SerpstackErrorResponse } from '@/lib/utils/serpstack-errors'

/**
 * 参考ドキュメント
 * https://serpstack.com/documentation
 * 
 */

/** Serpstack APIのリクエストパラメータ */
interface SerpstackParams {
  access_key: string                                              // APIアクセスキー
  query: string                                                   // 検索クエリ
  engine?: 'google' | 'bing' | 'yahoo' | 'youtube' | 'amazon'    // 検索エンジン
  type?: 'web' | 'images' | 'videos' | 'news' | 'shopping'       // 検索タイプ
  device?: 'desktop' | 'mobile' | 'tablet'                       // デバイスタイプ
  location?: string                                               // 地理的位置
  auto_location?: 0 | 1                                           // 自動位置検出 (0: 無効, 1: 有効)
  google_domain?: string                                          // Googleドメイン
  gl?: string                                                     // Google国コード (例: 日本は'jp')
  hl?: string                                                     // Google言語コード (例: 日本語は'ja')
  safe?: 0 | 1                                                    // セーフサーチ (0: オフ, 1: オン)
  period?: string                                                 // 期間フィルター
  period_start?: string                                           // カスタム期間の開始日
  period_end?: string                                             // カスタム期間の終了日
  news_type?: string                                              // ニュース検索タイプ
  exclude_autocorrected_results?: 0 | 1                           // 自動修正結果を除外 (0: 含む, 1: 除外)
  images_page?: number                                            // 画像結果の制限
  images_color?: string                                           // 画像カラーフィルター
  images_size?: string                                            // 画像サイズフィルター
  images_type?: string                                            // 画像タイプフィルター
  images_usage?: string                                           // 画像の使用権フィルター
  sort?: string                                                   // 結果のソート方法
  page?: number                                                   // ページ番号
  num?: number                                                    // 1ページあたりの結果数
  output?: 'json' | 'csv'                                         // 出力形式
  csv_fields?: string                                             // CSV出力時のフィールド選択
}

/** 検索結果の各項目 */
interface SerpstackOrganicResult {
  position: number          // 検索結果での順位
  title: string             // ページタイトル
  url: string               // ページURL
  domain: string            // ドメイン名
  displayed_url: string     // 表示用URL
  snippet: string           // 検索結果のスニペット（抜粋）
  cached_page_url?: string  // キャッシュページのURL
  related_page_url?: string // 関連ページのURL
}

/** 検索情報のメタデータ */
interface SerpstackSearchInformation {
  query: string                           // 実行された検索クエリ
  showing_results_for?: string            // 修正後の検索クエリ（スペルチェック後）
  total_results?: number                  // 総検索結果数
  time_taken_displayed?: number           // 検索にかかった時間（秒）
  detected_location?: string              // 検出された位置情報
  did_you_mean?: string                   // もしかして（修正候補）
  no_results_for_original_query?: boolean // 元のクエリで結果がなかった場合
}

/** アンサーボックス（直接回答） */
interface SerpstackAnswer {
  type: string   // 回答のタイプ
  result: string // 回答内容
}

/** ナレッジグラフ（詳細情報ボックス） */
interface SerpstackKnowledgeGraph {
  title: string                   // タイトル
  entity_type: string             // エンティティタイプ（人物、場所、組織など）
  description?: string            // 説明
  source?: {                      // 情報ソース
    name: string                  // ソース名
    url: string                   // ソースURL
  }
  image?: string                  // 画像URL
  facts?: Record<string, string>  // ファクト情報（キーと値のペア）
}

/** 関連検索クエリ */
interface SerpstackRelatedSearch {
  query: string // 関連検索キーワード
  url: string   // 検索URL
}

/** ページネーション情報 */
interface SerpstackPagination {
  current: number   // 現在のページ番号
  next?: string     // 次ページのURL
  pages?: Array<{   // 各ページ情報
    page: number    // ページ番号
    url: string     // ページURL
  }>
}

/** 広告結果 */
interface SerpstackAd {
  position: number      // 表示位置
  title: string         // 広告タイトル
  url: string           // 広告URL
  domain: string        // ドメイン名
  displayed_url: string // 表示用URL
  snippet: string       // 広告説明文
}

/** ローカル検索結果（地域情報） */
interface SerpstackLocalResult {
  position: number  // 表示位置
  title: string     // 店舗名または施設名
  place_id: string  // プレースID
  address: string   // 住所
  phone?: string    // 電話番号
  rating?: number   // 評価スコア
  reviews?: number  // レビュー数
  type?: string     // ビジネスタイプ
}

/** Serpstack APIのレスポンス */
export interface SerpstackResponse {
  request: {                                      // リクエスト情報
    success: true                                 // リクエストの成功フラグ（成功時は常にtrue）
    processed_timestamp: number                   // 処理タイムスタンプ
    search_url: string                            // 検索エンジンのURL
    requested_url?: string                        // リクエストされたURL
    total_time_taken: number                      // 処理にかかった時間（秒）
  }
  search_parameters: {                            // 検索パラメータ
    engine: string                                // 検索エンジン
    type: string                                  // 検索タイプ
    device: string                                // デバイスタイプ
    query: string                                 // 検索クエリ
    location?: string                             // 位置情報
    google_domain?: string                        // Googleドメイン
    gl?: string                                   // 国コード
    hl?: string                                   // 言語コード
    safe?: number                                 // セーフサーチ設定
    page?: number                                 // ページ番号
    num?: number                                  // 1ページあたりの結果数
    output: string                                // 出力形式
  }
  search_information?: SerpstackSearchInformation // 検索情報
  answer_box?: SerpstackAnswer                    // アンサーボックス
  knowledge_graph?: SerpstackKnowledgeGraph       // ナレッジグラフ
  organic_results?: SerpstackOrganicResult[]      // オーガニック検索結果
  ads?: SerpstackAd[]                             // 広告
  local_results?: SerpstackLocalResult[]          // ローカル検索結果
  related_searches?: SerpstackRelatedSearch[]     // 関連検索
  pagination?: SerpstackPagination                // ページネーション
  error?: {                                       // エラー情報
    code: number                                  // エラーコード
    type: string                                  // エラータイプ
    info: string                                  // エラー詳細
  }
}

let serpstackClient: SerpstackClient | null = null

export function getSerpstackClient(): SerpstackClient {
  if (!serpstackClient) {
    const apiKey = process.env.SERPSTACK_API_KEY
    if (!apiKey) {
      throw new Error('Serpstack APIキーが設定されていません')
    }
    serpstackClient = new SerpstackClient(apiKey)
  }
  return serpstackClient
}

export class SerpstackClient {
  private apiKey: string
  private baseUrl = 'https://api.serpstack.com/search'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(query: string, options: Partial<Omit<SerpstackParams, 'access_key' | 'query'>> = {}): Promise<SerpstackResponse> {
    const params: SerpstackParams = {
      access_key: this.apiKey,
      query,
      engine: 'google',
      type: 'web',
      gl: 'jp', // Google country code for Japan
      hl: 'ja', // Google language code for Japanese
      num: 10, // Default results per page
      page: 1, // Default to first page
      output: 'json',
      ...options
    }

    // Filter out undefined values and convert to string
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()
    console.log("queryString", queryString)

    const url = `${this.baseUrl}?${queryString}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      const data = await response.json() as SerpstackResponse | SerpstackErrorResponse
      // console.log("data", data)
      //５秒待つ
      // await new Promise(resolve => setTimeout(resolve, 5000))
      // const data: SerpstackResponse = {
      //   request: {
      //     success: true,
      //     processed_timestamp: 1722336000,
      //     search_url: "https://serpstack.com/search",
      //     total_time_taken: 0.5,
      //   },
      //   search_parameters: {
      //     engine: "google",
      //     type: "web",
      //     device: "desktop",
      //     query: "test",
      //     location: "Tokyo, Japan",
      //     google_domain: "google.com",
      //     gl: "jp",
      //     hl: "ja",
      //     safe: 0,
      //     page: 1,
      //     num: 10,
      //     output: "json",
      //   },
      //   search_information: {
      //     query: "test",
      //     showing_results_for: "test",
      //     total_results: 10,
      //     time_taken_displayed: 0.5,
      //   },
      //   organic_results: [
      //     {
      //       position: 1,
      //       title: "test",
      //       url: "https://serpstack.com/search",
      //       domain: "serpstack.com",
      //       displayed_url: "https://serpstack.com/search",
      //       snippet: "test",
      //     },
      //   ],
      // }



      // Serpstack API error handling using helper functions
      if (isSerpstackErrorResponse(data)) {
        throw new Error(formatSerpstackError(data.error))
      }

      // if (!response.ok) {
      //   throw new Error(
      //     `HTTP Error: ${response.status} ${response.statusText}`
      //   )
      // }

      return data
    } catch (error) {
      console.error('Serpstack API error:', error)
      throw error
    }
  }
}