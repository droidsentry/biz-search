import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConstantsSettingsForm from "./components/constants-settings-form";
import type { AppSettings } from "@/lib/types/app-settings";

export default async function ConstantsSettingsPage() {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // システムオーナーチェック
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "system_owner") {
    redirect("/");
  }

  // 設定データの取得
  const { data: settings } = await supabase
    .from("app_settings")
    .select("*")
    .order("key");

  return (
    <>
      <div className="sm:flex sm:items-center mb-5">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            フォーム設定
          </h1>
          <p className="mt-5 text-sm text-muted-foreground">
            検索フォームのデフォルト値を管理します
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ConstantsSettingsForm settings={(settings || []) as AppSettings[]} />
      </div>
    </>
  );
}
