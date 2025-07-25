import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiLimitsForm } from './components/api-limits-form'
import { ApiUsageStats } from './components/api-usage-stats'

function getApiDisplayName(apiName: string): string {
  switch (apiName) {
    case 'google_custom_search':
      return 'Google Custom Search API'
    case 'pdf_parsing':
      return 'PDF解析処理'
    case 'google_maps_geocoding':
      return 'Google Maps Geocoding API'
    default:
      return apiName
  }
}

export default async function ApiLimitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // システムオーナーチェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'system_owner') {
    redirect('/settings')
  }
  
  // すべてのAPIの制限設定を取得
  const { data: allLimits } = await supabase
    .from('api_global_limits')
    .select('*')
    .order('api_name')
    
  // すべてのAPIの使用状況を取得
  const { data: allUsage } = await supabase
    .from('api_global_usage')
    .select('*')
    .order('api_name')
  
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">API利用制限管理</h1>
          <p className="text-muted-foreground mt-2">
            システム全体のAPI利用制限を管理します
          </p>
        </div>
        
        <div className="space-y-8">
          {allLimits?.map((limit) => {
            const usage = allUsage?.find(u => u.api_name === limit.api_name)
            const displayName = getApiDisplayName(limit.api_name)
            
            return (
              <div key={limit.api_name} className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{displayName}</h2>
                <div className="grid gap-8 md:grid-cols-2">
                  <ApiLimitsForm limits={limit} />
                  <ApiUsageStats usage={usage || null} limits={limit} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}