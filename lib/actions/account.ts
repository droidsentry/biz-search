'use server'

import { displayNameSchema } from '@/lib/schemas/account'
import { createClient } from '@/lib/supabase/server'
import { DisplayNameFormData, UsernameFormData } from '@/lib/types/account'
import { TablesUpdate } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { unDebouncedUsernameSchema } from '../schemas/auth'

/**
 * 表示名（DisplayName）を更新
 * Supabase Authのuser_metadataのdisplayNameを更新
 */
export async function updateDisplayName(formData: DisplayNameFormData) {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('ユーザーが見つかりません')
  }

  // バリデーション
  const parsed = await displayNameSchema.safeParseAsync(formData)
  if (parsed.success === false) {
    console.error(parsed.error)
    throw new Error('表示名の更新に失敗しました')
  }
  const {error:profileError} = await supabase.from('profiles').update({
    display_name: parsed.data.displayName
  }).eq('id', user.id)
  if (profileError) {
    console.error(profileError)
    throw new Error('表示名の更新に失敗しました')
  }
  // user_metadataを更新
  const { error } = await supabase.auth.updateUser({
    data: {
      display_name: parsed.data.displayName
    }
  })

  if (error) {
    console.error('表示名更新エラー:', error.message)
    throw new Error('表示名の更新に失敗しました')
  }

  revalidatePath('/account/settings')
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
    throw new Error('ユーザーが見つかりません')
  }

  // バリデーション
  const result = await unDebouncedUsernameSchema.safeParseAsync(formData)
  
  if (result.success === false) {
    console.error(result.error)
    throw new Error('ユーザー名の更新に失敗しました')
  }

  // profilesテーブルを更新
  const updateData: TablesUpdate<'profiles'> = {
    username: result.data.username,
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    console.error('ユーザー名更新エラー:', error.message)
    throw new Error('ユーザー名の更新に失敗しました')
  }

  revalidatePath('/account/settings')
}