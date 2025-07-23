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

/**
 * 複数の住所を一括でジオコーディングするサーバーアクション
 * @param addresses 住所の配列
 * @returns ジオコーディング結果の配列
 */
export async function batchGeocodeAddresses(addresses: string[]): Promise<BatchGeocodingResult[]> {
  const results: BatchGeocodingResult[] = []
  
  // 住所を順次処理
  for (const address of addresses) {
    try {
      // 既存のgeocodeAddress関数を使用
      const geocodeResult = await geocodeAddress(address)
      
      if (geocodeResult.success && geocodeResult.data) {
        results.push({
          address,
          success: true,
          data: geocodeResult.data,
          streetViewAvailable: geocodeResult.streetViewAvailable,
        })
      } else {
        results.push({
          address,
          success: false,
          error: geocodeResult.error || '不明なエラー',
        })
      }
    } catch (error) {
      console.error(`ジオコーディングエラー (${address}):`, error)
      results.push({
        address,
        success: false,
        error: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
      })
    }
    
    // API制限を考慮して少し待機（1秒あたり50リクエスト制限）
    await new Promise(resolve => setTimeout(resolve, 50))
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