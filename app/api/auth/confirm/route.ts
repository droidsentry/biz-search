import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get("next") || '/'
  const role = searchParams.get('role') || 'user' // roleパラメータを取得

  console.log("token_hash", token_hash) // token_hash 1234567890
  console.log("type", type) // type email
  console.log("next", next) // next http://localhost:3001/account
  console.log("role", role) // role user or system_owner


  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // ユーザーのメタデータにpending_roleを保存
      const { error: updateError } = await supabase.auth.updateUser({
        data: { pending_role: role }
      })
      
      if (updateError) {
        console.error("Failed to update user metadata:", updateError)
      }
      
      // console.log("redirectTo after", redirectTo)
      redirectTo.searchParams.delete('next')
      // console.log("redirectTo after delete next", redirectTo)
      // console.log("redirect", `${next}/password-update`)
      return NextResponse.redirect(`${next}/password-update`)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}