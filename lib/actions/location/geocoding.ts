'use server'

import { Client, Language, Status } from '@googlemaps/google-maps-services-js'
import { z } from 'zod'

// レスポンスの型定義
interface GeocodingResult {
  lat: number
  lng: number
  formattedAddress: string
  streetViewAvailable?: boolean
}

// Street Viewメタデータレスポンスの型定義
interface StreetViewMetadataResponse {
  copyright?: string
  date?: string
  location?: {
    lat: number
    lng: number
  }
  pano_id?: string
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR'
}

// 入力バリデーション用のスキーマ
const geocodingSchema = z.object({
  address: z.string().min(1, '住所を入力してください').max(500, '住所が長すぎます'),
})

// Google Maps クライアントのインスタンスを作成
const client = new Client({})

export async function geocodeAddress(address: string) {
  // 入力検証
  const result = geocodingSchema.safeParse({ address })
  
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || '入力が不正です',
    }
  }

  // Supabaseクライアントを作成
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      success: false,
      error: '認証が必要です',
    }
  }

  // API制限チェック（Geocoding）
  const { data: limitCheck, error: limitCheckError } = await supabase
    .rpc('check_global_api_limit', {
      p_api_name: 'google_maps_geocoding'
    })

  if (limitCheckError) {
    console.error('API制限確認エラー:', limitCheckError)
    return {
      success: false,
      error: 'API制限の確認中にエラーが発生しました',
    }
  }

  // RPCの戻り値をキャスト
  interface LimitCheckResult {
    allowed: boolean
    daily_used: number
    daily_limit: number
    monthly_used: number
    monthly_limit: number
  }
  
  const limitResult = limitCheck as unknown as LimitCheckResult

  if (!limitResult.allowed) {
    return {
      success: false,
      error: `Geocoding API制限に達しました。本日: ${limitResult.daily_used}/${limitResult.daily_limit}回、今月: ${limitResult.monthly_used}/${limitResult.monthly_limit}回`,
    }
  }

  // サーバー用のAPIキーを使用
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_SERVER_KEY
  
  if (!apiKey) {
    console.error('Google Maps API key is not configured')
    return {
      success: false,
      error: 'サーバー設定エラーが発生しました',
    }
  }

  const startTime = Date.now()
  
  try {
    // Google Maps Services JSを使用してジオコーディング
    const response = await client.geocode({
      params: {
        address: address,
        key: apiKey, // 型ガードで既にチェック済み
        language: Language.ja, // 日本語で結果を取得
      },
    })
    console.log(response.data)
    
    const apiResponseTime = Date.now() - startTime
    
    if (response.data.status === Status.OK && response.data.results.length > 0) {
      const result = response.data.results[0]
      const location = result.geometry.location
      const formattedAddress = result.formatted_address
      
      // Street View可用性チェック
      const streetViewAvailable = await checkStreetViewAvailability(location.lat, location.lng)
      
      const geocodingResult: GeocodingResult = {
        lat: location.lat,
        lng: location.lng,
        formattedAddress,
        streetViewAvailable,
      }
      
      // 成功ログを記録（エラーは無視）
      supabase
        .from('geocoding_logs')
        .insert({
          user_id: user.id,
          address: address,
          success: true,
          lat: location.lat,
          lng: location.lng,
          street_view_available: streetViewAvailable,
          api_response_time: apiResponseTime
        })
        .then(({ error }) => {
          if (error) {
            console.error('Geocodingログ記録エラー:', error)
          }
        })
      
      return {
        success: true,
        data: geocodingResult,
        streetViewAvailable,
      }
    } else if (response.data.status === Status.ZERO_RESULTS) {
      // エラーログを記録
      supabase
        .from('geocoding_logs')
        .insert({
          user_id: user.id,
          address: address,
          success: false,
          error_message: '指定された住所が見つかりませんでした',
          api_response_time: apiResponseTime
        })
        .then(({ error }) => {
          if (error) {
            console.error('Geocodingログ記録エラー:', error)
          }
        })
      
      return {
        success: false,
        error: '指定された住所が見つかりませんでした',
      }
    } else if (response.data.status === Status.OVER_QUERY_LIMIT) {
      return {
        success: false,
        error: 'APIの利用制限に達しました。しばらく待ってから再度お試しください',
      }
    } else if (response.data.status === Status.REQUEST_DENIED) {
      console.error('Geocoding API request denied:', response.data.error_message)
      return {
        success: false,
        error: 'APIキーの設定に問題があります',
      }
    } else if (response.data.status === Status.INVALID_REQUEST) {
      return {
        success: false,
        error: '無効なリクエストです。住所を確認してください',
      }
    } else {
      console.error('Geocoding API error:', response.data.status, response.data.error_message)
      return {
        success: false,
        error: '住所の検索中にエラーが発生しました',
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    
    // エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    }
  }
}

// Street View可用性チェック関数
export async function checkStreetViewAvailability(lat: number, lng: number): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_SERVER_KEY
  
  if (!apiKey) {
    console.error('Google Maps API key is not configured for Street View check')
    return false
  }

  try {
    // Street Viewメタデータエンドポイントを使用（無料）
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`
    
    const response = await fetch(metadataUrl, {
      next: { revalidate: 3600 }, // 1時間キャッシュ
    })
    
    if (!response.ok) {
      console.error('Street View metadata request failed:', response.status)
      return false
    }
    
    const data: StreetViewMetadataResponse = await response.json()
    
    // statusが"OK"の場合のみStreet Viewが利用可能
    if (data.status === 'OK') {
      console.log('Street View available at:', data.location)
      return true
    } else if (data.status === 'ZERO_RESULTS') {
      console.log('No Street View imagery at this location')
      return false
    } else {
      console.error('Street View metadata error:', data.status)
      return false
    }
  } catch (error) {
    console.error('Error checking Street View availability:', error)
    return false
  }
}