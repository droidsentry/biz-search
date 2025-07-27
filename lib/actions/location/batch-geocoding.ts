'use server'

import { geocodeAddress } from './geocoding'

// バッチジオコーディングの結果型
interface BatchGeocodingResult {
  address: string
  success: boolean
  data?: {
    lat: number
    lng: number
    formattedAddress: string
  }
  streetViewAvailable?: boolean
  error?: string
}

// バッチ処理の設定
const BATCH_SIZE = 5 // 同時処理数（Google Maps APIの推奨値）
const BATCH_DELAY = 100 // バッチ間の待機時間(ms)

/**
 * 配列をチャンクに分割するヘルパー関数
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * 複数の住所を一括でジオコーディングするサーバーアクション（並列処理版）
 * @param addresses 住所の配列
 * @returns ジオコーディング結果の配列
 */
export async function batchGeocodeAddresses(addresses: string[]): Promise<BatchGeocodingResult[]> {
  // 結果を格納する配列（順序を保持するため）
  const results: BatchGeocodingResult[] = new Array(addresses.length)
  
  // 住所をチャンクに分割
  const chunks = chunkArray(addresses.map((address, index) => ({ address, index })), BATCH_SIZE)
  
  // API制限エラーが発生したかどうかのフラグ
  let apiLimitReached = false
  
  // 各チャンクを順次処理（チャンク内は並列処理）
  for (const chunk of chunks) {
    // API制限に達した場合は残りの処理をスキップ
    if (apiLimitReached) {
      // 残りの住所にエラーを設定
      chunk.forEach(({ address, index }) => {
        results[index] = {
          address,
          success: false,
          error: 'API制限により処理を中断しました',
        }
      })
      continue
    }
    
    // チャンク内の住所を並列処理
    const chunkPromises = chunk.map(async ({ address, index }) => {
      try {
        // 既存のgeocodeAddress関数を使用
        const geocodeResult = await geocodeAddress(address)
        
        if (geocodeResult.success && geocodeResult.data) {
          results[index] = {
            address,
            success: true,
            data: geocodeResult.data,
            streetViewAvailable: geocodeResult.streetViewAvailable,
          }
        } else {
          // API制限エラーをチェック
          if (geocodeResult.error && 
              (geocodeResult.error.includes('API利用制限に達しました') || 
               geocodeResult.error.includes('API制限に達しました'))) {
            apiLimitReached = true
          }
          
          results[index] = {
            address,
            success: false,
            error: geocodeResult.error || '不明なエラー',
          }
        }
      } catch (error) {
        // console.error(`ジオコーディングエラー (${address}):`, error)
        results[index] = {
          address,
          success: false,
          error: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
        }
      }
    })
    
    // チャンク内の全ての処理が完了するまで待機
    await Promise.all(chunkPromises)
    
    // 次のチャンクの前に待機（最後のチャンクでは待機しない）
    if (chunks.indexOf(chunk) < chunks.length - 1 && !apiLimitReached) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }
  }
  
  return results
}

/**
 * 単一の住所をジオコーディングして、Maps URLを含む結果を返す
 * @param address 住所
 * @returns ジオコーディング結果
 */
export async function geocodeAddressWithUrl(address: string): Promise<BatchGeocodingResult> {
  try {
    const geocodeResult = await geocodeAddress(address)
    
    if (geocodeResult.success && geocodeResult.data) {
      return {
        address,
        success: true,
        data: geocodeResult.data,
        streetViewAvailable: geocodeResult.streetViewAvailable,
      }
    } else {
      return {
        address,
        success: false,
        error: geocodeResult.error || '不明なエラー',
      }
    }
  } catch (error) {
    console.error(`ジオコーディングエラー (${address}):`, error)
    return {
      address,
      success: false,
      error: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
    }
  }
}