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
  // ユーザーがパスワードを設定しているかどうかを確認（招待ユーザーがパスワードを設定していない場合、パスワードリセットページにリダイレクト）
  const isPasswordSet = user?.user_metadata?.is_password_set;

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

    // パスワード設定チェック（/password-reset以外のプライベートルートの場合のみ）
    if (!isPasswordSet && path !== `/password-update`) {
      return NextResponse.redirect(new URL("/password-update", request.url));
    }

  }

  // 何もリダイレクトが発生しない場合、元のレスポンスを返す
  return supabaseResponse;
}