import { createClient } from "@/lib/supabase/server";
import { MemberListClient } from "./components/member-list-client";

export async function MemberList() {
  const supabase = await createClient();

  // 現在の認証ユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // profilesテーブルからメンバー一覧を取得
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("プロファイル取得エラー:", error);
    return <div className="text-red-500">メンバー一覧の取得に失敗しました</div>;
  }

  return <MemberListClient profiles={profiles || []} currentUserId={user.id} />;
}
