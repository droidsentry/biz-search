import { getBaseURL } from "@/lib/base-url";
import { Metadata } from "next";
import PasswordUpdateForm from "./form";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "パスワード更新 - BizSearch",
  description: "BizSearchアカウントのパスワードを安全に更新します。",
};

export default async function Page() {
  return <PasswordUpdateForm />;
}
