import { Metadata } from "next";
import { getBaseURL } from "@/lib/base-url";
import { SearchLayout } from "./components/search-layout";
import { getSearchPatterns } from "./components/action";
import { redirect } from "next/navigation";
import { GoogleCustomSearchFormProvider } from "@/components/providers/google-custom-search-form";
import { getDefaultGoogleCustomSearchPattern } from "@/lib/helpers/server-constants";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "検索実行 - BizSearch",
  description: "高度な検索条件を組み合わせてビジネス情報を検索します。保存された検索パターンを使用して効率的に情報を収集できます。",
};

export default async function SearchDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ patternId: string }>;
}) {
  const { patternId } = await searchParams;
  console.log("patternId", patternId);

  // パターン一覧を取得
  const patterns = await getSearchPatterns();
  // パターンが存在しない場合はリダイレクト
  const selectedSearchPattern = patterns.find(
    (pattern) => pattern.id === patternId
  );
  if (!selectedSearchPattern && patternId !== "new") {
    redirect("/search/patterns");
  }

  // デフォルトのGoogle検索パターンを取得
  const defaultGoogleSearchPattern = await getDefaultGoogleCustomSearchPattern();

  return (
    <GoogleCustomSearchFormProvider
      selectedSearchPattern={selectedSearchPattern}
      patterns={patterns}
      defaultPattern={defaultGoogleSearchPattern}
    >
      <SearchLayout patterns={patterns} />
    </GoogleCustomSearchFormProvider>
  );
}
