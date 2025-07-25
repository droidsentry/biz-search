'use server'

import { getBaseURL } from "@/lib/base-url"
import { inviteSchema } from "@/lib/schemas/invite"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSupabaseAuthErrorMessage, SupabaseAuthErrorCode } from "@/lib/supabase/error-code-ja"
import { createClient } from "@/lib/supabase/server"
import { Invite } from "@/lib/types/invite"
import { sendMagicLink } from "@/lib/actions/auth/supabase"

/**
 * メンバー招待
 * @param formData 招待フォームデータ
 */
export async function inviteMember(formData: Invite) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ユーザーが見つかりません')
  }
  const {data, error} = await inviteSchema.safeParseAsync(formData)
  if (!data || error) {
    console.error(error)
    throw new Error('フォームデータが無効です')
  }
  const { email, role } = data
  const baseUrl = getBaseURL()
  const supabaseAdmin = createAdminClient()
  await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${baseUrl}/auth/confirm`,
      data: {
        pending_role: role, // ユーザーのメタデータにpending_roleを保存
        added_by: user.email,
      }
    }
  ).then(async ({error}) => {
    if (error) {
      console.error(error.message)
      const errorCode = error.code as SupabaseAuthErrorCode
      throw new Error(await getSupabaseAuthErrorMessage(errorCode))
    }
  })

}

/**
 * メンバーの役割を変更
 * @param formData 役割変更フォームデータ
 */
export async function changeRoleAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: '認証が必要です' }
  }

  const userId = formData.get('userId') as string
  const role = formData.get('role') as string

  if (!userId || !role) {
    return { error: '必要なデータが不足しています' }
  }

  // 自分自身の役割は変更できない
  if (userId === user.id) {
    return { error: '自分自身の役割は変更できません' }
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      console.error('役割変更エラー:', error)
      return { error: '役割の変更に失敗しました' }
    }

    return { success: true }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { error: '予期せぬエラーが発生しました' }
  }
}

/**
 * アカウントの有効/無効を切り替え
 * @param formData アカウント停止/再開フォームデータ
 */
export async function suspendAccountAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: '認証が必要です' }
  }

  const userId = formData.get('userId') as string
  const isActive = formData.get('isActive') === 'true'

  if (!userId) {
    return { error: '必要なデータが不足しています' }
  }

  // 自分自身のアカウントは停止できない
  if (userId === user.id) {
    return { error: '自分自身のアカウントは停止できません' }
  }

  try {
    // profilesテーブルのis_activeを更新
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId)

    if (error) {
      console.error('アカウント停止エラー:', error)
      return { error: 'アカウントの停止/再開に失敗しました' }
    }

    // app_metadataも更新
    const supabaseAdmin = createAdminClient()
    const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { is_active: isActive } }
    )

    if (adminError) {
      console.error('app_metadata更新エラー:', adminError)
      // profilesは更新済みなので、エラーログのみ（ロールバックは行わない）
    }

    return { success: true }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { error: '予期せぬエラーが発生しました' }
  }
}

/**
 * アカウントを削除
 * @param formData アカウント削除フォームデータ
 */
export async function deleteAccountAction(formData: { userId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: '認証が必要です' }
  }

  const { userId } = formData

  if (!userId) {
    return { error: '必要なデータが不足しています' }
  }

  // 自分自身のアカウントは削除できない
  if (userId === user.id) {
    return { error: '自分自身のアカウントは削除できません' }
  }

  try {
    // まずprofilesテーブルのdeleted_atを更新
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('プロファイル更新エラー:', updateError)
      return { error: 'アカウントの削除に失敗しました' }
    }

    // Supabase Authからユーザーを削除
    const supabaseAdmin = createAdminClient()
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('アカウント削除エラー:', deleteError)
      const errorCode = deleteError.code as SupabaseAuthErrorCode
      const errorMessage = await getSupabaseAuthErrorMessage(errorCode)
      return { error: errorMessage || 'アカウントの削除に失敗しました' }
    }

    // 注: profilesテーブルのデータは残る（90日後に手動削除予定）

    return { success: true }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { error: '予期せぬエラーが発生しました' }
  }
}

/**
 * 認証メール（Magic Link）を送信
 * @param formData メンバー情報
 */
export async function sendAuthEmailAction(formData: { userId: string; email: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: '認証が必要です' }
  }

  const { userId, email } = formData

  if (!userId || !email) {
    return { error: '必要なデータが不足しています' }
  }

  try {
    // Magic Linkを送信
    await sendMagicLink(email)
    
    return { success: true, message: '認証メールを送信しました' }
  } catch (error) {
    console.error('認証メール送信エラー:', error)
    return { error: '認証メールの送信に失敗しました' }
  }
}