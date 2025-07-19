'use server'

import { getBaseURL } from "@/lib/base-url"
import { inviteSchema } from "@/lib/schemas/invite"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSupabaseAuthErrorMessage, SupabaseAuthErrorCode } from "@/lib/supabase/error-code-ja"
import { createClient } from "@/lib/supabase/server"
import { Invite } from "@/lib/types/invite"

/**
 * メンバー招待
 * @param formData 招待フォームデータ
 */
export async function inviteMember(formData: Invite) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
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
      }
    }
  ).then(async ({error }) => {
    if (error) {
      console.error(error.message)
      const errorCode = error.code as SupabaseAuthErrorCode
      throw new Error(await getSupabaseAuthErrorMessage(errorCode))
    }
  })

}