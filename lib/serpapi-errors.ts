import 'server-only';

/**
 * SerpAPI HTTP ステータスコードの定義
 */
export const SERPAPI_HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  GONE: 410,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * SerpAPI 検索ステータスの定義
 */
export const SERPAPI_SEARCH_STATUS = {
  SUCCESS: 'Success',
  PROCESSING: 'Processing',
  QUEUED: 'Queued',
  ERROR: 'Error',
} as const;

/**
 * SerpAPIエラーコードとメッセージのマッピング
 */
export const SERPAPI_ERROR_MESSAGES = {
  [SERPAPI_HTTP_STATUS.BAD_REQUEST]: 'リクエストの処理に失敗しました。必須パラメータが不足している可能性があります。',
  [SERPAPI_HTTP_STATUS.UNAUTHORIZED]: '有効なAPIキーが提供されていません。',
  [SERPAPI_HTTP_STATUS.FORBIDDEN]: 'このリクエストを実行する権限がありません。',
  [SERPAPI_HTTP_STATUS.NOT_FOUND]: '要求されたリソースが存在しません。',
  [SERPAPI_HTTP_STATUS.GONE]: '検索結果の有効期限が切れ、アーカイブから削除されました。',
  [SERPAPI_HTTP_STATUS.TOO_MANY_REQUESTS]: '時間あたりの制限を超過したか、検索回数が不足しています。',
  [SERPAPI_HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'SerpAPI側でエラーが発生しました。',
  [SERPAPI_HTTP_STATUS.SERVICE_UNAVAILABLE]: 'SerpAPIサービスが一時的に利用できません。',
} as const;

/**
 * SerpAPIのエラーレスポンス型
 */
export interface SerpApiErrorResponse {
  error?: string;
  search_metadata?: {
    id: string;
    status: string;
    json_endpoint?: string;
    created_at?: string;
    processed_at?: string;
    google_url?: string;
    raw_html_file?: string;
    total_time_taken?: number;
  };
  search_parameters?: Record<string, string | number | undefined>;
}

/**
 * カスタムSerpAPIエラークラス
 */
export class SerpApiError extends Error {
  public readonly statusCode?: number;
  public readonly searchStatus?: string;
  public readonly searchId?: string;
  public readonly rawError?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    searchStatus?: string,
    searchId?: string,
    rawError?: unknown
  ) {
    super(message);
    this.name = 'SerpApiError';
    this.statusCode = statusCode;
    this.searchStatus = searchStatus;
    this.searchId = searchId;
    this.rawError = rawError;
  }
}

/**
 * エラーレスポンスを解析してユーザーフレンドリーなメッセージを生成
 */
export function parseSerpApiError(response: SerpApiErrorResponse, statusCode?: number): SerpApiError {
  // エラーメッセージの優先順位
  // 1. レスポンスに含まれるerrorメッセージ
  // 2. HTTPステータスコードに基づくメッセージ
  // 3. デフォルトメッセージ

  let message = '検索中に予期しないエラーが発生しました。';
  const searchStatus = response.search_metadata?.status;
  const searchId = response.search_metadata?.id;

  // 特定のエラーメッセージの処理
  if (response.error) {
    // 英語のエラーメッセージを日本語に変換
    const errorLower = response.error.toLowerCase();
    
    if (errorLower.includes("google hasn't returned any results")) {
      message = 'この検索条件では結果が見つかりませんでした。検索条件を変更してお試しください。';
    } else if (errorLower.includes('invalid api key')) {
      message = 'APIキーが無効です。設定を確認してください。';
    } else if (errorLower.includes('rate limit')) {
      message = 'API利用制限に達しました。しばらく待ってから再度お試しください。';
    } else if (errorLower.includes('missing required parameter')) {
      message = '必須パラメータが不足しています。';
    } else {
      // その他のエラーメッセージはそのまま使用
      message = response.error;
    }
  } else if (statusCode && SERPAPI_ERROR_MESSAGES[statusCode as keyof typeof SERPAPI_ERROR_MESSAGES]) {
    message = SERPAPI_ERROR_MESSAGES[statusCode as keyof typeof SERPAPI_ERROR_MESSAGES];
  } else if (searchStatus === SERPAPI_SEARCH_STATUS.ERROR) {
    message = '検索処理中にエラーが発生しました。';
  }

  return new SerpApiError(
    message,
    statusCode,
    searchStatus,
    searchId,
    response
  );
}

/**
 * HTTPステータスコードがエラーかどうかを判定
 */
export function isErrorStatusCode(statusCode: number): boolean {
  return statusCode >= 400;
}

/**
 * 検索ステータスがエラーかどうかを判定
 */
export function isErrorSearchStatus(status: string): boolean {
  return status === SERPAPI_SEARCH_STATUS.ERROR;
}

/**
 * レスポンスが成功したかどうかを判定
 */
export function isSuccessfulResponse(response: SerpApiErrorResponse): boolean {
  // エラーメッセージがある場合は失敗
  if (response.error) {
    return false;
  }
  
  // search_metadataがない場合も成功として扱う（通常の検索結果の場合）
  if (!response.search_metadata) {
    return true;
  }
  
  // search_metadataがある場合はstatusをチェック
  return response.search_metadata.status === SERPAPI_SEARCH_STATUS.SUCCESS;
}