'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleInvestigationStatusAction(ownerId: string) {
  const supabase = await createClient()
  
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '認証が必要です' }
  }

  // 現在の調査状態を取得
  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .select('investigation_completed')
    .eq('id', ownerId)
    .single()

  if (ownerError || !owner) {
    return { success: false, error: '所有者情報の取得に失敗しました' }
  }

  const newStatus = !owner.investigation_completed

  // 調査完了に変更する場合は、owner_companiesのデータ存在を確認
  if (newStatus === true) {
    const { count, error: countError } = await supabase
      .from('owner_companies')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', ownerId)

    if (countError) {
      return { success: false, error: '会社情報の確認に失敗しました' }
    }

    if (count === 0) {
      return { 
        success: false, 
        error: '調査完了にするには、先に会社情報を登録してください' 
      }
    }
  }

  // 調査状態を更新
  const { error: updateError } = await supabase
    .from('owners')
    .update({ 
      investigation_completed: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', ownerId)

  if (updateError) {
    return { success: false, error: '調査状態の更新に失敗しました' }
  }

  // キャッシュを再検証
  revalidatePath(`/projects/[projectId]/[ownerId]`, 'page')
  revalidatePath(`/projects/[projectId]`, 'page')

  return { 
    success: true, 
    newStatus,
    message: newStatus ? '調査完了に設定しました' : '調査未完了に設定しました'
  }
}