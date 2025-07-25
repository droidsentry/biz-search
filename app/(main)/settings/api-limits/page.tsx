import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiLimitsForm } from './components/api-limits-form'
import { ApiUsageStats } from './components/api-usage-stats'

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
  
  // 現在の制限設定を取得
  const { data: limits } = await supabase
    .from('api_global_limits')
    .select('*')
    .eq('api_name', 'google_custom_search')
    .single()
    
  // 使用状況を取得
  const { data: usage } = await supabase
    .from('api_global_usage')
    .select('*')
    .eq('api_name', 'google_custom_search')
    .single()
  
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">API利用制限管理</h1>
          <p className="text-muted-foreground mt-2">
            システム全体のAPI利用制限を管理します
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2">
          <ApiLimitsForm limits={limits} />
          <ApiUsageStats usage={usage} limits={limits} />
        </div>
      </div>
    </div>
  )
}