'use server'

import { displayNameSchema, usernameSchema } from '@/lib/schemas/account'
import { createClient } from '@/lib/supabase/server'
import { DisplayNameFormData, UsernameFormData } from '@/lib/types/account'
import { Tables, TablesUpdate } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'

/**
 * 表示名（DisplayName）を更新
 * Supabase Authのuser_metadataのdisplayNameを更新
 */
export async function updateDisplayName(formData: DisplayNameFormData) {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: '認証が必要です' }
  }

  // バリデーション
  const result = displayNameSchema.safeParse(formData)
  
  if (!result.success) {
    return { 
      error: '入力データが不正です',
      details: result.error.flatten() 
    }
  }

  try {
    // user_metadataを更新
    const { error } = await supabase.auth.updateUser({
      data: {
        displayName: result.data.displayName
      }
    })

    if (error) {
      console.error('表示名更新エラー:', error)
      return { error: '表示名の更新に失敗しました' }
    }

    revalidatePath('/account/settings')
    return { success: true }
  } catch (error) {
    console.error('表示名更新エラー:', error)
    return { error: '予期せぬエラーが発生しました' }
  }
}

/**
 * ユーザー名（Username）を更新
 * profilesテーブルのusernameを更新
 */
export async function updateUsername(formData: UsernameFormData) {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: '認証が必要です' }
  }

  // バリデーション
  const result = usernameSchema.safeParse(formData)
  
  if (!result.success) {
    return { 
      error: '入力データが不正です',
      details: result.error.flatten() 
    }
  }

  try {
    // ユーザー名の重複チェック
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', result.data.username)
      .neq('id', user.id)
      .single()

    if (existingUser) {
      return { error: 'このユーザー名は既に使用されています' }
    }

    // profilesテーブルを更新
    const updateData: TablesUpdate<'profiles'> = {
      username: result.data.username,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('ユーザー名更新エラー:', error)
      return { error: 'ユーザー名の更新に失敗しました' }
    }

    revalidatePath('/account/settings')
    return { success: true }
  } catch (error) {
    console.error('ユーザー名更新エラー:', error)
    return { error: '予期せぬエラーが発生しました' }
  }
}