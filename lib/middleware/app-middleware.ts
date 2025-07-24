import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 誰でもアクセスできるパス
const publicRoutes = [
  "/",
  "/error",
  "/api/auth/callback",
  "/api/auth/confirm",
  "/api/auth/route",
  "/password-reset",
  "/password-reset/verify",
];

// ゲスト専用ルート(ログインしている人はアクセスできない)
const guestRoutes = [
  "/login",
];

export default async function AppMiddleware(
  request: NextRequest,
  supabaseResponse: NextResponse,
  user: User | null
) {
  // リクエストのパスを取得
  const path = request.nextUrl.pathname;
  // ユーザーがサインインしているかどうかを確認.サインインしていれば、true.
  const isLogin = Boolean(user);
  // パスがパブリックルートかどうかを確認.パブリックルートであれば、true.
  const isPublicRoute = publicRoutes.includes(path);
  // パスがゲスト専用ルートかどうかを確認.ゲスト専用ルートであれば、true.
  const isGuestRoute = guestRoutes.includes(path);
  // パスがプライベートルートかどうかを確認.プライベートルートであれば、true.
  const isPrivateRoute = !isPublicRoute && !isGuestRoute;
  // ユーザーがアカウントを作成しているかどうかを確認（招待ユーザーがアカウントを作成していない場合、アカウント作成ページにリダイレクト）
  const isSignupCompleted = user?.user_metadata?.is_signup_completed;

  // ゲスト専用ルートにサインイン済みのユーザーがアクセスしようとした場合、アカウントページにリダイレクト
  if (isGuestRoute && isLogin) {
    return NextResponse.redirect(new URL(`/dashboard`, request.url));
  }

  if (isPrivateRoute) {
    // サインインしていない場合、ログインページにリダイレクト
    if (!isLogin) {
      return NextResponse.redirect(
        new URL(`/login?from=${path}`, request.url)
      );
    }

    // アカウント作成チェック（/signup以外のプライベートルートの場合のみ）
    if (!isSignupCompleted && path !== `/signup`) {
      return NextResponse.redirect(new URL("/signup", request.url));
    }

  }

  // 何もリダイレクトが発生しない場合、元のレスポンスを返す
  return supabaseResponse;
}