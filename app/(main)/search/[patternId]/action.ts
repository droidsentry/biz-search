'use server'

import { googleCustomSearchParamsSchema } from '@/lib/schemas/custom-search'
import { createClient } from '@/lib/supabase/server'
import { TablesInsert, TablesUpdate } from '@/lib/types/database'
import { redirect } from 'next/navigation'

// 検索パターンの作成
export async function createSearchPattern(
  name: string,
  description: string | null,
  googleCustomSearchParams: unknown
) {
  const supabase = await createClient()
  
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // パラメータのバリデーション
  const paramsResult = googleCustomSearchParamsSchema.safeParse(googleCustomSearchParams)
  if (!paramsResult.success) {
    console.error('Invalid search parameters', paramsResult.error)
    return { error: 'Invalid search parameters', details: paramsResult.error.flatten() }
  }

  // パターンの作成
  const { data, error } = await supabase
    .from('search_patterns')
    .insert({
      name,
      description,
      google_custom_search_params: paramsResult.data,
      user_id: user.id
    } as TablesInsert<'search_patterns'>)
    .select()
    .single()

  if (error) {
    console.error('パターン作成エラー:', error)
    return { error: error.message }
  }

  return { success: true, data }
}

// 検索パターンの更新
export async function updateSearchPattern(
  id: string,
  updates: {
    name?: string
    description?: string | null
    google_custom_search_params?: unknown
  }
) {
  const supabase = await createClient()
  
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // パラメータのバリデーション（更新時のみ）
  if (updates.google_custom_search_params) {
    const paramsResult = googleCustomSearchParamsSchema.safeParse(updates.google_custom_search_params)
    if (!paramsResult.success) {
      console.error('Invalid search parameters', paramsResult.error)
      return { error: 'Invalid search parameters', details: paramsResult.error.flatten() }
    }
    updates.google_custom_search_params = paramsResult.data
  }

  // パターンの更新
  const { data, error } = await supabase
    .from('search_patterns')
    .update(updates as TablesUpdate<'search_patterns'>)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('パターン更新エラー:', error)
    return { error: error.message }
  }

  return { success: true, data }
}

// 検索パターンの削除
export async function deleteSearchPattern(id: string) {
  const supabase = await createClient()
  
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // パターンの削除
  const { error } = await supabase
    .from('search_patterns')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('パターン削除エラー:', error)
    return { error: error.message }
  }

  return { success: true }
}

// 検索パターンの取得（単一）
export async function getSearchPattern(id: string) {
  const supabase = await createClient()
  
  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // パターンの取得
  const { data, error } = await supabase
    .from('search_patterns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('パターン取得エラー:', error)
    return { error: error.message }
  }

  return data
}
