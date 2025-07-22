import { SearchLayout } from "./components/search-layout";
import { getSearchPattern } from "./action";
import { getPatterns } from "./components/get-patterns";
import { redirect } from "next/navigation";

// export type SearchPatterns = Awaited<ReturnType<typeof getPatterns>>;

// export type SearchPattern = Awaited<ReturnType<typeof getSearchPattern>>;

export default async function SearchDetailPage({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;

  // パターン一覧を取得
  const patterns = await getPatterns();

  // 新規検索の場合は特別な処理
  if (patternId === "new") {
    return <SearchLayout patterns={patterns} patternId={patternId} />;
  }

  // 既存パターンの取得
  const searchPattern = await getSearchPattern(patternId);
  console.log("searchPattern", searchPattern);

  if (!searchPattern) {
    redirect("/search");
  }

  return (
    <SearchLayout
      patterns={patterns}
      patternId={patternId}
      searchPattern={searchPattern}
    />
  );
}
