import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// プロファイル作成を別関数として分離
async function createUserProfile(email: string) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({ email })
      
    if (error) {
      console.error('Failed to create profile:', error)
    }
  } catch (error) {
    console.error('Unexpected error during profile creation:', error)
  }
  // プロファイル作成に失敗してもユーザー認証は成功しているため、エラーをthrowしない
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get("next") || '/'

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  // ガード節: 必須パラメータのチェック
  if (!token_hash || !type) {
    redirectTo.pathname = '/error'
    return NextResponse.redirect(redirectTo)
  }

  // OTP検証
  const supabase = await createClient()
  const { error: otpError } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  })

  // ガード節: OTP検証エラー
  if (otpError) {
    redirectTo.pathname = '/error'
    return NextResponse.redirect(redirectTo)
  }

  // ユーザー情報取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error('Failed to get user:', userError)
  } else if (!user) {
    console.error('ユーザーが見つかりませんでした。')
  } else if (!user.email) {
    console.error('ユーザーのメールアドレスが見つかりませんでした')
  } else {
    // プロファイル作成（非同期で実行、結果を待つ必要がない）
    await createUserProfile(user.email)
  }

  // 成功時のリダイレクト
  redirectTo.searchParams.delete('next')
  return NextResponse.redirect(`${next}/signup`)
}