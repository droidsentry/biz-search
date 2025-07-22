import { SearchLayout } from "./components/search-layout";
import { getSearchPattern } from "./action";
import { getPatterns } from "./components/get-patterns";
import { redirect } from "next/navigation";

export default async function SearchDetailPage({
  params,
}: {
  params: Promise<{ searchId: string }>;
}) {
  const { searchId } = await params;

  // パターン一覧を取得
  const patterns = await getPatterns();

  // 新規検索の場合は特別な処理
  if (searchId === "new") {
    return <SearchLayout patterns={patterns} searchId={searchId} />;
  }

  // 既存パターンの取得
  const result = await getSearchPattern(searchId);

  if (result.error || !result.data) {
    redirect("/search");
  }

  return <SearchLayout patterns={patterns} searchId={searchId} />;
}
