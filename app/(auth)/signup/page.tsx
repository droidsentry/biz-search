import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "./form";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "パスワード更新 - BizSearch",
  description: "BizSearchアカウントのパスワードを安全に更新します。",
};

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <SignupForm user={user} />;
}
