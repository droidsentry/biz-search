import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get("next") || '/'

  // console.log("token_hash", token_hash) // token_hash 1234567890
  // console.log("type", type) // type email
  // console.log("next", next) // next http://localhost:3001/account

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
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        // profilesテーブルにレコードを作成（重複時は無視）
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            email: user.email,
          })
        if (profileError) {
          console.error('Failed to create profile:', profileError)
          // プロファイル作成に失敗してもユーザー認証は成功しているため続行
        }
      }
      
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(`${next}/signup`)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}