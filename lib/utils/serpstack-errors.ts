/**
 * Serpstack API エラーコード定義とヘルパー関数
 * https://serpstack.com/documentation
 */

import { SerpstackResponse } from "../serpstack"




export interface SerpstackError {
  code: number
  type: string
  info: string
}

export interface SerpstackErrorResponse {
  success: false
  error: SerpstackError
}

/**
 * Serpstack APIのエラーコード定義
 */
export const SERPSTACK_ERROR_CODES = {
  NOT_FOUND: 404,
  MISSING_ACCESS_KEY: 101,
  INVALID_ACCESS_KEY: 101,
  INACTIVE_USER: 102,
  INVALID_API_FUNCTION: 103,
  USAGE_LIMIT_REACHED: 104,
  FUNCTION_ACCESS_RESTRICTED: 105,
  MISSING_LOCATION_QUERY: 210,
  MISSING_SEARCH_QUERY: 310,
  INVALID_ENGINE: 311,
  INVALID_OUTPUT_TYPE: 312,
  EMPTY_FIELD_LIST: 313,
  INVALID_SEARCH_TYPE: 314,
  INVALID_GOOGLE_DOMAIN: 315,
  INVALID_TIME_PERIOD: 316,
  MISSING_START_DATE: 317,
  MISSING_END_DATE: 318,
  INVALID_START_DATE: 319,
  INVALID_END_DATE: 320,
  INVALID_SORT_TYPE: 321,
  INVALID_IMAGES_PAGE: 322,
  INVALID_IMAGES_COLOR: 323,
  INVALID_IMAGES_SIZE: 324,
  INVALID_IMAGES_TYPE: 325,
  INVALID_IMAGES_USAGE: 326,
  REQUEST_FAILED: 327,
} as const

/**
 * エラーコードに基づいて日本語のエラーメッセージを返す
 */
export function getErrorMessage(error: SerpstackError): string {
  const messages: Record<number, string> = {
    404: '要求されたリソースが存在しません。',
    101: error.type === 'missing_access_key' 
      ? 'APIアクセスキーが提供されていません。' 
      : '無効なAPIアクセスキーです。',
    102: 'アカウントが非アクティブまたはブロックされています。',
    103: '存在しないAPI機能が要求されました。',
    104: '月間APIリクエスト数の上限に達しました。プランのアップグレードをご検討ください。',
    105: '現在のプランではこの機能は利用できません。',
    210: '有効な位置情報が指定されていません。',
    310: '検索キーワードが指定されていません。',
    311: '無効な検索エンジンが指定されました。',
    312: '無効な出力形式が指定されました。',
    313: 'CSVフィールドリストが空です。',
    314: '無効な検索タイプが指定されました。',
    315: '無効なGoogleドメインが指定されました。',
    316: '無効な期間が指定されました。',
    317: '開始日が指定されていません。',
    318: '終了日が指定されていません。',
    319: '無効な開始日が指定されました。',
    320: '無効な終了日が指定されました。',
    321: '無効なソートタイプが指定されました。',
    322: '無効な画像ページが指定されました。',
    323: '無効な画像カラーが指定されました。',
    324: '無効な画像サイズが指定されました。',
    325: '無効な画像タイプが指定されました。',
    326: '無効な画像使用権が指定されました。',
    327: '不明なエラーによりAPIリクエストが失敗しました。サポートにお問い合わせください。',
  }

  return messages[error.code] || error.info || '不明なエラーが発生しました。'
}

/**
 * エラーレスポンスかどうかを判定する型ガード
 */
export function isSerpstackErrorResponse(
  data: SerpstackResponse | SerpstackErrorResponse
): data is SerpstackErrorResponse {
  return (
    'success' in data &&
    data.success === false &&
    'error' in data &&
    data.error !== undefined &&
    data.error !== null &&
    typeof data.error.code === 'number' &&
    typeof data.error.type === 'string' &&
    typeof data.error.info === 'string'
  )
}

/**
 * エラーが特定のタイプかどうかを判定
 */
export function isErrorType(error: SerpstackError, errorCode: number): boolean {
  return error.code === errorCode
}

/**
 * リトライ可能なエラーかどうかを判定
 */
export function isRetryableError(error: SerpstackError): boolean {
  const retryableErrors: number[] = [
    SERPSTACK_ERROR_CODES.REQUEST_FAILED,
  ]
  return retryableErrors.includes(error.code)
}

/**
 * 認証関連のエラーかどうかを判定
 */
export function isAuthError(error: SerpstackError): boolean {
  const authErrors: number[] = [
    SERPSTACK_ERROR_CODES.MISSING_ACCESS_KEY,
    SERPSTACK_ERROR_CODES.INVALID_ACCESS_KEY,
    SERPSTACK_ERROR_CODES.INACTIVE_USER,
  ]
  return authErrors.includes(error.code)
}

/**
 * 使用制限関連のエラーかどうかを判定
 */
export function isUsageLimitError(error: SerpstackError): boolean {
  const usageLimitErrors: number[] = [
    SERPSTACK_ERROR_CODES.USAGE_LIMIT_REACHED,
    SERPSTACK_ERROR_CODES.FUNCTION_ACCESS_RESTRICTED,
  ]
  return usageLimitErrors.includes(error.code)
}

/**
 * パラメータ検証エラーかどうかを判定
 */
export function isValidationError(error: SerpstackError): boolean {
  return error.code >= 310 && error.code <= 326
}

/**
 * Serpstackエラーを処理してユーザーフレンドリーなメッセージを返す
 */
export function formatSerpstackError(error: SerpstackError): string {
  const message = getErrorMessage(error)
  
  if (isAuthError(error)) {
    return `認証エラー: ${message}`
  }
  
  if (isUsageLimitError(error)) {
    return `使用制限: ${message}`
  }
  
  if (isValidationError(error)) {
    return `入力エラー: ${message}`
  }
  
  return `エラー: ${message}`
}

/**
 * エラーの詳細情報を含むオブジェクトを生成
 */
export function createErrorDetails(error: SerpstackError) {
  return {
    code: error.code,
    type: error.type,
    message: getErrorMessage(error),
    category: getErrorCategory(error),
    isRetryable: isRetryableError(error),  // リトライ可能かどうか
    originalInfo: error.info,
  }
}

/**
 * エラーのカテゴリを判定
 */
function getErrorCategory(error: SerpstackError): string {
  if (isAuthError(error)) return '認証'
  if (isUsageLimitError(error)) return '使用制限'
  if (isValidationError(error)) return 'パラメータ検証'
  if (error.code === 404) return 'リソース'
  if (error.code === 327) return 'システム'
  return 'その他'
}