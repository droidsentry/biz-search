'use server'

import { createClient } from '@/lib/supabase/server';

// エクスポート用のデータ取得
export async function exportProjectProperties(
  projectId: string
) {
    const supabase = await createClient() 
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('認証が必要です')
    }

    // エクスポート用の関数を呼び出し
    const { data, error } = await supabase.rpc('get_project_export_data', {
      p_project_id: projectId
    })
    if (error || !data) {
      console.error('エクスポートエラー:', error)
      throw new Error(error.message)
    }

    // データをそのまま返す（クライアント側でExcel形式に変換）
    return data
}