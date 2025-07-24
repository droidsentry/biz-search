'use server'

import { loginWithEmailOrUsernameSchema, passwordUpdateSchema, signupSchema } from "@/lib/schemas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAuthErrorMessage, SupabaseAuthErrorCode } from "@/lib/supabase/error-code-ja";
import { createClient } from "@/lib/supabase/server";
import { LoginWithEmailOrUsername, PasswordUpdate, Signup } from "@/lib/types/auth";
import { redirect } from "next/navigation";

/**
 * サインアウト
 * @returns 
 */
export const signOut = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }
  await supabase.auth.signOut();
  redirect("/");
};

/**
 */
export async function signup(formData: Signup) {
  // 認証
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }
  //バリデーションチェック
  const result = await signupSchema.safeParseAsync(formData);
  if (result.success === false) {
    console.error(result.error);
    throw new Error("パスワード更新に失敗しました"); 
  }
  const { password, username, email } = formData;

  const userMetadata = {
    username: username,
    is_signup_completed: true,
    pending_role: null, // pending_roleをクリア
    added_by: null,
  }
  // パスワード更新
  await supabase.auth.updateUser({
    password,
    data: userMetadata,
  }).then(async (response) => {
    if (response.error) {
      console.error(response.error.message);
      const errorCode = response.error.code as SupabaseAuthErrorCode;
      throw new Error(await getSupabaseAuthErrorMessage(errorCode));
    }
  });
  // // パスワード更新後、パスワード設定フラグをtrueにし、pending_roleをクリア
  // const supabaseAdmin = createAdminClient();
  // await supabaseAdmin.auth.admin.updateUserById(user.id, {
  //   user_metadata: {
  //     username: username,
  //     is_signup_completed: true,
  //     pending_role: null, // pending_roleをクリア
  //     added_by: null,
  //   },
  // }).then(async (response) => {
  //   if (response.error) {
  //     console.error(response.error.message);
  //     const errorCode = response.error.code as SupabaseAuthErrorCode;
  //     throw new Error(await getSupabaseAuthErrorMessage(errorCode));
  //   }
  // });
  // ユーザーのメタデータからpending_roleを取得（デフォルトは'system_owner' 臨時で招待メールを発行した時のため）
  const pendingRole = user.user_metadata?.pending_role || 'system_owner';
  //profilesテーブルを作成
  const { error: profileError } = await supabase.from("profiles").upsert({
    email: email,
    username: username,
    role: pendingRole, 
  });
  if (profileError) {
    console.error(profileError.message);
    throw new Error("プロフィール作成に失敗しました");
  }
}

async function loginWithEmail(formData: LoginWithEmailOrUsername) {
  const { emailOrUsername: email, password } = formData;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error(error.message);
    if (error.code === "invalid_credentials") {
      throw new Error("メールアドレスまたはパスワードが違います");
    }
    const errorCode = error.code as SupabaseAuthErrorCode;
    throw new Error(await getSupabaseAuthErrorMessage(errorCode));
  }
  
  // app_metadataのis_activeをチェック
  if (data.user?.app_metadata?.is_active === false) {
    await supabase.auth.signOut();
    throw new Error("アカウントが停止されています。管理者にお問い合わせください。");
  }
  
  return data;
}
async function loginWithUsername(formData: LoginWithEmailOrUsername) {
  const supabaseAdmin = createAdminClient();
  const { emailOrUsername: username, password } = formData;
  const { data: user, error: dbError } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("username", username)
    .single();
  if (!user || dbError) {
    console.error(dbError?.message);
    throw new Error("ユーザー名またはパスワードが違います");
  }
  const supabase = await createClient();
  const { data, error: sigInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (sigInError) {
    console.error(sigInError.code);
    const errorCode = sigInError.code as SupabaseAuthErrorCode;
    throw new Error(await getSupabaseAuthErrorMessage(errorCode));
  }
  
  // app_metadataのis_activeをチェック
  if (data.user?.app_metadata?.is_active === false) {
    await supabase.auth.signOut();
    throw new Error("アカウントが停止されています。管理者にお問い合わせください。");
  }
}

export async function loginWithEmailOrUsername(formData: LoginWithEmailOrUsername) {
  //バリデーションチェック
  const parsedFormData = await loginWithEmailOrUsernameSchema.safeParseAsync(formData);
  if (parsedFormData.success === false) {
    console.error(parsedFormData.error);
    throw new Error("ログインに失敗しました"); 
  }
  // メールアドレスかユーザー名かを判断
  const isEmail = formData.emailOrUsername.includes("@");
  isEmail
    ? await loginWithEmail(parsedFormData.data)
    : await loginWithUsername(parsedFormData.data);
};

/**
 * パスワード更新
 * @param formData パスワード更新フォームデータ
 */
export async function updatePassword(formData: PasswordUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("ユーザーが見つかりません");
  }
  const result = await passwordUpdateSchema.safeParseAsync(formData);
  if (result.success === false) {
    console.error(result.error);
    throw new Error("パスワード更新に失敗しました"); 
  }
  const { password } = formData;
  await supabase.auth.updateUser({
    password: password,
  }).then(async (response) => {
    if (response.error) {
      console.error(response.error.message);
      const errorCode = response.error.code as SupabaseAuthErrorCode;
      throw new Error(await getSupabaseAuthErrorMessage(errorCode));
    }
  });
}