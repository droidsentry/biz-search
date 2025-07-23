import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { Form } from "./form";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "ログイン - BizSearch",
  description: "BizSearchへログインして、効率的なビジネス情報検索を始めましょう。",
};

export default function LoginPage() {
  return <Form />;
}