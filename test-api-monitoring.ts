// API監視設定の確認スクリプト
import { createClient } from '@/lib/supabase/server'

async function checkApiMonitoring() {
  const supabase = await createClient()
  
  console.log('=== API制限設定の確認 ===')
  
  // api_global_limitsの確認
  const { data: limits, error: limitsError } = await supabase
    .from('api_global_limits')
    .select('*')
    .order('api_name')
  
  if (limitsError) {
    console.error('制限設定取得エラー:', limitsError)
  } else {
    console.log('\n制限設定:')
    limits?.forEach(limit => {
      console.log(`- ${limit.api_name}: 日次=${limit.daily_limit}, 月次=${limit.monthly_limit}`)
    })
  }
  
  // api_global_usageの確認
  const { data: usage, error: usageError } = await supabase
    .from('api_global_usage')
    .select('*')
    .order('api_name')
  
  if (usageError) {
    console.error('使用状況取得エラー:', usageError)
  } else {
    console.log('\n使用状況:')
    usage?.forEach(u => {
      console.log(`- ${u.api_name}: 本日=${u.daily_count}, 今月=${u.monthly_count}, ブロック=${u.is_blocked}`)
    })
  }
  
  // テーブル存在確認
  console.log('\n=== ログテーブルの確認 ===')
  
  // PDF処理ログ
  const { count: pdfCount, error: pdfError } = await supabase
    .from('pdf_processing_logs')
    .select('*', { count: 'exact', head: true })
  
  if (pdfError) {
    console.error('pdf_processing_logsテーブルエラー:', pdfError.message)
  } else {
    console.log(`pdf_processing_logs: ${pdfCount || 0}件のレコード`)
  }
  
  // Geocodingログ
  const { count: geoCount, error: geoError } = await supabase
    .from('geocoding_logs')
    .select('*', { count: 'exact', head: true })
  
  if (geoError) {
    console.error('geocoding_logsテーブルエラー:', geoError.message)
  } else {
    console.log(`geocoding_logs: ${geoCount || 0}件のレコード`)
  }
  
  console.log('\n=== RPC関数の動作確認 ===')
  
  // check_global_api_limit関数のテスト
  const apis = ['google_custom_search', 'pdf_parsing', 'google_maps_geocoding']
  
  for (const apiName of apis) {
    const { data, error } = await supabase.rpc('check_global_api_limit', {
      p_api_name: apiName,
      p_increment: 0 // カウントは増やさない
    })
    
    if (error) {
      console.error(`${apiName} チェックエラー:`, error)
    } else {
      console.log(`${apiName}: 許可=${data.allowed}, 日次=${data.daily_used}/${data.daily_limit}, 月次=${data.monthly_used}/${data.monthly_limit}`)
    }
  }
}

// 実行
checkApiMonitoring().catch(console.error)