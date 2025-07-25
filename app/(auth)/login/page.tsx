import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import LoginForm from "./form";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "ログイン - BizSearch",
  description:
    "BizSearchへログインして、効率的なビジネス情報検索を始めましょう。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from: string }>;
}) {
  const params = await searchParams;

  const { from } = params;

  return <LoginForm from={from} />;
}
