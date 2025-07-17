'use server'

import { loginSchema, passwordUpdateSchema } from "@/lib/schemas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAuthErrorMessage, SupabaseAuthErrorCode } from "@/lib/supabase/error-code-ja";
import { createClient } from "@/lib/supabase/server";
import { Login, PasswordUpdate } from "@/lib/types/auth";
import { redirect } from "next/navigation";

/**
 * サインアウト
 * @returns 
 */
export const signOut = async () => {
  //5秒待機
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
};

/**
 * パスワード更新
 * @param formData パスワード更新フォームデータ
 */
export async function updatePassword(formData: PasswordUpdate) {
  // 認証
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }
  //バリデーションチェック
  const result = await passwordUpdateSchema.safeParseAsync(formData);
  if (result.success === false) {
    console.error(result.error);
    throw new Error("パスワード更新に失敗しました"); 
  }
  const { password, username } = formData;
  // パスワード更新
  await supabase.auth.updateUser({
    password,
  }).then(async (response) => {
    if (response.error) {
      console.error(response.error.message);
      const errorCode = response.error.code as SupabaseAuthErrorCode;
      throw new Error(await getSupabaseAuthErrorMessage(errorCode));
    }
  });
  // パスワード更新後、パスワード設定フラグをtrueにする
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      is_password_set: true,
    },
  }).then(async (response) => {
    if (response.error) {
      console.error(response.error.message);
      const errorCode = response.error.code as SupabaseAuthErrorCode;
      throw new Error(await getSupabaseAuthErrorMessage(errorCode));
    }
  });
  //userテーブルを作成
  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
    username: username,
  }).then(async (response) => {
    if (response.error) {
      console.error(response.error.message);
      const errorCode = response.error.code as SupabaseAuthErrorCode;
      throw new Error(await getSupabaseAuthErrorMessage(errorCode));
    }
  });
}

export async function signIn(formData: Login) {

  //バリデーションチェック
  const result = await loginSchema.safeParseAsync(formData);
  if (result.success === false) {
    console.error(result.error);
    throw new Error("ログインに失敗しました"); 
  }

  const supabase = await createClient();
  const { email, password } = result.data;
  await supabase.auth.signInWithPassword({
    email,
    password,
  }).then(async (response) => { 
    if (response.error) {
      console.error(response.error.message);
      const errorCode = response.error.code as SupabaseAuthErrorCode;
      throw new Error(await getSupabaseAuthErrorMessage(errorCode));
    }
  });
}